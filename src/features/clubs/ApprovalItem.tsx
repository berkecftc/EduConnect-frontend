import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { toApiError } from '@/lib/api/problem'
import { formatInstant } from '@/lib/time'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Field } from '@/components/ui/Field'
import { Textarea } from '@/components/ui/Textarea'
import { CATEGORY_LABEL, roleLabel } from './api'
import { ClubLogo } from './ClubMark'
import { APPROVAL_STATUS, APPROVAL_TYPE_LABEL, useDecideApproval, type ApprovalRequest } from './manage'

const REASON_MAX = 1000

/** Onaylanması ağır sonuç doğuran türler: onaydan önce bir kez daha sorulur. */
const CONSEQUENTIAL = new Set(['MEMBER_EXPULSION', 'CLUB_CLOSURE', 'ADVISOR_CHANGE', 'RESIGNATION', 'ROLE_CHANGE'])

/** Kapsayıcıya göre: geniş alanda üç sütun (tür | içerik | durum), dar alanda tür içeriğin üstünde, durum sağda. */
const GRID = 'grid gap-x-8 gap-y-3 @lg:grid-cols-[minmax(0,1fr)_11rem] @4xl:grid-cols-[10rem_minmax(0,1fr)_13rem]'

/**
 * Onay kaydı satırı: solda tür ve tarih, ortada (isteğe bağlı kulüp adıyla) içeriğin önizlemesi ve kimin hazırladığı,
 * sağda durum ve eylem. `mode="decide"` onay/ret, `mode="withdraw"` hazırlayanın geri çekmesi.
 */
export function ApprovalItem({
  request: r,
  mode,
  showClub = false,
}: {
  request: ApprovalRequest
  mode?: 'decide' | 'withdraw'
  showClub?: boolean
}) {
  const decide = useDecideApproval()
  const [dialog, setDialog] = useState<'approve' | 'reject' | 'withdraw' | null>(null)
  const [reason, setReason] = useState('')
  const status = APPROVAL_STATUS[r.status]
  const label = APPROVAL_TYPE_LABEL[r.type] ?? 'İstek'

  const run = (kind: 'approve' | 'reject' | 'withdraw', done: string) =>
    decide.mutate(
      { clubId: r.clubId, requestId: r.id, kind, reason },
      {
        onSuccess: () => {
          toast.success(done)
          setDialog(null)
          setReason('')
        },
        onError: (e) => toast.error(toApiError(e).message),
      },
    )

  return (
    <li className="@container border-b border-rule py-6">
      <div className={GRID}>
        <div>
          <p className="font-heavy">{label}</p>
          <p className="tabular mt-0.5 text-sm text-ink-3">{formatInstant(r.createdAt, 'datetime')}</p>
        </div>

        <div className="min-w-0">
          {showClub && r.clubName && (
            <Link
              to={`/clubs/${r.clubId}`}
              className="mb-1 inline-block text-sm font-semibold text-kulup underline-offset-4 hover:underline"
            >
              {r.clubName}
            </Link>
          )}
          <Preview request={r} />
          <p className="mt-3 text-sm text-ink-3">
            {r.preparedByName ? `Hazırlayan ${r.preparedByName}` : 'Hazırlayan bilinmiyor'}
            {r.presidentDecidedByName && r.presidentDecidedAt
              ? `. Başkan onayı ${r.presidentDecidedByName}, ${formatInstant(r.presidentDecidedAt, 'date')}`
              : ''}
            {r.decidedByName && r.decidedAt ? `. Karar ${r.decidedByName}, ${formatInstant(r.decidedAt, 'date')}` : ''}
          </p>
          {r.rejectionReason && <p className="mt-1 text-md text-ink-2">Ret gerekçesi: {r.rejectionReason}</p>}
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 @lg:col-start-2 @lg:row-span-2 @lg:row-start-1 @lg:flex-col @lg:items-end @lg:text-right @4xl:col-start-3 @4xl:row-span-1">
          <Badge tone={status.tone}>{status.label}</Badge>
          {mode === 'decide' && (
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setDialog('reject')}
                className="text-sm font-semibold text-ink-2 underline-offset-4 hover:text-danger hover:underline"
              >
                Reddet
              </button>
              <Button
                size="sm"
                variant="primary"
                loading={decide.isPending && dialog === null}
                onClick={() => (CONSEQUENTIAL.has(r.type) ? setDialog('approve') : run('approve', `${label} onaylandı`))}
              >
                Onayla
              </Button>
            </div>
          )}
          {mode === 'withdraw' && (
            <button
              type="button"
              onClick={() => setDialog('withdraw')}
              className="text-sm font-semibold text-ink-2 underline-offset-4 hover:text-ink hover:underline"
            >
              Geri çek
            </button>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={dialog === 'approve'}
        onOpenChange={(o) => !o && setDialog(null)}
        title={`${label} onaylansın mı?`}
        description={
          r.subjectUserName
            ? `${r.subjectUserName} hakkındaki bu istek onaylandığında hemen uygulanır.`
            : 'Bu istek onaylandığında hemen uygulanır.'
        }
        confirmLabel="Onayla"
        loading={decide.isPending}
        onConfirm={() => run('approve', `${label} onaylandı`)}
      />
      <ConfirmDialog
        open={dialog === 'reject'}
        onOpenChange={(o) => !o && setDialog(null)}
        title={`${label} reddedilsin mi?`}
        description="Gerekçeniz isteği hazırlayan kişiye iletilir."
        confirmLabel="Reddet"
        destructive
        loading={decide.isPending}
        onConfirm={() => (reason.trim() ? run('reject', `${label} reddedildi`) : toast.error('Ret gerekçesi yazın.'))}
      >
        <Field label="Gerekçe" required>
          <Textarea
            maxLength={REASON_MAX}
            valueLength={reason.length}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
          />
        </Field>
      </ConfirmDialog>
      <ConfirmDialog
        open={dialog === 'withdraw'}
        onOpenChange={(o) => !o && setDialog(null)}
        title="İsteği geri çek"
        description={`${label} isteğiniz geri çekilecek; onay süreci durur.`}
        confirmLabel="Geri çek"
        loading={decide.isPending}
        onConfirm={() => run('withdraw', 'İstek geri çekildi')}
      />
    </li>
  )
}

/** Türe göre içerik: duyuru metni, önerilen profil alanları, yeni logo, görev değişikliği, çıkarma gerekçesi ve savunma. */
function Preview({ request: r }: { request: ApprovalRequest }) {
  const subject = r.subjectUserName ?? 'Üye'
  switch (r.type) {
    case 'CLUB_ANNOUNCEMENT':
      return r.announcement ? (
        <div>
          <p className="text-lg font-heavy">{r.announcement.title}</p>
          <p className="mt-1 line-clamp-4 max-w-[64ch] whitespace-pre-line text-ink-2">{r.announcement.body}</p>
        </div>
      ) : (
        <Note text={r.note} />
      )
    case 'CLUB_LOGO_CHANGE':
      return (
        <div className="flex items-center gap-5">
          <ClubLogo name={r.clubName ?? 'Kulüp'} logoUrl={r.profileChange?.logoUrl} size="lg" />
          <Note text={r.note ?? 'Önerilen yeni logo.'} />
        </div>
      )
    case 'CLUB_PROFILE_UPDATE': {
      const p = r.profileChange
      const rows: [string, ReactNode][] = p
        ? (
            [
              ['Tanıtım', p.about],
              ['Kategori', p.category ? CATEGORY_LABEL[p.category] : null],
              ['E-posta', p.contactEmail],
              ['Web sitesi', p.websiteUrl],
              ['Instagram', p.instagramUrl],
              ['X', p.xUrl],
              ['LinkedIn', p.linkedinUrl],
            ] as [string, ReactNode][]
          ).filter(([, v]) => v)
        : []
      return rows.length ? (
        <dl className="grid max-w-[64ch] gap-x-6 gap-y-1.5 sm:grid-cols-[7rem_minmax(0,1fr)]">
          {rows.map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-sm text-ink-3">{k}</dt>
              <dd className="text-md break-words whitespace-pre-line">{v}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <Note text={r.note} />
      )
    }
    case 'ROLE_CHANGE':
      return (
        <div>
          <p className="text-lg">
            <span className="font-heavy">{subject}</span>: {roleLabel(r.currentPosition)} →{' '}
            <span className="font-heavy">{roleLabel(r.requestedPosition)}</span>
          </p>
          <Note text={r.note} />
        </div>
      )
    case 'RESIGNATION':
      return (
        <div>
          <p className="text-lg">
            <span className="font-heavy">{subject}</span> {roleLabel(r.currentPosition).toLocaleLowerCase('tr-TR')} görevinden ayrılmak
            istiyor.
          </p>
          <Note text={r.note} />
        </div>
      )
    case 'MEMBER_EXPULSION':
      return (
        <div>
          <p className="text-lg">
            <span className="font-heavy">{subject}</span> üyelikten çıkarılsın.
          </p>
          <Note label="Gerekçe" text={r.note} />
          <Note label="Savunma" text={r.responseNote ?? 'Üye henüz savunma eklemedi.'} />
        </div>
      )
    default:
      return <Note text={r.note} />
  }
}

function Note({ text, label }: { text: string | null | undefined; label?: string }) {
  if (!text) return null
  return (
    <p className="mt-1 max-w-[64ch] text-md whitespace-pre-line text-ink-2">
      {label && <span className="font-semibold text-ink">{label}: </span>}
      {text}
    </p>
  )
}
