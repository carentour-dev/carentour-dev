import Link from "next/link";

import type { PublicLocale } from "@/i18n/routing";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { BlockInstance } from "@/lib/cms/blocks";
import {
  localizePublicPathname,
  localizePublicPathnameWithFallback,
} from "@/lib/public/routing";
import { cn } from "@/lib/utils";

import { BlockSurface } from "./BlockSurface";
import { getFirstDefinedResponsiveValue } from "./styleUtils";

export type DoctorBlockItem = {
  id: string;
  name: string;
  title: string;
  specialization: string;
  languages?: string[] | null;
  avatar_url?: string | null;
  patient_rating?: number | null;
  total_reviews?: number | null;
  successful_procedures?: number | null;
};

const initials = (name: string) =>
  name
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();

export function DoctorsBlockContent({
  block,
  doctors,
  locale = "en",
}: {
  block: BlockInstance<"doctors">;
  doctors: DoctorBlockItem[];
  locale?: PublicLocale;
}) {
  const copy =
    locale === "ar"
      ? {
          badge: "الأطباء",
          rating: "التقييم",
          reviews: "مراجعات",
          procedures: "إجراءات",
          viewProfile: "عرض الملف",
          bookConsult: "احجز استشارة",
        }
      : {
          badge: "Doctors",
          rating: "rating",
          reviews: "reviews",
          procedures: "procedures",
          viewProfile: "View profile",
          bookConsult: "Book consult",
        };
  const isCarousel = block.layout === "carousel";
  const shouldCenterStatic = isCarousel && doctors.length <= 3;
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
  const styleAlignValue = getFirstDefinedResponsiveValue(
    block.style?.layout?.horizontalAlign,
  );
  const resolvedAlign = styleAlignValue ?? "center";
  const headerContainerClass = cn(
    "max-w-3xl",
    resolvedAlign === "start" && "text-left",
    resolvedAlign === "center" && "text-center mx-auto",
    resolvedAlign === "end" && "text-right ml-auto",
  );
  const textAlignClass =
    resolvedAlign === "end"
      ? "text-right"
      : resolvedAlign === "center"
        ? "text-center"
        : "text-left";
  const badgeAlignClass =
    resolvedAlign === "end"
      ? "ml-auto"
      : resolvedAlign === "center"
        ? "mx-auto"
        : undefined;
  const layoutAlignmentClass = isCarousel
    ? shouldCenterStatic
      ? "md:justify-center"
      : undefined
    : resolvedAlign === "end"
      ? "justify-items-end"
      : resolvedAlign === "center"
        ? "justify-items-center"
        : "justify-items-start";
  const layoutPositionClass = isCarousel
    ? undefined
    : resolvedAlign === "end"
      ? "ml-auto"
      : resolvedAlign === "center"
        ? "mx-auto"
        : undefined;
  const cardWrapperClass = isCarousel
    ? "snap-start flex-none w-[280px] sm:w-[320px] lg:w-[340px]"
    : undefined;
  const cardHeaderClass = cn(
    "flex flex-col space-y-1.5 p-6",
    resolvedAlign === "center" && "items-center text-center",
    resolvedAlign === "end" && "items-end text-right",
    resolvedAlign === "start" && "items-start text-left",
  );
  const cardHeaderInnerClass = cn(
    "flex w-full gap-3",
    resolvedAlign === "center" && "flex-col items-center text-center",
    resolvedAlign === "end" && "flex-row-reverse items-center text-right",
    resolvedAlign === "start" && "items-center text-left",
  );
  const cardBodyAlignClass =
    resolvedAlign === "end"
      ? "items-end text-right"
      : resolvedAlign === "center"
        ? "items-center text-center"
        : "items-start text-left";
  const inlineListAlignment =
    resolvedAlign === "end"
      ? "justify-end"
      : resolvedAlign === "center"
        ? "justify-center"
        : undefined;

  return (
    <BlockSurface
      block={block}
      className="border-y border-border/50"
      defaultPadding={{ top: "4rem", bottom: "4rem" }}
      contentClassName="space-y-10"
    >
      {() => (
        <>
          <div className={headerContainerClass}>
            <Badge
              variant="outline"
              className={cn("text-xs uppercase tracking-wide", badgeAlignClass)}
            >
              {copy.badge}
            </Badge>
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
            {doctors.map((doctor) => (
              <Card
                key={doctor.id}
                className={cn(
                  "flex h-full flex-col border-border/60 bg-card/90 shadow-sm hover:shadow-card-hover",
                  cardWrapperClass ?? "w-full",
                )}
              >
                <CardHeader className={cardHeaderClass}>
                  <div className={cardHeaderInnerClass}>
                    <Avatar className="h-12 w-12 border border-primary/30">
                      <AvatarImage
                        src={doctor.avatar_url ?? undefined}
                        alt={doctor.name}
                      />
                      <AvatarFallback>{initials(doctor.name)}</AvatarFallback>
                    </Avatar>
                    <div className={cardBodyAlignClass}>
                      <CardTitle
                        className={cn(
                          "text-lg text-foreground",
                          textAlignClass,
                        )}
                      >
                        {doctor.name}
                      </CardTitle>
                      <p
                        className={cn(
                          "text-xs text-muted-foreground",
                          textAlignClass,
                        )}
                      >
                        {doctor.title}
                      </p>
                      <p
                        className={cn(
                          "text-xs text-muted-foreground capitalize",
                          textAlignClass,
                        )}
                      >
                        {doctor.specialization}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent
                  className={cn(
                    "flex flex-1 flex-col gap-3 text-xs text-muted-foreground",
                    resolvedAlign === "center" && "text-center",
                    resolvedAlign === "end" && "text-right",
                  )}
                >
                  <div
                    className={cn(
                      "flex items-center gap-4",
                      inlineListAlignment,
                    )}
                  >
                    {typeof doctor.patient_rating === "number" ? (
                      <div className={textAlignClass}>
                        <span className="font-semibold text-foreground">
                          {doctor.patient_rating.toFixed(1)}
                        </span>
                        <span className="ml-1">{copy.rating}</span>
                      </div>
                    ) : null}
                    {typeof doctor.total_reviews === "number" ? (
                      <div>
                        {doctor.total_reviews}+ {copy.reviews}
                      </div>
                    ) : null}
                    {typeof doctor.successful_procedures === "number" ? (
                      <div>
                        {doctor.successful_procedures}+ {copy.procedures}
                      </div>
                    ) : null}
                  </div>
                  {doctor.languages && doctor.languages.length ? (
                    <div
                      className={cn(
                        "flex flex-wrap gap-1",
                        inlineListAlignment,
                      )}
                    >
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
                  <div
                    className={cn(
                      "mt-auto flex gap-2 pt-2",
                      inlineListAlignment,
                    )}
                  >
                    <Button asChild size="sm" className="flex-1">
                      <Link
                        href={localizePublicPathname(
                          `/doctors/${doctor.id}`,
                          locale,
                        )}
                      >
                        {copy.viewProfile}
                      </Link>
                    </Button>
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="flex-1"
                    >
                      <Link
                        href={`${localizePublicPathnameWithFallback("/start-journey", locale)}?doctor=${doctor.id}`}
                      >
                        {copy.bookConsult}
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {edgeSpacerClass ? (
              <div className={edgeSpacerClass} aria-hidden />
            ) : null}
          </div>
        </>
      )}
    </BlockSurface>
  );
}
