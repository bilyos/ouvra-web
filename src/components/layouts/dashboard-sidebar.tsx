'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  MessageSquare,
  Heart,
  Bell,
  UserCircle,
  LayoutDashboard,
  Briefcase,
  BarChart3,
  Star,
  ChevronLeft,
  ChevronRight,
  X,
  Settings,
  ShieldCheck,
  Users,
  CreditCard,
  Grid3X3,
  Rocket,
  CalendarCheck,
  Zap,
  Wallet,
  Crown,
  History,
  Megaphone,
  Inbox,
  FileText,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/utils/cn';
import { useAuthStore } from '@/stores/auth-store';
import { useUIStore } from '@/stores/ui-store';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BRAND_NAME, LogoMark, Wordmark } from '@/components/ui/logo';

interface NavItem {
  key: string;
  href: string;
  icon: React.ElementType;
}

const clientNavItems: NavItem[] = [
  { key: 'home', href: '/dashboard/client', icon: Home },
  { key: 'requests', href: '/dashboard/client/requests', icon: Megaphone },
  { key: 'urgent', href: '/dashboard/client/urgent', icon: Zap },
  { key: 'bookings', href: '/dashboard/client/bookings', icon: CalendarCheck },
  { key: 'history', href: '/dashboard/client/history', icon: History },
  { key: 'messages', href: '/dashboard/messages', icon: MessageSquare },
  { key: 'favorites', href: '/dashboard/client/favorites', icon: Heart },
  { key: 'notifications', href: '/dashboard/client/notifications', icon: Bell },
  { key: 'profile', href: '/dashboard/client/profile', icon: UserCircle },
  { key: 'settings', href: '/dashboard/settings', icon: Settings },
];

const providerNavItems: NavItem[] = [
  { key: 'dashboard', href: '/dashboard/provider', icon: LayoutDashboard },
  { key: 'requests', href: '/dashboard/provider/requests', icon: Inbox },
  { key: 'quotes', href: '/dashboard/provider/quotes', icon: FileText },
  { key: 'bookings', href: '/dashboard/provider/bookings', icon: CalendarCheck },
  { key: 'services', href: '/dashboard/provider/services', icon: Briefcase },
  { key: 'wallet', href: '/dashboard/provider/wallet', icon: Wallet },
  { key: 'subscription', href: '/dashboard/provider/subscription', icon: Crown },
  { key: 'messages', href: '/dashboard/messages', icon: MessageSquare },
  { key: 'reviews', href: '/dashboard/provider/reviews', icon: Star },
  { key: 'stats', href: '/dashboard/provider/stats', icon: BarChart3 },
  { key: 'settings', href: '/dashboard/settings', icon: Settings },
];

const adminNavItems: NavItem[] = [
  { key: 'dashboard', href: '/dashboard/admin', icon: ShieldCheck },
  { key: 'users', href: '/dashboard/admin/users', icon: Users },
  { key: 'bookings', href: '/dashboard/admin/bookings', icon: CalendarCheck },
  { key: 'categories', href: '/dashboard/admin/categories', icon: Grid3X3 },
  { key: 'payments', href: '/dashboard/admin/payments', icon: CreditCard },
  { key: 'subscriptions', href: '/dashboard/admin/subscriptions', icon: Crown },
  { key: 'settings', href: '/dashboard/settings', icon: Settings },
];

function getNavItems(role: string): NavItem[] {
  switch (role) {
    case 'PROVIDER':
      return providerNavItems;
    case 'ADMIN':
      return adminNavItems;
    default:
      return clientNavItems;
  }
}

function getNavNamespace(role: string): string {
  switch (role) {
    case 'PROVIDER':
      return 'provider';
    case 'ADMIN':
      return 'admin';
    default:
      return 'client';
  }
}

export function DashboardSidebar() {
  const t = useTranslations('dashboard.sidebar');
  const tRole = useTranslations('status.role');
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { sidebarCollapsed, setSidebarCollapsed, mobileMenuOpen, setMobileMenuOpen } = useUIStore();

  const role = user?.role ?? 'CLIENT';
  const navItems = getNavItems(role);
  const navNs = getNavNamespace(role);

  const userInitials = user
    ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
    : '';

  // L'accueil de chaque espace ne s'allume que sur lui-même, pas sur toutes ses sous-pages
  const isActive = (href: string) => pathname === href || (href !== navItems[0].href && pathname.startsWith(href + '/'));

  const label = (item: NavItem) => t(`${navNs}.${item.key}`);

  const sidebarContent = (collapsed: boolean) => (
    <div className="flex h-full flex-col">
      <div className={cn('flex h-16 shrink-0 items-center gap-2.5 px-5', collapsed && 'justify-center px-0')}>
        <Link href="/" className="flex items-center gap-2.5 rounded-md" aria-label={BRAND_NAME}>
          <LogoMark inverse />
          {!collapsed && <Wordmark inverse className="text-[20px]" />}
        </Link>
      </div>

      <nav className="hide-scrollbar flex-1 space-y-0.5 overflow-y-auto px-3 py-4" aria-label="Espace personnel">
        {navItems.map((item) => {
          const active = isActive(item.href);
          const urgent = item.href === '/dashboard/client/urgent';
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              aria-current={active ? 'page' : undefined}
              title={collapsed ? label(item) : undefined}
              className={cn(
                'relative flex h-10 items-center gap-3 rounded-lg px-3 text-[14px] font-medium transition-colors',
                collapsed && 'justify-center px-0',
                active ? 'bg-white/10 text-white' : 'text-brand-100/70 hover:bg-white/5 hover:text-white',
                urgent && !active && 'text-red-300 hover:text-red-200'
              )}
            >
              {active && <span className="absolute -left-3 top-2 bottom-2 w-[3px] rounded-r-full bg-sun-400" aria-hidden="true" />}
              <item.icon className={cn('h-[18px] w-[18px] shrink-0', active ? 'text-sun-400' : '')} strokeWidth={1.9} />
              {!collapsed && <span className="truncate">{label(item)}</span>}
            </Link>
          );
        })}
      </nav>

      {role === 'CLIENT' && !collapsed && (
        <div className="px-3 pb-3">
          <Link
            href="/dashboard/client/become-provider"
            onClick={() => setMobileMenuOpen(false)}
            className="block rounded-xl bg-white/[0.06] p-4 transition-colors hover:bg-white/10"
          >
            <p className="flex items-center gap-2 text-sm font-semibold text-white">
              <Rocket className="h-4 w-4 text-sun-400" />
              {t('becomeProvider')}
            </p>
            <p className="mt-1 text-[13px] leading-snug text-brand-100/65">{t('earnMoney')}</p>
          </Link>
        </div>
      )}

      <div className={cn('flex shrink-0 items-center gap-3 border-t border-white/10 px-4 py-3', collapsed && 'flex-col px-2')}>
        <Avatar className="h-9 w-9 shrink-0">
          {user?.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.firstName} />}
          <AvatarFallback className="bg-brand-700 text-xs font-semibold text-white">{userInitials}</AvatarFallback>
        </Avatar>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-[12px] text-brand-100/60">{tRole(role)}</p>
          </div>
        )}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-md text-brand-100/60 transition-colors hover:bg-white/10 hover:text-white lg:flex"
          aria-label={t('collapse')}
          title={t('collapse')}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );

  const mobileBottomItems = navItems.slice(0, 4);

  return (
    <>
      <aside
        className={cn(
          'sticky top-0 z-30 hidden h-screen shrink-0 flex-col bg-brand-950 transition-[width] duration-200 ease-out lg:flex',
          sidebarCollapsed ? 'w-[72px]' : 'w-[248px]'
        )}
      >
        {sidebarContent(sidebarCollapsed)}
      </aside>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-gray-950/50" onClick={() => setMobileMenuOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-[280px] bg-brand-950 shadow-xl">
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="absolute right-3 top-3.5 flex h-9 w-9 items-center justify-center rounded-lg text-brand-100/70 hover:bg-white/10 hover:text-white"
              aria-label="Fermer le menu"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebarContent(false)}
          </aside>
        </div>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card pb-[env(safe-area-inset-bottom)] lg:hidden">
        <div className="grid grid-cols-4">
          {mobileBottomItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors',
                  active ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                {active && <span className="absolute inset-x-6 top-0 h-[3px] rounded-b-full bg-sun-400" aria-hidden="true" />}
                <item.icon className={cn('h-5 w-5', active && 'text-brand-700 dark:text-brand-300')} />
                <span className="max-w-[72px] truncate">{label(item)}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
