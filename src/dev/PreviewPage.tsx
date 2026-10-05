import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { api } from '@/lib/api/client'
import { setSession } from '@/lib/auth/session'
import * as fx from './fixtures'

type Handler = (m: RegExpMatchArray) => unknown

/** Yol → örnek yanıt. Sıra önemli: daha özel yollar önce. */
const GET: [RegExp, Handler][] = [
  [/^\/users\/me$/, () => fx.me],
  [/^\/users\/profile\/([^/]+)$/, (m) => ({ title: fx.titles[m[1]!] ?? null, academicTitle: null })],
  [/^\/courses\/my-courses$/, () => fx.courses],
  [/^\/courses\/my-applications$/, () => fx.applications],
  [/^\/courses\/terms\/current$/, () => fx.term],
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
  if ((config.method ?? 'get') !== 'get') return reply(200, {})
  for (const [re, handle] of GET) {
    const m = url.match(re)
    if (!m) continue
    try {
      return reply(200, handle(m))
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
