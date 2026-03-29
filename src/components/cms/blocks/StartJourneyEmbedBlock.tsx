import type { BlockInstance } from "@/lib/cms/blocks";
import { StartJourneyWizard } from "@/components/start-journey/StartJourneyWizard";
import { BlockSurface } from "./BlockSurface";

export function StartJourneyEmbedBlock({
  block,
}: {
  block: BlockInstance<"startJourneyEmbed">;
}) {
  return (
    <BlockSurface
      block={block}
      className="border-y border-border/50 bg-background dark:border-[hsl(var(--editorial-ink-foreground)/0.08)] dark:bg-[hsl(var(--editorial-ink))]"
      defaultPadding={{ top: "5rem", bottom: "5rem" }}
      contentClassName="space-y-8"
    >
      {() => (
        <div className="mx-auto max-w-6xl rounded-[2rem] border border-border/60 bg-background/70 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur dark:border-[hsl(var(--editorial-ink-foreground)/0.12)] dark:bg-[hsl(var(--editorial-ink-soft)/0.94)] dark:shadow-[0_20px_60px_rgba(15,23,42,0.18)] md:p-8">
          <StartJourneyWizard
            mode="embedded"
            introEyebrow={block.eyebrow}
            introHeading={block.heading}
            introDescription={block.description}
            supportCardTitle={block.supportCardTitle}
            supportCardDescription={block.supportCardDescription}
            supportBullets={block.supportBullets}
            responseTimeLabel={block.responseTimeLabel}
            reassuranceLabel={block.reassuranceLabel}
            successRedirectHref={block.successRedirectHref ?? null}
          />
        </div>
      )}
    </BlockSurface>
  );
}
