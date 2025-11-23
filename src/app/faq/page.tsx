import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { FaqClient } from "./FaqClient";
import { getFaqsWithFallback } from "@/lib/faq/queries";

export const revalidate = 0;

export default async function FAQPage() {
  const faqResult = await getFaqsWithFallback();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <FaqClient
        faqs={faqResult.faqs}
        categories={faqResult.categories}
        source={faqResult.source}
      />
      <CTASection />
      <Footer />
    </div>
  );
}
