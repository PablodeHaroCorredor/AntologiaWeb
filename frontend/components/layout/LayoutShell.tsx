'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home,
  Search,
  Library,
  User,
  LogIn,
  LogOut,
  MessageCircle,
} from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Inicio', icon: Home },
  { href: '/search', label: 'Buscar', icon: Search },
  { href: '/library', label: 'Biblioteca', icon: Library },
];
const requestsNavItem = { href: '/requests', label: 'Solicitudes', icon: MessageCircle };

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar - desktop */}
      <aside className="hidden md:flex md:w-56 md:flex-col md:fixed md:inset-y-0 bg-card border-r border-border">
        <div className="p-4 flex items-center gap-2 border-b border-border">
          <Image
            src="/brand/logoAntologia.jpg"
            alt="AntologiaWeb"
            width={32}
            height={32}
            className="w-8 h-8 rounded object-cover shrink-0"
          />
          <span className="font-bold text-lg">AntologiaWeb</span>
        </div>
        <nav className="flex-1 flex flex-col p-3 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                pathname === href
                  ? 'bg-primary/20 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              )}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {label}
            </Link>
          ))}
          {user && (
            <Link
              href={requestsNavItem.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                pathname?.startsWith('/requests')
                  ? 'bg-primary/20 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              )}
            >
              <MessageCircle className="w-5 h-5 shrink-0" />
              {requestsNavItem.label}
            </Link>
          )}
          {user ? (
            <>
              <Link
                href={`/profile/${user._id}`}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  pathname?.startsWith('/profile')
                    ? 'bg-primary/20 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                )}
              >
                <User className="w-5 h-5 shrink-0" />
                Perfil
              </Link>
              <div className="mt-auto pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                >
                  <LogOut className="w-5 h-5 shrink-0" />
                  Cerrar sesión
                </button>
              </div>
            </>
          ) : (
            !loading && (
              <Link
                href="/login"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-primary hover:bg-primary/20"
              >
                <LogIn className="w-5 h-5 shrink-0" />
                Iniciar sesión
              </Link>
            )
          )}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 md:pl-56 pb-20 md:pb-0 min-h-screen">
        {children}
      </main>

      {/* Bottom nav - mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border flex items-center justify-around py-2 safe-area-pb">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex flex-col items-center gap-1 px-4 py-2 rounded-lg text-xs font-medium transition-colors',
              pathname === href ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            <Icon className="w-6 h-6" />
            {label}
          </Link>
        ))}
        {user && (
          <Link
            href={requestsNavItem.href}
            className={cn(
              'flex flex-col items-center gap-1 px-4 py-2 rounded-lg text-xs font-medium transition-colors',
              pathname?.startsWith('/requests') ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            <MessageCircle className="w-6 h-6" />
            {requestsNavItem.label}
          </Link>
        )}
        {user ? (
          <Link
            href={`/profile/${user._id}`}
            className={cn(
              'flex flex-col items-center gap-1 px-4 py-2 rounded-lg text-xs font-medium transition-colors',
              pathname?.startsWith('/profile') ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            <User className="w-6 h-6" />
            Perfil
          </Link>
        ) : (
          !loading && (
            <Link
              href="/login"
              className="flex flex-col items-center gap-1 px-4 py-2 rounded-lg text-xs font-medium text-primary"
            >
              <LogIn className="w-6 h-6" />
              Entrar
            </Link>
          )
        )}
      </nav>
    </div>
  );
}
