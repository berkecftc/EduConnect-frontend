import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api/client'

export type Badge = { badgeType: string; name: string; description: string; imageUrl: string | null; earnedAt: string }

/** `GET /api/gamification/users/me/summary`: katkı puanı ve haftalık katkı serisi (F-72). */
export type GamificationSummary = { totalPoints: number; currentStreak: number; highestStreak: number; badges: Badge[] }

export function useMySummary(enabled = true) {
  return useQuery({
    queryKey: ['gamification', 'summary'],
    enabled,
    queryFn: async () => (await api.get<GamificationSummary>('/gamification/users/me/summary')).data,
  })
}
