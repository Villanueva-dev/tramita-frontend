'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  LayoutDashboard,
  FilePlus2,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  Loader2,
  KeyRound,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Logo } from '@/components/brand'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth-store'
import { useTramita } from '@/lib/store'
import { displayNameFromEmail, initialsFromEmail } from '@/lib/identity'

const NAV = [
  { href: '/dashboard', label: 'Bandeja de trabajo', icon: LayoutDashboard },
  { href: '/requests/new', label: 'Nueva solicitud', icon: FilePlus2 },
]

function NavLinks({
  pathname,
  onClick,
}: {
  pathname: string
  onClick?: () => void
}) {
  return (
    <nav className="flex flex-col gap-1">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active =
          pathname === href ||
          (href !== '/dashboard' && pathname.startsWith(href))
        return (
          <Link
            key={href}
            href={href}
            onClick={onClick}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              active
                ? 'bg-sidebar-accent text-primary-foreground'
                : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-primary-foreground',
            )}
          >
            <Icon className="size-4.5" />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}

function SidebarContent({
  pathname,
  onClick,
  initials,
  displayName,
  onLogout,
}: {
  pathname: string
  onClick?: () => void
  initials: string
  displayName: string
  onLogout: () => void
}) {
  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <div className="px-2 pt-2">
        <Logo variant="light" />
      </div>
      <div className="px-2 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
        Menú
      </div>
      <NavLinks pathname={pathname} onClick={onClick} />
      <div className="mt-auto flex flex-col gap-3 border-t border-sidebar-border pt-4">
        <div className="flex items-center gap-3 px-2">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-sidebar-accent text-sm font-semibold text-primary-foreground">
            {initials}
          </span>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-medium text-primary-foreground">
              {displayName}
            </p>
            <p className="truncate text-xs text-sidebar-foreground/60">
              Coordinación · Sede Cali
            </p>
          </div>
        </div>
        <Link
          href="/account/password"
          onClick={onClick}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent/60 hover:text-primary-foreground"
        >
          <KeyRound className="size-4.5" />
          Cambiar contraseña
        </Link>
        <button
          onClick={onLogout}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent/60 hover:text-primary-foreground"
        >
          <LogOut className="size-4.5" />
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}

export function AppShell({
  children,
  title,
}: {
  children: React.ReactNode
  title?: string
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { status, user, logout } = useAuth()
  const { requests } = useTramita()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/')
  }, [status, router])

  const urgentCount = requests.filter(
    (r) => r.priority === 'urgente' && r.status !== 'finalizado',
  ).length

  async function handleLogout() {
    await logout()
    router.replace('/')
  }

  const displayName = user ? displayNameFromEmail(user.email) : ''
  const initials = user ? initialsFromEmail(user.email) : ''

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (status !== 'authenticated' || !user) return null

  const sidebarProps = {
    pathname,
    initials,
    displayName,
    onLogout: handleLogout,
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 bg-sidebar lg:block">
        <SidebarContent {...sidebarProps} />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-foreground/40"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-72 bg-sidebar">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-4 text-sidebar-foreground/70"
              aria-label="Cerrar menú"
            >
              <X className="size-5" />
            </button>
            <SidebarContent
              {...sidebarProps}
              onClick={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-border bg-card/80 px-4 backdrop-blur lg:px-8">
          <button
            onClick={() => setMobileOpen(true)}
            className="text-muted-foreground lg:hidden"
            aria-label="Abrir menú"
          >
            <Menu className="size-5" />
          </button>
          <h1 className="text-lg font-semibold tracking-tight">
            {title ?? 'Trámita'}
          </h1>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" aria-label="Buscar">
                <Search className="size-4.5" />
              </Button>
            </Link>
            <div className="relative">
              <Button variant="ghost" size="icon" aria-label="Notificaciones">
                <Bell className="size-4.5" />
              </Button>
              {urgentCount > 0 && (
                <span className="absolute right-1.5 top-1.5 grid size-4 place-items-center rounded-full bg-brand-red text-[9px] font-bold text-brand-red-foreground">
                  {urgentCount}
                </span>
              )}
            </div>
            <span className="ml-1 hidden size-9 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground sm:grid">
              {initials}
            </span>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  )
}
