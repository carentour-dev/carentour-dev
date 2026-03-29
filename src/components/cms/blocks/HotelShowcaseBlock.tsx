import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { BlockInstance } from "@/lib/cms/blocks";
import { cn } from "@/lib/utils";
import { BlockSurface } from "./BlockSurface";
import { resolveIcon } from "./utils";

const cleanList = (values?: (string | null)[] | null) =>
  (values ?? []).map((value) => (value ?? "").trim()).filter(Boolean);

const formatRating = (rating?: number, reviews?: number) => {
  if (typeof rating !== "number" || Number.isNaN(rating)) return null;
  const ratingLabel = `${rating.toFixed(1)}/5`;
  if (typeof reviews === "number" && reviews > 0) {
    const plural = reviews === 1 ? "review" : "reviews";
    return `${ratingLabel} · ${reviews.toLocaleString()} ${plural}`;
  }
  return ratingLabel;
};

export function HotelShowcaseBlock({
  block,
}: {
  block: BlockInstance<"hotelShowcase">;
}) {
  const isComparisonLayout =
    block.layout === "grid" && block.items.length === 3;
  const layoutClass =
    block.layout === "carousel"
      ? "flex gap-4 overflow-x-auto pb-4 [&::-webkit-scrollbar]:hidden"
      : isComparisonLayout
        ? "overflow-hidden rounded-[2rem] border border-border/60 bg-card/90"
        : "grid gap-6 md:grid-cols-2 xl:grid-cols-3";

  return (
    <BlockSurface
      block={block}
      className="border-y border-border/40 bg-background"
      defaultPadding={{ top: "5rem", bottom: "5rem" }}
      contentClassName="space-y-10"
    >
      {() => (
        <>
          {(block.eyebrow || block.heading || block.description) && (
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              {block.eyebrow ? (
                <span className="inline-flex items-center rounded-full border border-primary/15 bg-primary/5 px-4 py-2 text-xs font-medium uppercase tracking-[0.24em] text-primary">
                  {block.eyebrow}
                </span>
              ) : null}
              {block.heading ? (
                <h2 className="text-3xl font-semibold tracking-[-0.03em] text-foreground md:text-5xl">
                  {block.heading}
                </h2>
              ) : null}
              {block.description ? (
                <p className="text-base leading-8 text-muted-foreground md:text-lg">
                  {block.description}
                </p>
              ) : null}
            </div>
          )}

          <div className={layoutClass}>
            <div
              className={cn(
                isComparisonLayout
                  ? "grid divide-y divide-border/60 lg:grid-cols-3 lg:divide-x lg:divide-y-0"
                  : "contents",
              )}
            >
              {block.items.map((item, index) => {
                const Icon = resolveIcon(item.icon ?? "Hotel");
                const amenities = cleanList(item.amenities);
                const medicalServices = cleanList(item.medicalServices);
                const ratingSummary = formatRating(
                  item.rating,
                  item.reviewCount,
                );
                const metaRows = [
                  item.priceLabel
                    ? { label: "Investment", value: item.priceLabel }
                    : null,
                  item.locationLabel
                    ? { label: "Location", value: item.locationLabel }
                    : null,
                  item.addressDetails
                    ? { label: "Address", value: item.addressDetails }
                    : null,
                  ratingSummary
                    ? { label: "Guest rating", value: ratingSummary }
                    : null,
                ].filter(Boolean) as { label: string; value: string }[];
                const hasContact =
                  item.contactPhone || item.contactEmail || item.website;

                return (
                  <article
                    key={`${item.title}-${index}`}
                    className={cn(
                      "flex h-full flex-col gap-6 p-6 md:p-8",
                      !isComparisonLayout &&
                        "overflow-hidden rounded-[1.75rem] border border-border/60 bg-card/90 shadow-sm",
                      block.layout === "carousel" &&
                        "w-[280px] flex-none sm:w-[320px] lg:w-[360px]",
                    )}
                  >
                    {item.heroImage ? (
                      <div
                        className={cn(
                          "relative overflow-hidden rounded-[1.25rem] border border-border/60",
                          isComparisonLayout ? "h-40" : "h-44",
                        )}
                      >
                        <Image
                          src={item.heroImage}
                          alt={`${item.title} showcase image`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 1024px) 100vw, 33vw"
                        />
                      </div>
                    ) : null}

                    <div className="grid gap-4">
                      <div
                        className={cn(
                          "flex items-start gap-3",
                          isComparisonLayout && "min-h-[4.75rem]",
                        )}
                      >
                        {Icon ? (
                          <div className="mt-0.5 rounded-full bg-primary/10 p-2 text-primary">
                            <Icon className="h-5 w-5" />
                          </div>
                        ) : null}
                        <div className="space-y-1">
                          <h3 className="text-xl font-semibold text-foreground">
                            {item.title}
                          </h3>
                          {item.starRating ? (
                            <p className="text-xs text-muted-foreground">
                              Rated {item.starRating}-star accommodation
                            </p>
                          ) : null}
                        </div>
                      </div>

                      {item.description ? (
                        <p
                          className={cn(
                            "text-sm leading-7 text-muted-foreground",
                            isComparisonLayout && "min-h-[5.5rem]",
                          )}
                        >
                          {item.description}
                        </p>
                      ) : (
                        <div
                          className={cn(isComparisonLayout && "min-h-[5.5rem]")}
                        />
                      )}
                    </div>

                    {amenities.length ? (
                      <div
                        className={cn(isComparisonLayout && "min-h-[12rem]")}
                      >
                        <h4 className="text-xs font-semibold uppercase tracking-[0.22em] text-foreground">
                          Amenities
                        </h4>
                        <ul className="mt-3 space-y-2 text-sm leading-7 text-muted-foreground">
                          {amenities.map((amenity, amenityIndex) => (
                            <li
                              key={`${item.title}-amenity-${amenityIndex}`}
                              className="flex gap-2"
                            >
                              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
                              <span>{amenity}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <div
                        className={cn(isComparisonLayout && "min-h-[12rem]")}
                      />
                    )}

                    {medicalServices.length ? (
                      <div
                        className={cn(
                          "rounded-xl border border-border/60 bg-muted/20 p-3",
                          isComparisonLayout && "min-h-[7.25rem]",
                        )}
                      >
                        <h4 className="text-xs font-semibold uppercase tracking-[0.22em] text-foreground">
                          Medical services
                        </h4>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {medicalServices.map((service, serviceIndex) => (
                            <Badge
                              key={`${item.title}-service-${serviceIndex}`}
                              variant="outline"
                            >
                              {service}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div
                        className={cn(isComparisonLayout && "min-h-[7.25rem]")}
                      />
                    )}

                    {(metaRows.length || hasContact) && (
                      <div className="mt-auto space-y-4 border-t border-border/50 pt-4">
                        {metaRows.length ? (
                          <div className="space-y-2 text-xs">
                            {metaRows.map((row) => (
                              <div
                                key={`${item.title}-${row.label}`}
                                className="flex items-center justify-between gap-3"
                              >
                                <span>{row.label}</span>
                                <span className="max-w-[15rem] text-right font-medium text-foreground">
                                  {row.value}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : null}

                        {hasContact ? (
                          <div className="rounded-xl border border-border/60 p-3 text-xs">
                            <h4 className="text-xs font-semibold uppercase tracking-[0.22em] text-foreground">
                              Contact
                            </h4>
                            <div className="mt-2 space-y-1 text-foreground">
                              {item.contactPhone ? (
                                <p>Phone: {item.contactPhone}</p>
                              ) : null}
                              {item.contactEmail ? (
                                <p>Email: {item.contactEmail}</p>
                              ) : null}
                              {item.website ? (
                                <Link
                                  href={item.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline"
                                >
                                  Visit website
                                </Link>
                              ) : null}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </div>
        </>
      )}
    </BlockSurface>
  );
}
