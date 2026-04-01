import type { PublicLocale } from "@/i18n/routing";
import type { BlockInstance } from "@/lib/cms/blocks";
import { JourneyStepsSection } from "@/components/home";

export function JourneyStepsBlock({
  block,
  locale = "en",
}: {
  block: BlockInstance<"journeySteps">;
  locale?: PublicLocale;
}) {
  const steps = block.steps.map((step) => ({
    title: step.title ?? "",
    description: step.description ?? "",
    icon: step.icon ?? "",
  }));

  return (
    <JourneyStepsSection
      title={block.title}
      highlight={block.highlight}
      description={block.description}
      steps={steps}
      locale={locale}
    />
  );
}
