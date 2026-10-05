import { useMemo } from 'react'
import { useQueries } from '@tanstack/react-query'
import { api } from '@/lib/api/client'

/** Unvan kodları (AcademicTitle) → okunur biçim; profilde `title` boşsa yedek. */
const TITLE_LABEL: Record<string, string> = {
  PROFESSOR: 'Prof. Dr.',
  ASSOCIATE_PROFESSOR: 'Doç. Dr.',
  ASSISTANT_PROFESSOR: 'Dr. Öğr. Üyesi',
  LECTURER_PHD: 'Öğr. Gör. Dr.',
  LECTURER: 'Öğr. Gör.',
  RESEARCH_ASSISTANT_PHD: 'Arş. Gör. Dr.',
  RESEARCH_ASSISTANT: 'Arş. Gör.',
}

type ProfileTitle = { title: string | null; academicTitle: string | null }

/**
 * Personelin unvanları: kadro ve ders yanıtlarında unvan yok, profilden (`GET /api/users/profile/{id}`) alınır.
 * Personel profili herkese açıktır (F-60). Sonuç kişi başına önbelleğe alınır.
 */
export function useStaffTitles(userIds: (string | null | undefined)[]): Map<string, string> {
  const ids = useMemo(() => [...new Set(userIds.filter((id): id is string => !!id))], [userIds])
  const results = useQueries({
    queries: ids.map((id) => ({
      queryKey: ['people', 'title', id],
      staleTime: 60 * 60_000,
      retry: false,
      queryFn: async () => {
        const { data } = await api.get<ProfileTitle>(`/users/profile/${id}`)
        return data.title?.trim() || (data.academicTitle ? (TITLE_LABEL[data.academicTitle] ?? null) : null)
      },
    })),
  })
  return useMemo(() => {
    const map = new Map<string, string>()
    ids.forEach((id, i) => {
      const t = results[i]?.data
      if (t) map.set(id, t)
    })
    return map
  }, [ids, results])
}

/** "Doç. Dr. Ayşe Yılmaz": unvanı adın önüne ekler; ad zaten unvanla başlıyorsa tekrar etmez. */
export function withTitle(name: string | null | undefined, title: string | undefined): string {
  const n = (name ?? '').trim()
  if (!title || !n) return n
  return n.toLocaleLowerCase('tr-TR').startsWith(title.toLocaleLowerCase('tr-TR')) ? n : `${title} ${n}`
}
