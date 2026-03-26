import type { BlockInstance } from "@/lib/cms/blocks";
import { JourneyStepsSection } from "@/components/home";

export function JourneyStepsBlock({
  block,
}: {
  block: BlockInstance<"journeySteps">;
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
    />
  );
}
