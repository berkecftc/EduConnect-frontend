import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Bell, LogOut, Menu, X } from 'lucide-react'
import { Dialog } from 'radix-ui'
import { AnimatePresence, motion } from 'motion/react'
import { LINES } from '@/design/lines'
import { transition } from '@/design/motion'
import { logout } from '@/lib/api/client'
import { useSession, type Session } from '@/lib/auth/session'
import { cn } from '@/lib/cn'
import { Button } from '@/components/ui/Button'
import { LineBullet } from '@/components/ui/LineBullet'
import { ThemeSwitch } from '@/components/ui/ThemeSwitch'
import { Wordmark } from '@/components/ui/Wordmark'
import { displayName, initials, useMe } from '@/features/me/useMe'
import { buildNav, roleLabel } from './nav'

/**
 * Uygulama kabuğu. Geniş ekranda sol hat menüsü, dar ekranda üst çubuk + açılır menü.
 */
export function AppShell() {
  const session = useSession()
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const [lastPath, setLastPath] = useState(location.pathname)

  const mainRef = useRef<HTMLElement>(null)

  // Sayfa değişince mobil menüyü kapat.
  if (lastPath !== location.pathname) {
    setLastPath(location.pathname)
    if (open) setOpen(false)
  }

  // Sayfa değişince odağı içeriğe taşı: ekran okuyucu yeni sayfayı baştan okur (ilk yüklemede değil).
  const firstRender = useRef(true)
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    mainRef.current?.focus({ preventScroll: true })
    window.scrollTo({ top: 0 })
  }, [location.pathname])

  if (!session) return null

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[16.5rem_minmax(0,1fr)]">
      <a
        href="#icerik"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-ink focus:px-3 focus:py-2 focus:text-on-ink"
      >
        İçeriğe geç
      </a>

      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-rule bg-surface lg:flex">
        <div className="px-5 pt-5 pb-4">
          <NavLink to="/" className="rounded-sm" aria-label="EduConnect ana sayfa">
            <Wordmark />
          </NavLink>
        </div>
        <SideNav session={session} />
        <UserBlock session={session} />
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-rule bg-canvas px-4 lg:justify-end lg:px-8">
          <NavLink to="/" className="rounded-sm lg:hidden" aria-label="EduConnect ana sayfa">
            <Wordmark />
          </NavLink>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" asChild className="size-10 px-0">
              <NavLink to="/notifications" aria-label="Bildirimler">
                <Bell className="size-5" aria-hidden />
              </NavLink>
            </Button>
            <Dialog.Root open={open} onOpenChange={setOpen}>
              <Dialog.Trigger asChild>
                <Button variant="ghost" size="sm" className="size-10 px-0 lg:hidden" aria-label="Menüyü aç">
                  <Menu className="size-5" aria-hidden />
                </Button>
              </Dialog.Trigger>
              <AnimatePresence>
                {open && (
                  <Dialog.Portal forceMount>
                    <Dialog.Overlay asChild forceMount>
                      <motion.div
                        className="fixed inset-0 z-40 bg-scrim"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={transition.base}
                      />
                    </Dialog.Overlay>
                    <Dialog.Content asChild forceMount>
                      <motion.div
                        className="fixed inset-y-0 right-0 z-50 flex w-[min(20rem,88vw)] flex-col bg-surface shadow-pop"
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={transition.slow}
                      >
                        <div className="flex items-center justify-between px-5 pt-4 pb-3">
                          <Dialog.Title className="text-lg font-heavy">Menü</Dialog.Title>
                          <Dialog.Close asChild>
                            <Button variant="ghost" size="sm" className="size-10 px-0" aria-label="Menüyü kapat">
                              <X className="size-5" aria-hidden />
                            </Button>
                          </Dialog.Close>
                        </div>
                        <Dialog.Description className="sr-only">EduConnect bölümleri</Dialog.Description>
                        <SideNav session={session} />
                        <UserBlock session={session} />
                      </motion.div>
                    </Dialog.Content>
                  </Dialog.Portal>
                )}
              </AnimatePresence>
            </Dialog.Root>
          </div>
        </header>

        <main ref={mainRef} id="icerik" tabIndex={-1} className="flex-1 px-4 py-6 outline-none sm:px-6 lg:px-10 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

function SideNav({ session }: { session: Session }) {
  const groups = buildNav(session)
  return (
    <nav aria-label="Ana menü" className="flex-1 overflow-y-auto px-3 pb-6">
      <NavLink
        to="/"
        end
        className={({ isActive }) =>
          cn('mb-3 flex h-10 items-center rounded-md px-2.5 font-semibold', isActive ? 'bg-sunken text-ink' : 'text-ink-2 hover:bg-sunken hover:text-ink')
        }
      >
        Bugün
      </NavLink>
      <ul className="flex flex-col gap-5">
        {groups.map((g) => (
          <li key={g.line}>
            <p className="flex items-center gap-2 px-2.5 text-md font-semibold text-ink">
              <LineBullet line={g.line} size="sm" />
              {g.label}
            </p>
            <ul className="relative mt-1.5 ml-[19px] border-l-2 pl-0" style={{ borderColor: LINES[g.line].stroke }}>
              {g.items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end
                    className={({ isActive }) =>
                      cn(
                        'relative -ml-[2px] flex h-9 items-center rounded-r-md pl-5 pr-2.5 text-md',
                        isActive ? 'bg-sunken font-semibold text-ink' : 'text-ink-2 hover:bg-sunken hover:text-ink',
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span
                          aria-hidden
                          className={cn('absolute left-[-5px] size-2 rounded-full border-2 bg-surface', isActive && 'scale-125')}
                          style={{ borderColor: LINES[g.line].stroke, background: isActive ? LINES[g.line].stroke : undefined }}
                        />
                        {item.label}
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </nav>
  )
}

function UserBlock({ session }: { session: Session }) {
  // Profil yoksa (yönetici/görevli) e-posta ve JWT rolleriyle devam edilir (F-83).
  const { data: me } = useMe()
  return (
    <div className="border-t border-rule px-4 py-4">
      <div className="flex items-center gap-3">
        <NavLink to="/profile" className="flex min-w-0 flex-1 items-center gap-3 rounded-md p-1 -m-1 hover:bg-sunken">
          <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-full bg-sunken text-sm font-heavy text-ink-2">
            {initials(me, session.email)}
          </span>
          <span className="min-w-0">
            <span className="sr-only">Profilim: </span>
            <span className="block truncate text-md font-semibold">{displayName(me, session.email)}</span>
            <span className="block truncate text-sm text-ink-3">{roleLabel(session)}</span>
          </span>
        </NavLink>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <ThemeSwitch />
        <Button variant="ghost" size="sm" onClick={() => void logout()}>
          <LogOut className="size-4" aria-hidden />
          Çıkış yap
        </Button>
      </div>
    </div>
  )
}
