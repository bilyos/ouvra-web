import type { Metadata, Viewport } from 'next';
import { Bricolage_Grotesque, Figtree } from 'next/font/google';
import Script from 'next/script';
import { getLocale, getMessages, getTranslations } from 'next-intl/server';
import { Providers } from '@/components/providers';
import { PwaSupport } from '@/components/pwa/pwa-support';
import { THEME_SCRIPT } from '@/providers/theme-script';
import './globals.css';

const figtree = Figtree({
  subsets: ['latin'],
  variable: '--font-figtree',
  display: 'swap',
});

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-bricolage',
  display: 'swap',
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata');

  return {
    title: {
      default: t('title'),
      template: '%s | Ouvra',
    },
    description: t('description'),
    keywords: t('keywords').split(','),
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0e1310' },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${figtree.variable} ${bricolage.variable}`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-background text-foreground antialiased" suppressHydrationWarning>
        <Script id="theme-init" strategy="beforeInteractive">
          {THEME_SCRIPT}
        </Script>
        <Providers locale={locale} messages={messages}>
          {children}
          <PwaSupport />
        </Providers>
      </body>
    </html>
  );
}
