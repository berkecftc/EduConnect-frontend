/**
 * Öğrenci önizlemesi, kulüp yönetimi: Elif Demir Satranç Kulübü'nün başkanı (görev verme, üyelikten çıkarma,
 * kulüp bilgileri, logo, danışman önerme, kapatma talebi), Robotik'te etkinlik koordinatörü (istifa).
 * Bir kurucu daveti ve reddedilmiş eski bir kuruluş başvurusu var. Satranç'ta seçim açılabilir (açılınca birkaç üye aday
 * olmuş sayılır, oylama bitince diğer üyelerin oyları eklenir); Robotik'te oylama sürüyor ve Elif henüz oy vermedi. Üye ve önerilen danışman adları, backend'in
 * bu alanları dolduracağı varsayımıyla gelir. Bellekte tutulur; yalnız `/onizleme` (öğrenci) içindir.
 */
import type { InternalAxiosRequestConfig } from 'axios'
import type { AcademicianHit } from '@/features/courses/teach'
import type { ClubCreationRequest } from '@/features/clubs/advise'
import type { ClubCategory, ClubMember } from '@/features/clubs/api'
import type { AdvisorChange, ProfileDraft } from '@/features/clubs/governance'
import type { Election, ElectionBallot, ElectionCandidate } from '@/features/clubs/elections'
import type { ApprovalRequest } from '@/features/clubs/manage'
import * as fx from './fixtures'

type Handler = (m: RegExpMatchArray, config: InternalAxiosRequestConfig) => unknown

const ago = (hours: number) => new Date(Date.now() - hours * 3_600_000).toISOString()
const now = () => new Date().toISOString()
const body = <T>(config: InternalAxiosRequestConfig) => JSON.parse(String(config.data ?? '{}')) as T
let seq = 0
const nextId = (p: string) => `${p}-${++seq}`

function fail(config: InternalAxiosRequestConfig, status: number, errorCode: string, message: string): never {
  throw Object.assign(new Error(message), {
    isAxiosError: true,
    config,
    response: { status, statusText: '', headers: {}, config, data: { status, errorCode, message } },
  })
}

// ——— Üyeler ———

const member = (studentId: string, firstName: string, lastName: string, role = 'MEMBER'): ClubMember => ({
  studentId,
  firstName,
  lastName,
  role,
})

/** Satranç Kulübü'nün etkin üyeleri (kurul dahil), adlarıyla. */
export const members: Record<string, ClubMember[]> = {
  k2: [
    member('u1', 'Elif', 'Demir', 'ROLE_CLUB_OFFICIAL'),
    member('st5', 'Deniz', 'Kara', 'ROLE_VICE_PRESIDENT'),
    member('st6', 'Oğuz', 'Tan', 'ROLE_MEMBERSHIP_OFFICER'),
    member('st9', 'Selin', 'Ak'),
    member('st10', 'Arda', 'Kılıç'),
    member('st11', 'Zeynep', 'Uçar'),
    member('st12', 'Emre', 'Doğan'),
    member('st13', 'Ceren', 'Aydın'),
    member('st14', 'Baran', 'Şimşek'),
    member('st15', 'İrem', 'Kurt'),
    member('st16', 'Tolga', 'Er'),
    member('st17', 'Nazlı', 'Sezer'),
  ],
}

/** Öğrenci numarası → öğrenci (görev verirken numarayla arama). Burcu Öz üye değil. */
const NUMBERS: Record<string, { id: string; name: string }> = {
  '210101042': { id: 'st9', name: 'Selin Ak' },
  '200101007': { id: 'st10', name: 'Arda Kılıç' },
  '220101015': { id: 'st7', name: 'Burcu Öz' },
}

const LIMIT: Record<string, number> = { VICE_PRESIDENT: 1, GENERAL_SECRETARY: 1, TREASURER: 1, BOARD_MEMBER: 7, AUDITOR: 3 }
const canonical = (r: string | null) =>
  !r ? 'MEMBER' : r === 'ROLE_CLUB_OFFICIAL' ? 'PRESIDENT' : r === 'ROLE_SECRETARY' ? 'GENERAL_SECRETARY' : r.replace(/^ROLE_/, '')

// ——— Danışman adayları ———

const academician = (id: string, firstName: string, lastName: string, title: string, department: string): AcademicianHit => ({
  id,
  firstName,
  lastName,
  title,
  academicTitle: null,
  department,
  departmentId: null,
})
const academicians: AcademicianHit[] = [
  academician('u-c1', 'Mehmet', 'Kaya', 'Dr. Öğr. Üyesi', 'Bilgisayar Mühendisliği'),
  academician('u-c2', 'Ayşe', 'Arslan', 'Doç. Dr.', 'Bilgisayar Mühendisliği'),
  academician('u-c3', 'Hakan', 'Öztürk', 'Prof. Dr.', 'Matematik'),
  academician('u-c7', 'Selin', 'Koç', 'Dr. Öğr. Üyesi', 'Sosyoloji'),
  academician('u-c9', 'Zeynep', 'Çelik', 'Öğr. Gör.', 'Güzel Sanatlar'),
  academician('u-c10', 'Kemal', 'Aydın', 'Prof. Dr.', 'İşletme'),
  academician('u-c12', 'Burak', 'Şahin', 'Doç. Dr.', 'Bilgisayar Mühendisliği'),
]
const searchKey = (s: string) => s.trim().replace(/\s+/g, ' ').toLocaleUpperCase('tr-TR').replace(/İ/g, 'I')
const fullName = (a: AcademicianHit) => [a.title, a.firstName, a.lastName].filter(Boolean).join(' ')

export const advisorChanges: Record<string, AdvisorChange[]> = {
  k2: [
    {
      id: 'ac1',
      clubId: 'k2',
      clubName: 'Satranç Kulübü',
      proposedAdvisorId: 'u-c10',
      proposedAdvisorName: 'Prof. Dr. Kemal Aydın',
      requestedBy: 'u1',
      message: 'Lig maçlarına eşlik edebilecek bir danışman arıyoruz.',
      status: 'REJECTED',
      rejectionReason: 'Bu dönem iki kulübe danışmanlık yapıyorum; yeni bir kulüp alamıyorum.',
      createdAt: ago(24 * 70),
      decidedAt: ago(24 * 66),
    },
  ],
}

// ——— Kuruluş ———

const founder = (
  studentId: string,
  firstName: string,
  lastName: string,
  status: 'INVITED' | 'CONFIRMED' | 'DECLINED',
  respondedAt: string | null,
) => ({
  studentId,
  firstName,
  lastName,
  status,
  respondedAt,
})

export const invitations: ClubCreationRequest[] = [
  {
    id: 'cr-inv1',
    clubName: 'Bilim Kurgu Okuma Kulübü',
    about: 'Ayda bir kitap seçiyor, son çarşamba akşamı kütüphanede tartışıyoruz. Dönem sonunda öykü yarışması düzenlemek istiyoruz.',
    requestingStudentId: 'st20',
    suggestedAdvisorId: 'u-c7',
    status: 'PENDING_FOUNDERS',
    requestDate: ago(26),
    rejectionReason: null,
    processedAt: null,
    clubId: null,
    founders: [
      founder('st20', 'Kerem', 'Aslan', 'CONFIRMED', ago(26)),
      founder('st21', 'Pınar', 'Ünal', 'CONFIRMED', ago(20)),
      founder('u1', 'Elif', 'Demir', 'INVITED', null),
      founder('st22', 'Mert', 'Yazıcı', 'INVITED', null),
    ],
  },
]

export const creations: ClubCreationRequest[] = [
  {
    id: 'cr-old',
    clubName: 'Go Kulübü',
    about: 'Go oyununu tanıtmak ve haftalık oyun akşamları düzenlemek.',
    requestingStudentId: 'u1',
    suggestedAdvisorId: 'u-c3',
    status: 'REJECTED',
    requestDate: ago(24 * 140),
    rejectionReason: 'Satranç Kulübü içinde bir Go çalışma grubu açmanızı öneriyorum; ayrı kulüp için üye sayısı yetersiz.',
    processedAt: ago(24 * 133),
    clubId: null,
    founders: [founder('u1', 'Elif', 'Demir', 'CONFIRMED', ago(24 * 140))],
  },
]

// ——— Seçimler ———

const cand = (
  id: string,
  ballot: ElectionBallot,
  studentId: string,
  firstName: string,
  lastName: string,
  votes: number | null = null,
  elected = false,
): ElectionCandidate => ({ id, ballot, studentId, firstName, lastName, votes, elected })

export const elections: Record<string, Election[]> = {
  k1: [
    {
      id: 'el-k1',
      clubId: 'k1',
      status: 'VOTING',
      boardSeats: 3,
      auditSeats: 0,
      note: 'Genel kurul 24 Ekim cuma 18.00, B Blok 204. Oylama genel kurulun sonuna kadar açık.',
      openedBy: 'st5',
      openedAt: ago(24 * 9),
      votingStartedAt: ago(30),
      closedAt: null,
      eligibleVoters: null,
      voters: null,
      requestId: null,
      completedAt: null,
      myBallots: [],
      candidates: [
        cand('c-k1-1', 'PRESIDENT', 'st2', 'Can', 'Erdem'),
        cand('c-k1-2', 'PRESIDENT', 'st4', 'Mert', 'Aksu'),
        cand('c-k1-3', 'BOARD', 'st3', 'Ece', 'Yalçın'),
        cand('c-k1-4', 'BOARD', 'st30', 'Bora', 'Tunç'),
        cand('c-k1-5', 'BOARD', 'st31', 'Gizem', 'Ateş'),
        cand('c-k1-6', 'BOARD', 'st32', 'Ozan', 'Kaya'),
      ],
    },
  ],
  k2: [
    {
      id: 'el-k2-old',
      clubId: 'k2',
      status: 'COMPLETED',
      boardSeats: 2,
      auditSeats: 1,
      note: null,
      openedBy: 'st40',
      openedAt: ago(24 * 352),
      votingStartedAt: ago(24 * 340),
      closedAt: ago(24 * 336),
      eligibleVoters: 39,
      voters: 34,
      requestId: 'ap-k2-old',
      completedAt: ago(24 * 330),
      myBallots: ['PRESIDENT', 'BOARD', 'AUDIT'],
      candidates: [
        cand('c-o-1', 'PRESIDENT', 'u1', 'Elif', 'Demir', 23, true),
        cand('c-o-2', 'PRESIDENT', 'st41', 'Kaan', 'Er', 11),
        cand('c-o-3', 'BOARD', 'st5', 'Deniz', 'Kara', 19, true),
        cand('c-o-4', 'BOARD', 'st6', 'Oğuz', 'Tan', 17, true),
        cand('c-o-5', 'BOARD', 'st9', 'Selin', 'Ak', 9),
        cand('c-o-6', 'AUDIT', 'st10', 'Arda', 'Kılıç', 20, true),
      ],
    },
    {
      id: 'el-k2-older',
      clubId: 'k2',
      status: 'CANCELLED',
      boardSeats: 2,
      auditSeats: 0,
      note: null,
      openedBy: 'st40',
      openedAt: ago(24 * 420),
      votingStartedAt: null,
      closedAt: null,
      eligibleVoters: null,
      voters: null,
      requestId: null,
      completedAt: ago(24 * 405),
      myBallots: [],
      candidates: [],
    },
  ],
}

/** Önizlemede diğer üyelerin oyları: aday sırasına göre sabit sayılar; oylama bitince Elif'in oylarına eklenir. */
const OTHERS_VOTES = [14, 9, 12, 7, 11, 5, 8, 6]
const OTHER_VOTERS = 26
const myVotes: Record<string, string[]> = {}

/** Oylama bitmeden oy sayıları gizli: yanıtta null. */
const electionView = (e: Election): Election => ({
  ...e,
  myBallots: [...(e.myBallots ?? [])],
  candidates: e.candidates.map((c) => ({ ...c, votes: e.closedAt ? c.votes : null, elected: !!e.closedAt && c.elected })),
})

function findElection(config: InternalAxiosRequestConfig, clubId: string, id: string, phase?: Election['status']): Election {
  const e = (elections[clubId] ?? []).find((x) => x.id === id)
  if (!e) fail(config, 404, 'ELECTION_NOT_FOUND', 'Seçim bulunamadı.')
  if (phase && e.status !== phase) fail(config, 409, 'ELECTION_PHASE', 'Seçim bu işlem için uygun aşamada değil.')
  return e
}

const running = (clubId: string) =>
  (elections[clubId] ?? []).some((e) => e.status === 'CANDIDACY' || e.status === 'VOTING' || e.status === 'AWAITING_APPROVAL')

// ——— Onay kayıtları ———

function submit(clubId: string, r: Partial<ApprovalRequest> & Pick<ApprovalRequest, 'type' | 'status'>): ApprovalRequest {
  const club = fx.clubs.find((c) => c.id === clubId)
  const saved: ApprovalRequest = {
    id: nextId('ap'),
    clubId,
    clubName: club?.name ?? null,
    preparedBy: 'u1',
    preparedByName: 'Elif Demir',
    subjectUserId: null,
    subjectUserName: null,
    currentPosition: null,
    requestedPosition: null,
    note: null,
    rejectionReason: null,
    responseNote: null,
    createdAt: now(),
    presidentDecidedByName: null,
    presidentDecidedAt: null,
    decidedByName: null,
    decidedAt: null,
    profileChange: null,
    announcement: null,
    ...r,
  }
  ;(fx.clubApprovals[clubId] ??= []).unshift(saved)
  return { ...saved }
}

const pendingOf = (clubId: string, type: string, subject?: string) =>
  (fx.clubApprovals[clubId] ?? []).some(
    (r) =>
      r.type === type &&
      (r.status === 'PENDING_PRESIDENT' || r.status === 'PENDING_ADVISOR') &&
      (subject === undefined || r.subjectUserId === subject),
  )

const presides = (clubId: string) => fx.clubAccess(clubId).actingPresident

// ——— Tablolar ———

export const GET: [RegExp, Handler][] = [
  [/^\/clubs\/founding-invitations$/, () => invitations.map((r) => ({ ...r, founders: r.founders.map((f) => ({ ...f })) }))],
  [/^\/clubs\/my-creation-requests$/, () => creations.map((r) => ({ ...r, founders: r.founders.map((f) => ({ ...f })) }))],
  [/^\/clubs\/([^/]+)\/advisor-change-requests$/, (m) => (advisorChanges[m[1]!] ?? []).map((r) => ({ ...r }))],
  [/^\/clubs\/([^/]+)\/elections$/, (m) => (elections[m[1]!] ?? []).map(electionView)],
  [/^\/clubs\/(k2)$/, (m) => ({ ...fx.clubDetail(m[1]!)!, members: members[m[1]!]!.map((x) => ({ ...x })) })],
  [
    /^\/users\/search\/academicians$/,
    (_m, config) => {
      const q = searchKey(String((config.params as { query?: string } | undefined)?.query ?? ''))
      if (q.length < 2) return []
      return academicians.filter((a) => searchKey(`${a.firstName} ${a.lastName}`).includes(q))
    },
  ],
]

export const WRITE: [string, RegExp, Handler][] = [
  [
    'post',
    /^\/clubs\/request-creation$/,
    (_m, config) => {
      const b = body<{ name: string; about: string | null; academicAdvisorId: string }>(config)
      if (fx.clubs.some((c) => c.name.toLocaleLowerCase('tr-TR') === b.name.toLocaleLowerCase('tr-TR')))
        fail(config, 409, 'CLUB_NAME_TAKEN', 'Bu isimde bir kulüp zaten var.')
      creations.unshift({
        id: nextId('cr'),
        clubName: b.name,
        about: b.about,
        requestingStudentId: 'u1',
        suggestedAdvisorId: b.academicAdvisorId,
        status: 'PENDING',
        requestDate: now(),
        rejectionReason: null,
        processedAt: null,
        clubId: null,
        founders: [founder('u1', 'Elif', 'Demir', 'CONFIRMED', now())],
      })
      return 'Club creation request submitted. Pending advisor approval.'
    },
  ],
  [
    'post',
    /^\/clubs\/creation-requests\/([^/]+)\/founders\/(confirm|decline)$/,
    (m) => {
      const i = invitations.findIndex((r) => r.id === m[1])
      const r = invitations[i]!
      const f = r.founders.find((x) => x.studentId === 'u1')!
      Object.assign(f, { status: m[2] === 'confirm' ? 'CONFIRMED' : 'DECLINED', respondedAt: now() })
      invitations.splice(i, 1)
      return { ...r }
    },
  ],
  [
    'post',
    /^\/clubs\/([^/]+)\/role-change-requests$/,
    (m, config) => {
      const clubId = m[1]!
      const b = body<{ studentId?: string; studentNumber?: string; requestedRole: string }>(config)
      const found = b.studentId ? { id: b.studentId, name: '' } : NUMBERS[b.studentNumber ?? '']
      if (!found) fail(config, 404, 'NOT_FOUND', 'Bu öğrenci numarasıyla kayıtlı öğrenci bulunamadı.')
      const target = (members[clubId] ?? []).find((x) => x.studentId === found.id)
      if (!target) fail(config, 400, 'BAD_REQUEST', 'Bu öğrenci kulübün aktif üyesi değil. Önce üye olmalı.')
      if (canonical(target.role) === b.requestedRole) fail(config, 400, 'BAD_REQUEST', 'Öğrenci zaten bu görevde.')
      if (pendingOf(clubId, 'ROLE_CHANGE', target.studentId))
        fail(config, 409, 'CONFLICT', 'Bu öğrenci için zaten bekleyen bir görev değişikliği talebi var.')
      const limit = LIMIT[b.requestedRole]
      if (limit && (members[clubId] ?? []).filter((x) => canonical(x.role) === b.requestedRole).length >= limit)
        fail(config, 409, 'CONFLICT', 'Bu görev için kontenjan dolu.')
      submit(clubId, {
        type: 'ROLE_CHANGE',
        status: 'PENDING_ADVISOR',
        subjectUserId: target.studentId,
        subjectUserName: `${target.firstName} ${target.lastName}`,
        currentPosition: target.role,
        requestedPosition: b.requestedRole,
      })
      return { id: nextId('rc'), status: 'PENDING' }
    },
  ],
  [
    'delete',
    /^\/clubs\/([^/]+)\/members\/([^/]+)\/role$/,
    (m, config) => {
      const target = (members[m[1]!] ?? []).find((x) => x.studentId === m[2])!
      if (pendingOf(m[1]!, 'ROLE_CHANGE', target.studentId))
        fail(config, 409, 'CONFLICT', 'Bu öğrenci için zaten bekleyen bir görev değişikliği talebi var.')
      submit(m[1]!, {
        type: 'ROLE_CHANGE',
        status: 'PENDING_ADVISOR',
        subjectUserId: target.studentId,
        subjectUserName: `${target.firstName} ${target.lastName}`,
        currentPosition: target.role,
        requestedPosition: 'MEMBER',
      })
      return 'Görevden alma talebi danışman onayına gönderildi.'
    },
  ],
  [
    'post',
    /^\/clubs\/([^/]+)\/resignations$/,
    (m, config) => {
      if (pendingOf(m[1]!, 'RESIGNATION', 'u1')) fail(config, 409, 'RESIGNATION_PENDING', 'Bekleyen bir istifa talebiniz var.')
      const position = fx.clubAccess(m[1]!).position
      return submit(m[1]!, {
        type: 'RESIGNATION',
        status: presides(m[1]!) ? 'PENDING_ADVISOR' : 'PENDING_PRESIDENT',
        subjectUserId: 'u1',
        subjectUserName: 'Elif Demir',
        currentPosition: position,
        requestedPosition: 'MEMBER',
        note: body<{ note: string | null }>(config).note,
      })
    },
  ],
  [
    'post',
    /^\/clubs\/([^/]+)\/expulsion-requests$/,
    (m, config) => {
      const b = body<{ studentId: string; reason: string }>(config)
      if (pendingOf(m[1]!, 'MEMBER_EXPULSION', b.studentId))
        fail(config, 409, 'EXPULSION_PENDING', 'Bu üye için bekleyen bir çıkarma talebi var.')
      const target = (members[m[1]!] ?? []).find((x) => x.studentId === b.studentId)!
      return submit(m[1]!, {
        type: 'MEMBER_EXPULSION',
        status: 'PENDING_ADVISOR',
        subjectUserId: target.studentId,
        subjectUserName: `${target.firstName} ${target.lastName}`,
        currentPosition: target.role,
        note: b.reason,
      })
    },
  ],
  [
    'post',
    /^\/clubs\/([^/]+)\/profile-change-requests$/,
    (m, config) => {
      if (pendingOf(m[1]!, 'CLUB_PROFILE_UPDATE'))
        fail(config, 409, 'PROFILE_CHANGE_PENDING', 'Kulüp bilgileri için bekleyen bir talep var.')
      const b = body<Partial<ProfileDraft> & { note: string | null }>(config)
      const c = fx.clubDetail(m[1]!)!
      const pick = (k: keyof ProfileDraft, was: string | null) => (b[k] === undefined ? was : b[k] || null)
      return submit(m[1]!, {
        type: 'CLUB_PROFILE_UPDATE',
        status: presides(m[1]!) ? 'PENDING_ADVISOR' : 'PENDING_PRESIDENT',
        note: b.note,
        profileChange: {
          about: pick('about', c.about),
          category: pick('category', c.profile?.category ?? null) as ClubCategory | null,
          contactEmail: pick('contactEmail', c.profile?.contactEmail ?? null),
          websiteUrl: pick('websiteUrl', c.profile?.websiteUrl ?? null),
          instagramUrl: pick('instagramUrl', c.profile?.instagramUrl ?? null),
          xUrl: pick('xUrl', c.profile?.xUrl ?? null),
          linkedinUrl: pick('linkedinUrl', c.profile?.linkedinUrl ?? null),
          logoUrl: null,
        },
      })
    },
  ],
  [
    'post',
    /^\/clubs\/([^/]+)\/logo-change-requests$/,
    (m, config) => {
      if (pendingOf(m[1]!, 'CLUB_LOGO_CHANGE')) fail(config, 409, 'LOGO_CHANGE_PENDING', 'Bekleyen bir logo değişikliği talebi var.')
      const form = config.data as FormData
      return submit(m[1]!, {
        type: 'CLUB_LOGO_CHANGE',
        status: presides(m[1]!) ? 'PENDING_ADVISOR' : 'PENDING_PRESIDENT',
        note: (form.get('note') as string | null) ?? null,
        profileChange: {
          about: null,
          category: null,
          contactEmail: null,
          websiteUrl: null,
          instagramUrl: null,
          xUrl: null,
          linkedinUrl: null,
          logoUrl: URL.createObjectURL(form.get('file') as File),
        },
      })
    },
  ],
  [
    'post',
    /^\/clubs\/([^/]+)\/advisor-change-requests$/,
    (m, config) => {
      const list = (advisorChanges[m[1]!] ??= [])
      if (list.some((r) => r.status === 'PENDING_ADVISOR'))
        fail(config, 409, 'ADVISOR_CHANGE_PENDING', 'Bekleyen bir danışman değişikliği talebi var.')
      const b = body<{ proposedAdvisorId: string; message: string | null }>(config)
      const a = academicians.find((x) => x.id === b.proposedAdvisorId)!
      const saved: AdvisorChange = {
        id: nextId('ac'),
        clubId: m[1]!,
        clubName: fx.clubs.find((c) => c.id === m[1])?.name ?? null,
        proposedAdvisorId: a.id,
        proposedAdvisorName: fullName(a),
        requestedBy: 'u1',
        message: b.message,
        status: 'PENDING_ADVISOR',
        rejectionReason: null,
        createdAt: now(),
        decidedAt: null,
      }
      list.unshift(saved)
      return { ...saved }
    },
  ],
  [
    'delete',
    /^\/clubs\/([^/]+)\/advisor-change-requests\/([^/]+)$/,
    (m) => {
      const r = (advisorChanges[m[1]!] ?? []).find((x) => x.id === m[2])!
      Object.assign(r, { status: 'WITHDRAWN', decidedAt: now() })
      return null
    },
  ],
  [
    'post',
    /^\/clubs\/([^/]+)\/closure-requests$/,
    (m, config) => {
      if (pendingOf(m[1]!, 'CLUB_CLOSURE')) fail(config, 409, 'CLOSURE_PENDING', 'Kulübün bekleyen bir kapatma talebi var.')
      return submit(m[1]!, { type: 'CLUB_CLOSURE', status: 'PENDING_ADVISOR', note: body<{ reason: string }>(config).reason })
    },
  ],
  [
    'post',
    /^\/clubs\/([^/]+)\/elections$/,
    (m, config) => {
      const clubId = m[1]!
      if (running(clubId)) fail(config, 409, 'ELECTION_OPEN', 'Kulübün devam eden bir seçimi var.')
      const b = body<{ boardSeats: number; auditSeats: number; note: string | null }>(config)
      // Açıldıktan sonra birkaç üye aday olmuş sayılır.
      const seeded = [
        cand(nextId('c'), 'PRESIDENT', 'st5', 'Deniz', 'Kara'),
        cand(nextId('c'), 'BOARD', 'st9', 'Selin', 'Ak'),
        cand(nextId('c'), 'BOARD', 'st11', 'Zeynep', 'Uçar'),
        cand(nextId('c'), 'BOARD', 'st13', 'Ceren', 'Aydın'),
        cand(nextId('c'), 'AUDIT', 'st10', 'Arda', 'Kılıç'),
        cand(nextId('c'), 'AUDIT', 'st16', 'Tolga', 'Er'),
      ].filter((c) => (c.ballot === 'BOARD' ? b.boardSeats : c.ballot === 'AUDIT' ? b.auditSeats : 1) > 0)
      const e: Election = {
        id: nextId('el'),
        clubId,
        status: 'CANDIDACY',
        boardSeats: b.boardSeats,
        auditSeats: b.auditSeats,
        note: b.note,
        openedBy: 'u1',
        openedAt: now(),
        votingStartedAt: null,
        closedAt: null,
        eligibleVoters: null,
        voters: null,
        requestId: null,
        completedAt: null,
        myBallots: [],
        candidates: seeded,
      }
      ;(elections[clubId] ??= []).unshift(e)
      return electionView(e)
    },
  ],
  [
    'post',
    /^\/clubs\/([^/]+)\/elections\/([^/]+)\/candidacy$/,
    (m, config) => {
      const e = findElection(config, m[1]!, m[2]!, 'CANDIDACY')
      if (e.candidates.some((c) => c.studentId === 'u1')) fail(config, 409, 'ALREADY_CANDIDATE', 'Bu seçimde zaten adaysınız.')
      e.candidates.push(cand(nextId('c'), body<{ ballot: ElectionBallot }>(config).ballot, 'u1', 'Elif', 'Demir'))
      return electionView(e)
    },
  ],
  [
    'delete',
    /^\/clubs\/([^/]+)\/elections\/([^/]+)\/candidacy$/,
    (m, config) => {
      const e = findElection(config, m[1]!, m[2]!, 'CANDIDACY')
      e.candidates = e.candidates.filter((c) => c.studentId !== 'u1')
      return electionView(e)
    },
  ],
  [
    'post',
    /^\/clubs\/([^/]+)\/elections\/([^/]+)\/start-voting$/,
    (m, config) => {
      const e = findElection(config, m[1]!, m[2]!, 'CANDIDACY')
      if (!e.candidates.some((c) => c.ballot === 'PRESIDENT'))
        fail(config, 400, 'NO_PRESIDENT_CANDIDATE', 'Başkanlık için en az bir aday olmadan oylama başlatılamaz.')
      Object.assign(e, { status: 'VOTING', votingStartedAt: now() })
      return electionView(e)
    },
  ],
  [
    'post',
    /^\/clubs\/([^/]+)\/elections\/([^/]+)\/votes$/,
    (m, config) => {
      const e = findElection(config, m[1]!, m[2]!, 'VOTING')
      const b = body<{ ballot: ElectionBallot; candidateIds: string[] }>(config)
      if ((e.myBallots ?? []).includes(b.ballot)) fail(config, 409, 'ALREADY_VOTED', 'Bu oylamada oyunuzu zaten kullandınız.')
      e.myBallots = [...(e.myBallots ?? []), b.ballot]
      ;(myVotes[e.id] ??= []).push(...b.candidateIds)
      return electionView(e)
    },
  ],
  [
    'post',
    /^\/clubs\/([^/]+)\/elections\/([^/]+)\/close$/,
    (m, config) => {
      const clubId = m[1]!
      const e = findElection(config, clubId, m[2]!, 'VOTING')
      const mine = myVotes[e.id] ?? []
      e.candidates.forEach((c, i) => (c.votes = (OTHERS_VOTES[i % OTHERS_VOTES.length] ?? 0) + mine.filter((x) => x === c.id).length))
      for (const ballot of ['PRESIDENT', 'BOARD', 'AUDIT'] as ElectionBallot[]) {
        const seats = ballot === 'PRESIDENT' ? 1 : ballot === 'BOARD' ? e.boardSeats : e.auditSeats
        e.candidates
          .filter((c) => c.ballot === ballot)
          .sort((a, b) => (b.votes ?? 0) - (a.votes ?? 0))
          .forEach((c, i) => (c.elected = i < seats && (c.votes ?? 0) > 0))
      }
      const voters = OTHER_VOTERS + ((e.myBallots ?? []).length ? 1 : 0)
      Object.assign(e, { status: 'AWAITING_APPROVAL', closedAt: now(), eligibleVoters: 41, voters })
      const request = submit(clubId, {
        type: 'CLUB_ELECTION',
        status: presides(clubId) ? 'PENDING_ADVISOR' : 'PENDING_PRESIDENT',
        note: `Katılım: ${voters}/41`,
      })
      e.requestId = request.id
      return request
    },
  ],
  [
    'post',
    /^\/clubs\/([^/]+)\/elections\/([^/]+)\/cancel$/,
    (m, config) => {
      const e = findElection(config, m[1]!, m[2]!)
      if (e.status !== 'CANDIDACY' && e.status !== 'VOTING')
        fail(config, 409, 'ELECTION_LOCKED', 'Oylaması kapanmış seçim bu yolla iptal edilemez.')
      Object.assign(e, { status: 'CANCELLED', completedAt: now() })
      return electionView(e)
    },
  ],
]
