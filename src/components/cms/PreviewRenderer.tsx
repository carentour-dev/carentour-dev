"use client";

import type { PublicLocale } from "@/i18n/routing";
import type { BlockInstance } from "@/lib/cms/blocks";
import { blockRegistry, normalizeBlocks } from "@/lib/cms/blocks";
import { cn } from "@/lib/utils";
import { AnimationController } from "./AnimationController";
import { CallToActionBlock } from "./blocks/CallToActionBlock";
import { ContactFormEmbedBlockPreview } from "./blocks/ContactFormEmbedBlockContent";
import { DifferentiatorsBlock } from "./blocks/DifferentiatorsBlock";
import { FeaturedTreatmentsHomePreview } from "./blocks/FeaturedTreatmentsHomePreview";
import { FeatureGridBlockPreview } from "./blocks/FeatureGridBlockContent";
import { DataGridBlock } from "./blocks/DataGridBlock";
import { FaqBlock } from "./blocks/FaqBlock";
import { FaqDirectoryPreview } from "./blocks/FaqDirectoryPreview";
import { MedicalFacilitiesDirectoryPreview } from "./blocks/MedicalFacilitiesDirectoryPreview";
import { LeadershipGridBlock } from "./blocks/LeadershipGridBlock";
import { HeroBlock } from "./blocks/HeroBlock";
import { HomeCtaBlock } from "./blocks/HomeCtaBlock";
import { HomeHeroBlock } from "./blocks/HomeHeroBlock";
import { ImageFeatureBlock } from "./blocks/ImageFeatureBlock";
import { JourneyStepsBlock } from "./blocks/JourneyStepsBlock";
import { LogoGridBlock } from "./blocks/LogoGridBlock";
import { AboutHeroBlock } from "./blocks/AboutHeroBlock";
import { MissionVisionValuesBlock } from "./blocks/MissionVisionValuesBlock";
import { QuoteBlock } from "./blocks/QuoteBlock";
import { MedicalFacilityProfilePreview } from "./blocks/MedicalFacilityProfilePreview";
import { RichTextBlock } from "./blocks/RichTextBlock";
import { HotelShowcaseBlock } from "./blocks/HotelShowcaseBlock";
import { InfoPanelsBlock } from "./blocks/InfoPanelsBlock";
import { ServiceCatalogBlock } from "./blocks/ServiceCatalogBlock";
import { StatGridBlock } from "./blocks/StatGridBlock";
import { AdvisoryNoticeBlock } from "./blocks/AdvisoryNoticeBlock";
import { StoryNarrativeBlock } from "./blocks/StoryNarrativeBlock";
import { TabbedGuidePreview } from "./blocks/TabbedGuidePreview";
import { TreatmentSpecialtiesPreview } from "./blocks/TreatmentSpecialtiesPreview";
import { TrustSignalsBlock } from "./blocks/TrustSignalsBlock";
import { StartJourneyEmbedBlock } from "./blocks/StartJourneyEmbedBlock";

function Placeholder({ title }: { title: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border/50 bg-muted/20 p-6 text-sm text-muted-foreground">
      {title} preview available on published page.
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

export function BlockPreviewRenderer({
  blocks,
  className,
  disableAnimations,
  locale = "en",
}: {
  blocks: unknown;
  className?: string;
  disableAnimations?: boolean;
  locale?: PublicLocale;
}) {
  const parsedBlocks = ensureBlockInstances(blocks);

  if (!parsedBlocks.length) return null;

  return (
    <>
      <div className={cn("flex flex-col", className)}>
        {parsedBlocks.map((block) => {
          const blockKey = getBlockKey(block);
          switch (block.type) {
            case "hero":
              return <HeroBlock key={blockKey} block={block} />;
            case "homeHero":
              return <HomeHeroBlock key={blockKey} block={block} />;
            case "aboutHero":
              return <AboutHeroBlock key={blockKey} block={block} />;
            case "featuredTreatmentsHome":
              return (
                <FeaturedTreatmentsHomePreview key={blockKey} block={block} />
              );
            case "journeySteps":
              return <JourneyStepsBlock key={blockKey} block={block} />;
            case "differentiators":
              return <DifferentiatorsBlock key={blockKey} block={block} />;
            case "homeCta":
              return <HomeCtaBlock key={blockKey} block={block} />;
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
              return <LeadershipGridBlock key={blockKey} block={block} />;
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
              return <RichTextBlock key={blockKey} block={block} />;
            case "imageFeature":
              return <ImageFeatureBlock key={blockKey} block={block} />;
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
              return <CallToActionBlock key={blockKey} block={block} />;
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
              return <FaqDirectoryPreview key={blockKey} block={block} />;
            case "medicalFacilitiesDirectory":
              return (
                <MedicalFacilitiesDirectoryPreview
                  key={blockKey}
                  block={block}
                />
              );
            case "quote":
              return <QuoteBlock key={blockKey} block={block} />;
            case "medicalFacilityProfile":
              return (
                <MedicalFacilityProfilePreview key={blockKey} block={block} />
              );
            case "treatmentSpecialties":
              return (
                <TreatmentSpecialtiesPreview key={blockKey} block={block} />
              );
            case "treatments":
              return <Placeholder key={blockKey} title="Treatments" />;
            case "doctors":
              return <Placeholder key={blockKey} title="Doctors" />;
            case "tabbedGuide":
              return (
                <TabbedGuidePreview
                  key={blockKey}
                  block={block as BlockInstance<"tabbedGuide">}
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
