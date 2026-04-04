"use client";

import { useMemo } from "react";

import type { PublicLocale } from "@/i18n/routing";
import type { BlockInstance } from "@/lib/cms/blocks";
import { blockRegistry, normalizeBlocks } from "@/lib/cms/blocks";
import { cn } from "@/lib/utils";
import { useCmsBlogPreviewData } from "@/hooks/useCmsBlogPreviewData";
import { AnimationController } from "./AnimationController";
import { BlogArticleBodyBlock } from "./blocks/BlogArticleBodyBlock";
import { BlogArticleHeroBlock } from "./blocks/BlogArticleHeroBlock";
import { BlogAuthorSummaryBlock } from "./blocks/BlogAuthorSummaryBlock";
import {
  BlogPostFeedContent,
  selectPreviewBlogPostFeedItems,
} from "./blocks/BlogPostFeedBlockContent";
import {
  BlogTaxonomyGridContent,
  selectPreviewBlogTaxonomyItems,
} from "./blocks/BlogTaxonomyGridBlockContent";
import { BlockSurface } from "./blocks/BlockSurface";
import { CallToActionBlock } from "./blocks/CallToActionBlock";
import { ContactFormEmbedBlockPreview } from "./blocks/ContactFormEmbedBlockContent";
import { DifferentiatorsBlock } from "./blocks/DifferentiatorsBlock";
import { DoctorsBlockPreview } from "./blocks/DoctorsBlockPreview";
import { FeaturedTreatmentsHomePreview } from "./blocks/FeaturedTreatmentsHomePreview";
import { FeatureGridBlockPreview } from "./blocks/FeatureGridBlockContent";
import { DataGridBlock } from "./blocks/DataGridBlock";
import { FaqBlock } from "./blocks/FaqBlock";
import { FaqDirectoryContent } from "./blocks/FaqDirectoryContent";
import { LeadershipGridBlock } from "./blocks/LeadershipGridBlock";
import { HeroBlock } from "./blocks/HeroBlock";
import { HomeCtaBlock } from "./blocks/HomeCtaBlock";
import { HomeHeroBlock } from "./blocks/HomeHeroBlock";
import { ImageFeatureBlock } from "./blocks/ImageFeatureBlock";
import { JourneyStepsBlock } from "./blocks/JourneyStepsBlock";
import { LogoGridBlock } from "./blocks/LogoGridBlock";
import { AboutHeroBlock } from "./blocks/AboutHeroBlock";
import { MedicalFacilitiesDirectoryClient } from "./blocks/MedicalFacilitiesDirectoryClient";
import { MedicalFacilityProfileClient } from "./blocks/MedicalFacilityProfileClient";
import { MissionVisionValuesBlock } from "./blocks/MissionVisionValuesBlock";
import { QuoteBlock } from "./blocks/QuoteBlock";
import {
  previewFaqCategories,
  previewFaqs,
  previewMedicalFacilitiesDirectoryData,
  previewMedicalFacilityDetail,
} from "./blocks/previewFixtures";
import { RichTextBlock } from "./blocks/RichTextBlock";
import { HotelShowcaseBlock } from "./blocks/HotelShowcaseBlock";
import { InfoPanelsBlock } from "./blocks/InfoPanelsBlock";
import { ServiceCatalogBlock } from "./blocks/ServiceCatalogBlock";
import { StatGridBlock } from "./blocks/StatGridBlock";
import { AdvisoryNoticeBlock } from "./blocks/AdvisoryNoticeBlock";
import { StoryNarrativeBlock } from "./blocks/StoryNarrativeBlock";
import { TabbedGuidePreview } from "./blocks/TabbedGuidePreview";
import { TreatmentsBlockPreview } from "./blocks/TreatmentsBlockPreview";
import { TreatmentSpecialtiesPreview } from "./blocks/TreatmentSpecialtiesPreview";
import { TrustSignalsBlock } from "./blocks/TrustSignalsBlock";
import { StartJourneyEmbedBlock } from "./blocks/StartJourneyEmbedBlock";

const BLOG_PREVIEW_BLOCK_TYPES = new Set([
  "blogPostFeed",
  "blogTaxonomyGrid",
  "blogArticleHero",
  "blogArticleBody",
  "blogAuthorSummary",
]);

function Placeholder({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="rounded-lg border border-dashed border-border/50 bg-muted/20 p-6 text-sm text-muted-foreground">
      <p className="font-medium text-foreground">{title}</p>
      <p className="mt-2">
        {description ?? `${title} preview available on published page.`}
      </p>
    </div>
  );
}

function isBlockInstance(candidate: unknown): candidate is BlockInstance {
  if (!candidate || typeof candidate !== "object") return false;
  const typed = candidate as { type?: string; blockId?: unknown };
  return (
    typeof typed.type === "string" &&
    typed.type in blockRegistry &&
    typeof typed.blockId === "string" &&
    typed.blockId.length > 0
  );
}

function isBlockLike(candidate: unknown): candidate is { type?: string } {
  if (!candidate || typeof candidate !== "object") return false;
  const typed = candidate as { type?: string };
  return typeof typed.type === "string" && typed.type in blockRegistry;
}

function ensureBlockInstances(blocks: unknown): BlockInstance[] {
  if (Array.isArray(blocks)) {
    if (blocks.every((candidate) => isBlockInstance(candidate))) {
      return blocks as BlockInstance[];
    }
    if (blocks.every((candidate) => isBlockLike(candidate))) {
      return normalizeBlocks(blocks);
    }
  }
  return normalizeBlocks(blocks);
}

function stableHash(input: string): string {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

function getBlockKey(block: BlockInstance): string {
  const contentSignature = stableHash(JSON.stringify(block));
  return `${block.blockId}-${contentSignature}`;
}

function FaqDirectoryEditorPreview({
  block,
  locale,
}: {
  block: BlockInstance<"faqDirectory">;
  locale: PublicLocale;
}) {
  return (
    <BlockSurface
      block={block}
      className="overflow-visible border-y border-border/60 bg-background dark:border-slate-200 dark:bg-slate-50"
      defaultPadding={{ top: "5rem", bottom: "5rem" }}
      contentClassName="space-y-10"
    >
      {() => (
        <FaqDirectoryContent
          eyebrow={block.eyebrow}
          heading={block.heading}
          description={block.description}
          layout={block.layout}
          locale={locale}
          navigationHeading={block.navigationHeading}
          showSearch={block.showSearch}
          showCategoryDescriptions={block.showCategoryDescriptions}
          showSourceBadge={false}
          searchPlaceholder={block.searchPlaceholder}
          emptyStateHeading={block.emptyStateHeading}
          emptyStateDescription={block.emptyStateDescription}
          clearSearchLabel={block.clearSearchLabel}
          faqs={previewFaqs}
          categories={previewFaqCategories}
          source="cms"
        />
      )}
    </BlockSurface>
  );
}

function MedicalFacilitiesDirectoryEditorPreview({
  block,
}: {
  block: BlockInstance<"medicalFacilitiesDirectory">;
}) {
  return (
    <BlockSurface
      block={block}
      className="overflow-visible border-y border-border/50 bg-background"
      defaultPadding={{ top: "5rem", bottom: "5rem" }}
      contentClassName="space-y-10"
    >
      {() => (
        <MedicalFacilitiesDirectoryClient
          block={block}
          initialData={previewMedicalFacilitiesDirectoryData}
          disableLiveFetch
        />
      )}
    </BlockSurface>
  );
}

function MedicalFacilityProfileEditorPreview({
  block,
}: {
  block: BlockInstance<"medicalFacilityProfile">;
}) {
  return (
    <BlockSurface
      block={block}
      container={false}
      className="overflow-visible bg-background"
      defaultPadding={{ top: "0rem", bottom: "0rem" }}
    >
      {() => (
        <MedicalFacilityProfileClient
          block={block}
          slug={previewMedicalFacilityDetail.provider.slug}
          initialData={previewMedicalFacilityDetail}
          disableLiveFetch
        />
      )}
    </BlockSurface>
  );
}

export function BlockPreviewRenderer({
  blocks,
  className,
  disableAnimations,
  locale = "en",
  pageSlug,
  authToken,
}: {
  blocks: unknown;
  className?: string;
  disableAnimations?: boolean;
  locale?: PublicLocale;
  pageSlug?: string;
  authToken?: string;
}) {
  const parsedBlocks = useMemo(() => ensureBlockInstances(blocks), [blocks]);
  const needsBlogPreviewData = parsedBlocks.some((block) =>
    BLOG_PREVIEW_BLOCK_TYPES.has(block.type),
  );
  const blogPreview = useCmsBlogPreviewData({
    pageSlug,
    locale,
    authToken,
    enabled: needsBlogPreviewData,
  });
  const blogContext = blogPreview.data?.blogContext
    ? { blog: blogPreview.data.blogContext }
    : undefined;
  const blogPreviewFallbackDescription = blogPreview.loading
    ? "Fetching sample editorial content for this block."
    : "Open the page-level preview to render this block with live editorial content.";

  if (!parsedBlocks.length) return null;

  return (
    <>
      <div className={cn("flex flex-col", className)}>
        {parsedBlocks.map((block) => {
          const blockKey = getBlockKey(block);
          switch (block.type) {
            case "hero":
              return <HeroBlock key={blockKey} block={block} locale={locale} />;
            case "homeHero":
              return (
                <HomeHeroBlock key={blockKey} block={block} locale={locale} />
              );
            case "aboutHero":
              return (
                <AboutHeroBlock key={blockKey} block={block} locale={locale} />
              );
            case "featuredTreatmentsHome":
              return (
                <FeaturedTreatmentsHomePreview key={blockKey} block={block} />
              );
            case "journeySteps":
              return (
                <JourneyStepsBlock
                  key={blockKey}
                  block={block}
                  locale={locale}
                />
              );
            case "differentiators":
              return (
                <DifferentiatorsBlock
                  key={blockKey}
                  block={block}
                  locale={locale}
                />
              );
            case "homeCta":
              return (
                <HomeCtaBlock key={blockKey} block={block} locale={locale} />
              );
            case "storyNarrative":
              return (
                <StoryNarrativeBlock
                  key={blockKey}
                  block={block}
                  locale={locale}
                />
              );
            case "missionVisionValues":
              return <MissionVisionValuesBlock key={blockKey} block={block} />;
            case "trustSignals":
              return (
                <TrustSignalsBlock
                  key={blockKey}
                  block={block}
                  locale={locale}
                />
              );
            case "leadershipGrid":
              return (
                <LeadershipGridBlock
                  key={blockKey}
                  block={block}
                  locale={locale}
                />
              );
            case "statGrid":
              return (
                <StatGridBlock key={blockKey} block={block} locale={locale} />
              );
            case "advisoryNotice":
              return (
                <AdvisoryNoticeBlock
                  key={blockKey}
                  block={block}
                  locale={locale}
                />
              );
            case "richText":
              return (
                <RichTextBlock key={blockKey} block={block} locale={locale} />
              );
            case "imageFeature":
              return (
                <ImageFeatureBlock
                  key={blockKey}
                  block={block}
                  locale={locale}
                />
              );
            case "featureGrid":
              return (
                <FeatureGridBlockPreview
                  key={blockKey}
                  block={block}
                  locale={locale}
                />
              );
            case "dataGrid":
              return (
                <DataGridBlock key={blockKey} block={block} locale={locale} />
              );
            case "infoPanels":
              return (
                <InfoPanelsBlock key={blockKey} block={block} locale={locale} />
              );
            case "hotelShowcase":
              return (
                <HotelShowcaseBlock
                  key={blockKey}
                  block={block}
                  locale={locale}
                />
              );
            case "serviceCatalog":
              return (
                <ServiceCatalogBlock
                  key={blockKey}
                  block={block}
                  locale={locale}
                />
              );
            case "logoGrid":
              return <LogoGridBlock key={blockKey} block={block} />;
            case "callToAction":
              return (
                <CallToActionBlock
                  key={blockKey}
                  block={block}
                  locale={locale}
                />
              );
            case "startJourneyEmbed":
              return <StartJourneyEmbedBlock key={blockKey} block={block} />;
            case "contactFormEmbed":
              return (
                <ContactFormEmbedBlockPreview
                  key={blockKey}
                  block={block}
                  locale={locale}
                />
              );
            case "faq":
              return <FaqBlock key={blockKey} block={block} />;
            case "faqDirectory":
              return (
                <FaqDirectoryEditorPreview
                  key={blockKey}
                  block={block}
                  locale={locale}
                />
              );
            case "medicalFacilitiesDirectory":
              return (
                <MedicalFacilitiesDirectoryEditorPreview
                  key={blockKey}
                  block={block}
                />
              );
            case "quote":
              return <QuoteBlock key={blockKey} block={block} />;
            case "medicalFacilityProfile":
              return (
                <MedicalFacilityProfileEditorPreview
                  key={blockKey}
                  block={block}
                />
              );
            case "treatmentSpecialties":
              return (
                <TreatmentSpecialtiesPreview key={blockKey} block={block} />
              );
            case "treatments":
              return <TreatmentsBlockPreview key={blockKey} block={block} />;
            case "doctors":
              return <DoctorsBlockPreview key={blockKey} block={block} />;
            case "tabbedGuide":
              return (
                <TabbedGuidePreview
                  key={blockKey}
                  block={block as BlockInstance<"tabbedGuide">}
                  locale={locale}
                />
              );
            case "blogPostFeed":
              if (blogPreview.loading) {
                return (
                  <Placeholder
                    key={blockKey}
                    title="Loading blog preview"
                    description="Fetching sample editorial content for this block."
                  />
                );
              }

              if (blogPreview.error || !blogPreview.data) {
                return (
                  <Placeholder
                    key={blockKey}
                    title="Blog preview unavailable"
                    description={
                      blogPreview.error ??
                      "Open the page-level preview to render this block with live editorial data."
                    }
                  />
                );
              }

              return (
                <BlogPostFeedContent
                  key={blockKey}
                  block={block}
                  posts={selectPreviewBlogPostFeedItems({
                    block,
                    context: blogContext,
                    posts: blogPreview.data.posts,
                  })}
                  context={blogContext}
                  locale={locale}
                />
              );
            case "blogTaxonomyGrid":
              if (blogPreview.loading) {
                return (
                  <Placeholder
                    key={blockKey}
                    title="Loading taxonomy preview"
                    description="Fetching sample archive data for this block."
                  />
                );
              }

              if (blogPreview.error || !blogPreview.data) {
                return (
                  <Placeholder
                    key={blockKey}
                    title="Taxonomy preview unavailable"
                    description={
                      blogPreview.error ??
                      "Open the page-level preview to render this block with live editorial data."
                    }
                  />
                );
              }

              return (
                <BlogTaxonomyGridContent
                  key={blockKey}
                  block={block}
                  items={selectPreviewBlogTaxonomyItems({
                    block,
                    items: blogPreview.data.taxonomy,
                  })}
                  locale={locale}
                />
              );
            case "blogArticleHero":
              return blogContext ? (
                <BlogArticleHeroBlock
                  key={blockKey}
                  block={block}
                  context={blogContext}
                  locale={locale}
                />
              ) : (
                <Placeholder
                  key={blockKey}
                  title="Blog Article Hero"
                  description={blogPreviewFallbackDescription}
                />
              );
            case "blogArticleBody":
              return blogContext ? (
                <BlogArticleBodyBlock
                  key={blockKey}
                  block={block}
                  context={blogContext}
                  locale={locale}
                />
              ) : (
                <Placeholder
                  key={blockKey}
                  title="Blog Article Body"
                  description={blogPreviewFallbackDescription}
                />
              );
            case "blogAuthorSummary":
              return blogContext ? (
                <BlogAuthorSummaryBlock
                  key={blockKey}
                  block={block}
                  context={blogContext}
                  locale={locale}
                />
              ) : (
                <Placeholder
                  key={blockKey}
                  title="Blog Author Summary"
                  description={blogPreviewFallbackDescription}
                />
              );
            default:
              return (
                <pre
                  key={blockKey}
                  className="max-w-full overflow-auto rounded border border-dashed border-border/60 bg-muted/10 p-4 text-xs text-muted-foreground"
                >
                  {JSON.stringify(block, null, 2)}
                </pre>
              );
          }
        })}
      </div>
      {disableAnimations ? null : <AnimationController />}
    </>
  );
}

export default BlockPreviewRenderer;
