import { HeroSection } from '@/components/landing/hero';
import { CategoriesSection } from '@/components/landing/categories';
import { HowItWorksSection } from '@/components/landing/how-it-works';
import { PriceCheckSection } from '@/components/landing/price-check';
import { PopularProvidersSection } from '@/components/landing/popular-providers';
import { TrustSection } from '@/components/landing/trust';
import { TestimonialsSection } from '@/components/landing/testimonials';
import { CoverageMapSection } from '@/components/landing/coverage-map';
import { DownloadAppSection } from '@/components/landing/download-app';
import { FAQSection } from '@/components/landing/faq';
import { CTASection } from '@/components/landing/cta';

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <CategoriesSection />
      <HowItWorksSection />
      <PriceCheckSection />
      <PopularProvidersSection />
      <TrustSection />
      <TestimonialsSection />
      <CoverageMapSection />
      <DownloadAppSection />
      <FAQSection />
      <CTASection />
    </>
  );
}
