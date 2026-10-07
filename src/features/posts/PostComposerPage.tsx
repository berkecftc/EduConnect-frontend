import { useId, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { toApiError, type ApiError } from '@/lib/api/problem'
import { hasRole, useSession } from '@/lib/auth/session'
import { usePageTitle } from '@/lib/usePageTitle'
import { useMyCourses } from '@/features/courses/api'
import { Button } from '@/components/ui/Button'
import { ChoiceGroup } from '@/components/ui/ChoiceGroup'
import { Field } from '@/components/ui/Field'
import { FileField } from '@/components/ui/FileField'
import { Input } from '@/components/ui/Input'
import { Notice } from '@/components/ui/Notice'
import { Panel } from '@/components/ui/Panel'
import { Select } from '@/components/ui/Select'
import { EmptyState, PageHeader, QueryBoundary } from '@/components/ui/States'
import { Textarea } from '@/components/ui/Textarea'
import { uploadAttachment, useAttachment, usePost, useSavePost, type Post, type PostInput } from './api'

const ATTACHMENT_MAX = 20 * 1024 * 1024
const CONTENT_MAX = 10_000

/** Gönderi yaz / düzenle (F-67, F-71). Öğrenciye açık: soru, ders notu, genel. */
export function PostComposerPage() {
  const { postId } = useParams()
  usePageTitle(postId ? 'Gönderiyi düzenle' : 'Gönderi yaz')
  const session = useSession()
  const student = hasRole(session, 'ROLE_STUDENT', 'ROLE_CLUB_OFFICIAL')
  const post = usePost(postId ?? '', !!postId)

  if (!postId && !student) {
    return (
      <div className="mx-auto max-w-[56rem]">
        <EmptyState title="Gönderi yazma öğrencilere açık">Akışı okuyabilir ve gönderilere yorum yazabilirsiniz.</EmptyState>
      </div>
    )
  }
  return (
    <div className="mx-auto max-w-[72rem]">
      <PageHeader title={postId ? 'Gönderiyi düzenle' : 'Gönderi yaz'} />
      <div className="mt-10 grid gap-14 lg:grid-cols-12 lg:gap-10">
        <div className="min-w-0 lg:col-span-8">
          {postId ? (
            <QueryBoundary query={post} what="Gönderi" skeletonRows={4}>
              {(p) => <Composer existing={p} />}
            </QueryBoundary>
          ) : (
            <Composer />
          )}
        </div>
        <aside className="lg:col-span-4">
          <Panel title="Puan">
            <p className="text-md text-ink-2">Puan girişle değil katkıyla kazanılır:</p>
            <dl className="mt-4">
              {(
                [
                  ['Kabul edilen cevap', '+15'],
                  ['Haklı çıkan şikâyet', '+10'],
                  ['Kaydedilen ders notu', '+3'],
                  ['Beğenilen ders notu', '+2'],
                ] as const
              ).map(([k, v]) => (
                <div key={k} className="flex items-baseline justify-between border-b border-rule py-2.5 first:pt-0">
                  <dt className="text-md">{k}</dt>
                  <dd className="tabular text-lg font-heavy">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-sm text-ink-3">Günlük sınırlar vardır. İçerik kaldırılırsa kazandırdığı puan geri alınır.</p>
          </Panel>
        </aside>
      </div>
    </div>
  )
}

function Composer({ existing }: { existing?: Post }) {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const save = useSavePost(existing?.id)
  const courses = useMyCourses()
  const declarationId = useId()
  const editing = !!existing
  const [category, setCategory] = useState<PostInput['category']>(existing && existing.category !== 'DUYURU' ? existing.category : 'SORU')
  const [title, setTitle] = useState(existing?.title ?? '')
  const [content, setContent] = useState(existing?.content ?? '')
  const [courseId, setCourseId] = useState(existing?.courseId ?? '')
  const [declared, setDeclared] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [errors, setErrors] = useState<Partial<Record<'title' | 'content' | 'declaration' | 'course', string>>>({})
  const [failure, setFailure] = useState<ApiError | null>(null)
  const [uploading, setUploading] = useState(false)
  const note = category === 'DERS_NOTU'

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const next: typeof errors = {}
    if (!title.trim()) next.title = 'Başlık yazın.'
    if (!content.trim()) next.content = note ? 'Notunuzu yazın.' : 'İçeriği yazın.'
    if (note && !editing && !declared) next.declaration = 'Paylaşmadan önce bu beyanı onaylayın.'
    setErrors(next)
    setFailure(null)
    if (Object.keys(next).length) return
    save.mutate(
      { title, content, category, courseId: category === 'GENEL' ? null : courseId || null, sharingDeclaration: declared },
      {
        onSuccess: async (p) => {
          if (note && file) {
            setUploading(true)
            try {
              await uploadAttachment(p.id, file)
              void qc.invalidateQueries({ queryKey: ['posts', p.id] })
            } catch (err) {
              toast.error(`Gönderi kaydedildi ama ek yüklenemedi: ${toApiError(err).message}`)
            } finally {
              setUploading(false)
            }
          }
          toast.success(
            editing
              ? 'Gönderiniz güncellendi'
              : p.status === 'PUBLISHED'
                ? 'Gönderiniz yayımlandı'
                : 'Gönderiniz kontrol edildikten sonra yayımlanacak',
          )
          navigate(`/posts/${p.id}`)
        },
        onError: (err) => {
          const ae = toApiError(err)
          if (ae.code === 'DECLARATION_REQUIRED') setErrors({ declaration: ae.message })
          else if (ae.code === 'NOT_COURSE_MEMBER' || ae.code === 'SCOPE_NOT_ALLOWED') setErrors({ course: ae.message })
          else setFailure(ae)
        },
      },
    )
  }

  return (
    <form onSubmit={submit} noValidate className="flex max-w-[44rem] flex-col gap-7">
      {editing ? (
        <p className="text-md text-ink-2">
          Tür:{' '}
          <span className="font-semibold text-ink">{category === 'SORU' ? 'Soru' : category === 'DERS_NOTU' ? 'Ders notu' : 'Genel'}</span>
          {existing?.courseLabel ? `, ${existing.courseLabel}` : ''}. Tür ve ders sonradan değiştirilemez.
        </p>
      ) : (
        <ChoiceGroup
          layout="rows"
          label="Ne paylaşıyorsunuz?"
          value={category}
          onChange={setCategory}
          choices={[
            { value: 'SORU', title: 'Soru', description: 'Takıldığınız bir konuyu sorun; gelen cevaplardan birini seçebilirsiniz.' },
            { value: 'DERS_NOTU', title: 'Ders notu', description: 'Kendi hazırladığınız notu paylaşın; dosya ekleyebilirsiniz.' },
            { value: 'GENEL', title: 'Genel', description: 'Derse bağlı olmayan tartışma ve paylaşımlar.' },
          ]}
        />
      )}

      {!editing && category !== 'GENEL' && (
        <Field label="Ders" hint="İsteğe bağlı. Yalnız kayıtlı olduğunuz ya da aldığınız dersler." error={errors.course}>
          <Select value={courseId} onChange={(e) => setCourseId(e.target.value)} disabled={courses.isPending}>
            <option value="">Derse bağlı değil</option>
            {(courses.data ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} {c.title}
              </option>
            ))}
          </Select>
        </Field>
      )}

      <Field label="Başlık" required error={errors.title}>
        <Input
          maxLength={255}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={category === 'SORU' ? 'Ör. Kırmızı-siyah ağaçta silme nasıl dengelenir?' : undefined}
        />
      </Field>
      <Field label={note ? 'Not' : category === 'SORU' ? 'Soru' : 'İçerik'} required error={errors.content}>
        <Textarea
          maxLength={CONTENT_MAX}
          valueLength={content.length}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={10}
        />
      </Field>

      {note &&
        (editing ? (
          <AttachmentEditor post={existing!} />
        ) : (
          <FileField
            label="Ek dosya"
            hint="İsteğe bağlı, en fazla 20 MB. PDF, görsel ya da belge; çalıştırılabilir dosyalar kabul edilmez."
            maxBytes={ATTACHMENT_MAX}
            value={file}
            onChange={setFile}
          />
        ))}

      {note && !editing && (
        <div>
          <label htmlFor={declarationId} className="flex cursor-pointer items-start gap-3 text-md">
            <input
              id={declarationId}
              type="checkbox"
              checked={declared}
              onChange={(e) => setDeclared(e.target.checked)}
              aria-invalid={errors.declaration ? true : undefined}
              className="mt-0.5 size-[18px] shrink-0 cursor-pointer accent-[var(--ec-ink)]"
            />
            <span>Bu not bana ait; sınav sorusu, cevap anahtarı ya da telifli materyal içermiyor.</span>
          </label>
          {errors.declaration && <p className="mt-1.5 text-sm font-semibold text-danger">{errors.declaration}</p>}
        </div>
      )}

      {failure && (
        <Notice variant="line" tone="danger" title="Kaydedilemedi">
          {failure.message}
        </Notice>
      )}
      <div className="flex items-center gap-5">
        <Button type="submit" variant="primary" size="lg" loading={save.isPending || uploading}>
          {editing ? 'Kaydet' : 'Paylaş'}
        </Button>
        <Link
          to={existing ? `/posts/${existing.id}` : '/posts'}
          className="text-md font-semibold text-ink-2 underline-offset-4 hover:text-ink hover:underline"
        >
          Vazgeç
        </Link>
      </div>
    </form>
  )
}

/** Düzenlemede ek: değiştir ya da kaldır (tek ek; yenisi eskisinin yerine geçer). */
function AttachmentEditor({ post }: { post: Post }) {
  const attach = useAttachment(post.id)
  const [file, setFile] = useState<File | null>(null)
  const fail = (e: unknown) => toast.error(toApiError(e).message)
  return (
    <div className="flex flex-col gap-3">
      {post.attachmentName && (
        <p className="flex flex-wrap items-baseline gap-x-4 text-md">
          <span>
            Mevcut ek: <span className="font-semibold">{post.attachmentName}</span>
          </span>
          <button
            type="button"
            onClick={() => attach.mutate(null, { onSuccess: () => toast.success('Ek kaldırıldı'), onError: fail })}
            className="text-sm font-semibold text-ink-2 underline-offset-4 hover:text-danger hover:underline"
          >
            Eki kaldır
          </button>
        </p>
      )}
      <FileField
        label={post.attachmentName ? 'Yeni ek' : 'Ek dosya'}
        hint="En fazla 20 MB."
        maxBytes={ATTACHMENT_MAX}
        value={file}
        onChange={setFile}
      />
      {file && (
        <div>
          <Button
            size="sm"
            loading={attach.isPending}
            onClick={() =>
              attach.mutate(file, {
                onSuccess: () => {
                  toast.success('Ek yüklendi')
                  setFile(null)
                },
                onError: fail,
              })
            }
          >
            Eki yükle
          </Button>
        </div>
      )}
    </div>
  )
}
