import type { PublicLocale } from "@/i18n/routing";
import type { BlogBlockContextEntity } from "@/lib/blog/server";
import type { BlockInstance } from "@/lib/cms/blocks";
import { normalizeBlocks } from "@/lib/cms/blocks";
import type {
  MedicalFacilitiesDirectoryResponse,
  MedicalFacilityDetail,
} from "@/lib/medical-facilities";
import { cn } from "@/lib/utils";
import { AnimationController } from "./AnimationController";
import {
  HeroBlock,
  HomeHeroBlock,
  AboutHeroBlock,
  FeaturedTreatmentsHomeBlock,
  JourneyStepsBlock,
  DifferentiatorsBlock,
  HomeCtaBlock,
  StoryNarrativeBlock,
  MissionVisionValuesBlock,
  TrustSignalsBlock,
  LeadershipGridBlock,
  StatGridBlock,
  AdvisoryNoticeBlock,
  RichTextBlock,
  ImageFeatureBlock,
  FeatureGridBlock,
  DataGridBlock,
  InfoPanelsBlock,
  HotelShowcaseBlock,
  ServiceCatalogBlock,
  LogoGridBlock,
  CallToActionBlock,
  StartJourneyEmbedBlock,
  ContactFormEmbedBlock,
  FaqBlock,
  FaqDirectoryBlock,
  MedicalFacilitiesDirectoryBlock,
  QuoteBlock,
  MedicalFacilityProfileBlock,
  TreatmentSpecialtiesBlock,
  TreatmentsBlock,
  DoctorsBlock,
  TabbedGuideBlock,
  BlogPostFeedBlock,
  BlogTaxonomyGridBlock,
  BlogArticleHeroBlock,
  BlogArticleBodyBlock,
  BlogAuthorSummaryBlock,
} from "./blocks";

export type CmsBlockRenderContext = {
  medicalFacilitiesDirectoryData?: MedicalFacilitiesDirectoryResponse | null;
  medicalFacility?: MedicalFacilityDetail | null;
  medicalFacilitySlug?: string;
  blog?: BlogBlockContextEntity | null;
};

interface BlockRendererProps {
  blocks: unknown;
  className?: string;
  context?: CmsBlockRenderContext;
  locale?: PublicLocale;
}

export function BlockRenderer({
  blocks,
  className,
  context,
  locale = "en",
}: BlockRendererProps) {
  const parsedBlocks = normalizeBlocks(blocks);

  if (!parsedBlocks.length) return null;

  return (
    <>
      <div className={cn("flex flex-col", className)}>
        {parsedBlocks.map((block: BlockInstance) => {
          const key = block.blockId;
          switch (block.type) {
            case "hero":
              return <HeroBlock key={key} block={block} />;
            case "homeHero":
              return <HomeHeroBlock key={key} block={block} locale={locale} />;
            case "aboutHero":
              return <AboutHeroBlock key={key} block={block} locale={locale} />;
            case "featuredTreatmentsHome":
              return <FeaturedTreatmentsHomeBlock key={key} block={block} />;
            case "journeySteps":
              return (
                <JourneyStepsBlock key={key} block={block} locale={locale} />
              );
            case "differentiators":
              return (
                <DifferentiatorsBlock key={key} block={block} locale={locale} />
              );
            case "homeCta":
              return <HomeCtaBlock key={key} block={block} locale={locale} />;
            case "storyNarrative":
              return (
                <StoryNarrativeBlock key={key} block={block} locale={locale} />
              );
            case "missionVisionValues":
              return <MissionVisionValuesBlock key={key} block={block} />;
            case "trustSignals":
              return (
                <TrustSignalsBlock key={key} block={block} locale={locale} />
              );
            case "leadershipGrid":
              return (
                <LeadershipGridBlock key={key} block={block} locale={locale} />
              );
            case "statGrid":
              return <StatGridBlock key={key} block={block} locale={locale} />;
            case "advisoryNotice":
              return (
                <AdvisoryNoticeBlock key={key} block={block} locale={locale} />
              );
            case "richText":
              return <RichTextBlock key={key} block={block} />;
            case "imageFeature":
              return <ImageFeatureBlock key={key} block={block} />;
            case "featureGrid":
              return (
                <FeatureGridBlock key={key} block={block} locale={locale} />
              );
            case "dataGrid":
              return <DataGridBlock key={key} block={block} locale={locale} />;
            case "infoPanels":
              return (
                <InfoPanelsBlock key={key} block={block} locale={locale} />
              );
            case "hotelShowcase":
              return (
                <HotelShowcaseBlock key={key} block={block} locale={locale} />
              );
            case "serviceCatalog":
              return (
                <ServiceCatalogBlock key={key} block={block} locale={locale} />
              );
            case "logoGrid":
              return <LogoGridBlock key={key} block={block} />;
            case "callToAction":
              return <CallToActionBlock key={key} block={block} />;
            case "startJourneyEmbed":
              return <StartJourneyEmbedBlock key={key} block={block} />;
            case "contactFormEmbed":
              return (
                <ContactFormEmbedBlock
                  key={key}
                  block={block}
                  locale={locale}
                />
              );
            case "faq":
              return <FaqBlock key={key} block={block} />;
            case "faqDirectory":
              return <FaqDirectoryBlock key={key} block={block} />;
            case "medicalFacilitiesDirectory":
              return (
                <MedicalFacilitiesDirectoryBlock
                  key={key}
                  block={block}
                  context={context}
                />
              );
            case "quote":
              return <QuoteBlock key={key} block={block} />;
            case "medicalFacilityProfile":
              return (
                <MedicalFacilityProfileBlock
                  key={key}
                  block={block}
                  context={context}
                />
              );
            case "treatmentSpecialties":
              return <TreatmentSpecialtiesBlock key={key} block={block} />;
            case "treatments":
              return <TreatmentsBlock key={key} block={block} />;
            case "doctors":
              return <DoctorsBlock key={key} block={block} />;
            case "tabbedGuide":
              return <TabbedGuideBlock key={key} block={block} />;
            case "blogPostFeed":
              return (
                <BlogPostFeedBlock
                  key={key}
                  block={block}
                  context={context}
                  locale={locale}
                />
              );
            case "blogTaxonomyGrid":
              return (
                <BlogTaxonomyGridBlock
                  key={key}
                  block={block}
                  locale={locale}
                />
              );
            case "blogArticleHero":
              return (
                <BlogArticleHeroBlock
                  key={key}
                  block={block}
                  context={context}
                  locale={locale}
                />
              );
            case "blogArticleBody":
              return (
                <BlogArticleBodyBlock
                  key={key}
                  block={block}
                  context={context}
                  locale={locale}
                />
              );
            case "blogAuthorSummary":
              return (
                <BlogAuthorSummaryBlock
                  key={key}
                  block={block}
                  context={context}
                  locale={locale}
                />
              );
            default:
              return (
                <pre
                  key={key}
                  className="max-w-full overflow-auto rounded border border-dashed border-destructive bg-destructive/10 p-4 text-xs text-destructive"
                >
                  {JSON.stringify(block, null, 2)}
                </pre>
              );
          }
        })}
      </div>
      <AnimationController />
    </>
  );
}

export default BlockRenderer;
