import type { Metadata } from "next";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { BlockRenderer } from "@/components/cms/BlockRenderer";
import { StructuredDataScripts } from "@/components/seo/StructuredDataScripts";
import { getPublishedPageBySlug, type CmsPage } from "@/lib/cms/server";
import { getTemplate } from "@/lib/cms/templates";
import { getFaqsWithFallbackCached } from "@/lib/faq/queries";
import {
  faqPageSchema,
  maybeRedirectFromLegacyPath,
  organizationSchema,
  resolveSeo,
  webPageSchema,
} from "@/lib/seo";

export const revalidate = 300;

const PATHNAME = "/faq";
const fallbackTemplate = getTemplate("faq-global");

function getFaqContentModifiedTime(
  cmsPage: CmsPage | null,
  faqResult: Awaited<ReturnType<typeof getFaqsWithFallbackCached>>,
) {
  const timestamps = [
    cmsPage?.updated_at,
    ...faqResult.faqs.flatMap((entry) => [entry.updated_at, entry.created_at]),
    ...faqResult.categories.flatMap((entry) => [
      entry.updated_at,
      entry.created_at,
    ]),
  ]
    .filter((value): value is string => Boolean(value))
    .map((value) => Date.parse(value))
    .filter((value) => Number.isFinite(value));

  if (!timestamps.length) {
    return cmsPage?.updated_at ?? undefined;
  }

  return new Date(Math.max(...timestamps)).toISOString();
}

async function getSeo(
  cmsPage: CmsPage | null,
  faqResult: Awaited<ReturnType<typeof getFaqsWithFallbackCached>>,
) {
  const title =
    typeof cmsPage?.seo?.title === "string" &&
    cmsPage.seo.title.trim().length > 0
      ? cmsPage.seo.title.trim()
      : (fallbackTemplate?.seo?.title ??
        "FAQ for International Patients Seeking Treatment in Egypt | Care N Tour");
  const description =
    typeof cmsPage?.seo?.description === "string" &&
    cmsPage.seo.description.trim().length > 0
      ? cmsPage.seo.description.trim()
      : (fallbackTemplate?.seo?.description ??
        "Read Care N Tour's FAQ for international patients seeking treatment in Egypt, with answers on doctors, accredited hospitals, medical travel planning, pricing, accommodation, safety, recovery, and follow-up.");
  const ogImage =
    typeof cmsPage?.seo?.ogImage === "string" &&
    cmsPage.seo.ogImage.trim().length > 0
      ? cmsPage.seo.ogImage.trim()
      : null;
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
    defaults: {
      title,
      description,
    },
    source: {
      title,
      description,
      ogImageUrl: ogImage,
    },
    schema: [
      webPageSchema({
        urlPath: PATHNAME,
        title,
        description,
        breadcrumbs: [
          { name: "Home", path: "/" },
          { name: "FAQ", path: PATHNAME },
        ],
      }),
      organizationSchema(),
      faqSchema,
    ],
    modifiedTime: getFaqContentModifiedTime(cmsPage, faqResult),
  });

  return seo;
}

export async function generateMetadata(): Promise<Metadata> {
  const [cmsPage, faqResult] = await Promise.all([
    getPublishedPageBySlug("faq"),
    getFaqsWithFallbackCached(),
  ]);
  const seo = await getSeo(cmsPage, faqResult);
  return seo.metadata;
}

export default async function FAQPage() {
  await maybeRedirectFromLegacyPath(PATHNAME);
  const [cmsPage, faqResult] = await Promise.all([
    getPublishedPageBySlug("faq"),
    getFaqsWithFallbackCached(),
  ]);
  const seo = await getSeo(cmsPage, faqResult);
  const blocks =
    cmsPage?.content?.length && cmsPage.content.length > 0
      ? cmsPage.content
      : (fallbackTemplate?.blocks ?? []);

  return (
    <>
      <StructuredDataScripts payload={seo.jsonLd} />
      <div className="min-h-screen">
        <Header />
        <main>
          <BlockRenderer blocks={blocks} />
        </main>
        <Footer />
      </div>
    </>
  );
}
