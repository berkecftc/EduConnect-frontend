import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { logout } from '@/lib/api/client'
import { toApiError, type ApiError } from '@/lib/api/problem'
import { useSession } from '@/lib/auth/session'
import { emailField, newPasswordField } from '@/features/auth/schemas'
import { useChangePassword, useEmailChange } from '@/features/profile/api'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Input, PasswordInput } from '@/components/ui/Input'
import { Notice } from '@/components/ui/Notice'
import { Panel } from '@/components/ui/Panel'

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Mevcut şifrenizi girin'),
    newPassword: newPasswordField,
    confirmationPassword: z.string().min(1, 'Yeni şifreyi tekrar girin'),
  })
  .refine((v) => v.newPassword === v.confirmationPassword, { path: ['confirmationPassword'], message: 'Şifreler eşleşmiyor' })
  .refine((v) => v.newPassword !== v.currentPassword, { path: ['newPassword'], message: 'Yeni şifre eskisiyle aynı olamaz' })
type PasswordValues = z.infer<typeof passwordSchema>

const emailSchema = z.object({ newEmail: emailField, currentPassword: z.string().min(1, 'Mevcut şifrenizi girin') })
type EmailValues = z.infer<typeof emailSchema>

/** Hesap: şifre ve e-posta değişikliği (F-55). */
export function AccountSettings() {
  return (
    <div className="flex flex-col gap-20">
      <PasswordForm />
      <EmailForm />
    </div>
  )
}

function PasswordForm() {
  const change = useChangePassword()
  const [failure, setFailure] = useState<ApiError | null>(null)
  const form = useForm<PasswordValues>({ resolver: zodResolver(passwordSchema), defaultValues: { currentPassword: '', newPassword: '', confirmationPassword: '' } })
  const { errors } = form.formState

  const onSubmit = form.handleSubmit((v) => {
    setFailure(null)
    change.mutate(v, {
      onSuccess: () => {
        toast.success('Şifreniz değiştirildi')
        form.reset()
      },
      onError: (err) => {
        const ae = toApiError(err)
        // Backend bu kodlarda İngilizce mesaj döner; Türkçesi ilgili alanın altına yazılır.
        if (ae.code === 'WRONG_CURRENT_PASSWORD') form.setError('currentPassword', { message: 'Mevcut şifreniz yanlış.' })
        else if (ae.code === 'PASSWORD_UNCHANGED') form.setError('newPassword', { message: 'Yeni şifre eskisiyle aynı olamaz.' })
        else if (ae.code === 'PASSWORD_CONFIRMATION_MISMATCH') form.setError('confirmationPassword', { message: 'Şifreler eşleşmiyor.' })
        else setFailure(ae)
      },
    })
  })

  return (
    <Panel title="Şifre">
      <form onSubmit={onSubmit} noValidate className="flex max-w-[28rem] flex-col gap-5">
        <Field label="Mevcut şifre" required error={errors.currentPassword?.message}>
          <PasswordInput autoComplete="current-password" {...form.register('currentPassword')} />
        </Field>
        <Field label="Yeni şifre" required hint="En az 10 karakter; harf, rakam ve işaretleri karıştırın." error={errors.newPassword?.message}>
          <PasswordInput autoComplete="new-password" {...form.register('newPassword')} />
        </Field>
        <Field label="Yeni şifre (tekrar)" required error={errors.confirmationPassword?.message}>
          <PasswordInput autoComplete="new-password" {...form.register('confirmationPassword')} />
        </Field>
        {failure && (
          <Notice variant="line" tone="danger" title="Şifre değiştirilemedi">
            {failure.message}
          </Notice>
        )}
        <div>
          <Button type="submit" variant="primary" loading={change.isPending}>
            Şifreyi değiştir
          </Button>
        </div>
      </form>
    </Panel>
  )
}

function EmailForm() {
  const session = useSession()
  const change = useEmailChange()
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [failure, setFailure] = useState<ApiError | null>(null)
  const form = useForm<EmailValues>({ resolver: zodResolver(emailSchema), defaultValues: { newEmail: '', currentPassword: '' } })
  const { errors } = form.formState

  const onSubmit = form.handleSubmit((v) => {
    setFailure(null)
    change.mutate(v, {
      onSuccess: (r) => {
        if (r.status === 'CHANGED') {
          toast.success('E-posta adresiniz değişti. Yeni adresinizle yeniden giriş yapın.')
          void logout()
          return
        }
        setSentTo(v.newEmail)
        form.reset()
      },
      onError: (err) => {
        const ae = toApiError(err)
        if (ae.code === 'CURRENT_PASSWORD_INVALID') form.setError('currentPassword', { message: ae.message })
        else if (ae.code === 'EMAIL_UNCHANGED' || ae.code === 'EMAIL_TAKEN' || ae.code === 'EMAIL_DOMAIN_NOT_ALLOWED') form.setError('newEmail', { message: ae.message })
        else setFailure(ae)
      },
    })
  })

  return (
    <Panel title="E-posta adresi">
      <p className="max-w-[60ch] text-md text-ink-2">
        Şu anki adresiniz <span className="font-semibold text-ink">{session?.email}</span>. Yeni adrese bir doğrulama bağlantısı gönderilir; bağlantıyı
        açtığınızda adres değişir ve oturumunuz kapanır.
      </p>
      {sentTo ? (
        <Notice variant="line" tone="success" title="Bağlantı gönderildi" className="mt-6">
          {sentTo} adresine bir doğrulama bağlantısı gönderdik. Bağlantıyı açana kadar giriş adresiniz değişmez.
        </Notice>
      ) : (
        <form onSubmit={onSubmit} noValidate className="mt-6 flex max-w-[28rem] flex-col gap-5">
          <Field label="Yeni e-posta adresi" required error={errors.newEmail?.message}>
            <Input type="email" autoComplete="email" {...form.register('newEmail')} />
          </Field>
          <Field label="Mevcut şifre" required hint="Değişikliği sizin yaptığınızı doğrulamak için." error={errors.currentPassword?.message}>
            <PasswordInput autoComplete="current-password" {...form.register('currentPassword')} />
          </Field>
          {failure && (
            <Notice variant="line" tone="danger" title="E-posta değiştirilemedi">
              {failure.message}
            </Notice>
          )}
          <div>
            <Button type="submit" variant="primary" loading={change.isPending}>
              Doğrulama bağlantısı gönder
            </Button>
          </div>
        </form>
      )}
    </Panel>
  )
}
