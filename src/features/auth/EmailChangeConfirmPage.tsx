import { usePageTitle } from '@/lib/usePageTitle'
import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api, logout } from '@/lib/api/client'
import { toApiError, type ApiError } from '@/lib/api/problem'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { AuthLayout } from './AuthLayout'

type State = { kind: 'working' } | { kind: 'changed' } | { kind: 'failed'; error: ApiError | null }

/**
 * Yeni e-posta adresinin onayı (F-55). Başarıda oturum kapanır; giriş yeni adresle yapılır.
 */
export function EmailChangeConfirmPage() {
  usePageTitle('E-posta değişikliği')
  const [params] = useSearchParams()
  const token = params.get('token')
  const [state, setState] = useState<State>(token ? { kind: 'working' } : { kind: 'failed', error: null })
  const started = useRef(false)

  useEffect(() => {
    if (!token || started.current) return
    started.current = true
    api
      .post('/auth/email-change/confirm', { token })
      .then(async () => {
        await logout()
        setState({ kind: 'changed' })
      })
      .catch((err) => setState({ kind: 'failed', error: toApiError(err) }))
  }, [token])

  return (
    <AuthLayout>
      {state.kind === 'working' && (
        <div className="flex items-center gap-3 text-ink-2">
          <Spinner />
          <p>Yeni e-posta adresiniz onaylanıyor</p>
        </div>
      )}
      {state.kind === 'changed' && (
        <>
          <h1 className="text-3xl">E-posta değiştirildi</h1>
          <p className="mt-3 text-ink-2">Bundan sonra yeni adresinizle giriş yapın.</p>
          <Button asChild variant="primary" size="lg" className="mt-8">
            <Link to="/login">Giriş yap</Link>
          </Button>
        </>
      )}
      {state.kind === 'failed' && (
        <>
          <h1 className="text-3xl">Bağlantı geçersiz veya süresi dolmuş</h1>
          <p className="mt-3 text-ink-2">
            {state.error && state.error.code !== 'EMAIL_CHANGE_LINK_INVALID'
              ? state.error.message
              : 'Ayarlar sayfasından e-posta değişikliğini yeniden başlatın.'}
          </p>
          <Button asChild variant="secondary" className="mt-8">
            <Link to="/login">Girişe dön</Link>
          </Button>
        </>
      )}
    </AuthLayout>
  )
}
