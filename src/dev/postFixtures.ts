/**
 * Akış önizleme deposu: gönderiler, yorumlar ve işlemler bellekte; sayfa yenilenince sıfırlanır.
 * Biçimler gerçek API ile aynıdır (PostResponse, CommentResponse). Yalnız `/onizleme` içindir.
 */
import type { Appeal, Post, PostComment } from '@/features/posts/api'

const ago = (hours: number) => new Date(Date.now() - hours * 3_600_000).toISOString()
const ME = 'u1'

const post = (p: Partial<Post> & Pick<Post, 'id' | 'title' | 'content' | 'category' | 'authorId' | 'authorName' | 'createdAt'>): Post => ({
  status: 'PUBLISHED',
  publisherType: 'STUDENT',
  clubId: null,
  courseId: null,
  publisherName: null,
  official: false,
  commentsDisabled: false,
  reviewNote: null,
  courseLabel: null,
  attachmentName: null,
  acceptedCommentId: null,
  authorDepartment: 'Bilgisayar Mühendisliği',
  likeCount: 0,
  commentCount: 0,
  liked: false,
  bookmarked: false,
  updatedAt: null,
  ...p,
})

export const posts: Post[] = [
  post({
    id: 'p1',
    title: 'Kırmızı-siyah ağaçta silmeden sonra renkler nasıl düzeltiliyor?',
    content:
      'Ekleme tarafını anladım ama silmede "çift siyah" durumunda kardeş düğümün rengine göre dört ayrı durum var. Özellikle kardeş siyah, yeğenlerden biri kırmızıyken hangi döndürmeyi yapacağımı karıştırıyorum. Adım adım anlatan olursa çok sevinirim.',
    category: 'SORU',
    courseId: 'c1',
    courseLabel: 'BİL 301 Veri Yapıları ve Algoritmalar',
    authorId: 'st3',
    authorName: 'Ece Yalçın',
    createdAt: ago(5),
    likeCount: 4,
    commentCount: 3,
    acceptedCommentId: 'cm2',
  }),
  post({
    id: 'p2',
    title: 'Normalizasyon özeti: 1NF’den BCNF’ye',
    content:
      'Ara sınav öncesi kendi çıkardığım özet. Her normal formu bir örnek tablo üzerinden gösterdim; sonunda sık yapılan hataları listeledim.\n\nÖzetin tamamı ekteki PDF’te.',
    category: 'DERS_NOTU',
    courseId: 'c2',
    courseLabel: 'BİL 304 Veri Tabanı Sistemleri',
    attachmentName: 'normalizasyon-ozeti.pdf',
    authorId: 'st2',
    authorName: 'Can Erdem',
    createdAt: ago(26),
    likeCount: 18,
    commentCount: 1,
    bookmarked: true,
  }),
  post({
    id: 'p3',
    title: 'Robotik Kulübü yarışma takımı seçmeleri',
    content: 'Bahar dönemindeki robot yarışması için takım seçmeleri gelecek hafta laboratuvarda. Katılmak isteyenler kulüp sayfasından başvurabilir.',
    category: 'DUYURU',
    publisherType: 'CLUB',
    clubId: 'k1',
    publisherName: 'Robotik Kulübü',
    official: true,
    authorId: 'st2',
    authorName: 'Can Erdem',
    createdAt: ago(30),
    likeCount: 9,
    commentsDisabled: true,
  }),
  post({
    id: 'p4',
    title: 'Kütüphanenin üçüncü katı sınav haftasında 24 saat açık mı?',
    content: 'Geçen dönem açıktı diye hatırlıyorum, bu dönem için duyuru göremedim. Bilen var mı?',
    category: 'GENEL',
    authorId: 'st7',
    authorName: 'Burcu Öz',
    authorDepartment: 'Elektrik-Elektronik Mühendisliği',
    createdAt: ago(48),
    likeCount: 2,
    commentCount: 0,
  }),
  post({
    id: 'p5',
    title: 'Bağlı listede ters çevirme için özyinelemeli çözüm',
    content: 'Yinelemeli çözümü yazdım ama özyinelemeli sürümde son düğümün next değerini nerede null yapmam gerektiğini bulamadım.',
    category: 'SORU',
    status: 'PENDING',
    courseId: 'c1',
    courseLabel: 'BİL 301 Veri Yapıları ve Algoritmalar',
    authorId: ME,
    authorName: 'Elif Demir',
    createdAt: ago(1),
  }),
  post({
    id: 'p6',
    title: 'Ara sınav soruları',
    content: 'Geçen yılın ara sınav sorularını paylaşıyorum.',
    category: 'DERS_NOTU',
    status: 'HIDDEN',
    reviewNote: 'Sınav soruları paylaşılamaz (akademik dürüstlük).',
    courseId: 'c1',
    courseLabel: 'BİL 301 Veri Yapıları ve Algoritmalar',
    authorId: ME,
    authorName: 'Elif Demir',
    createdAt: ago(24 * 9),
  }),
]

const comment = (c: Partial<PostComment> & Pick<PostComment, 'id' | 'postId' | 'authorId' | 'authorName' | 'content' | 'createdAt'>): PostComment => ({
  parentCommentId: null,
  status: 'PUBLISHED',
  moderationNote: null,
  replies: [],
  updatedAt: null,
  ...c,
})

export const comments: PostComment[] = [
  comment({ id: 'cm1', postId: 'p1', authorId: 'st4', authorName: 'Mert Aksu', content: 'Cormen’deki tabloyu takip et; durum 3’ten sonra hep durum 4’e geçiyorsun.', createdAt: ago(4) }),
  comment({
    id: 'cm2',
    postId: 'p1',
    authorId: 'st2',
    authorName: 'Can Erdem',
    content:
      'Kardeş siyah ve uzak yeğen siyah, yakın yeğen kırmızıysa önce kardeşte ters yöne döndür ve renklerini değiştir; böylece durum 4’e indirgenir. Durum 4’te ebeveynde döndürüp kardeşe ebeveynin rengini ver, ebeveyni ve uzak yeğeni siyah yap. Çift siyah orada biter.',
    createdAt: ago(3),
    replies: [comment({ id: 'cm3', postId: 'p1', parentCommentId: 'cm2', authorId: 'st3', authorName: 'Ece Yalçın', content: 'Çok net oldu, teşekkürler!', createdAt: ago(2) })],
  }),
  comment({ id: 'cm4', postId: 'p2', authorId: ME, authorName: 'Elif Demir', content: 'BCNF örneği çok iyi olmuş, sağ ol.', createdAt: ago(20) }),
]

export const appeals: Appeal[] = []

/** Akış süzgeci: kategori, resmî; kaydedilenler ve benimkiler ayrı. */
export function feed(list: 'all' | 'saved' | 'mine', params: { category?: string; official?: boolean; page?: number; size?: number }) {
  const all = posts.filter((p) =>
    list === 'saved' ? p.bookmarked : list === 'mine' ? p.authorId === ME : p.status === 'PUBLISHED' && (!params.category || p.category === params.category) && (!params.official || p.official),
  )
  const page = params.page ?? 0
  const size = params.size ?? 10
  const content = all.slice(page * size, page * size + size).map((p) => ({ ...p }))
  return { content, totalElements: all.length, totalPages: Math.ceil(all.length / size), number: page, last: (page + 1) * size >= all.length }
}

/** Yorumlar: yazar kendi yayımlanmamış yorumunu görür, diğerleri yalnız yayındakileri. */
export function commentsOf(postId: string) {
  const visible = comments.filter((c) => c.postId === postId && (c.status === 'PUBLISHED' || c.authorId === ME))
  const copy = (c: PostComment): PostComment => ({ ...c, replies: c.replies.filter((r) => r.status === 'PUBLISHED' || r.authorId === ME).map(copy) })
  return { content: visible.map(copy), totalElements: visible.length, totalPages: 1, number: 0, last: true }
}

export function findComment(id: string): PostComment | undefined {
  for (const c of comments) {
    if (c.id === id) return c
    const r = c.replies.find((x) => x.id === id)
    if (r) return r
  }
  return undefined
}

export function recount(postId: string) {
  const p = posts.find((x) => x.id === postId)
  if (p) p.commentCount = comments.filter((c) => c.postId === postId && c.status === 'PUBLISHED').reduce((n, c) => n + 1 + c.replies.length, 0)
}

export function newPost(body: Record<string, unknown>): Post {
  const p = post({
    id: 'p-' + Date.now(),
    title: String(body.title),
    content: String(body.content),
    category: (body.category as Post['category']) ?? 'SORU',
    courseId: (body.courseId as string) ?? null,
    courseLabel: body.courseId === 'c1' ? 'BİL 301 Veri Yapıları ve Algoritmalar' : body.courseId === 'c2' ? 'BİL 304 Veri Tabanı Sistemleri' : null,
    authorId: ME,
    authorName: 'Elif Demir',
    createdAt: new Date().toISOString(),
  })
  posts.unshift(p)
  return p
}

export function newComment(postId: string, content: string, parentId?: string): PostComment {
  const c = comment({ id: 'cm-' + Date.now(), postId, parentCommentId: parentId ?? null, authorId: ME, authorName: 'Elif Demir', content, createdAt: new Date().toISOString() })
  if (parentId) findComment(parentId)?.replies.push(c)
  else comments.push(c)
  recount(postId)
  return c
}
