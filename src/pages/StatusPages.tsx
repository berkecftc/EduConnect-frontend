import { usePageTitle } from '@/lib/usePageTitle'
import { Link, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/Button'

function StatusLayout({ title, body, children }: { title: string; body: string; children?: React.ReactNode }) {
  usePageTitle(title)
  return (
    <section className="max-w-[40rem] py-10">
      <h1 className="text-3xl">{title}</h1>
      <p className="mt-3 text-ink-2">{body}</p>
      <div className="mt-8 flex flex-wrap gap-3">{children}</div>
    </section>
  )
}

export function NotFoundPage() {
  const { pathname } = useLocation()
  return (
    <StatusLayout
      title="Bu sayfa bulunamadı"
      body={`${pathname} adresinde bir sayfa yok. Bağlantı eski olabilir ya da kayıt kaldırılmış olabilir.`}
    >
      <Button asChild variant="primary">
        <Link to="/">Bugün ekranına dön</Link>
      </Button>
    </StatusLayout>
  )
}

export function NotAllowedPage() {
  return (
    <StatusLayout
      title="Bu bölüme erişiminiz yok"
      body="Hesabınızın rolü bu sayfayı açmaya yetmiyor. Yetki gerektiğini düşünüyorsanız birim yöneticinize başvurun."
    >
      <Button asChild variant="primary">
        <Link to="/">Bugün ekranına dön</Link>
      </Button>
    </StatusLayout>
  )
}

/** Yenileme sürerken henüz yazılmamış rotalar için. */
export function NotBuiltPage() {
  const { pathname } = useLocation()
  return (
    <StatusLayout
      title="Bu ekran yeniden yazılıyor"
      body={`${pathname} yeni tasarıma taşınma sırasında. Hazır olduğunda burada açılacak.`}
    >
      <Button asChild variant="secondary">
        <Link to="/">Bugün ekranına dön</Link>
      </Button>
    </StatusLayout>
  )
}
