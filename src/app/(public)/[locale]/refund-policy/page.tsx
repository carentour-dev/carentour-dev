import type { Metadata } from "next";
import LegalDocumentPage from "@/components/legal/LegalDocumentPage";
import { StructuredDataScripts } from "@/components/seo/StructuredDataScripts";
import type { PublicLocale } from "@/i18n/routing";
import { getLegalDocument } from "@/lib/legalDocuments";
import { getLocalizedCompanyName } from "@/lib/public/brand";
import {
  getLocalizedPublicPagePathname,
  getPublicLocaleFromParams,
} from "@/lib/public/page";
import { resolveSeo, webPageSchema } from "@/lib/seo";

export const revalidate = 300;

type PageProps = {
  params: Promise<{ locale: string }>;
};

const document = getLegalDocument("refund");

async function getSeo(locale: PublicLocale) {
  const copy = document.locales[locale];
  const pathname = getLocalizedPublicPagePathname(document.pathname, locale);
  const companyName = getLocalizedCompanyName(locale);

  return resolveSeo({
    routeKey: document.routeKey,
    pathname,
    locale,
    defaults: {
      title: `${copy.title} | ${companyName}`,
      description: copy.description,
    },
    schema: webPageSchema({
      urlPath: pathname,
      title: `${copy.title} | ${companyName}`,
      description: copy.description,
      breadcrumbs: [
        {
          name: locale === "ar" ? "الرئيسية" : "Home",
          path: getLocalizedPublicPagePathname("/", locale),
        },
        { name: copy.title, path: pathname },
      ],
    }),
  });
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const locale = await getPublicLocaleFromParams(params);
  const seo = await getSeo(locale);
  return seo.metadata;
}

export default async function RefundPolicyPage({ params }: PageProps) {
  const locale = await getPublicLocaleFromParams(params);
  const seo = await getSeo(locale);

  return (
    <>
      <StructuredDataScripts payload={seo.jsonLd} />
      <LegalDocumentPage kind="refund" locale={locale} />
    </>
  );
}
