import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api/client'

export type EventStatus = 'PENDING_PRESIDENT' | 'PENDING' | 'ACTIVE' | 'REJECTED' | 'CANCELLED' | 'COMPLETED'
export type RegistrationStatus = 'REGISTERED' | 'CANCELLED' | 'NO_SHOW'

/** `GET /api/events/my-registrations` öğesi. `eventDate` = başlangıç (bölgesiz yerel saat). */
export type MyRegistration = {
  eventId: string
  eventTitle: string
  eventDescription: string | null
  eventDate: string
  eventLocation: string | null
  qrCode: string | null
  registrationTime: string
  attended: boolean
  registrationStatus: RegistrationStatus
  eventStatus: EventStatus
}

/** `GET /api/events/{id}` ve liste öğesi (EventResponse). Saatler bölgesiz yerel. */
export type CampusEvent = {
  id: string
  title: string
  description: string | null
  startsAt: string
  endsAt: string | null
  location: string | null
  imageUrl: string | null
  clubId: string | null
  clubName: string | null
  organizerName: string | null
  capacity: number | null
  status: EventStatus
}

/** Etkin etkinliklerin ilk sayfası (oturumsuz da açık uç). */
export function useUpcomingEvents(size = 6) {
  return useQuery({
    queryKey: ['events', 'upcoming', size],
    queryFn: async () =>
      (await api.get<{ content: CampusEvent[] }>('/events', { params: { page: 0, size } })).data.content,
  })
}

export function useMyRegistrations(enabled = true) {
  return useQuery({
    queryKey: ['events', 'registrations', 'mine'],
    enabled,
    queryFn: async () => (await api.get<MyRegistration[]>('/events/my-registrations')).data,
  })
}
