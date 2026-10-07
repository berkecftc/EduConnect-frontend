import { createBrowserRouter, type RouteObject } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { RequireAuth } from '@/components/layout/RequireAuth'
import { LoginPage } from '@/features/auth/LoginPage'
import { NotBuiltPage, NotFoundPage } from '@/pages/StatusPages'

/**
 * Sayfalar rota bazlı bölünür: yalnız açıldığında indirilir. Giriş sayfası ilk açılış olduğu için pakette kalır.
 * `page(() => import(...), 'Ad')` dosyanın adlı dışa aktarımını Component olarak verir.
 */
function page<M extends Record<string, unknown>>(load: () => Promise<M>, name: keyof M): Pick<RouteObject, 'lazy'> {
  return { lazy: async () => ({ Component: (await load())[name] as React.ComponentType }) }
}

/** Henüz yeni tasarıma taşınmamış rotalar; menüden açılabilsin diye yer tutar. */
const PENDING = ['clubs/advised', 'clubs/new', 'clubs/:clubId/*', 'events/:eventId/*', 'me/*', 'manage/*']

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/register', ...page(() => import('@/features/auth/register/RegisterPage'), 'RegisterPage') },
  { path: '/forgot-password', ...page(() => import('@/features/auth/ForgotPasswordPage'), 'ForgotPasswordPage') },
  { path: '/reset-password', ...page(() => import('@/features/auth/ResetPasswordPage'), 'ResetPasswordPage') },
  { path: '/verify-email', ...page(() => import('@/features/auth/VerifyEmailPage'), 'VerifyEmailPage') },
  // E-postadaki abonelikten çıkma bağlantısı: oturumsuz açılır (F-74).
  { path: '/notifications/unsubscribe', ...page(() => import('@/features/notifications/UnsubscribePage'), 'UnsubscribePage') },
  ...(import.meta.env.DEV
    ? [
        { path: '/design', ...page(() => import('@/pages/DesignSystemPage'), 'DesignSystemPage') },
        // Örnek veriyle önizleme: oturum bellekte, istekler ağa gitmez (yalnız geliştirme).
        { path: '/onizleme', ...page(() => import('@/dev/PreviewPage'), 'PreviewPage') },
      ]
    : []),
  {
    path: '/',
    element: (
      <RequireAuth>
        <AppShell />
      </RequireAuth>
    ),
    children: [
      { index: true, ...page(() => import('@/pages/HomePage'), 'HomePage') },
      { path: 'courses', ...page(() => import('@/features/courses/CoursesPage'), 'CoursesPage') },
      { path: 'courses/catalog', ...page(() => import('@/features/courses/CatalogPage'), 'CatalogPage') },
      { path: 'courses/new', element: <NotBuiltPage /> },
      { path: 'courses/:courseId', ...page(() => import('@/features/courses/CoursePage'), 'CoursePage') },
      {
        path: 'courses/:courseId/assignments/:assignmentId',
        ...page(() => import('@/features/assignments/AssignmentPage'), 'AssignmentPage'),
      },
      { path: 'clubs', ...page(() => import('@/features/clubs/ClubsPage'), 'ClubsPage') },
      { path: 'clubs/approvals', ...page(() => import('@/features/clubs/ApprovalsPage'), 'ApprovalsPage') },
      { path: 'clubs/mine', ...page(() => import('@/features/clubs/MyClubsPage'), 'MyClubsPage') },
      { path: 'clubs/:clubId', ...page(() => import('@/features/clubs/ClubPage'), 'ClubPage') },
      { path: 'events', ...page(() => import('@/features/events/EventsPage'), 'EventsPage') },
      { path: 'events/:eventId', ...page(() => import('@/features/events/EventPage'), 'EventPage') },
      { path: 'events/:eventId/yonetim', ...page(() => import('@/features/events/EventManagePage'), 'EventManagePage') },
      { path: 'clubs/:clubId/events/new', ...page(() => import('@/features/events/EventCreatePage'), 'EventCreatePage') },
      { path: 'me/tickets', ...page(() => import('@/features/events/TicketsPage'), 'TicketsPage') },
      { path: 'posts', ...page(() => import('@/features/posts/PostsPage'), 'PostsPage') },
      { path: 'posts/new', ...page(() => import('@/features/posts/PostComposerPage'), 'PostComposerPage') },
      { path: 'posts/:postId', ...page(() => import('@/features/posts/PostPage'), 'PostPage') },
      { path: 'posts/:postId/edit', ...page(() => import('@/features/posts/PostComposerPage'), 'PostComposerPage') },
      { path: 'leaderboard', ...page(() => import('@/features/gamification/LeaderboardPage'), 'LeaderboardPage') },
      { path: 'profile', ...page(() => import('@/features/profile/ProfilePage'), 'ProfilePage') },
      { path: 'notifications', ...page(() => import('@/features/notifications/NotificationsPage'), 'NotificationsPage') },
      { path: 'settings', ...page(() => import('@/features/settings/SettingsPage'), 'SettingsPage') },
      { path: 'settings/:section', ...page(() => import('@/features/settings/SettingsPage'), 'SettingsPage') },
      { path: 'assignments', ...page(() => import('@/features/assignments/AssignmentsPage'), 'AssignmentsPage') },
      ...PENDING.map((path) => ({ path, element: <NotBuiltPage /> })),
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
