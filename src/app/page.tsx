import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import FeaturedTreatments from "@/components/FeaturedTreatments";
import ProcessSection from "@/components/ProcessSection";
import USPSection from "@/components/USPSection";
import Testimonials from "@/components/Testimonials";
import DoctorsSection from "@/components/DoctorsSection";
import CTASection from "@/components/CTASection";
import { BlockRenderer } from "@/components/cms/BlockRenderer";
import { getPublishedPageBySlug } from "@/lib/cms/server";

export const revalidate = 300;
export async function generateMetadata() {
  const cmsPage = await getPublishedPageBySlug("home");
  return {
    title: cmsPage?.seo?.title ?? "Care N Tour",
    description: cmsPage?.seo?.description ?? undefined,
    openGraph: cmsPage?.seo?.ogImage ? { images: [cmsPage.seo.ogImage] } : undefined,
  } as any;
}

export default async function Home() {
  const cmsPage = await getPublishedPageBySlug("home");

  if (cmsPage?.content?.length) {
    return (
      <div className="min-h-screen">
        <Header />
        <main>
          <BlockRenderer blocks={cmsPage.content} />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <FeaturedTreatments />
        <ProcessSection />
        <USPSection />
        <DoctorsSection />
        <Testimonials />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
