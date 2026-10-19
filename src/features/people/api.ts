import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import type { Me } from '@/features/me/useMe'

/**
 * Başkasının profili (F-54): `GET /api/users/profile/{id}` kimlik ve akademik bilgiler; e-posta ve öğrenci numarası
 * görünürlüğü sunucuda (personelin e-postası herkese; öğrencininki ve numarası yalnız dersini veren ya da kulübünü
 * yöneten kişiye). `…/aggregated` son gönderileri ve rozetleri ekler.
 */

export type PersonProfile = Me

export type PersonBadge = { badgeType: string; name: string; description: string | null; imageUrl: string | null; earnedAt: string | null }

export type PersonExtras = {
  gamification: { badges: PersonBadge[] } | null
  recentPosts: { id: string; title: string; content: string; createdAt: string }[]
}

export const personKeys = {
  profile: (id: string) => ['people', id] as const,
  extras: (id: string) => ['people', id, 'extras'] as const,
}

export function usePersonProfile(id: string) {
  return useQuery({
    queryKey: personKeys.profile(id),
    retry: false,
    staleTime: 60_000,
    queryFn: async () => (await api.get<PersonProfile>(`/users/profile/${id}`)).data,
  })
}

/** Son gönderiler ve rozetler; gelmezse sayfa bunlarsız açılır. */
export function usePersonExtras(id: string, enabled: boolean) {
  return useQuery({
    queryKey: personKeys.extras(id),
    enabled,
    retry: false,
    staleTime: 60_000,
    queryFn: async () => (await api.get<PersonExtras>(`/users/profile/${id}/aggregated`)).data,
  })
}

export const isAcademician = (p: Pick<PersonProfile, 'affiliations' | 'academicTitle' | 'staffCategory'>) =>
  !!p.affiliations?.includes('ACADEMICIAN') || !!p.academicTitle || !!p.staffCategory

export const isStudent = (p: Pick<PersonProfile, 'affiliations' | 'studentNumber' | 'programName'>) =>
  !!p.affiliations?.includes('STUDENT') || !!p.studentNumber || !!p.programName

/** Profil bağlantısı; kendi kimliğiniz için Profilim. */
export const personPath = (id: string) => `/people/${id}`
