/**
 * Geliştirme önizlemesi için örnek veri. Biçimler gerçek API yanıtlarıyla aynıdır; tarihler bugüne göre üretilir.
 * Yalnız `/onizleme` yolunda ve geliştirme sunucusunda kullanılır, üretim paketine girmez.
 */
import { localStamp, nowLocalIso } from '@/lib/time'
import type { EnrolledCourse, Course, CourseStaff, Material, Announcement, CourseApplication, Term } from '@/features/courses/api'
import type { MyAssignment, MyGrades } from '@/features/assignments/api'
import type { MyRegistration, CampusEvent } from '@/features/events/api'
import type { AppNotification } from '@/features/notifications/api'
import type { GamificationSummary } from '@/features/gamification/api'
import type { Me } from '@/features/me/useMe'

/** Bugünden `days` gün sonra (eksiyse önce) saat `hh:mm`, bölgesiz yerel ISO. */
function at(days: number, hh: number, mm = 0): string {
  const today = nowLocalIso().slice(0, 10)
  const d = new Date(localStamp(`${today}T00:00:00`) + days * 86_400_000)
  return `${d.toISOString().slice(0, 10)}T${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:00`
}

/** UTC kayıt anı: şu andan `hours` saat önce. */
function ago(hours: number): string {
  return new Date(Date.now() - hours * 3_600_000).toISOString()
}

export const term: Term = {
  id: 't1',
  academicYear: 2026,
  season: 'FALL',
  label: '2026-2027 Güz',
  startsOn: '2026-09-14',
  endsOn: '2027-01-31',
  enrollmentOpensOn: null,
  enrollmentClosesOn: null,
}

const course = (c: Partial<EnrolledCourse> & Pick<EnrolledCourse, 'id' | 'code' | 'title' | 'instructorName'>): EnrolledCourse => ({
  description: null,
  credit: 3,
  semester: null,
  termId: 't1',
  termLabel: '2026-2027 Güz',
  section: '1',
  ects: 5,
  status: 'ACTIVE',
  imageUrl: null,
  instructorId: 'u-' + c.id,
  enrollmentDate: ago(24 * 20),
  ...c,
})

export const courses: EnrolledCourse[] = [
  course({
    id: 'c1',
    code: 'BİL 301',
    title: 'Veri Yapıları ve Algoritmalar',
    instructorName: 'Mehmet Kaya',
    credit: 4,
    ects: 6,
    description:
      'Diziler, bağlı listeler, yığın ve kuyruk, ağaçlar, öncelik kuyrukları ve çizgeler. Algoritma çözümlemesi ve büyük O gösterimi; her hafta bir uygulama oturumu.',
  }),
  course({
    id: 'c2',
    code: 'BİL 304',
    title: 'Veri Tabanı Sistemleri',
    instructorName: 'Ayşe Arslan',
    description: 'İlişkisel model, SQL, normalizasyon, işlem yönetimi ve indeksleme. Dönem projesi olarak bir kampüs uygulamasının veri modeli tasarlanır.',
  }),
  course({
    id: 'c3',
    code: 'MAT 201',
    title: 'Lineer Cebir',
    instructorName: 'Hakan Öztürk',
    section: '2',
    description: 'Vektör uzayları, doğrusal dönüşümler, matrisler, determinant, özdeğer ve özvektörler.',
  }),
  course({
    id: 'c9',
    code: 'MAT 101',
    title: 'Analiz I',
    instructorName: 'Zeynep Çelik',
    termId: 't0',
    termLabel: '2025-2026 Bahar',
    status: 'COMPLETED',
  }),
]

export const courseDetail = (id: string): Course | undefined => {
  const c = courses.find((x) => x.id === id)
  if (!c) return undefined
  const rest: Omit<EnrolledCourse, 'enrollmentDate'> & { enrollmentDate?: string } = { ...c }
  delete rest.enrollmentDate
  return { ...rest, capacity: 60, enrolledStudentCount: id === 'c1' ? 54 : 41 }
}

export const staff: Record<string, CourseStaff[]> = {
  c1: [
    { userId: 's1', role: 'COORDINATOR', name: 'Mehmet Kaya', department: 'Bilgisayar Mühendisliği', since: ago(24 * 40) },
    { userId: 's2', role: 'ASSISTANT', name: 'Deniz Yılmaz', department: 'Bilgisayar Mühendisliği', since: ago(24 * 30) },
  ],
  c2: [{ userId: 's3', role: 'COORDINATOR', name: 'Ayşe Arslan', department: 'Bilgisayar Mühendisliği', since: ago(24 * 40) }],
  c3: [{ userId: 's4', role: 'COORDINATOR', name: 'Hakan Öztürk', department: 'Matematik', since: ago(24 * 40) }],
}

const assignment = (a: Partial<MyAssignment> & Pick<MyAssignment, 'id' | 'courseId' | 'title' | 'dueDate'>): MyAssignment => ({
  description: null,
  fileUrl: null,
  type: 'HOMEWORK',
  aiPolicy: 'GUIDANCE',
  weight: 10,
  maxPoints: 100,
  gradesPublished: false,
  latePenaltyPercent: 0,
  effectiveDueDate: a.dueDate,
  effectiveLateUntil: null,
  groupSetId: null,
  groupId: null,
  groupName: null,
  submission: null,
  ...a,
})

export const assignments: MyAssignment[] = [
  assignment({
    id: 'a1',
    courseId: 'c2',
    title: 'Normalizasyon ödevi',
    dueDate: at(0, 23, 59),
    weight: 15,
    aiPolicy: 'ALLOWED_WITH_DISCLOSURE',
    latePenaltyPercent: 20,
    effectiveLateUntil: at(2, 23, 59),
    fileUrl: 'x',
    description:
      'Ekteki kütüphane tablosunu 3NF düzeyine getirin. Her adımda hangi bağımlılığı kaldırdığınızı bir cümleyle açıklayın; sonucu PDF olarak yükleyin.',
  }),
  assignment({ id: 'a2', courseId: 'c1', title: 'Bağlı liste uygulaması', dueDate: at(3, 18), type: 'PROJECT', weight: 25 }),
  assignment({ id: 'a3', courseId: 'c3', title: 'Kısa sınav 2', dueDate: at(6, 10), type: 'QUIZ', weight: 10, aiPolicy: 'NONE' }),
  assignment({ id: 'a7', courseId: 'c1', title: 'Ara sınav', dueDate: at(9, 13, 30), type: 'MIDTERM', weight: 30, aiPolicy: 'NONE' }),
  assignment({
    id: 'a5',
    courseId: 'c2',
    title: 'ER diyagramı',
    dueDate: at(-2, 18),
    effectiveLateUntil: at(1, 18),
    latePenaltyPercent: 10,
    weight: 10,
  }),
  assignment({
    id: 'a4',
    courseId: 'c1',
    title: 'Ödev 1: Yığın ve kuyruk',
    dueDate: at(-5, 18),
    weight: 15,
    gradesPublished: true,
    submission: {
      submissionId: 'sub4',
      submittedAt: ago(24 * 6),
      grade: 85,
      finalGrade: 85,
      textContent: null,
      feedback: 'Kuyruk taşma durumu güzel ele alınmış. Testlere boş yığın senaryosunu da ekleyin.',
      late: false,
      aiUsed: null,
      aiNote: null,
    },
  }),
  assignment({
    id: 'a6',
    courseId: 'c3',
    title: 'Matris işlemleri',
    dueDate: at(-10, 18),
    weight: 10,
    latePenaltyPercent: 20,
    gradesPublished: true,
    submission: {
      submissionId: 'sub6',
      submittedAt: ago(24 * 9),
      grade: 80,
      finalGrade: 64,
      textContent: null,
      feedback: null,
      late: true,
      aiUsed: null,
      aiNote: null,
    },
  }),
]

export function gradesFor(courseId: string): MyGrades {
  const list = assignments.filter((a) => a.courseId === courseId)
  const grades = list.map((a) => ({
    assignmentId: a.id,
    submissionId: a.submission?.submissionId ?? null,
    status: (a.submission ? (a.gradesPublished ? 'GRADED' : 'SUBMITTED') : 'NOT_SUBMITTED') as 'GRADED' | 'SUBMITTED' | 'NOT_SUBMITTED',
    grade: a.gradesPublished ? (a.submission?.grade ?? null) : null,
    finalGrade: a.gradesPublished ? (a.submission?.finalGrade ?? null) : null,
    late: a.submission?.late ?? false,
    submittedAt: a.submission?.submittedAt ?? null,
  }))
  const graded = list.filter((a) => a.gradesPublished && a.submission?.finalGrade != null)
  const weightedTotal = graded.reduce((s, a) => s + ((a.submission!.finalGrade ?? 0) * a.weight) / a.maxPoints, 0)
  return {
    courseId,
    assessments: list.map((a) => ({
      id: a.id,
      title: a.title,
      type: a.type,
      weight: a.weight,
      maxPoints: a.maxPoints,
      dueDate: a.dueDate,
      gradesPublished: a.gradesPublished,
    })),
    grades,
    weightedTotal: Math.round(weightedTotal * 100) / 100,
    gradedWeight: graded.reduce((s, a) => s + a.weight, 0),
  }
}

export const materials: Record<string, Material[]> = {
  c1: [
    { id: 'm1', courseId: 'c1', title: 'Ders notu: Bağlı listeler', description: 'Tek ve çift yönlü bağlı listeler, ekleme ve silme.', section: 'Hafta 3', sortOrder: 1, kind: 'FILE', fileName: 'hafta3-bagli-listeler.pdf', linkUrl: null, visible: true, createdAt: ago(200), updatedAt: ago(150) },
    { id: 'm2', courseId: 'c1', title: 'Görselleştirme aracı', description: 'Veri yapılarını adım adım izlemek için.', section: 'Hafta 3', sortOrder: 2, kind: 'LINK', fileName: null, linkUrl: 'https://visualgo.net', visible: true, createdAt: ago(200), updatedAt: ago(200) },
    { id: 'm3', courseId: 'c1', title: 'Ders notu: Yığın ve kuyruk', description: null, section: 'Hafta 2', sortOrder: 1, kind: 'FILE', fileName: 'hafta2-yigin-kuyruk.pdf', linkUrl: null, visible: true, createdAt: ago(400), updatedAt: ago(380) },
  ],
}

export const announcements: Record<string, Announcement[]> = {
  c1: [{ id: 'n1', courseId: 'c1', title: 'Ara sınav salonları açıklandı', content: 'Soyadı A–K olanlar B201, L–Z olanlar B204 salonunda. Kimlik kartınızı unutmayın.', createdAt: ago(5), createdByName: 'Dr. Öğr. Üyesi Mehmet Kaya' }],
  c2: [{ id: 'n2', courseId: 'c2', title: 'Perşembe dersi çevrim içi', content: 'Bu haftaki ders Teams üzerinden yapılacak; bağlantı ders saatinden önce paylaşılacak.', createdAt: ago(28), createdByName: 'Doç. Dr. Ayşe Arslan' }],
  c3: [],
}

export const applications: CourseApplication[] = [
  { id: 'ap1', courseId: 'c7', courseTitle: 'Olasılık ve İstatistik', courseCode: 'İST 202', status: 'PENDING', applicationDate: ago(30), processedDate: null, rejectionReason: null },
]

export const registrations: MyRegistration[] = [
  { eventId: 'e1', eventTitle: 'Arduino atölyesi', eventDescription: null, eventDate: at(1, 18, 30), eventLocation: 'B Blok 204', qrCode: null, registrationTime: ago(48), attended: false, registrationStatus: 'REGISTERED', eventStatus: 'ACTIVE' },
  { eventId: 'e2', eventTitle: 'Kariyer günleri: yazılım', eventDescription: null, eventDate: at(4, 14), eventLocation: 'Kongre Merkezi', qrCode: null, registrationTime: ago(72), attended: false, registrationStatus: 'REGISTERED', eventStatus: 'ACTIVE' },
]

export const campusEvents: CampusEvent[] = [
  { id: 'e1', title: 'Arduino atölyesi', description: null, startsAt: at(1, 18, 30), endsAt: at(1, 20, 30), location: 'B Blok 204', imageUrl: null, clubId: 'k1', clubName: 'Robotik Kulübü', organizerName: null, capacity: 40, status: 'ACTIVE' },
  { id: 'e3', title: 'Yapay zekâ ve etik söyleşisi', description: null, startsAt: at(2, 15), endsAt: at(2, 17), location: 'Amfi 1', imageUrl: null, clubId: null, clubName: null, organizerName: 'Mühendislik Fakültesi', capacity: 200, status: 'ACTIVE' },
  { id: 'e2', title: 'Kariyer günleri: yazılım', description: null, startsAt: at(4, 14), endsAt: at(4, 18), location: 'Kongre Merkezi', imageUrl: null, clubId: null, clubName: null, organizerName: 'Kariyer Merkezi', capacity: null, status: 'ACTIVE' },
  { id: 'e4', title: 'Satranç turnuvası', description: null, startsAt: at(5, 13), endsAt: at(5, 19), location: 'Kütüphane salonu', imageUrl: null, clubId: 'k2', clubName: 'Satranç Kulübü', organizerName: null, capacity: 64, status: 'ACTIVE' },
]

export const notifications: AppNotification[] = [
  { id: 'nt1', category: 'COURSE', type: 'ASSIGNMENT_GRADES_PUBLISHED', title: '[BİL 301] Yığın ve kuyruk puanları ilan edildi', body: 'Puanınız ve geri bildiriminiz hazır.', link: '/courses/c1/assignments/a4', read: false, createdAt: ago(2) },
  { id: 'nt2', category: 'COURSE', type: 'ANNOUNCEMENT', title: '[BİL 301] Ara sınav salonları açıklandı', body: 'Salon bilgisi ders duyurularında.', link: '/courses/c1?sekme=duyurular', read: false, createdAt: ago(5) },
  { id: 'nt3', category: 'EVENT', type: 'EVENT_REMINDER', title: 'Arduino atölyesi yarın 18:30', body: 'Biletiniz Biletlerim sayfasında.', link: '/events/e1', read: false, createdAt: ago(9) },
  { id: 'nt4', category: 'ACHIEVEMENT', type: 'BADGE_EARNED', title: 'Yeni rozet: Yardımsever', body: 'Bir cevabınız kabul edildi.', link: '/profile', read: true, createdAt: ago(30) },
  { id: 'nt5', category: 'CLUB_NEWS', type: 'CLUB_ANNOUNCEMENT', title: 'Robotik Kulübü: yeni dönem tanışma', body: 'Perşembe 17:00, kulüp odası.', link: '/clubs/k1', read: true, createdAt: ago(50) },
]

export const summary: GamificationSummary = {
  totalPoints: 245,
  currentStreak: 4,
  highestStreak: 6,
  badges: [
    { badgeType: 'HELPER', name: 'Yardımsever', description: 'Kabul edilen ilk cevap', imageUrl: null, earnedAt: ago(30) },
    { badgeType: 'STREAK_3', name: 'Üç hafta', description: 'Üç hafta üst üste katkı', imageUrl: null, earnedAt: ago(24 * 10) },
  ],
}

export const me: Me = {
  id: 'u1',
  firstName: 'Elif',
  lastName: 'Demir',
  email: 'elif.demir@ogr.ornek.edu.tr',
  profileImageUrl: null,
  bio: null,
  role: 'Student',
  studentNumber: '20231045',
  title: null,
  academicTitle: null,
  department: 'Bilgisayar Mühendisliği',
  programId: 'p1',
  programName: 'Bilgisayar Mühendisliği',
  programLevel: 'BACHELOR',
  facultyName: 'Mühendislik Fakültesi',
  facultyId: 'f1',
  departmentId: 'd1',
  entryYear: 2023,
  classYear: 3,
  staffCategory: null,
  affiliations: ['STUDENT'],
  officeNumber: null,
  officeHours: null,
  studentStatus: 'ACTIVE',
  staffStatus: null,
}

/** Personel unvanları (profil ucunun `title` alanı); kadro ve ders yanıtlarında unvan yok. */
export const titles: Record<string, string> = {
  s1: 'Dr. Öğr. Üyesi',
  s2: 'Arş. Gör.',
  s3: 'Doç. Dr.',
  s4: 'Prof. Dr.',
  'u-c1': 'Dr. Öğr. Üyesi',
  'u-c2': 'Doç. Dr.',
  'u-c3': 'Prof. Dr.',
  'u-c9': 'Dr. Öğr. Üyesi',
}
