import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Download, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { downloadFile } from '@/lib/api/client'
import { toApiError, type ApiError } from '@/lib/api/problem'
import { formatNumber } from '@/lib/format'
import { formatInstant, formatLocal } from '@/lib/time'
import { usePageTitle } from '@/lib/usePageTitle'
import { useCourse } from '@/features/courses/api'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ChoiceGroup } from '@/components/ui/ChoiceGroup'
import { Field } from '@/components/ui/Field'
import { FileField } from '@/components/ui/FileField'
import { Notice } from '@/components/ui/Notice'
import { EmptyState, PageHeader, QueryBoundary } from '@/components/ui/States'
import { Textarea } from '@/components/ui/Textarea'
import {
  AI_NOTE_MAX,
  AI_POLICY,
  SUBMISSION_TEXT_MAX,
  TYPE_LABEL,
  useMyAssignments,
  useSubmissionVersions,
  useSubmitAssignment,
  type MyAssignment,
} from './api'
import { viewAssignment } from './model'

/** Teslim dosyası için ön sınır; asıl doğrulama sunucuda. */
const SUBMISSION_MAX_BYTES = 20 * 1024 * 1024

/** Ödev sayfası (öğrenci): bildirim bağlantısı /courses/{courseId}/assignments/{id} buraya düşer (F-76). */
export function AssignmentPage() {
  const { courseId = '', assignmentId = '' } = useParams()
  const assignments = useMyAssignments()
  const course = useCourse(courseId)
  const a = assignments.data?.find((x) => x.id === assignmentId)
  usePageTitle(a ? a.title : 'Ödev')

  return (
    <div className="max-w-[60rem]">
      <Link to={`/courses/${courseId}?sekme=odevler`} className="text-sm font-semibold text-ders underline-offset-2 hover:underline">
        {course.data ? `${course.data.code} ödevleri` : 'Ders ödevleri'}
      </Link>
      <div className="mt-3">
        <QueryBoundary query={assignments} what="Ödev" skeletonRows={3}>
          {() =>
            a ? (
              <AssignmentBody assignment={a} courseLabel={course.data ? `${course.data.code} ${course.data.title}` : undefined} />
            ) : (
              <EmptyState title="Bu ödev bulunamadı">
                Ödev kaldırılmış ya da bu derse kayıtlı olmayabilirsiniz.{' '}
                <Link to="/assignments" className="font-semibold text-ders underline-offset-2 hover:underline">
                  Ödevlerime dön
                </Link>
              </EmptyState>
            )
          }
        </QueryBoundary>
      </div>
    </div>
  )
}

function AssignmentBody({ assignment: a, courseLabel }: { assignment: MyAssignment; courseLabel?: string }) {
  const v = viewAssignment(a)
  const s = a.submission
  const [busy, setBusy] = useState(false)

  const download = async (url: string, name: string) => {
    setBusy(true)
    try {
      await downloadFile(url, name)
    } catch (e) {
      toast.error(toApiError(e).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageHeader
        title={a.title}
        meta={
          <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
            {courseLabel && <span>{courseLabel}</span>}
            <span>{TYPE_LABEL[a.type]}</span>
            {a.weight > 0 && <span>Ağırlık %{formatNumber(a.weight)}</span>}
            <span>{formatNumber(a.maxPoints)} puan</span>
            <Badge tone={v.status.tone}>{v.status.label}</Badge>
          </span>
        }
      />

      <dl className="mt-8 grid gap-x-8 gap-y-5 border-y border-rule py-5 sm:grid-cols-2">
        <div>
          <dt className="text-sm text-ink-3">Son tarih</dt>
          <dd className="mt-0.5 font-semibold">
            <span className="tabular">{formatLocal(a.effectiveDueDate, 'long')}, {formatLocal(a.effectiveDueDate, 'time')}</span>
            {a.effectiveDueDate !== a.dueDate && <Badge tone="info" className="ml-2">Size özel uzatma</Badge>}
          </dd>
          {v.timing && <dd className="text-sm text-ink-2">{v.timing}</dd>}
        </div>
        <div>
          <dt className="text-sm text-ink-3">Geç teslim</dt>
          <dd className="mt-0.5 font-semibold">
            {a.effectiveLateUntil ? (
              <span className="tabular">
                {formatLocal(a.effectiveLateUntil, 'datetime')} kadar{v.penaltyText ? `, ${v.penaltyText} kesinti` : ''}
              </span>
            ) : (
              'Yok, teslim son tarihte kapanır'
            )}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="flex items-center gap-1.5 text-sm text-ink-3">
            <Sparkles className="size-4" aria-hidden />
            Yapay zekâ kullanımı
          </dt>
          <dd className="mt-0.5">
            <span className="font-semibold">{AI_POLICY[a.aiPolicy].label}.</span>{' '}
            <span className="text-ink-2">{AI_POLICY[a.aiPolicy].description}</span>
          </dd>
        </div>
        {a.groupSetId && (
          <div className="sm:col-span-2">
            <dt className="text-sm text-ink-3">Grup ödevi</dt>
            <dd className="mt-0.5 font-semibold">{a.groupName ?? 'Henüz bir gruba katılmadınız'}</dd>
          </div>
        )}
      </dl>

      {(a.description || a.fileUrl) && (
        <section aria-labelledby="odev-aciklama" className="mt-8">
          <h2 id="odev-aciklama" className="text-lg">
            Açıklama
          </h2>
          {a.description && <p className="mt-2 max-w-[68ch] whitespace-pre-line text-ink-2">{a.description}</p>}
          {a.fileUrl && (
            <Button className="mt-4" loading={busy} onClick={() => void download(`/assignments/${a.id}/file`, `${a.title}`)}>
              <Download className="size-4" aria-hidden />
              Ödev dosyasını indir
            </Button>
          )}
        </section>
      )}

      {s && (
        <section aria-labelledby="teslimim" className="mt-10">
          <h2 id="teslimim" className="text-lg">
            Teslimim
          </h2>
          <div className="mt-3 rounded-md border border-rule bg-surface p-4">
            <p className="text-md text-ink-2">
              {formatInstant(s.submittedAt, 'datetime')} tarihinde teslim edildi
              {s.late && <Badge tone="warning" className="ml-2">Geç teslim</Badge>}
            </p>
            {v.gradeText && (
              <p className="mt-3">
                <span className="tabular text-2xl font-heavy">{v.gradeText}</span>
                {s.late && v.penaltyText && <span className="ml-2 text-sm text-ink-3">({v.penaltyText})</span>}
              </p>
            )}
            {s.feedback && (
              <div className="mt-3">
                <p className="text-sm font-semibold text-ink-3">Hocanın geri bildirimi</p>
                <p className="mt-1 whitespace-pre-line">{s.feedback}</p>
              </div>
            )}
            {s.textContent && (
              <div className="mt-3">
                <p className="text-sm font-semibold text-ink-3">Metin</p>
                <p className="mt-1 max-h-60 overflow-y-auto whitespace-pre-line text-md">{s.textContent}</p>
              </div>
            )}
            {s.aiUsed !== null && (
              <p className="mt-3 text-sm text-ink-2">
                Yapay zekâ beyanı: <span className="font-semibold text-ink">{s.aiUsed ? 'Kullandım' : 'Kullanmadım'}</span>
                {s.aiUsed && s.aiNote ? `. ${s.aiNote}` : ''}
              </p>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" loading={busy} onClick={() => void download(`/assignments/submissions/${s.submissionId}/file`, `${a.title} teslim`)}>
                <Download className="size-4" aria-hidden />
                Teslim dosyamı indir
              </Button>
            </div>
            <Versions submissionId={s.submissionId} />
          </div>
        </section>
      )}

      <section aria-labelledby="teslim-et" className="mt-10">
        <h2 id="teslim-et" className="text-lg">
          {s ? 'Yeniden teslim et' : 'Teslim et'}
        </h2>
        {v.canSubmit ? (
          <SubmitForm assignment={a} resubmit={!!s} late={v.phase === 'late'} penaltyText={v.penaltyText} />
        ) : (
          <p className="mt-2 text-ink-2">{v.blockedReason}</p>
        )}
      </section>
    </>
  )
}

function Versions({ submissionId }: { submissionId: string }) {
  const versions = useSubmissionVersions(submissionId)
  if (!versions.data || versions.data.length < 2) return null
  return (
    <details className="mt-4">
      <summary className="cursor-pointer text-sm font-semibold text-ders">Sürüm geçmişi ({versions.data.length})</summary>
      <ol className="mt-2 flex flex-col gap-1 text-sm text-ink-2">
        {versions.data.map((ver) => (
          <li key={ver.versionNo} className="tabular">
            Sürüm {ver.versionNo}: {formatInstant(ver.submittedAt, 'datetime')}
            {ver.late ? ', geç' : ''}
          </li>
        ))}
      </ol>
    </details>
  )
}

/** Teslim formu (F-48, F-79): dosya ve/veya metin; politika gerektiriyorsa yapay zekâ beyanı. */
function SubmitForm({ assignment: a, resubmit, late, penaltyText }: { assignment: MyAssignment; resubmit: boolean; late: boolean; penaltyText: string | null }) {
  const submit = useSubmitAssignment(a.id)
  const [file, setFile] = useState<File | null>(null)
  const [text, setText] = useState('')
  const [aiUsed, setAiUsed] = useState<'yes' | 'no' | undefined>()
  const [aiNote, setAiNote] = useState('')
  const [errors, setErrors] = useState<{ content?: string; ai?: string; aiNote?: string }>({})
  const [failure, setFailure] = useState<ApiError | null>(null)
  const needsDeclaration = a.aiPolicy === 'ALLOWED_WITH_DISCLOSURE'

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFailure(null)
    const next: typeof errors = {}
    if (!file && !text.trim()) next.content = 'Dosya ekleyin ya da metin yazın.'
    if (needsDeclaration && !aiUsed) next.ai = 'Yapay zekâ kullanıp kullanmadığınızı seçin.'
    setErrors(next)
    if (Object.keys(next).length) return
    submit.mutate(
      { file, text, aiUsed: needsDeclaration ? aiUsed === 'yes' : null, aiNote },
      {
        onSuccess: () => {
          toast.success(resubmit ? 'Yeniden teslim edildi' : 'Teslim edildi')
          setFile(null)
          setText('')
        },
        onError: (err) => {
          const ae = toApiError(err)
          if (ae.code === 'SUBMISSION_EMPTY') setErrors({ content: ae.message })
          else if (ae.code === 'AI_DECLARATION_REQUIRED') setErrors({ ai: ae.message })
          else if (ae.code === 'AI_NOTE_TOO_LONG') setErrors({ aiNote: ae.message })
          else setFailure(ae)
        },
      },
    )
  }

  return (
    <form onSubmit={onSubmit} noValidate className="mt-4 flex max-w-[40rem] flex-col gap-5">
      {(resubmit || late) && (
        <Notice tone={late ? 'warning' : 'info'}>
          {late && `Son tarih geçti; bu teslim geç sayılır${penaltyText ? ` ve puandan ${penaltyText.replace('geç teslim ', '')} kesilir` : ''}. Geç teslimden sonra yeniden teslim yapılamaz. `}
          {resubmit && 'Yeni teslim öncekinin yerine geçer; önceki sürüm geçmişte kalır.'}
        </Notice>
      )}
      <FileField label="Dosya" hint="İsteğe bağlı, en fazla 20 MB." maxBytes={SUBMISSION_MAX_BYTES} value={file} onChange={setFile} />
      <Field label="Metin" hint="İsteğe bağlı. Dosya ya da metinden en az biri gerekli." error={errors.content}>
        <Textarea maxLength={SUBMISSION_TEXT_MAX} valueLength={text.length} value={text} onChange={(e) => setText(e.target.value)} rows={6} />
      </Field>
      {needsDeclaration && (
        <>
          <ChoiceGroup
            label="Yapay zekâ beyanı"
            value={aiUsed}
            onChange={setAiUsed}
            error={errors.ai}
            choices={[
              { value: 'no', title: 'Kullanmadım', description: 'Bu çalışmada yapay zekâ aracı kullanmadım.' },
              { value: 'yes', title: 'Kullandım', description: 'Hangi araçla ve ne için kullandığınızı aşağıya yazın.' },
            ]}
          />
          {aiUsed === 'yes' && (
            <Field label="Nasıl kullandınız?" hint="Ör. kod hatasını bulmak için ChatGPT'ye danıştım." error={errors.aiNote}>
              <Textarea maxLength={AI_NOTE_MAX} valueLength={aiNote.length} value={aiNote} onChange={(e) => setAiNote(e.target.value)} rows={3} />
            </Field>
          )}
        </>
      )}
      {failure && (
        <Notice tone={failure.status === 409 ? 'warning' : 'danger'} title="Teslim edilemedi">
          {failure.message}
        </Notice>
      )}
      <div>
        <Button type="submit" variant="primary" size="lg" loading={submit.isPending}>
          {resubmit ? 'Yeniden teslim et' : 'Teslim et'}
        </Button>
      </div>
    </form>
  )
}
