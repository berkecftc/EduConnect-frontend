import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/cn'

/** Bölüm: kalın üst çizgi, tek düzey başlık, sağda bağlantı ya da eylem. Kutu yok. */
export function Panel({
  title,
  to,
  linkLabel = 'Tümü',
  action,
  children,
  className,
}: {
  title: string
  to?: string
  linkLabel?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  const id = `bolum-${title.replace(/\s+/g, '-').toLocaleLowerCase('tr-TR')}`
  return (
    <section aria-labelledby={id} className={cn('border-t-2 border-ink pt-4', className)}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 id={id} className="text-xl font-heavy">
          {title}
        </h2>
        {action}
        {!action && to && (
          <Link to={to} className="text-sm font-semibold underline-offset-4 hover:underline">
            {linkLabel}
          </Link>
        )}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  )
}
