import { createBrowserRouter } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { RequireAuth } from '@/components/layout/RequireAuth'
import { EmailChangeConfirmPage } from '@/features/auth/EmailChangeConfirmPage'
import { ForgotPasswordPage } from '@/features/auth/ForgotPasswordPage'
import { LoginPage } from '@/features/auth/LoginPage'
import { ResetPasswordPage } from '@/features/auth/ResetPasswordPage'
import { VerifyEmailPage } from '@/features/auth/VerifyEmailPage'
import { DesignSystemPage } from '@/pages/DesignSystemPage'
import { HomePage } from '@/pages/HomePage'
import { NotBuiltPage, NotFoundPage } from '@/pages/StatusPages'

/** Henüz yeni tasarıma taşınmamış rotalar; menüden açılabilsin diye yer tutar. */
const PENDING = [
  'courses/*',
  'assignments/*',
  'clubs/*',
  'events/*',
  'me/*',
  'posts/*',
  'leaderboard',
  'notifications',
  'profile',
  'settings/*',
  'manage/*',
]

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  { path: '/reset-password', element: <ResetPasswordPage /> },
  { path: '/verify-email', element: <VerifyEmailPage /> },
  { path: '/email-change/confirm', element: <EmailChangeConfirmPage /> },
  ...(import.meta.env.DEV ? [{ path: '/design', element: <DesignSystemPage /> }] : []),
  {
    path: '/',
    element: (
      <RequireAuth>
        <AppShell />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <HomePage /> },
      ...PENDING.map((path) => ({ path, element: <NotBuiltPage /> })),
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
