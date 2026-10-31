'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Menu,
  Search,
  Bell,
  ChevronRight,
  LogOut,
  Settings,
  UserCircle,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

import { useAuthStore } from '@/stores/auth-store';
import { useUIStore } from '@/stores/ui-store';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { notificationApi } from '@/services/api';
import { toast } from '@/hooks/use-toast';

export function DashboardHeader() {
  const t = useTranslations('dashboard.header');
  const tCrumb = useTranslations('dashboard.breadcrumb');
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuthStore();
  const { setMobileMenuOpen } = useUIStore();
  const { logout } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef<number | null>(null);

  const { data: notificationCount = 0 } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: notificationApi.unreadCount,
    refetchInterval: 15000,
    enabled: !!user,
  });

  useEffect(() => {
    if (prevCountRef.current !== null && notificationCount > prevCountRef.current) {
      toast({
        title: t('newNotification'),
        description: t('newNotificationBody'),
      });
    }
    prevCountRef.current = notificationCount;
  }, [notificationCount, t]);

  const userInitials = user
    ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
    : '';

  const pathSegments = pathname.split('/').filter(Boolean);
  const breadcrumbs = pathSegments.map((segment, index) => ({
    // Un identifiant de réservation n'a rien à faire dans le fil d'Ariane
    label: /^[0-9a-f]{8}-[0-9a-f]{4}-/.test(segment) ? tCrumb('detail') : tCrumb.has(segment) ? tCrumb(segment) : segment,
    href: '/' + pathSegments.slice(0, index + 1).join('/'),
    isLast: index === pathSegments.length - 1,
  }));

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setDropdownOpen(false);
    await logout();
    router.push('/auth/login');
  };

  // Une seule page de notifications, quel que soit le rôle
  const notifHref = '/dashboard/client/notifications';

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-card px-4 lg:px-8">
      {/* Mobile menu toggle */}
      <button
        onClick={() => setMobileMenuOpen(true)}
        className="lg:hidden flex items-center justify-center h-10 w-10 -ml-2 rounded-lg text-foreground hover:bg-muted transition-colors"
        aria-label="Menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Breadcrumb */}
      <nav className="hidden md:flex items-center text-sm" aria-label="Fil d'Ariane">
        {breadcrumbs.map((crumb, index) => (
          <div key={crumb.href} className="flex items-center">
            {index > 0 && (
              <ChevronRight className="h-4 w-4 mx-1.5 text-gray-300 dark:text-gray-600" aria-hidden="true" />
            )}
            {crumb.isLast ? (
              <span className="font-semibold text-foreground" aria-current="page">
                {crumb.label}
              </span>
            ) : (
              <Link
                href={crumb.href}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {crumb.label}
              </Link>
            )}
          </div>
        ))}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search */}
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          const q = searchQuery.trim();
          router.push(q ? `/search?q=${encodeURIComponent(q)}` : '/search');
        }}
        className="hidden sm:flex items-center relative max-w-xs w-full"
      >
        <Search className="pointer-events-none absolute left-3 h-4 w-4 text-gray-400" aria-hidden="true" />
        <input
          type="search"
          aria-label={t('search')}
          placeholder={t('search')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-10 w-full rounded-lg border border-transparent bg-muted pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand-600 focus:bg-card focus:outline-none focus:ring-[3px] focus:ring-brand-600/15 transition-colors"
        />
      </form>

      <LanguageSwitcher />

      {/* Notifications */}
      <Link
        href={notifHref}
        className="relative flex items-center justify-center h-10 w-10 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        aria-label={notificationCount > 0 ? `Notifications (${notificationCount})` : 'Notifications'}
      >
        <Bell className="h-5 w-5" />
        {notificationCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white ring-2 ring-card">
            {notificationCount > 99 ? '99+' : notificationCount}
          </span>
        )}
      </Link>

      {/* User dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-muted transition-colors"
          aria-expanded={dropdownOpen}
          aria-haspopup="menu"
        >
          <Avatar className="h-8 w-8">
            {user?.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.firstName} />}
            <AvatarFallback className="bg-brand-100 text-xs font-semibold text-brand-800 dark:bg-brand-900 dark:text-brand-200">{userInitials}</AvatarFallback>
          </Avatar>
          <span className="hidden md:block text-sm font-medium max-w-[120px] truncate">
            {user?.firstName}
          </span>
        </button>

        {/* Dropdown menu */}
        {dropdownOpen && (
          <div role="menu" className="absolute right-0 mt-2 w-60 rounded-xl border border-border bg-card p-1.5 shadow-lg shadow-gray-900/10">
            <div className="px-3 pb-2.5 pt-2 border-b border-border mb-1">
              <p className="text-sm font-semibold">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-[13px] text-muted-foreground truncate">
                {user?.email}
              </p>
            </div>

            <div>
              <Link
                href={user?.role === 'CLIENT' ? '/dashboard/client/profile' : '/dashboard/settings'}
                onClick={() => setDropdownOpen(false)}
                role="menuitem" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground/85 hover:bg-muted hover:text-foreground transition-colors"
              >
                <UserCircle className="h-4 w-4 text-gray-400" />
                {t('myProfile')}
              </Link>
              <Link
                href="/dashboard/settings"
                onClick={() => setDropdownOpen(false)}
                role="menuitem" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground/85 hover:bg-muted hover:text-foreground transition-colors"
              >
                <Settings className="h-4 w-4 text-gray-400" />
                {t('settings')}
              </Link>
            </div>

            <div className="border-t border-border mt-1 pt-1">
              <button
                onClick={handleLogout}
                role="menuitem" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-red-700 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-500/10 w-full transition-colors"
              >
                <LogOut className="h-4 w-4" />
                {t('logout')}
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
