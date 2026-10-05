import type { ReactNode } from 'react'
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react'
import { cn } from '@/lib/cn'

type Tone = 'info' | 'success' | 'warning' | 'danger'

const tones: Record<Tone, { box: string; icon: typeof Info; iconColor: string }> = {
  info: { box: 'bg-sunken border-rule', icon: Info, iconColor: 'text-ink-2' },
  success: { box: 'bg-success-soft border-success/40', icon: CheckCircle2, iconColor: 'text-success' },
  warning: { box: 'bg-warning-soft border-warning/40', icon: AlertTriangle, iconColor: 'text-warning' },
  danger: { box: 'bg-danger-soft border-danger/40', icon: XCircle, iconColor: 'text-danger' },
}

/** Sayfa içi bildirim. Hata tonunda `role="alert"`, diğerlerinde `status`. */
export function Notice({
  tone = 'info',
  title,
  children,
  action,
  className,
}: {
  tone?: Tone
  title?: string
  children?: ReactNode
  action?: ReactNode
  className?: string
}) {
  const { box, icon: Icon, iconColor } = tones[tone]
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={cn('flex gap-3 rounded-md border px-3.5 py-3 text-md text-ink', box, className)}
    >
      <Icon className={cn('mt-0.5 size-[18px] shrink-0', iconColor)} aria-hidden />
      <div className="min-w-0 flex-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn(title && 'mt-0.5 text-ink-2')}>{children}</div>}
        {action && <div className="mt-2.5">{action}</div>}
      </div>
    </div>
  )
}
