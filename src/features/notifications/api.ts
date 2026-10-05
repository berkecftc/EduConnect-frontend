import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api/client'

export type NotificationCategory =
  | 'ACCOUNT'
  | 'COURSE'
  | 'EVENT'
  | 'MODERATION'
  | 'CLUB_MANAGEMENT'
  | 'CLUB_NEWS'
  | 'COMMUNITY'
  | 'ACHIEVEMENT'

/** `GET /api/notifications` öğesi (F-74). `link` uygulama içi göreli yol. */
export type AppNotification = {
  id: string
  category: NotificationCategory
  type: string
  title: string
  body: string
  link: string | null
  read: boolean
  createdAt: string
}

/** Spring `Page` (DIRECT) biçiminin kullandığımız kısmı. */
export type SpringPage<T> = { content: T[]; totalElements: number; totalPages: number; number: number; last: boolean }

export function useUnreadCount() {
  return useQuery({
    queryKey: ['notifications', 'unread'],
    refetchInterval: 60_000,
    queryFn: async () => (await api.get<{ unread: number }>('/notifications/unread-count')).data.unread,
  })
}

export function useRecentNotifications(size = 5) {
  return useQuery({
    queryKey: ['notifications', 'recent', size],
    queryFn: async () => (await api.get<SpringPage<AppNotification>>('/notifications', { params: { page: 0, size } })).data.content,
  })
}
