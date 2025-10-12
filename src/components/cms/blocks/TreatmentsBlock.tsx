import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { BlockValue } from "@/lib/cms/blocks";
import { getTreatmentsForBlock } from "@/lib/cms/server";
import { getPrimaryProcedure } from "@/lib/treatments";

const formatCurrency = (value: number, currency?: string | null) => {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 0,
    }).format(value);
  } catch (error) {
    return `$${value.toLocaleString()}`;
  }
};

const formatDuration = (duration?: number | null) => {
  if (typeof duration === "number" && Number.isFinite(duration)) {
    return `${duration} day${duration === 1 ? "" : "s"}`;
  }
  return null;
};

export async function TreatmentsBlock({ block }: { block: BlockValue<"treatments"> }) {
  const treatments = await getTreatmentsForBlock(block);

  if (!treatments.length) {
    return null;
  }

  const layoutClass =
    block.layout === "carousel"
      ? "flex gap-4 overflow-x-auto pb-4"
      : "grid gap-6 md:grid-cols-2 xl:grid-cols-3";

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="mb-10 max-w-3xl">
          <div className="flex items-center gap-2 text-sm text-primary">
            <Badge variant="outline">Treatments</Badge>
          </div>
          {block.title ? <h2 className="mt-4 text-3xl font-semibold text-foreground">{block.title}</h2> : null}
          {block.description ? <p className="mt-2 text-muted-foreground">{block.description}</p> : null}
        </div>

        <div className={layoutClass}>
          {treatments.map((treatment) => {
            const primaryProcedure = getPrimaryProcedure(treatment.procedures);
            const stay = formatDuration(treatment.duration_days);
            const recovery = formatDuration(treatment.recovery_time_days);
            let durationLabel = primaryProcedure?.duration ?? "Personalized itinerary";
            if (stay && recovery) {
              durationLabel = `${stay} • ${recovery}`;
            } else if (stay) {
              durationLabel = stay;
            } else if (recovery) {
              durationLabel = recovery;
            }

            const priceCandidate =
              typeof treatment.base_price === "number"
                ? treatment.base_price
                : primaryProcedure?.egyptPrice ?? null;
            const priceLabel =
              typeof priceCandidate === "number"
                ? `From ${formatCurrency(priceCandidate, treatment.currency)}`
                : "Custom pricing";

            return (
              <Card
                key={treatment.id}
                className="border-border/60 bg-card/90 shadow-sm transition hover:shadow-card-hover"
              >
                <CardHeader>
                  <CardTitle className="text-xl text-foreground">{treatment.name}</CardTitle>
                  {treatment.category ? (
                    <Badge variant="secondary" className="w-fit text-xs capitalize">
                      {treatment.category}
                    </Badge>
                  ) : null}
                  <CardDescription className="text-sm text-muted-foreground">
                    {treatment.summary ??
                      treatment.description ??
                      "World-class medical care coordinated by our operations team."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-muted-foreground">
                  <div className="flex items-center justify-between text-xs">
                    <span>Itinerary</span>
                    <span className="text-foreground">{durationLabel}</span>
                  </div>
                  {primaryProcedure?.success_rate ? (
                    <div className="flex items-center justify-between text-xs">
                      <span>Success rate</span>
                      <span className="text-foreground">{primaryProcedure.success_rate}</span>
                    </div>
                  ) : null}
                  <div className="flex items-center justify-between text-xs">
                    <span>Investment</span>
                    <span className="text-foreground">{priceLabel}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button asChild size="sm" className="flex-1">
                      <Link href={`/treatments/${treatment.slug}`}>View treatment</Link>
                    </Button>
                    <Button asChild size="sm" variant="outline" className="flex-1">
                      <Link href={`/start-journey?treatment=${treatment.slug}`}>Plan journey</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
