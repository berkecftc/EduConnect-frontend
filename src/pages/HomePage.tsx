import { usePageTitle } from '@/lib/usePageTitle'
import { useSession } from '@/lib/auth/session'
import { formatInstant } from '@/lib/time'
import { Notice } from '@/components/ui/Notice'

/**
 * "Bugün" ekranı. Rol bazlı içerik (dersler, onaylar, etkinlikler) ekran yeniden yazımında eklenecek.
 */
export function HomePage() {
  usePageTitle('Bugün')
  const session = useSession()
  const today = formatInstant(new Date().toISOString(), 'long')
  return (
    <section className="max-w-[56rem]">
      <h1 className="text-3xl">Bugün, {today}</h1>
      {session && session.pendingRequests.length > 0 && (
        <Notice tone="warning" title="Başvurunuz onay bekliyor" className="mt-6">
          {session.pendingRequests.includes('ACADEMICIAN') ? 'Akademisyen' : 'Öğrenci'} kaydınız doğrulayıcı onayından
          sonra etkinleşecek. Sonuç e-postayla bildirilecek.
        </Notice>
      )}
      <Notice title="Bu ekran sıradaki adımda kuruluyor" className="mt-6">
        Dersler, onay bekleyen işler ve etkinlikler bu listede saat sırasıyla toplanacak.
      </Notice>
    </section>
  )
}
