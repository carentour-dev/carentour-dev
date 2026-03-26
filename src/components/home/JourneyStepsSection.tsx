import { Card, CardContent } from "@/components/ui/card";
import { resolveIcon } from "@/lib/icons";
import type { JourneyStep } from "./content";

export function JourneyStepsSection({
  title = "Your Journey to",
  highlight = "Better Health",
  description = "A seamless, step-by-step process designed to make your medical tourism experience stress-free",
  steps,
}: {
  title?: string;
  highlight?: string;
  description?: string;
  steps: JourneyStep[];
}) {
  return (
    <section className="bg-background py-20">
      <div className="container mx-auto px-4">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-bold text-foreground md:text-5xl">
            {title} <span className="text-primary">{highlight}</span>
          </h2>
          <p className="mx-auto max-w-2xl text-xl text-muted-foreground">
            {description}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {steps.map((step, index) => {
            const Icon = resolveIcon(step.icon);

            return (
              <Card
                key={`${step.title}-${index}`}
                className="group relative overflow-visible border-border/50 transition-spring hover:shadow-card-hover"
              >
                <div className="absolute -left-4 -top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {index + 1}
                </div>

                <CardContent className="p-8 text-center">
                  <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary-light transition-spring group-hover:scale-110">
                    {Icon ? <Icon className="h-8 w-8 text-primary" /> : null}
                  </div>

                  <h3 className="mb-3 text-xl font-semibold text-foreground">
                    {step.title}
                  </h3>

                  <p className="leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
