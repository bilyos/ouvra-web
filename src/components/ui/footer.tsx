'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { LogoMark, Wordmark } from '@/components/ui/logo';
import { config } from '@/config';

const { contact, social: socialLinks } = config;
/** « +2376XXXXXXXX » affiché « +237 6 XX XX XX XX » */
const prettyPhone = (p: string) => p.replace(/^\+?237(\d)(\d{2})(\d{2})(\d{2})(\d{2})$/, '+237 $1 $2 $3 $4 $5');

const footerLinks = [
  {
    section: 'services',
    links: [
      { key: 'plumbing', href: '/search?q=Plomberie' },
      { key: 'electricity', href: '/search?q=Electricite' },
      { key: 'cleaning', href: '/search?q=Menage' },
      { key: 'hairdressing', href: '/search?q=Coiffure' },
      { key: 'carpentry', href: '/search?q=Menuiserie' },
      { key: 'allServices', href: '/search' },
    ],
  },
  {
    section: 'company',
    links: [
      { key: 'howItWorks', href: '/#comment-ca-marche' },
      { key: 'testimonials', href: '/#temoignages' },
      { key: 'faq', href: '/#faq' },
      { key: 'becomeProvider', href: '/auth/register?role=provider' },
    ],
  },
  {
    section: 'legal',
    links: [
      { key: 'terms', href: '/#conditions' },
      { key: 'privacy', href: '/#confidentialite' },
      { key: 'legalNotice', href: '/#mentions' },
    ],
  },
] as const;

export function Footer() {
  const t = useTranslations('footer');

  return (
    <footer className="bg-brand-950 text-brand-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-x-6 gap-y-12 py-16 sm:grid-cols-3 md:grid-cols-12">
          <div className="col-span-2 sm:col-span-3 md:col-span-5">
            <Link href="/" className="inline-flex items-center gap-2.5 rounded-md">
              <LogoMark inverse />
              <Wordmark inverse />
            </Link>
            <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-brand-200/80">{t('description')}</p>

            <dl className="mt-8 grid max-w-sm grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
              {contact.phone && (
                <>
                  <dt className="text-brand-300/70">{t('contact.phone')}</dt>
                  <dd>
                    <a href={`tel:${contact.phone}`} className="text-white underline-offset-4 hover:underline">
                      {prettyPhone(contact.phone)}
                    </a>
                  </dd>
                </>
              )}
              {contact.whatsapp && (
                <>
                  <dt className="text-brand-300/70">WhatsApp</dt>
                  <dd>
                    <a href={`https://wa.me/${contact.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-white underline-offset-4 hover:underline">
                      {prettyPhone(contact.whatsapp)}
                    </a>
                  </dd>
                </>
              )}
              {contact.email && (
                <>
                  <dt className="text-brand-300/70">{t('contact.email')}</dt>
                  <dd>
                    <a href={`mailto:${contact.email}`} className="text-white underline-offset-4 hover:underline">
                      {contact.email}
                    </a>
                  </dd>
                </>
              )}
              <dt className="text-brand-300/70">{t('contact.office')}</dt>
              <dd className="text-white">{t('location')}</dd>
            </dl>
          </div>

          {footerLinks.map((section, i) => (
            <div key={section.section} className={i === 0 ? 'md:col-span-2 md:col-start-7' : 'md:col-span-2'}>
              <h3 className="font-sans text-sm font-semibold tracking-normal text-white">{t(`sections.${section.section}`)}</h3>
              <ul className="mt-4 space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-brand-200/75 transition-colors hover:text-white">
                      {t(`links.${link.key}`)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-4 border-t border-white/10 py-6 text-[13px] text-brand-200/60 sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; {new Date().getFullYear()} Ouvra. {t('rights')}
          </p>
          <ul className="flex gap-5">
            {socialLinks.map((s) => (
              <li key={s.label}>
                <a href={s.href} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-white">
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
