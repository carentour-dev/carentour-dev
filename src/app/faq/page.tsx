import type { Metadata } from "next";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { StructuredDataScripts } from "@/components/seo/StructuredDataScripts";
import { FaqClient } from "./FaqClient";
import { getFaqsWithFallback } from "@/lib/faq/queries";
import {
  faqPageSchema,
  maybeRedirectFromLegacyPath,
  resolveSeo,
  webPageSchema,
} from "@/lib/seo";

export const revalidate = 300;

const PATHNAME = "/faq";
const DEFAULTS = {
  title: "FAQ | Care N Tour",
  description:
    "Find answers to common questions about treatments, travel, and patient support.",
};

async function getSeo() {
  const faqResult = await getFaqsWithFallback();
  const faqSchema = faqPageSchema({
    path: PATHNAME,
    faqs: faqResult.faqs.map((entry) => ({
      question: entry.question,
      answer: entry.answer,
    })),
  });

  const seo = await resolveSeo({
    routeKey: PATHNAME,
    pathname: PATHNAME,
    defaults: DEFAULTS,
    source: {
      title: DEFAULTS.title,
      description: DEFAULTS.description,
    },
    schema: [
      webPageSchema({
        urlPath: PATHNAME,
        title: DEFAULTS.title,
        description: DEFAULTS.description,
      }),
      faqSchema,
    ],
  });

  return { faqResult, seo };
}

export async function generateMetadata(): Promise<Metadata> {
  const { seo } = await getSeo();
  return seo.metadata;
}

export default async function FAQPage() {
  await maybeRedirectFromLegacyPath(PATHNAME);
  const { faqResult, seo } = await getSeo();

  return (
    <>
      <StructuredDataScripts payload={seo.jsonLd} />
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
    </>
  );
}
