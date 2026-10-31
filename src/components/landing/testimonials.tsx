'use client';

import { useTranslations } from 'next-intl';

const featured = { key: 'aurelien', name: 'Aurélien Tchamba', initials: 'AT' } as const;
const others = [
  { key: 'christelle', name: 'Christelle Mbarga', initials: 'CM' },
  { key: 'patrick', name: 'Patrick Nkeng', initials: 'PN' },
] as const;

function Person({ initials, name, role }: { initials: string; name: string; role: string }) {
  return (
    <figcaption className="flex items-center gap-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 font-display text-sm font-bold text-brand-800 dark:bg-brand-900 dark:text-brand-200">
        {initials}
      </span>
      <span>
        <span className="block text-[15px] font-semibold">{name}</span>
        <span className="block text-sm text-muted-foreground">{role}</span>
      </span>
    </figcaption>
  );
}

export function TestimonialsSection() {
  const t = useTranslations('landing.testimonials');

  return (
    <section id="temoignages" className="scroll-mt-20 py-20 sm:py-28" aria-labelledby="testimonials-title">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 id="testimonials-title" className="text-3xl font-bold sm:text-[2.6rem] sm:leading-[1.1]">
          {t('title')}
        </h2>

        <div className="mt-12 grid gap-12 lg:grid-cols-12 lg:gap-16">
          <figure className="lg:col-span-7">
            <blockquote className="font-display text-2xl font-medium leading-snug tracking-[-0.02em] sm:text-[2rem] sm:leading-[1.25]">
              <p>
                <span aria-hidden="true" className="text-sun-500">
                  «&nbsp;
                </span>
                {t(`items.${featured.key}.text`)}
                <span aria-hidden="true" className="text-sun-500">
                  &nbsp;»
                </span>
              </p>
            </blockquote>
            <div className="mt-8">
              <Person initials={featured.initials} name={featured.name} role={t(`items.${featured.key}.role`)} />
            </div>
          </figure>

          <div className="grid content-start gap-10 lg:col-span-5 lg:border-l lg:border-border lg:pl-12">
            {others.map((p) => (
              <figure key={p.key}>
                <blockquote className="text-[17px] leading-relaxed text-foreground/90">
                  <p>{t(`items.${p.key}.text`)}</p>
                </blockquote>
                <div className="mt-5">
                  <Person initials={p.initials} name={p.name} role={t(`items.${p.key}.role`)} />
                </div>
              </figure>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
