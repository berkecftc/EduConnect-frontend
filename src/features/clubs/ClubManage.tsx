import { useState } from 'react'
import { toast } from 'sonner'
import { toApiError } from '@/lib/api/problem'
import { useSession } from '@/lib/auth/session'
import { formatInstant } from '@/lib/time'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { Notice } from '@/components/ui/Notice'
import { Panel } from '@/components/ui/Panel'
import { QueryBoundary } from '@/components/ui/States'
import { Textarea } from '@/components/ui/Textarea'
import { roleLabel } from './api'
import { ApprovalItem } from './ApprovalItem'
import {
  can,
  isPendingApproval,
  useClubApprovals,
  useDecideMembership,
  usePendingMembershipRequests,
  useSubmitAnnouncement,
  type ClubAccess,
  type MembershipRecommendation,
  type PendingMembershipRequest,
} from './manage'

const TITLE_MAX = 200
const BODY_MAX = 5000
const NOTE_MAX = 1000

/** Yönetim sekmesi: yalnız yetkinin izin verdiği bölümler görünür (F-85). */
export function ClubManage({ clubId, access }: { clubId: string; access: ClubAccess }) {
  const decides = can(access, 'MANAGE_MEMBERSHIP_REQUESTS')
  const reviews = can(access, 'REVIEW_MEMBERSHIP_REQUESTS')
  const showRequests = decides || reviews
  const showDecisions = can(access, 'VIEW_DECISIONS')
  const announces = can(access, 'PREPARE_ANNOUNCEMENT')

  return (
    <div className="grid gap-14 lg:grid-cols-12 lg:gap-10">
      <div className="flex min-w-0 flex-col gap-14 lg:col-span-8">
        {showRequests && <MembershipRequests clubId={clubId} decides={decides} />}
        {showDecisions && <Decisions clubId={clubId} access={access} />}
      </div>
      <aside className="flex flex-col gap-14 lg:col-span-4">
        <Panel title="Göreviniz">
          <p className="text-lg font-heavy">{access.advisor ? 'Danışman' : roleLabel(access.position)}</p>
          {access.actingPresident && access.position !== 'PRESIDENT' && access.position !== 'ROLE_CLUB_OFFICIAL' && (
            <p className="mt-1 text-md text-ink-2">Başkanlık boş olduğu için başkan yetkilerini vekâleten kullanıyorsunuz.</p>
          )}
        </Panel>
        {announces && <AnnouncementForm clubId={clubId} publishesDirectly={access.actingPresident} />}
      </aside>
    </div>
  )
}

function MembershipRequests({ clubId, decides }: { clubId: string; decides: boolean }) {
  const requests = usePendingMembershipRequests(clubId, true)
  return (
    <Panel
      title="Üyelik başvuruları"
      action={requests.data?.length ? <span className="tabular text-md text-ink-3">{requests.data.length} bekliyor</span> : undefined}
    >
      <QueryBoundary query={requests} what="Başvurular" skeletonRows={2}>
        {(list) =>
          list.length === 0 ? (
            <p className="text-ink-3">Bekleyen üyelik başvurusu yok.</p>
          ) : (
            <ul className="border-t border-rule">
              {[...list]
                .sort((a, b) => a.requestDate.localeCompare(b.requestDate))
                .map((r) => (
                  <RequestRow key={r.id} clubId={clubId} request={r} decides={decides} />
                ))}
            </ul>
          )
        }
      </QueryBoundary>
    </Panel>
  )
}

/**
 * Bekleyen başvuru: öğrenci, başvuru zamanı ve notu, varsa üyelik sorumlusunun önerisi.
 * Karar yetkisi olan kabul eder ya da reddeder; üyelik sorumlusu yalnız öneri verir.
 */
function RequestRow({ clubId, request: r, decides }: { clubId: string; request: PendingMembershipRequest; decides: boolean }) {
  const decide = useDecideMembership(clubId)
  const [dialog, setDialog] = useState<'reject' | MembershipRecommendation | null>(null)
  const [text, setText] = useState('')
  const name = r.studentName ?? 'Öğrenci'

  const done = (message: string) => ({
    onSuccess: () => {
      toast.success(message)
      setDialog(null)
      setText('')
    },
    onError: (e: unknown) => toast.error(toApiError(e).message),
  })

  return (
    <li className="grid gap-x-8 gap-y-3 border-b border-rule py-5 sm:grid-cols-[minmax(0,1fr)_auto]">
      <div className="min-w-0">
        <p className="text-lg font-heavy">{name}</p>
        <p className="text-sm text-ink-3">
          {r.studentEmail && <span className="mr-4">{r.studentEmail}</span>}
          {formatInstant(r.requestDate, 'datetime')} tarihinde başvurdu
        </p>
        {r.message && <p className="mt-2 max-w-[60ch] text-md whitespace-pre-line text-ink-2">“{r.message}”</p>}
        {r.recommendation && (
          <p className="mt-2 text-md">
            <Badge tone={r.recommendation === 'APPROVE' ? 'success' : 'danger'}>
              {r.recommendation === 'APPROVE' ? 'Üyelik sorumlusu kabul öneriyor' : 'Üyelik sorumlusu ret öneriyor'}
            </Badge>
            {r.recommendationNote && <span className="ml-3 text-ink-2">{r.recommendationNote}</span>}
          </p>
        )}
      </div>
      <div className="flex items-center gap-4 sm:flex-col sm:items-end">
        {decides ? (
          <>
            <Button
              size="sm"
              variant="primary"
              loading={decide.isPending && dialog === null}
              onClick={() => decide.mutate({ kind: 'approve', requestId: r.id }, done(`${name} üyeliğe kabul edildi`))}
            >
              Kabul et
            </Button>
            <button type="button" onClick={() => setDialog('reject')} className="text-sm font-semibold text-ink-2 underline-offset-4 hover:text-danger hover:underline">
              Reddet
            </button>
          </>
        ) : (
          <>
            <Button size="sm" onClick={() => setDialog('APPROVE')}>
              Kabul öner
            </Button>
            <button type="button" onClick={() => setDialog('REJECT')} className="text-sm font-semibold text-ink-2 underline-offset-4 hover:text-ink hover:underline">
              Ret öner
            </button>
          </>
        )}
      </div>

      <ConfirmDialog
        open={dialog === 'reject'}
        onOpenChange={(o) => !o && setDialog(null)}
        title={`${name} başvurusu reddedilsin mi?`}
        description="Gerekçe yazarsanız öğrenciye iletilir."
        confirmLabel="Reddet"
        destructive
        loading={decide.isPending}
        onConfirm={() => decide.mutate({ kind: 'reject', requestId: r.id, reason: text }, done('Başvuru reddedildi'))}
      >
        <Field label="Gerekçe" hint="İsteğe bağlı.">
          <Textarea maxLength={NOTE_MAX} valueLength={text.length} value={text} onChange={(e) => setText(e.target.value)} rows={3} />
        </Field>
      </ConfirmDialog>
      <ConfirmDialog
        open={dialog === 'APPROVE' || dialog === 'REJECT'}
        onOpenChange={(o) => !o && setDialog(null)}
        title={dialog === 'APPROVE' ? 'Kabul öner' : 'Ret öner'}
        description="Öneriniz kararı verecek yöneticiye başvuruyla birlikte gösterilir."
        confirmLabel="Öneriyi gönder"
        loading={decide.isPending}
        onConfirm={() =>
          (dialog === 'APPROVE' || dialog === 'REJECT') &&
          decide.mutate({ kind: 'recommend', requestId: r.id, recommendation: dialog, note: text }, done('Öneriniz kaydedildi'))
        }
      >
        <Field label="Notunuz" hint="İsteğe bağlı.">
          <Textarea maxLength={NOTE_MAX} valueLength={text.length} value={text} onChange={(e) => setText(e.target.value)} rows={3} />
        </Field>
      </ConfirmDialog>
    </li>
  )
}

/**
 * Kulüp kararları: bekleyenler önce, sonra son kararlar. Sıra size geldiyse karar verebilir,
 * kendi hazırladığınız bekleyen isteği geri çekebilirsiniz.
 */
function Decisions({ clubId, access }: { clubId: string; access: ClubAccess }) {
  const session = useSession()
  const approvals = useClubApprovals(clubId, true)
  return (
    <Panel title="Kulüp kararları">
      <QueryBoundary query={approvals} what="Kararlar" skeletonRows={2}>
        {(list) => {
          if (list.length === 0) return <p className="text-ink-3">Henüz bir karar kaydı yok.</p>
          const pending = list.filter((r) => isPendingApproval(r.status))
          const past = list.filter((r) => !isPendingApproval(r.status)).slice(0, 10)
          return (
            <ul className="border-t border-rule">
              {[...pending, ...past].map((r) => {
                const myTurn =
                  (r.status === 'PENDING_PRESIDENT' && can(access, 'APPROVE_AS_PRESIDENT')) || (r.status === 'PENDING_ADVISOR' && access.advisor)
                const mine = isPendingApproval(r.status) && !!session && r.preparedBy === session.userId
                return <ApprovalItem key={r.id} request={r} mode={myTurn ? 'decide' : mine ? 'withdraw' : undefined} />
              })}
            </ul>
          )
        }}
      </QueryBoundary>
    </Panel>
  )
}

/** Duyuru hazırla: başkan (ya da vekili) hazırlarsa hemen yayımlanır; diğerlerinde başkan onayına gider. */
function AnnouncementForm({ clubId, publishesDirectly }: { clubId: string; publishesDirectly: boolean }) {
  const submit = useSubmitAnnouncement(clubId)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [errors, setErrors] = useState<{ title?: string; body?: string }>({})

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const next: typeof errors = {}
    if (!title.trim()) next.title = 'Başlık yazın.'
    if (!body.trim()) next.body = 'Duyuru metnini yazın.'
    setErrors(next)
    if (Object.keys(next).length) return
    submit.mutate(
      { title, body },
      {
        onSuccess: (r) => {
          toast.success(r.status === 'APPROVED' ? 'Duyuru yayımlandı' : 'Duyuru başkan onayına gönderildi')
          setTitle('')
          setBody('')
        },
        onError: (err) => toast.error(toApiError(err).message),
      },
    )
  }

  return (
    <Panel title="Duyuru hazırla">
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
        <Notice variant="line" tone="info">
          {publishesDirectly ? 'Başkan olarak hazırladığınız duyuru hemen üyelere yayımlanır.' : 'Duyuru, başkan onayladıktan sonra üyelere yayımlanır.'}
        </Notice>
        <Field label="Başlık" error={errors.title} required>
          <Input maxLength={TITLE_MAX} value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <Field label="Metin" error={errors.body} required>
          <Textarea maxLength={BODY_MAX} valueLength={body.length} value={body} onChange={(e) => setBody(e.target.value)} rows={6} />
        </Field>
        <div>
          <Button type="submit" variant="primary" loading={submit.isPending}>
            {publishesDirectly ? 'Yayımla' : 'Onaya gönder'}
          </Button>
        </div>
      </form>
    </Panel>
  )
}
