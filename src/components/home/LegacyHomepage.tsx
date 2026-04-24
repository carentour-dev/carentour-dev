import CTASection from "@/components/CTASection";
import FeaturedTreatments from "@/components/FeaturedTreatments";
import Hero from "@/components/Hero";
import ProcessSection from "@/components/ProcessSection";
import USPSection from "@/components/USPSection";

type LegacyHomepageProps = {
  heroImageUrl?: string | null;
};

export default function LegacyHomepage({ heroImageUrl }: LegacyHomepageProps) {
  return (
    <>
      <Hero backgroundImageUrl={heroImageUrl} />
      <FeaturedTreatments />
      <ProcessSection />
      <USPSection />
      <CTASection />
    </>
  );
}
