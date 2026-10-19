/**
 * Görevli ve yönetici önizlemesi (`/onizleme?rol=gorevli` ya da `?rol=yonetici`): doğrulama kuyrukları, profil talepleri,
 * hesaplar ve görevli hesapları. Görevli ve yöneticinin profili yoktur (`/users/me` 404, F-83).
 * Bellekte tutulur; yalnız geliştirme içindir.
 */
import type { InternalAxiosRequestConfig } from 'axios'
import type { AffiliationStatus, ManagedAccount, StaffAccount } from '@/features/manage/accounts'
import type { AcademicianRequest, ChangeRequest, StudentRequest } from '@/features/manage/verification'

type Handler = (m: RegExpMatchArray, config: InternalAxiosRequestConfig) => unknown

/** Önizlemenin yönetim rolü; PreviewPage ayarlar. */
export const state: { role: 'staff' | 'admin' | null } = { role: null }

export const STAFF = { id: 'g1', email: 'dogrulama@ornek.edu.tr' }

const ago = (hours: number) => new Date(Date.now() - hours * 3_600_000).toISOString()

function fail(config: InternalAxiosRequestConfig, status: number, errorCode: string, message: string): never {
  throw Object.assign(new Error(message), {
    isAxiosError: true,
    config,
    response: { status, statusText: '', headers: {}, config, data: { status, errorCode, message } },
  })
}

const body = <T>(config: InternalAxiosRequestConfig) => (config.data ? (JSON.parse(String(config.data)) as T) : ({} as T))

/** Önizleme belgesi: gerçekte MinIO'nun 15 dakikalık bağlantısı. */
const doc = (title: string, lines: string[]) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="600" height="400" fill="#fff"/><text x="40" y="70" font-family="sans-serif" font-size="26" font-weight="700">${title}</text>${lines
      .map((l, i) => `<text x="40" y="${130 + i * 40}" font-family="sans-serif" font-size="20">${l}</text>`)
      .join('')}</svg>`,
  )}`

// ——— Doğrulama ———

export const students: StudentRequest[] = [
  {
    id: 101,
    firstName: 'Zeynep',
    lastName: 'Aydın',
    email: 'zeynep.aydin@ogr.ornek.edu.tr',
    studentNumber: '20261004',
    department: 'Bilgisayar Mühendisliği',
    studentDocumentUrl: doc('Öğrenci belgesi', ['Zeynep Aydın', 'No: 20261004', 'Bilgisayar Mühendisliği (Lisans)']),
    emailVerified: true,
    additionalAffiliation: false,
    programId: 'p1',
  },
  {
    id: 102,
    firstName: 'Emre',
    lastName: 'Kılıç',
    email: 'emre.kilic@ogr.ornek.edu.tr',
    studentNumber: '20261011',
    department: 'Bilgisayar Mühendisliği',
    studentDocumentUrl: doc('Öğrenci belgesi', ['Emre Kılıç', 'No: 20261011']),
    emailVerified: false,
    additionalAffiliation: false,
    programId: 'p1',
  },
  {
    id: 103,
    firstName: 'Deniz',
    lastName: 'Yılmaz',
    email: 'deniz.yilmaz@ornek.edu.tr',
    studentNumber: '20262201',
    department: 'Bilgisayar Mühendisliği',
    studentDocumentUrl: doc('Öğrenci belgesi', ['Deniz Yılmaz', 'No: 20262201', 'Doktora']),
    emailVerified: true,
    additionalAffiliation: true,
    programId: 'p1',
  },
]

export const academicians: AcademicianRequest[] = [
  {
    id: 201,
    userId: 'a-201',
    firstName: 'Selin',
    lastName: 'Koç',
    title: 'Dr. Öğr. Üyesi',
    department: 'Bilgisayar Mühendisliği',
    officeNumber: 'B-318',
    idCardImageUrl: doc('Personel kimlik kartı', ['Dr. Öğr. Üyesi Selin Koç', 'Bilgisayar Mühendisliği']),
    emailVerified: true,
    additionalAffiliation: false,
  },
]

export const changes: ChangeRequest[] = [
  {
    id: 'cr-1',
    userId: 'u1',
    currentName: 'Elif Demir',
    firstName: null,
    lastName: 'Demir Yalçın',
    academicTitle: null,
    titleLabel: null,
    programId: null,
    departmentId: null,
    reason: 'Evlilik nedeniyle soyadım değişti; nüfus cüzdanımın fotokopisini öğrenci işlerine teslim ettim.',
    status: 'PENDING',
    reviewNote: null,
    reviewedAt: null,
    createdAt: ago(30),
  },
  {
    id: 'cr-2',
    userId: 's5',
    currentName: 'Selin Koç',
    firstName: null,
    lastName: null,
    academicTitle: 'ASSOCIATE_PROFESSOR',
    titleLabel: 'Doç. Dr.',
    programId: null,
    departmentId: null,
    reason: 'Doçentlik unvanım 1 Ekim itibarıyla YÖK tarafından onaylandı.',
    status: 'PENDING',
    reviewNote: null,
    reviewedAt: null,
    createdAt: ago(8),
  },
  {
    id: 'cr-3',
    userId: 'st3',
    currentName: 'Ece Yalçın',
    firstName: 'Ecem',
    lastName: null,
    academicTitle: null,
    titleLabel: null,
    programId: null,
    departmentId: null,
    reason: 'Adım sistemde eksik yazılmış.',
    status: 'REJECTED',
    reviewNote: 'Nüfus kaydındaki adınız Ece; değişiklik için resmî belge gerekli.',
    reviewedAt: ago(24 * 6),
    createdAt: ago(24 * 8),
  },
]

const byStatus = (config: InternalAxiosRequestConfig) => {
  const status = (config.params as { status?: string } | undefined)?.status ?? 'PENDING'
  return changes.filter((c) => c.status === status).map((c) => ({ ...c }))
}

const decideChange = (id: string, approve: boolean, config: InternalAxiosRequestConfig) => {
  const c = changes.find((x) => x.id === id)!
  if (c.status !== 'PENDING') fail(config, 409, 'CHANGE_REQUEST_CLOSED', 'Bu talep zaten sonuçlandırılmış.')
  const note = approve ? null : (body<{ note?: string | null }>(config).note ?? null)
  Object.assign(c, { status: approve ? 'APPROVED' : 'REJECTED', reviewNote: note, reviewedAt: new Date().toISOString() })
  return { ...c }
}

// ——— Hesaplar ———

const managed = (a: Pick<ManagedAccount, 'id' | 'email' | 'roles'> & Partial<ManagedAccount>): ManagedAccount => ({
  status: 'ACTIVE',
  studentNumber: null,
  studentStatus: null,
  staffStatus: null,
  closureDueAt: null,
  ...a,
})

export const accounts: ManagedAccount[] = [
  managed({
    id: 'u1',
    email: 'elif.demir@ogr.ornek.edu.tr',
    roles: ['ROLE_STUDENT', 'ROLE_CLUB_OFFICIAL'],
    studentNumber: '20231045',
    studentStatus: 'ACTIVE',
  }),
  managed({
    id: 'st2',
    email: 'can.erdem@ogr.ornek.edu.tr',
    roles: ['ROLE_STUDENT'],
    studentNumber: '20221187',
    studentStatus: 'ON_LEAVE',
  }),
  managed({
    id: 'st9',
    email: 'selin.ak@ogr.ornek.edu.tr',
    roles: ['ROLE_STUDENT'],
    status: 'SUSPENDED',
    studentNumber: '20211230',
    studentStatus: 'ACTIVE',
  }),
  managed({
    id: 'st40',
    email: 'mert.yalcin@ogr.ornek.edu.tr',
    roles: ['ROLE_STUDENT'],
    studentNumber: '20191004',
    studentStatus: 'GRADUATED',
    closureDueAt: ago(-24 * 21),
  }),
  managed({ id: 's1', email: 'mehmet.kaya@ornek.edu.tr', roles: ['ROLE_ACADEMICIAN'], staffStatus: 'ACTIVE' }),
  managed({
    id: 's2',
    email: 'deniz.yilmaz@ornek.edu.tr',
    roles: ['ROLE_ACADEMICIAN', 'ROLE_STUDENT'],
    studentNumber: '20252210',
    studentStatus: 'ACTIVE',
    staffStatus: 'ACTIVE',
  }),
]

const affiliationHistory: Record<string, AffiliationStatus['history']> = {
  st2: [
    {
      affiliation: 'STUDENT',
      previousStatus: 'ACTIVE',
      status: 'ON_LEAVE',
      effectiveDate: '2026-09-01',
      reason: 'Sağlık nedeniyle bir dönem kayıt dondurma; YK 2026/31.',
      changedBy: STAFF.id,
      changedAt: ago(24 * 48),
    },
  ],
  st40: [
    {
      affiliation: 'STUDENT',
      previousStatus: 'ACTIVE',
      status: 'GRADUATED',
      effectiveDate: '2026-07-15',
      reason: null,
      changedBy: STAFF.id,
      changedAt: ago(24 * 9),
    },
  ],
}

const account = (id: string) => accounts.find((a) => a.id === id)!
const ENDED = ['GRADUATED', 'WITHDRAWN', 'EXPELLED', 'TRANSFERRED_OUT', 'RETIRED', 'RESIGNED', 'TERMINATED']

// ——— Görevli hesapları ———

export const staffAccounts: StaffAccount[] = [
  {
    id: 'g1',
    email: 'dogrulama@ornek.edu.tr',
    displayName: 'Öğrenci İşleri',
    status: 'ACTIVE',
    grants: [
      { permission: 'STUDENT_VERIFIER', facultyId: null },
      { permission: 'STAFF_VERIFIER', facultyId: null },
      { permission: 'ACCOUNT_MANAGER', facultyId: null },
    ],
  },
  {
    id: 'g2',
    email: 'muhendislik.ogrenci@ornek.edu.tr',
    displayName: 'Mühendislik Fakültesi Öğrenci İşleri',
    status: 'ACTIVE',
    grants: [{ permission: 'STUDENT_VERIFIER', facultyId: 'f1' }],
  },
  {
    id: 'g3',
    email: 'moderasyon@ornek.edu.tr',
    displayName: 'Topluluk Moderasyonu',
    status: 'ACTIVE',
    grants: [{ permission: 'MODERATOR', facultyId: null }],
  },
  {
    id: 'g4',
    email: 'sks@ornek.edu.tr',
    displayName: 'Sağlık, Kültür ve Spor',
    status: 'SUSPENDED',
    grants: [{ permission: 'CAMPUS_PUBLISHER', facultyId: null }],
  },
]

type GrantBody = { grants: { permission: StaffAccount['grants'][number]['permission']; facultyIds: string[] }[] }
const flatten = (b: GrantBody): StaffAccount['grants'] =>
  b.grants.flatMap((g): StaffAccount['grants'] =>
    g.facultyIds.length
      ? g.facultyIds.map((facultyId) => ({ permission: g.permission, facultyId }))
      : [{ permission: g.permission, facultyId: null }],
  )

// ——— Tablolar ———

export const GET: [RegExp, Handler][] = [
  [/^\/users\/me$/, (_m, config) => fail(config, 404, 'PROFILE_NOT_FOUND', 'Profil bulunamadı.')],
  [/^\/auth\/verification\/students$/, () => students.map((s) => ({ ...s }))],
  [/^\/auth\/verification\/academicians$/, () => academicians.map((a) => ({ ...a }))],
  [/^\/users\/(?:verification|admin)\/change-requests$/, (_m, config) => byStatus(config)],
  [
    /^\/auth\/account-management\/users$/,
    (_m, config) => {
      const q = String((config.params as { query?: string } | undefined)?.query ?? '')
        .trim()
        .toLocaleLowerCase('tr-TR')
      if (q.length < 3) return []
      return accounts.filter((a) => a.studentNumber === q || a.email.toLocaleLowerCase('tr-TR').includes(q)).map((a) => ({ ...a }))
    },
  ],
  [
    /^\/auth\/account-management\/users\/([^/]+)\/affiliations$/,
    (m) => {
      const a = account(m[1]!)
      return {
        userId: a.id,
        studentStatus: a.studentStatus,
        staffStatus: a.staffStatus,
        closureDueAt: a.closureDueAt,
        history: [...(affiliationHistory[a.id] ?? [])],
      }
    },
  ],
  [/^\/auth\/admin\/staff-accounts$/, () => staffAccounts.map((s) => ({ ...s, grants: [...s.grants] }))],
]

export const WRITE: [string, RegExp, Handler][] = [
  [
    'post',
    /^\/auth\/verification\/students\/([^/]+)\/(approve|reject)$/,
    (m, config) => {
      const i = students.findIndex((s) => String(s.id) === m[1])
      if (m[2] === 'approve' && !students[i]!.emailVerified)
        fail(config, 409, 'CONFLICT', 'Başvuru sahibi e-posta adresini henüz doğrulamadı.')
      students.splice(i, 1)
      return m[2] === 'approve' ? 'Öğrenci onaylandı.' : 'Öğrenci başvurusu reddedildi.'
    },
  ],
  [
    'post',
    /^\/auth\/verification\/academicians\/([^/]+)\/(approve|reject)$/,
    (m) => {
      academicians.splice(
        academicians.findIndex((a) => a.userId === m[1]),
        1,
      )
      return m[2] === 'approve' ? 'Akademisyen onaylandı.' : 'Akademisyen başvurusu reddedildi.'
    },
  ],
  ['post', /^\/users\/(?:verification|admin)\/change-requests\/([^/]+)\/approve$/, (m, config) => decideChange(m[1]!, true, config)],
  ['post', /^\/users\/(?:verification|admin)\/change-requests\/([^/]+)\/reject$/, (m, config) => decideChange(m[1]!, false, config)],
  [
    'put',
    /^\/auth\/account-management\/users\/([^/]+)\/(student|staff)-status$/,
    (m, config) => {
      const a = account(m[1]!)
      const b = body<{ status: string; effectiveDate: string | null; reason: string | null }>(config)
      const key = m[2] === 'student' ? 'studentStatus' : 'staffStatus'
      if (a[key] === b.status) fail(config, 409, 'STATUS_UNCHANGED', 'Hesap zaten bu durumda.')
      ;(affiliationHistory[a.id] ??= []).push({
        affiliation: m[2] === 'student' ? 'STUDENT' : 'STAFF',
        previousStatus: a[key],
        status: b.status,
        effectiveDate: b.effectiveDate ?? new Date().toISOString().slice(0, 10),
        reason: b.reason,
        changedBy: STAFF.id,
        changedAt: new Date().toISOString(),
      })
      Object.assign(a, { [key]: b.status })
      const stillActive = [a.studentStatus, a.staffStatus].some((s) => s && !ENDED.includes(s))
      a.closureDueAt = stillActive ? null : ago(-24 * 30)
      return null
    },
  ],
  [
    'put',
    /^\/auth\/account-management\/users\/([^/]+)\/(suspend|reactivate)$/,
    (m) => {
      account(m[1]!).status = m[2] === 'suspend' ? 'SUSPENDED' : 'ACTIVE'
      return m[2] === 'suspend' ? 'Hesap askıya alındı.' : 'Hesap yeniden etkin.'
    },
  ],
  [
    'put',
    /^\/auth\/account-management\/users\/([^/]+)\/email$/,
    (m, config) => {
      const a = account(m[1]!)
      const { newEmail } = body<{ newEmail: string }>(config)
      if (newEmail === a.email) fail(config, 409, 'EMAIL_UNCHANGED', 'Yeni adres mevcut adresle aynı.')
      if (accounts.some((x) => x.email === newEmail)) fail(config, 409, 'EMAIL_TAKEN', 'Bu e-posta adresi kullanılıyor.')
      if (!/@(ogr\.)?ornek\.edu\.tr$/.test(newEmail))
        fail(config, 400, 'EMAIL_DOMAIN_NOT_ALLOWED', 'E-posta adresi kurum alan adlarından biri olmalı: ornek.edu.tr, ogr.ornek.edu.tr')
      a.email = newEmail
      return { ...a }
    },
  ],
  [
    'post',
    /^\/auth\/admin\/staff-accounts$/,
    (_m, config) => {
      const b = body<GrantBody & { email: string; displayName: string }>(config)
      if (staffAccounts.some((s) => s.email === b.email)) fail(config, 409, 'EMAIL_TAKEN', 'Bu e-posta adresi kullanılıyor.')
      const s: StaffAccount = { id: 'g-' + Date.now(), email: b.email, displayName: b.displayName, status: 'ACTIVE', grants: flatten(b) }
      staffAccounts.push(s)
      return s
    },
  ],
  [
    'put',
    /^\/auth\/admin\/staff-accounts\/([^/]+)\/permissions$/,
    (m, config) => {
      const s = staffAccounts.find((x) => x.id === m[1])!
      s.grants = flatten(body<GrantBody>(config))
      return { ...s }
    },
  ],
  [
    'put',
    /^\/auth\/admin\/users\/([^/]+)\/(suspend|reactivate)$/,
    (m) => {
      const s = staffAccounts.find((x) => x.id === m[1])
      if (s) s.status = m[2] === 'suspend' ? 'SUSPENDED' : 'ACTIVE'
      return 'Tamam'
    },
  ],
]
