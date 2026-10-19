import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import type { ApiError } from '@/lib/api/problem'
import type { CampusEvent } from './api'

/**
 * Etkinlik görevlileri (F-63): kapıda bilet okutan, kulübün aktif üyelerinden seçilen kişiler. Etkinliği yöneten
 * (MANAGE_EVENT_OPERATIONS) önerir; başkan önerirse hemen atanır, diğer önerileri başkan onaylar. Yalnız kulüp
 * etkinliklerinde ve etkinlik bitmeden. Onaylı görevli kapı ekranından giriş yapar (`verify-qr`).
 */

export type EventStaffStatus = 'PENDING' | 'APPROVED'

export type EventStaff = {
  eventId: string
  userId: string
  firstName: string | null
  lastName: string | null
  status: EventStaffStatus
  proposedBy: string | null
  approvedBy: string | null
  createdAt: string
  decidedAt: string | null
}

export const staffName = (s: Pick<EventStaff, 'firstName' | 'lastName'>) => [s.firstName, s.lastName].filter(Boolean).join(' ') || 'Üye'

/** Görevli atanabilen durumlar (sunucu kuralı): onayda ya da yayında olan, bitmemiş etkinlik. */
export const staffable = (e: Pick<CampusEvent, 'status' | 'clubId'>) =>
  !!e.clubId && (e.status === 'PENDING_PRESIDENT' || e.status === 'PENDING' || e.status === 'ACTIVE')

export const staffKeys = {
  list: (eventId: string) => ['events', eventId, 'staff'] as const,
  mine: ['events', 'staff', 'me'] as const,
}

export function useEventStaff(eventId: string, enabled: boolean) {
  return useQuery({
    queryKey: staffKeys.list(eventId),
    enabled,
    queryFn: async () => (await api.get<EventStaff[]>(`/events/manage/${eventId}/staff`)).data,
  })
}

/** Görevli olduğum, yayında ve bitmemiş etkinlikler. */
export function useMyStaffEvents(enabled = true) {
  return useQuery({
    queryKey: staffKeys.mine,
    enabled,
    staleTime: 60_000,
    queryFn: async () => (await api.get<CampusEvent[]>('/events/manage/staff/me')).data,
  })
}

export type StaffAction = { kind: 'propose' | 'approve' | 'reject' | 'remove'; userId: string }

export function useStaffAction(eventId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (a: StaffAction) => {
      const base = `/events/manage/${eventId}/staff`
      if (a.kind === 'propose') return (await api.post<EventStaff>(base, { userId: a.userId })).data
      if (a.kind === 'remove') return void (await api.delete(`${base}/${a.userId}`))
      return void (await api.post(`${base}/${a.userId}/${a.kind}`))
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: staffKeys.list(eventId) })
      void qc.invalidateQueries({ queryKey: staffKeys.mine })
    },
  })
}

// ——— Kapı ———

/** Bilet doğrulama hatası: sunucunun kodları (bir kısmı İngilizce mesajlı) Türkçe ve kapıda okunacak kadar kısa. */
export function scanFailure(e: ApiError): string {
  switch (e.code) {
    case 'INVALID_TICKET':
    case 'VERIFICATION_FAILED':
      return 'Bilet bulunamadı. Kodu kontrol edin.'
    case 'TICKET_ALREADY_USED':
      return 'Bu bilet zaten okutuldu.'
    case 'TICKET_CANCELLED':
      return 'Bu kayıt iptal edilmiş.'
    case 'EVENT_NOT_ACTIVE':
      return 'Etkinlik yayında değil.'
    case 'CHECK_IN_CLOSED':
      return e.message
    default:
      return e.status === 403 ? 'Bu biletin etkinliğinde giriş yapma yetkiniz yok.' : e.message
  }
}

/** Bilet kodunu doğrular ve girişi yapar; yoklama listesi tazelenir. */
export function useVerifyTicket(eventId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (code: string) => {
      await api.post('/events/manage/verify-qr', { qrCode: code.trim() })
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['events', eventId, 'attendance'] }),
  })
}
