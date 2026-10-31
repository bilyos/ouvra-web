'use client';

import { useState, useEffect, useRef, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/providers/theme-provider';
import { Menu, X, Sun, Moon, User, LogOut, Settings, ChevronDown, LayoutDashboard } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { Logo } from '@/components/ui/logo';
import { useAuth } from '@/hooks/use-auth';

const navLinks = [
  { key: 'services', href: '/search' },
  { key: 'howItWorks', href: '/#comment-ca-marche' },
  { key: 'becomeProvider', href: '/auth/register?role=provider' },
] as const;

function ThemeToggle({ label }: { label: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  // false au rendu serveur, true côté client : évite d'afficher la mauvaise icône avant hydratation
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const dark = mounted && resolvedTheme === 'dark';

  return (
    <button
      onClick={() => setTheme(dark ? 'light' : 'dark')}
      className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      aria-label={label}
    >
      {mounted ? dark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" /> : <span className="h-[18px] w-[18px]" />}
    </button>
  );
}

export function Navbar() {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  // useAuth restaure la session depuis le jeton stocké : sans lui, les pages publiques affichaient « Connexion » à un utilisateur connecté
  const { user, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
  }

  useEffect(() => {
    if (!userMenuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setUserMenuOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [userMenuOpen]);

  const isActive = (href: string) => !href.includes('#') && pathname.startsWith(href.split('?')[0]);

  const accountLinks = [
    { href: '/dashboard/client', icon: LayoutDashboard, label: t('dashboard') },
    { href: '/dashboard/client/profile', icon: User, label: t('myProfile') },
    { href: '/dashboard/settings', icon: Settings, label: t('settings') },
  ];

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-50 border-b bg-background/95 transition-[border-color] duration-200 supports-[backdrop-filter]:bg-background/85 supports-[backdrop-filter]:backdrop-blur',
          scrolled ? 'border-border' : 'border-transparent'
        )}
      >
        <nav className="mx-auto flex h-16 max-w-7xl items-center gap-8 px-4 sm:px-6 lg:px-8" aria-label="Navigation principale">
          <Logo />

          <div className="hidden items-center gap-1 lg:flex">
            {navLinks.map((link) => (
              <Link
                key={link.key}
                href={link.href}
                aria-current={isActive(link.href) ? 'page' : undefined}
                className={cn(
                  'relative whitespace-nowrap rounded-md px-3 py-2 text-[14px] font-medium transition-colors',
                  isActive(link.href) ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {t(link.key)}
                {isActive(link.href) && <span className="absolute inset-x-3 -bottom-[13px] h-[3px] rounded-full bg-sun-400" />}
              </Link>
            ))}
          </div>

          <div className="ml-auto hidden items-center gap-1 lg:flex">
            <LanguageSwitcher />
            <ThemeToggle label={t('toggleTheme')} />

            {isAuthenticated && user ? (
              <div className="relative ml-2" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  aria-expanded={userMenuOpen}
                  aria-haspopup="menu"
                  className="flex items-center gap-2 rounded-lg py-1.5 pl-1.5 pr-2 transition-colors hover:bg-muted"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 font-display text-sm font-bold text-brand-800 dark:bg-brand-800 dark:text-brand-100">
                    {user.firstName.charAt(0)}
                  </span>
                  <span className="text-sm font-medium">{user.firstName}</span>
                  <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', userMenuOpen && 'rotate-180')} />
                </button>

                {userMenuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 top-full z-50 mt-2 w-60 rounded-xl border border-border bg-card p-1.5 shadow-lg shadow-gray-900/10"
                  >
                    <div className="px-3 pb-2.5 pt-2">
                      <p className="text-sm font-semibold">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="truncate text-[13px] text-muted-foreground">{user.email}</p>
                    </div>
                    <div className="my-1 h-px bg-border" />
                    {accountLinks.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        role="menuitem"
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
                      >
                        <item.icon className="h-4 w-4 text-muted-foreground" />
                        {item.label}
                      </Link>
                    ))}
                    <div className="my-1 h-px bg-border" />
                    <button
                      role="menuitem"
                      onClick={() => {
                        logout();
                        setUserMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-red-700 transition-colors hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-500/10"
                    >
                      <LogOut className="h-4 w-4" />
                      {t('logout')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="ml-3 flex items-center gap-2">
                <Button variant="ghost" asChild>
                  <Link href="/auth/login">{t('login')}</Link>
                </Button>
                <Button asChild>
                  <Link href="/auth/register">{t('register')}</Link>
                </Button>
              </div>
            )}
          </div>

          <div className="ml-auto flex items-center gap-0.5 lg:hidden">
            <ThemeToggle label={t('toggleTheme')} />
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-muted"
              aria-label={t('menu')}
              aria-expanded={mobileMenuOpen}
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </nav>
      </header>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label={t('menu')}>
          <div className="absolute inset-0 bg-gray-950/40" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute inset-y-0 right-0 flex w-full max-w-sm flex-col bg-background shadow-xl">
            <div className="flex h-16 items-center justify-between border-b border-border px-4">
              <Logo />
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-muted"
                aria-label={t('close')}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-6">
              <ul className="space-y-1">
                {navLinks.map((link) => (
                  <li key={link.key}>
                    <Link
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        'block rounded-lg px-3 py-3 font-display text-xl font-semibold transition-colors hover:bg-muted',
                        isActive(link.href) && 'bg-muted'
                      )}
                    >
                      {t(link.key)}
                    </Link>
                  </li>
                ))}
              </ul>

              <div className="my-6 h-px bg-border" />

              {isAuthenticated && user ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-3 px-3 pb-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 font-display font-bold text-brand-800 dark:bg-brand-800 dark:text-brand-100">
                      {user.firstName.charAt(0)}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="truncate text-[13px] text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  {accountLinks.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 rounded-lg px-3 py-3 text-[15px] hover:bg-muted"
                    >
                      <item.icon className="h-[18px] w-[18px] text-muted-foreground" />
                      {item.label}
                    </Link>
                  ))}
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-[15px] text-red-700 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-500/10"
                  >
                    <LogOut className="h-[18px] w-[18px]" />
                    {t('logout')}
                  </button>
                </div>
              ) : (
                <div className="grid gap-2">
                  <Button size="lg" asChild>
                    <Link href="/auth/register">{t('register')}</Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link href="/auth/login">{t('login')}</Link>
                  </Button>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-border px-4 py-3">
              <span className="text-sm text-muted-foreground">{t('language')}</span>
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
