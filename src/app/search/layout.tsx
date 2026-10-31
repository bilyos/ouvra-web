import { Suspense, type ReactNode } from 'react';
import { Navbar } from '@/components/ui/navbar';
import { Footer } from '@/components/ui/footer';

export const metadata = {
  title: 'Recherche',
  description: 'Trouvez les meilleurs prestataires de services près de chez vous',
};

export default function SearchLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Navbar />
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-700 border-t-transparent" />
          </div>
        }
      >
        {children}
      </Suspense>
      <Footer />
    </>
  );
}
