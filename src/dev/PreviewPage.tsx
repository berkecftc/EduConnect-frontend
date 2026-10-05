import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { api } from '@/lib/api/client'
import { setSession } from '@/lib/auth/session'
import * as fx from './fixtures'

type Handler = (m: RegExpMatchArray, config: InternalAxiosRequestConfig) => unknown

/** Yol → örnek yanıt. Sıra önemli: daha özel yollar önce. */
const GET: [RegExp, Handler][] = [
  [/^\/users\/me$/, () => fx.me],
  [/^\/courses\/my-courses$/, () => fx.courses],
  // Kopya: başvuru ve geri çekme diziyi yerinde değiştirir; aynı nesne dönerse React Query değişikliği görmez.
  [/^\/courses\/my-applications$/, () => fx.applications.map((a) => ({ ...a }))],
  [/^\/courses\/terms\/current$/, () => fx.term],
  [/^\/courses\/terms$/, () => fx.terms],
  [/^\/courses$/, (_m, config) => fx.catalog((config.params as { termId?: string } | undefined)?.termId)],
  [/^\/courses\/([^/]+)\/staff$/, (m) => fx.staff[m[1]!] ?? []],
  [/^\/courses\/([^/]+)\/materials$/, (m) => fx.materials[m[1]!] ?? []],
  [/^\/courses\/([^/]+)\/announcements$/, (m) => fx.announcements[m[1]!] ?? []],
  [/^\/courses\/([^/]+)$/, (m) => fx.courseDetail(m[1]!) ?? notFound()],
  [/^\/assignments\/my-assignments$/, () => fx.assignments],
  [/^\/assignments\/course\/([^/]+)\/my-grades$/, (m) => fx.gradesFor(m[1]!)],
  [/^\/assignments\/submissions\/([^/]+)\/versions$/, () => []],
  [/^\/events\/my-registrations$/, () => fx.registrations],
  [/^\/events$/, () => ({ content: fx.campusEvents, number: 0, size: 6, totalElements: fx.campusEvents.length, totalPages: 1, first: true, last: true })],
  [/^\/notifications\/unread-count$/, () => ({ unread: fx.notifications.filter((n) => !n.read).length })],
  [/^\/notifications$/, () => ({ content: fx.notifications, totalElements: fx.notifications.length, totalPages: 1, number: 0, last: true })],
  [/^\/gamification\/users\/me\/summary$/, () => fx.summary],
  [/^\/clubs$/, () => fx.clubs],
  [/^\/clubs\/my-access$/, () => fx.clubAccesses],
  [
    /^\/clubs\/approvals\/inbox$/,
    () =>
      Object.values(fx.clubApprovals)
        .flat()
        .filter((r) => r.status === 'PENDING_PRESIDENT' && fx.clubAccess(r.clubId).actingPresident)
        .map((r) => ({ ...r })),
  ],
  [/^\/clubs\/([^/]+)\/my-access$/, (m) => fx.clubAccess(m[1]!)],
  [/^\/clubs\/([^/]+)\/membership-requests\/pending$/, (m) => (fx.pendingMembershipRequests[m[1]!] ?? []).map((r) => ({ ...r }))],
  [/^\/clubs\/([^/]+)\/approvals$/, (m) => (fx.clubApprovals[m[1]!] ?? []).map((r) => ({ ...r }))],
  [/^\/clubs\/my-memberships$/, () => fx.myMemberships.map((m) => ({ ...m }))],
  [/^\/clubs\/my-memberships\/history$/, () => [...fx.myMemberships, ...fx.membershipHistory].map((m) => ({ ...m }))],
  [/^\/clubs\/my-membership-requests$/, () => fx.membershipRequests.map((r) => ({ ...r }))],
  [/^\/clubs\/my-positions$/, () => fx.myPositions],
  [/^\/clubs\/([^/]+)\/board-members$/, (m) => fx.clubBoard[m[1]!] ?? []],
  [
    /^\/clubs\/([^/]+)\/announcements$/,
    (m) =>
      fx.myMemberships.some((x) => x.clubId === m[1])
        ? { content: [...(fx.clubAnnouncements[m[1]!] ?? [])], number: 0, size: 20, totalElements: 0, totalPages: 1, first: true, last: true }
        : notFound(),
  ],
  [/^\/clubs\/([^/]+)$/, (m) => fx.clubDetail(m[1]!) ?? notFound()],
  [/^\/events\/club\/([^/]+)$/, (m) => fx.campusEvents.filter((e) => e.clubId === m[1])],
]

/** Yazma istekleri (yöntem, yol): başvuru, geri çekme, ayrılma ve yenileme önizleme verisini değiştirir; diğerleri boş yanıt döner. */
const WRITE: [string, RegExp, Handler][] = [
  [
    'put',
    /^\/clubs\/([^/]+)\/membership-requests\/([^/]+)\/(approve|reject|recommendation)$/,
    (m, config) => {
      const list = fx.pendingMembershipRequests[m[1]!] ?? []
      const i = list.findIndex((r) => r.id === m[2])
      if (i < 0) return null
      if (m[3] === 'recommendation') {
        const body = JSON.parse(String(config.data ?? '{}')) as { recommendation: 'APPROVE' | 'REJECT'; note: string | null }
        Object.assign(list[i]!, { recommendation: body.recommendation, recommendationNote: body.note })
        return list[i]
      }
      const [r] = list.splice(i, 1)
      const club = fx.clubs.find((c) => c.id === m[1])
      if (m[3] === 'approve' && club?.memberCount != null) club.memberCount += 1
      return r
    },
  ],
  [
    'post',
    /^\/clubs\/([^/]+)\/approvals\/([^/]+)\/(approve|reject|withdraw)$/,
    (m, config) => {
      const r = (fx.clubApprovals[m[1]!] ?? []).find((x) => x.id === m[2])
      if (!r) return null
      const now = new Date().toISOString()
      if (m[3] === 'approve') {
        Object.assign(r, { status: 'APPROVED', presidentDecidedByName: 'Elif Demir', presidentDecidedAt: now })
        if (r.announcement) (fx.clubAnnouncements[r.clubId] ??= []).unshift({ ...r.announcement, publishedAt: now })
      } else if (m[3] === 'reject') {
        Object.assign(r, { status: 'REJECTED', rejectionReason: (JSON.parse(String(config.data ?? '{}')) as { reason?: string }).reason ?? null, decidedByName: 'Elif Demir', decidedAt: now })
      } else Object.assign(r, { status: 'WITHDRAWN' })
      return r
    },
  ],
  [
    'post',
    /^\/clubs\/([^/]+)\/announcements$/,
    (m, config) => {
      const body = JSON.parse(String(config.data ?? '{}')) as { title: string; body: string }
      const now = new Date().toISOString()
      const direct = fx.clubAccess(m[1]!).actingPresident
      const announcement = { id: 'an-' + Date.now(), clubId: m[1]!, title: body.title, body: body.body, createdAt: now, publishedAt: direct ? now : null }
      if (direct) (fx.clubAnnouncements[m[1]!] ??= []).unshift(announcement)
      const r = {
        ...fx.clubApprovals.k2![0]!,
        id: 'ap-' + Date.now(),
        clubId: m[1]!,
        type: 'CLUB_ANNOUNCEMENT',
        status: direct ? ('APPROVED' as const) : ('PENDING_PRESIDENT' as const),
        createdAt: now,
        preparedBy: 'u1',
        preparedByName: 'Elif Demir',
        announcement,
      }
      ;(fx.clubApprovals[m[1]!] ??= []).unshift(r)
      return r
    },
  ],
  [
    'delete',
    /^\/clubs\/([^/]+)\/announcements\/([^/]+)$/,
    (m) => {
      const list = fx.clubAnnouncements[m[1]!] ?? []
      const i = list.findIndex((a) => a.id === m[2])
      if (i >= 0) list.splice(i, 1)
      return null
    },
  ],
  [
    'post',
    /^\/clubs\/([^/]+)\/membership-requests$/,
    (m) => {
      const c = fx.clubs.find((x) => x.id === m[1])!
      const r = { id: 'mr-' + c.id, clubId: c.id, clubName: c.name, clubLogoUrl: null, status: 'PENDING' as const, requestDate: new Date().toISOString(), processedDate: null, message: null, rejectionReason: null }
      fx.membershipRequests.unshift(r)
      return r
    },
  ],
  [
    'delete',
    /^\/clubs\/([^/]+)\/membership-requests$/,
    (m) => {
      const i = fx.membershipRequests.findIndex((r) => r.clubId === m[1] && r.status === 'PENDING')
      if (i >= 0) fx.membershipRequests.splice(i, 1)
      return null
    },
  ],
  [
    'delete',
    /^\/clubs\/([^/]+)\/leave$/,
    (m) => {
      const i = fx.myMemberships.findIndex((x) => x.clubId === m[1])
      if (i >= 0) fx.membershipHistory.unshift({ ...fx.myMemberships.splice(i, 1)[0]!, active: false, endedAt: new Date().toISOString(), endReason: 'LEFT' })
      return null
    },
  ],
  [
    'post',
    /^\/clubs\/([^/]+)\/membership\/renew$/,
    (m) => {
      const x = fx.myMemberships.find((y) => y.clubId === m[1])!
      x.validUntil = `${Number(x.validUntil!.slice(0, 4)) + 1}${x.validUntil!.slice(4)}`
      return x
    },
  ],
  [
    'post',
    /^\/courses\/([^/]+)\/apply$/,
    (m) => {
      const c = fx.catalog('t1').find((x) => x.id === m[1])!
      const app = { id: 'ap-' + c.id, courseId: c.id, courseTitle: c.title, courseCode: c.code, status: 'PENDING' as const, applicationDate: new Date().toISOString(), processedDate: null, rejectionReason: null }
      fx.applications.unshift(app)
      return app
    },
  ],
  [
    'post',
    /^\/courses\/applications\/([^/]+)\/withdraw$/,
    (m) => {
      const app = fx.applications.find((a) => a.id === m[1])!
      Object.assign(app, { status: 'WITHDRAWN', processedDate: new Date().toISOString() })
      return app
    },
  ],
]

class PreviewNotFound extends Error {}
function notFound(): never {
  throw new PreviewNotFound()
}

/** Ağa gitmeden örnek veriyle yanıt veren axios adaptörü; gerçekçi olsun diye kısa gecikme. */
const fixtureAdapter: AxiosAdapter = async (config: InternalAxiosRequestConfig) => {
  await new Promise((r) => setTimeout(r, 250))
  const url = (config.url ?? '').split('?')[0]!
  const reply = (status: number, data: unknown): AxiosResponse => ({ status, statusText: '', data, headers: {}, config })
  const method = config.method ?? 'get'
  if (method !== 'get') {
    const hit = WRITE.filter(([verb]) => verb === method).map(([, re, handle]) => [url.match(re), handle] as const).find(([m]) => m)
    return reply(200, hit ? hit[1](hit[0]!, config) : {})
  }
  for (const [re, handle] of GET) {
    const m = url.match(re)
    if (!m) continue
    try {
      return reply(200, handle(m, config))
    } catch (e) {
      if (e instanceof PreviewNotFound) break
      throw e
    }
  }
  const error = Object.assign(new Error('Önizleme verisi yok: ' + url), {
    isAxiosError: true,
    config,
    response: reply(404, { status: 404, errorCode: 'NOT_FOUND', message: `Önizlemede bu veri yok (${url}).` }),
  })
  throw error
}

/**
 * Geliştirme önizlemesi: oturumu yalnız bellekte açar ve istekleri örnek verilerle yanıtlar.
 * Gerçek hesaba ve backend'e dokunmaz; sayfa yenilenince biter.
 */
export function PreviewPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  useEffect(() => {
    api.defaults.adapter = fixtureAdapter
    qc.clear()
    setSession(
      {
        token: 'onizleme',
        refreshToken: 'onizleme',
        userId: 'u1',
        email: fx.me.email!,
        roles: ['ROLE_STUDENT'],
        primaryRole: 'ROLE_STUDENT',
        pendingRequests: [],
        permissions: [],
        expiresAt: Date.now() + 24 * 3_600_000,
      },
      { persist: false },
    )
    navigate('/', { replace: true })
  }, [navigate, qc])
  return null
}
