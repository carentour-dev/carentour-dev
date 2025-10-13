import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { BlockInstance, BlockValue } from "@/lib/cms/blocks";
import { getDoctorsForBlock } from "@/lib/cms/server";
import { BlockSurface } from "./BlockSurface";
import { getFirstDefinedResponsiveValue } from "./styleUtils";
import { cn } from "@/lib/utils";

const initials = (name: string) =>
  name
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();

export async function DoctorsBlock({
  block,
}: {
  block: BlockInstance<"doctors">;
}) {
  const doctors = await getDoctorsForBlock(block);

  if (!doctors.length) {
    return null;
  }

  const layoutClass =
    block.layout === "carousel"
      ? "flex gap-4 overflow-x-auto pb-4"
      : "grid gap-6 md:grid-cols-2 xl:grid-cols-3";
  const styleAlignValue = getFirstDefinedResponsiveValue(
    block.style?.layout?.horizontalAlign,
  );
  const headerAlignClass = (() => {
    switch (styleAlignValue) {
      case "center":
        return "text-center";
      case "end":
        return "text-right ml-auto";
      case "start":
        return "text-left";
      default:
        return "text-left";
    }
  })();

  return (
    <BlockSurface
      block={block}
      defaultPadding={{ top: "4rem", bottom: "4rem" }}
      contentClassName="space-y-10"
    >
      {() => (
        <>
          <div
            className={cn(
              "max-w-3xl",
              headerAlignClass,
              headerAlignClass.includes("ml-auto") ? "ml-auto" : undefined,
            )}
          >
            <Badge
              variant="outline"
              className={cn(
                "text-xs uppercase tracking-wide",
                headerAlignClass.includes("text-right")
                  ? "ml-auto"
                  : headerAlignClass.includes("text-center")
                    ? "mx-auto"
                    : "",
              )}
            >
              Doctors
            </Badge>
            {block.title ? (
              <h2
                className={cn(
                  "mt-4 text-3xl font-semibold text-foreground",
                  headerAlignClass.includes("text-right")
                    ? "text-right"
                    : headerAlignClass.includes("text-center")
                      ? "text-center"
                      : "text-left",
                )}
              >
                {block.title}
              </h2>
            ) : null}
            {block.description ? (
              <p
                className={cn(
                  "mt-2 text-muted-foreground",
                  headerAlignClass.includes("text-right")
                    ? "text-right"
                    : headerAlignClass.includes("text-center")
                      ? "text-center"
                      : "text-left",
                )}
              >
                {block.description}
              </p>
            ) : null}
          </div>

          <div className={layoutClass}>
            {doctors.map((doctor) => (
              <Card
                key={doctor.id}
                className="min-w-[260px] border-border/60 bg-card/90 shadow-sm hover:shadow-card-hover"
              >
                <CardHeader className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 border border-primary/30">
                    <AvatarImage
                      src={doctor.avatar_url ?? undefined}
                      alt={doctor.name}
                    />
                    <AvatarFallback>{initials(doctor.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg text-foreground">
                      {doctor.name}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {doctor.title}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {doctor.specialization}
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-4">
                    {typeof doctor.patient_rating === "number" ? (
                      <div>
                        <span className="font-semibold text-foreground">
                          {doctor.patient_rating.toFixed(1)}
                        </span>
                        <span className="ml-1">rating</span>
                      </div>
                    ) : null}
                    {typeof doctor.total_reviews === "number" ? (
                      <div>{doctor.total_reviews}+ reviews</div>
                    ) : null}
                    {typeof doctor.successful_procedures === "number" ? (
                      <div>{doctor.successful_procedures}+ procedures</div>
                    ) : null}
                  </div>
                  {doctor.languages && doctor.languages.length ? (
                    <div className="flex flex-wrap gap-1">
                      {doctor.languages.slice(0, 4).map((language) => (
                        <Badge
                          key={language}
                          variant="outline"
                          className="text-[11px]"
                        >
                          {language}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                  <div className="flex gap-2 pt-2">
                    <Button asChild size="sm" className="flex-1">
                      <Link href={`/doctors/${doctor.id}`}>View profile</Link>
                    </Button>
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="flex-1"
                    >
                      <Link href={`/start-journey?doctor=${doctor.id}`}>
                        Book consult
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </BlockSurface>
  );
}
