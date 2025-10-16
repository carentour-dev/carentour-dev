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
import type { BlockInstance } from "@/lib/cms/blocks";
import { getTreatmentsForBlock } from "@/lib/cms/server";
import { selectPrimaryProcedure } from "@/lib/treatments";
import { BlockSurface } from "./BlockSurface";
import { getFirstDefinedResponsiveValue } from "./styleUtils";
import { cn } from "@/lib/utils";

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

export async function TreatmentsBlock({
  block,
}: {
  block: BlockInstance<"treatments">;
}) {
  const treatments = await getTreatmentsForBlock(block);

  if (!treatments.length) {
    return null;
  }

  const isCarousel = block.layout === "carousel";
  const shouldCenterStatic = isCarousel && treatments.length <= 3;
  const layoutClass = shouldCenterStatic
    ? "flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden md:gap-6 md:overflow-visible md:snap-none md:justify-center"
    : isCarousel
      ? "flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden"
      : "grid gap-6 md:grid-cols-2 xl:grid-cols-3";
  const layoutStyle =
    !shouldCenterStatic && isCarousel
      ? ({ scrollPaddingLeft: "1rem", scrollPaddingRight: "1rem" } as const)
      : undefined;
  const edgeSpacerClass =
    !shouldCenterStatic && isCarousel ? "flex-none w-4 sm:w-6" : undefined;
  const cardOuterClass = isCarousel
    ? "snap-start flex-none w-[280px] sm:w-[320px] lg:w-[360px]"
    : undefined;
  const styleAlignValue = getFirstDefinedResponsiveValue(
    block.style?.layout?.horizontalAlign,
  );
  const resolvedAlign = styleAlignValue ?? "center";
  const headerContainerClass = cn(
    "max-w-3xl",
    resolvedAlign === "center" && "mx-auto text-center",
    resolvedAlign === "end" && "ml-auto text-right",
    resolvedAlign === "start" && "text-left",
  );
  const labelAlignmentClass =
    resolvedAlign === "end"
      ? "justify-end"
      : resolvedAlign === "center"
        ? "justify-center"
        : "justify-start";
  const textAlignClass =
    resolvedAlign === "end"
      ? "text-right"
      : resolvedAlign === "center"
        ? "text-center"
        : "text-left";
  const layoutAlignmentClass = isCarousel
    ? shouldCenterStatic
      ? "md:justify-center"
      : undefined
    : resolvedAlign === "end"
      ? "justify-items-end"
      : resolvedAlign === "center"
        ? "justify-items-center"
        : "justify-items-start";
  const layoutPositionClass = !isCarousel
    ? resolvedAlign === "end"
      ? "ml-auto"
      : resolvedAlign === "center"
        ? "mx-auto"
        : undefined
    : undefined;

  return (
    <BlockSurface
      block={block}
      defaultPadding={{ top: "4rem", bottom: "4rem" }}
      containerClassName={
        resolvedAlign === "end"
          ? "ml-auto"
          : resolvedAlign === "center"
            ? "mx-auto"
            : undefined
      }
      contentClassName="space-y-10"
    >
      {() => (
        <>
          <div className={headerContainerClass}>
            <div
              className={cn(
                "flex items-center gap-2 text-sm text-primary",
                labelAlignmentClass,
              )}
            >
              <Badge variant="outline">Treatments</Badge>
            </div>
            {block.title ? (
              <h2
                className={cn(
                  "mt-4 text-3xl font-semibold text-foreground",
                  textAlignClass,
                )}
              >
                {block.title}
              </h2>
            ) : null}
            {block.description ? (
              <p className={cn("mt-2 text-muted-foreground", textAlignClass)}>
                {block.description}
              </p>
            ) : null}
          </div>

          <div
            className={cn(
              layoutClass,
              layoutAlignmentClass,
              layoutPositionClass,
            )}
            style={layoutStyle}
          >
            {edgeSpacerClass ? (
              <div className={edgeSpacerClass} aria-hidden />
            ) : null}
            {treatments.map((treatment) => {
              const primaryProcedure = selectPrimaryProcedure(
                treatment.procedures,
              );
              const stay = formatDuration(treatment.durationDays);
              const recovery = formatDuration(treatment.recoveryTimeDays);
              let durationLabel =
                primaryProcedure?.duration ?? "Personalized itinerary";
              if (stay && recovery) {
                durationLabel = `${stay} • ${recovery}`;
              } else if (stay) {
                durationLabel = stay;
              } else if (recovery) {
                durationLabel = recovery;
              }

              const priceCandidate =
                typeof treatment.basePrice === "number"
                  ? treatment.basePrice
                  : (primaryProcedure?.egyptPrice ?? null);
              const priceLabel =
                typeof priceCandidate === "number"
                  ? `From ${formatCurrency(priceCandidate, treatment.currency)}`
                  : "Custom pricing";

              return (
                <Card
                  key={treatment.id}
                  className={cn(
                    "border-border/60 bg-card/90 shadow-sm transition hover:shadow-card-hover",
                    cardOuterClass,
                  )}
                >
                  <CardHeader>
                    <CardTitle className="text-xl text-foreground">
                      {treatment.name}
                    </CardTitle>
                    {treatment.category ? (
                      <Badge
                        variant="secondary"
                        className="w-fit text-xs capitalize"
                      >
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
                    {primaryProcedure?.successRate ? (
                      <div className="flex items-center justify-between text-xs">
                        <span>Success rate</span>
                        <span className="text-foreground">
                          {primaryProcedure.successRate}
                        </span>
                      </div>
                    ) : null}
                    <div className="flex items-center justify-between text-xs">
                      <span>Investment</span>
                      <span className="text-foreground">{priceLabel}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button asChild size="sm" className="flex-1">
                        <Link href={`/treatments/${treatment.slug}`}>
                          View treatment
                        </Link>
                      </Button>
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="flex-1"
                      >
                        <Link
                          href={`/start-journey?treatment=${treatment.slug}`}
                        >
                          Plan journey
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {edgeSpacerClass ? (
              <div className={edgeSpacerClass} aria-hidden />
            ) : null}
          </div>
        </>
      )}
    </BlockSurface>
  );
}
