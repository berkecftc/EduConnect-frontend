import { lazy, Suspense } from 'react'
import { useParams } from 'react-router-dom'
import { hasRole, useSession } from '@/lib/auth/session'
import { Skeleton } from '@/components/ui/States'
import { useTeachingCourses } from './teach'

const CoursesPage = lazy(() => import('./CoursesPage').then((m) => ({ default: m.CoursesPage })))
const TeachingPage = lazy(() => import('./TeachingPage').then((m) => ({ default: m.TeachingPage })))
const CoursePage = lazy(() => import('./CoursePage').then((m) => ({ default: m.CoursePage })))
const CourseManagePage = lazy(() => import('./CourseManagePage').then((m) => ({ default: m.CourseManagePage })))

/** `/courses`: akademisyene verdiği dersler, öğrenciye kayıtlı olduğu dersler. */
export function CoursesIndex() {
  const session = useSession()
  return <Suspense fallback={<Skeleton rows={5} />}>{hasRole(session, 'ROLE_ACADEMICIAN') ? <TeachingPage /> : <CoursesPage />}</Suspense>
}

/**
 * `/courses/:courseId`: kişi dersin kadrosundaysa yönetim sayfası (göreviyle), değilse öğrenci sayfası.
 * Kadro bilgisi "verdiğim dersler" listesinden gelir (`staffRole`, F-43).
 */
export function CourseRoute() {
  const { courseId = '' } = useParams()
  const session = useSession()
  const academician = hasRole(session, 'ROLE_ACADEMICIAN')
  const teaching = useTeachingCourses(academician)
  if (academician && teaching.isPending) return <Skeleton rows={5} />
  const mine = teaching.data?.find((c) => c.id === courseId)
  return <Suspense fallback={<Skeleton rows={5} />}>{mine ? <CourseManagePage key={courseId} teaching={mine} /> : <CoursePage />}</Suspense>
}
