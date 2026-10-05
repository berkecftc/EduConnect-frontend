import { useId } from 'react'
import { Link } from 'react-router-dom'
import { usePageTitle } from '@/lib/usePageTitle'
import { EmptyState, PageHeader, QueryBoundary } from '@/components/ui/States'
import { ApprovalItem } from './ApprovalItem'
import { useClubs } from './api'
import { ClubLogo } from './ClubMark'
import { useApprovalInbox, type ApprovalRequest } from './manage'

/**
 * Onay bekleyenler: başkanlığını yaptığınız kulüplerde başkan onayı, danışmanı olduğunuz kulüplerde danışman onayı
 * bekleyen istekler. Kulübe göre gruplu, en eski istek önce (backend sırası).
 */
export function ApprovalsPage() {
  usePageTitle('Onay bekleyenler')
  const inbox = useApprovalInbox()
  // Onay kaydı logo taşımaz; kulüp listesinden (önbellekte) alınır.
  const clubs = useClubs()
  const logos = new Map((clubs.data ?? []).map((c) => [c.id, c.logoUrl]))
  return (
    <div className="mx-auto max-w-[80rem]">
      <PageHeader
        title="Onay bekleyenler"
        meta={inbox.data ? (inbox.data.length > 0 ? `${inbox.data.length} istek kararınızı bekliyor.` : 'Kararınızı bekleyen istek yok.') : undefined}
      />
      <div className="mt-10">
        <QueryBoundary query={inbox} what="Onay kutusu" skeletonRows={4}>
          {(list) =>
            list.length === 0 ? (
              <EmptyState title="Her şey güncel">
                Yönetim kurulunun hazırladığı duyurular, görev değişiklikleri ve kulüp bilgisi güncellemeleri onayınıza düştüğünde burada görünür.
              </EmptyState>
            ) : (
              <div className="flex flex-col gap-14">
                {groupByClub(list).map(([clubId, items]) => (
                  <ClubGroup key={clubId} items={items} logoUrl={logos.get(clubId)} />
                ))}
              </div>
            )
          }
        </QueryBoundary>
      </div>
    </div>
  )
}

function groupByClub(list: ApprovalRequest[]): [string, ApprovalRequest[]][] {
  const groups = new Map<string, ApprovalRequest[]>()
  for (const r of list) groups.set(r.clubId, [...(groups.get(r.clubId) ?? []), r])
  return [...groups.entries()]
}

function ClubGroup({ items, logoUrl }: { items: ApprovalRequest[]; logoUrl?: string | null }) {
  const id = useId()
  const first = items[0]!
  const name = first.clubName ?? 'Kulüp'
  return (
    <section aria-labelledby={id}>
      <h2 id={id} className="flex items-center gap-4 border-b-2 border-ink pb-3">
        <ClubLogo name={name} logoUrl={logoUrl} />
        <Link to={`/clubs/${first.clubId}?sekme=yonetim`} className="text-3xl leading-none font-heavy tracking-[-0.02em] underline-offset-4 hover:underline">
          {name}
        </Link>
        <span className="tabular text-md text-ink-3">{items.length} istek</span>
      </h2>
      <ul>
        {items.map((r) => (
          <ApprovalItem key={r.id} request={r} mode="decide" />
        ))}
      </ul>
    </section>
  )
}
