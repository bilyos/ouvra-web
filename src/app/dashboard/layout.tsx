'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { useAuth } from '@/hooks/use-auth';
import { useLiveSync } from '@/hooks/use-live';
import { DashboardSidebar } from '@/components/layouts/dashboard-sidebar';
import { DashboardHeader } from '@/components/layouts/dashboard-header';
import { Spinner } from '@/components/ui/spinner';

function getDashboardHome(role: string): string {
  switch (role) {
    case 'ADMIN':
      return '/dashboard/admin';
    case 'PROVIDER':
      return '/dashboard/provider';
    default:
      return '/dashboard/client';
  }
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading } = useAuthStore();
  useAuth();
  useLiveSync();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    if (pathname === '/dashboard' && user) {
      router.replace(getDashboardHome(user.role));
    }
  }, [isAuthenticated, isLoading, pathname, user, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Spinner size={40} />
          <p className="text-sm text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-paper">
      <DashboardSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto px-4 pb-24 pt-6 md:px-6 lg:px-10 lg:pb-12 lg:pt-8">
          <div className="mx-auto w-full max-w-6xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
