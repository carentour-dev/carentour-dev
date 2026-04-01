import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlockRenderer } from "@/components/cms/BlockRenderer";
import { StructuredDataScripts } from "@/components/seo/StructuredDataScripts";
import type { PublicLocale } from "@/i18n/routing";
import type { BlockInstance, BlockValue } from "@/lib/cms/blocks";
import { type CmsPage } from "@/lib/cms/server";
import { getTemplate } from "@/lib/cms/templates";
import { getLocalizedCompanyName } from "@/lib/public/brand";
import { getLocalizedCmsPageBySlug } from "@/lib/public/localization";
import {
  getLocalizedPublicPagePathname,
  getPublicLocaleFromParams,
} from "@/lib/public/page";
import {
  contactPageSchema,
  faqPageSchema,
  maybeRedirectFromLegacyPath,
  organizationContactSchema,
  organizationSchema,
  resolveSeo,
  webPageSchema,
} from "@/lib/seo";

export const revalidate = 300;

const PATHNAME = "/contact";
const fallbackTemplate = getTemplate("contact-global");

type PageProps = {
  params: Promise<{ locale: string }>;
};

type ContactPageBlock = BlockInstance | BlockValue;

function getContactSeoDefaults(locale: PublicLocale, companyName: string) {
  if (locale === "ar") {
    return {
      title: `اتصل بـ ${companyName} | استفسارات المرضى الدوليين والشركاء`,
      description: `تواصل مع ${companyName} للحصول على تخطيط العلاج، ودعم المرضى الدوليين، وتنسيق الإحالات، واستفسارات الشراكات المرتبطة بالسفر العلاجي إلى مصر.`,
    };
  }

  return {
    title: `Contact ${companyName} | International Patient, Partner & Corporate Enquiries`,
    description: `Contact ${companyName} for treatment planning, international patient support, referral coordination, and corporate or partner enquiries related to medical travel in Egypt.`,
  };
}

function extractFaqs(blocks: ContactPageBlock[]) {
  return blocks.flatMap((block) =>
    block.type === "faq"
      ? block.items.map((item) => ({
          question: item.question,
          answer: item.answer,
        }))
      : [],
  );
}

function extractContactPoints(blocks: ContactPageBlock[]) {
  const contactBlock = blocks.find(
    (block): block is BlockValue<"contactFormEmbed"> =>
      block.type === "contactFormEmbed",
  );

  if (!contactBlock) {
    return [];
  }

  return contactBlock.channels
    .map((channel) => {
      const href = channel.href?.trim() ?? "";
      const content = channel.content.trim();
      const isTelephone = href.startsWith("tel:");
      const isEmail = href.startsWith("mailto:");
      const isUrl = href.startsWith("https://") || href.startsWith("http://");

      return {
        contactType: channel.schemaContactType ?? "customer support",
        telephone: isTelephone ? href.replace(/^tel:/, "") : undefined,
        email: isEmail ? href.replace(/^mailto:/, "") : undefined,
        url: isUrl ? href : undefined,
        areaServed: ["International"],
        availableLanguage: ["English", "Arabic"],
        fallbackContent: !isTelephone && !isEmail && !isUrl ? content : null,
      };
    })
    .map(({ fallbackContent, ...point }) => point);
}

function extractAiSummary(blocks: ContactPageBlock[]) {
  const summaryParts = blocks.flatMap((block) => {
    switch (block.type) {
      case "aboutHero":
        return [block.description];
      case "serviceCatalog":
        return [
          block.description,
          ...block.items.flatMap((item) => [
            item.title,
            item.description,
            ...(item.bullets ?? []),
          ]),
        ];
      case "contactFormEmbed":
        return [
          block.description,
          block.channelsDescription,
          block.supportDescription,
          ...(block.supportItems ?? []),
        ];
      case "faq":
        return block.items.flatMap((item) => [item.question, item.answer]);
      default:
        return [];
    }
  });

  return summaryParts
    .filter((value): value is string => Boolean(value))
    .join(" ")
    .trim();
}

async function getSeo(
  cmsPage: CmsPage | null,
  blocks: ContactPageBlock[],
  locale: PublicLocale,
) {
  const localizedPathname = getLocalizedPublicPagePathname(PATHNAME, locale);
  const companyName = getLocalizedCompanyName(locale);
  const seoDefaults = getContactSeoDefaults(locale, companyName);
  const homeLabel = locale === "ar" ? "الرئيسية" : "Home";
  const contactLabel = locale === "ar" ? "اتصل بنا" : "Contact Us";
  const title =
    typeof cmsPage?.seo?.title === "string" &&
    cmsPage.seo.title.trim().length > 0
      ? cmsPage.seo.title.trim()
      : locale === "ar"
        ? seoDefaults.title
        : (fallbackTemplate?.seo?.title ?? seoDefaults.title);
  const description =
    typeof cmsPage?.seo?.description === "string" &&
    cmsPage.seo.description.trim().length > 0
      ? cmsPage.seo.description.trim()
      : locale === "ar"
        ? seoDefaults.description
        : (fallbackTemplate?.seo?.description ?? seoDefaults.description);
  const ogImage =
    typeof cmsPage?.seo?.ogImage === "string" &&
    cmsPage.seo.ogImage.trim().length > 0
      ? cmsPage.seo.ogImage.trim()
      : null;
  const faqs = extractFaqs(blocks);
  const contactPoints = extractContactPoints(blocks);
  const aiSummary = extractAiSummary(blocks);

  return resolveSeo({
    routeKey: PATHNAME,
    pathname: localizedPathname,
    locale,
    defaults: {
      title,
      description,
    },
    source: {
      title,
      description,
      ogImageUrl: ogImage,
      aiSummary,
    },
    schema: [
      organizationSchema(),
      webPageSchema({
        urlPath: localizedPathname,
        title,
        description,
        breadcrumbs: [
          {
            name: homeLabel,
            path: getLocalizedPublicPagePathname("/", locale),
          },
          { name: contactLabel, path: localizedPathname },
        ],
      }),
      contactPageSchema({
        path: localizedPathname,
        title,
        description,
      }),
      ...(contactPoints.length > 0
        ? [organizationContactSchema({ contactPoints })]
        : []),
      ...(faqs.length > 0
        ? [faqPageSchema({ path: localizedPathname, faqs })]
        : []),
    ],
    modifiedTime: cmsPage?.updated_at ?? undefined,
  });
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const locale = await getPublicLocaleFromParams(params);
  const cmsPage = await getLocalizedCmsPageBySlug("contact", locale);
  const blocks =
    cmsPage?.content?.length && cmsPage.content.length > 0
      ? cmsPage.content
      : (fallbackTemplate?.blocks ?? []);
  const seo = await getSeo(cmsPage, blocks, locale);
  return seo.metadata;
}

export default async function ContactPage({ params }: PageProps) {
  const locale = await getPublicLocaleFromParams(params);
  await maybeRedirectFromLegacyPath(PATHNAME);

  const cmsPage = await getLocalizedCmsPageBySlug("contact", locale);
  if (locale === "ar" && !cmsPage) {
    notFound();
  }
  const blocks =
    cmsPage?.content?.length && cmsPage.content.length > 0
      ? cmsPage.content
      : (fallbackTemplate?.blocks ?? []);
  const seo = await getSeo(cmsPage, blocks, locale);

  return (
    <>
      <StructuredDataScripts payload={seo.jsonLd} />
      <BlockRenderer blocks={blocks} />
    </>
  );
}
