"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import type { BlockInstance, TabbedGuideSection } from "@/lib/cms/blocks";
import { BlockSurface } from "./BlockSurface";
import { resolveIcon } from "./utils";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import { resolveSectionKey } from "./tabbedGuideUtils";

const columnClassName: Record<number, string> = {
  1: "md:grid-cols-1",
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
};

const cardMarkdownComponents: Components = {
  h1: ({ node, ...props }) => (
    <h4 className="text-lg font-semibold text-foreground" {...props} />
  ),
  h2: ({ node, ...props }) => (
    <h5 className="text-base font-semibold text-foreground" {...props} />
  ),
  h3: ({ node, ...props }) => (
    <h6 className="text-base font-semibold text-foreground" {...props} />
  ),
  p: ({ node, ...props }) => (
    <p className="text-sm leading-relaxed text-muted-foreground" {...props} />
  ),
  ul: ({ node, ...props }) => (
    <ul
      className="list-disc space-y-1 pl-5 text-sm text-muted-foreground"
      {...props}
    />
  ),
  ol: ({ node, ...props }) => (
    <ol
      className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground"
      {...props}
    />
  ),
  li: ({ node, ...props }) => (
    <li className="leading-snug text-muted-foreground" {...props} />
  ),
  strong: ({ node, ...props }) => (
    <strong className="font-semibold text-foreground" {...props} />
  ),
  em: ({ node, ...props }) => (
    <em className="italic text-muted-foreground" {...props} />
  ),
  a: ({ node, ...props }) => (
    <a className="text-primary underline-offset-4 hover:underline" {...props} />
  ),
};

const inlineMarkdownComponents: Components = {
  p: ({ node, ...props }) => (
    <span className="text-sm leading-snug text-muted-foreground" {...props} />
  ),
  strong: ({ node, ...props }) => (
    <strong className="font-semibold text-foreground" {...props} />
  ),
  em: ({ node, ...props }) => (
    <em className="italic text-muted-foreground" {...props} />
  ),
  a: ({ node, ...props }) => (
    <a className="text-primary underline-offset-4 hover:underline" {...props} />
  ),
  br: () => <br />,
};

const SCROLL_OFFSET = 120;
const SCROLL_THRESHOLD = 32;

const formatPrice = (value?: number | null, currency?: string | null) => {
  if (typeof value !== "number" || Number.isNaN(value)) return null;
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency ?? "USD",
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `$${value.toLocaleString()}`;
  }
};

const formatDistance = (value?: number | null) => {
  if (typeof value !== "number" || Number.isNaN(value)) return null;
  return `${value} km from partner hospitals`;
};

const formatRating = (rating?: number | null, reviews?: number | null) => {
  if (typeof rating !== "number" || Number.isNaN(rating)) return null;
  const ratingLabel = `${rating.toFixed(1)}/5`;
  if (typeof reviews === "number" && reviews > 0) {
    const plural = reviews === 1 ? "review" : "reviews";
    return `${ratingLabel} · ${reviews.toLocaleString()} ${plural}`;
  }
  return ratingLabel;
};

export type TabbedGuideHotelCard = {
  id?: string;
  title: string;
  description?: string | null;
  amenities?: string[] | null;
  medicalServices?: string[] | null;
  nightlyRate?: number | null;
  currency?: string | null;
  distanceToFacilityKm?: number | null;
  addressLabel?: string | null;
  starRating?: number | null;
  priceLabel?: string | null;
  locationLabel?: string | null;
  icon?: string | null;
  heroImage?: string | null;
  gallery?: string[] | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  website?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  slug?: string | null;
  addressDetails?: string | null;
};

export type TabbedGuideHotelsMap = Record<string, TabbedGuideHotelCard[]>;

const cleanList = (values?: (string | null)[] | null) =>
  (values ?? []).map((value) => (value ?? "").trim()).filter(Boolean);

export function TabbedGuideContent({
  block,
  hotelMap,
  isPreview,
}: {
  block: BlockInstance<"tabbedGuide">;
  hotelMap: TabbedGuideHotelsMap;
  isPreview?: boolean;
}) {
  const tabsAnchorRef = useRef<HTMLDivElement | null>(null);

  const tabValues = useMemo(
    () => block.tabs.map((tab, index) => tab.id ?? `tab-${index}`),
    [block.tabs],
  );

  const fallbackValueRef = useRef(
    tabValues[0] ?? `tab-${Math.random().toString(36).slice(2, 8)}`,
  );

  const [activeValue, setActiveValue] = useState(
    tabValues[0] ?? fallbackValueRef.current,
  );

  useEffect(() => {
    if (!tabValues.length) return;
    if (!tabValues.includes(activeValue)) {
      setActiveValue(tabValues[0]);
    }
  }, [tabValues, activeValue]);

  const scrollTabsIntoView = () => {
    if (typeof window === "undefined" || !tabsAnchorRef.current) {
      return;
    }
    const { top } = tabsAnchorRef.current.getBoundingClientRect();
    if (top >= SCROLL_THRESHOLD) {
      return;
    }
    const targetTop = window.scrollY + top - SCROLL_OFFSET;
    window.scrollTo({
      top: Math.max(targetTop, 0),
      behavior: "smooth",
    });
  };

  const handleTabChange = (nextValue: string) => {
    setActiveValue(nextValue);
    scrollTabsIntoView();
  };

  const resolvedValue = activeValue ?? tabValues[0] ?? fallbackValueRef.current;

  return (
    <BlockSurface
      block={block}
      defaultPadding={{ top: "4rem", bottom: "4rem" }}
      contentClassName="space-y-10"
    >
      {() => (
        <div ref={tabsAnchorRef} className="space-y-10 scroll-mt-24">
          <div className="space-y-4 text-center">
            {block.badge ? (
              <Badge variant="outline" className="px-4 py-1 text-xs uppercase">
                {block.badge}
              </Badge>
            ) : null}
            <div className="space-y-3">
              {block.eyebrow ? (
                <p className="text-sm font-semibold uppercase tracking-wide text-primary">
                  {block.eyebrow}
                </p>
              ) : null}
              <h2 className="text-4xl font-bold text-foreground">
                {block.heading}
              </h2>
              {block.description ? (
                <p className="mx-auto max-w-3xl text-lg text-muted-foreground">
                  {block.description}
                </p>
              ) : null}
            </div>
          </div>

          <Tabs
            value={resolvedValue}
            onValueChange={handleTabChange}
            className="space-y-6"
          >
            <TabsList className="grid w-full grid-cols-1 gap-2 rounded-full bg-muted/30 p-2 md:grid-cols-2 lg:grid-cols-4">
              {block.tabs.map((tab, index) => {
                const value = tabValues[index] ?? `tab-${index}`;
                const Icon = resolveIcon(tab.icon);
                return (
                  <TabsTrigger
                    key={value}
                    value={value}
                    type="button"
                    className={cn(
                      "flex items-center justify-center gap-2 rounded-full border border-transparent px-4 py-2.5 text-sm font-semibold text-muted-foreground data-[state=active]:border-primary/40 data-[state=active]:bg-background data-[state=active]:text-foreground",
                    )}
                  >
                    {Icon ? <Icon className="h-4 w-4" /> : null}
                    {tab.label}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {block.tabs.map((tab, tabIndex) => {
              const value = tabValues[tabIndex] ?? `tab-${tabIndex}`;
              return (
                <TabsContent key={value} value={value}>
                  <div className="space-y-8">
                    {(tab.heading || tab.description) && (
                      <div className="space-y-2 text-center">
                        {tab.heading ? (
                          <h3 className="text-3xl font-semibold text-foreground">
                            {tab.heading}
                          </h3>
                        ) : null}
                        {tab.description ? (
                          <p className="text-lg text-muted-foreground">
                            {tab.description}
                          </p>
                        ) : null}
                      </div>
                    )}
                    <div className="grid gap-6 md:grid-cols-2">
                      {tab.sections.map((section, sectionIndex) => {
                        const sectionKey = resolveSectionKey(
                          value,
                          sectionIndex,
                        );
                        const width = section.displayWidth ?? "full";
                        return (
                          <div
                            key={sectionKey}
                            className={cn(
                              width === "half"
                                ? "md:col-span-1"
                                : "md:col-span-2",
                            )}
                          >
                            <SectionRenderer
                              section={section}
                              sectionKey={sectionKey}
                              hotelMap={hotelMap}
                              isPreview={isPreview}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </TabsContent>
              );
            })}
          </Tabs>
        </div>
      )}
    </BlockSurface>
  );
}

function SectionRenderer({
  section,
  sectionKey,
  hotelMap,
  isPreview,
}: {
  section: TabbedGuideSection;
  sectionKey: string;
  hotelMap: TabbedGuideHotelsMap;
  isPreview?: boolean;
}) {
  switch (section.type) {
    case "cardGrid":
      return (
        <div className="space-y-4">
          {section.title ? (
            <h4 className="text-2xl font-semibold text-foreground">
              {section.title}
            </h4>
          ) : null}
          {section.description ? (
            <p className="text-muted-foreground">{section.description}</p>
          ) : null}
          <div
            className={cn(
              "grid gap-6",
              columnClassName[section.columns ?? 2] ?? "md:grid-cols-2",
            )}
          >
            {section.cards.map((card, index) => {
              const cardBullets = cleanList(card.bullets);
              const Icon = resolveIcon(card.icon);
              const markdownBody = (card.markdown ?? "").trim();
              const helperText = (card.helper ?? "").trim();
              const hasMarkdown = markdownBody.length > 0;
              const hasBullets = cardBullets.length > 0;
              const hasHelper = helperText.length > 0;
              const hasActions = Boolean(card.actions?.length);
              const hasContent =
                hasMarkdown || hasBullets || hasHelper || hasActions;
              return (
                <Card key={`${sectionKey}-card-${index}`} className="h-full">
                  <CardHeader className="space-y-3">
                    <div className="flex items-center gap-3">
                      {Icon ? (
                        <div className="rounded-full bg-primary/10 p-2 text-primary">
                          <Icon className="h-5 w-5" />
                        </div>
                      ) : null}
                      <div className="space-y-1">
                        {card.badge ? (
                          <Badge variant="secondary" className="text-xs">
                            {card.badge}
                          </Badge>
                        ) : null}
                        <CardTitle className="text-xl">{card.title}</CardTitle>
                      </div>
                    </div>
                    {card.description ? (
                      <CardDescription>{card.description}</CardDescription>
                    ) : null}
                  </CardHeader>
                  {hasContent && (
                    <CardContent className="space-y-4 text-sm text-muted-foreground">
                      {hasMarkdown ? (
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          rehypePlugins={[rehypeSanitize]}
                          components={cardMarkdownComponents}
                        >
                          {markdownBody}
                        </ReactMarkdown>
                      ) : null}
                      {hasBullets ? (
                        <ul className="space-y-2">
                          {cardBullets.map((bullet, bulletIndex) => (
                            <li key={bulletIndex} className="flex gap-2">
                              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                              <div className="flex-1">
                                <ReactMarkdown
                                  remarkPlugins={[remarkGfm]}
                                  rehypePlugins={[rehypeSanitize]}
                                  components={inlineMarkdownComponents}
                                >
                                  {bullet}
                                </ReactMarkdown>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                      {hasHelper ? <p>{helperText}</p> : null}
                      {card.actions?.length ? (
                        <div className="flex flex-wrap gap-2">
                          {card.actions.map((action, actionIndex) => (
                            <Button
                              key={actionIndex}
                              asChild
                              size="sm"
                              variant={
                                action.variant ??
                                (actionIndex === 0 ? "default" : "outline")
                              }
                            >
                              <Link
                                href={action.href}
                                target={action.target ?? "_self"}
                                rel={
                                  action.target === "_blank"
                                    ? "noopener noreferrer"
                                    : undefined
                                }
                              >
                                {action.label}
                              </Link>
                            </Button>
                          ))}
                        </div>
                      ) : null}
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      );
    case "compactList": {
      const Icon = resolveIcon(section.icon);
      return (
        <Card className="border-border/70 bg-card/95 shadow-sm">
          <CardContent className="space-y-5 p-5">
            <div className="flex items-center gap-3">
              {Icon ? (
                <div className="rounded-full bg-primary/10 p-2 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
              ) : null}
              <div>
                {section.title ? (
                  <h4 className="text-lg font-semibold text-foreground">
                    {section.title}
                  </h4>
                ) : null}
                {section.description ? (
                  <p className="text-sm text-muted-foreground">
                    {section.description}
                  </p>
                ) : null}
              </div>
            </div>
            <div className="space-y-3">
              {section.rows.map((row, index) => (
                <div
                  key={`${sectionKey}-compact-${index}`}
                  className={cn(
                    "rounded-lg border border-border/40 bg-card/60 px-4 py-3",
                    "flex flex-col gap-1",
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-foreground">
                      {row.title}
                    </span>
                    {row.pill ? (
                      <Badge className="rounded-full bg-muted px-3 py-0.5 text-[11px] font-semibold tracking-wide text-muted-foreground">
                        {row.pill}
                      </Badge>
                    ) : null}
                  </div>
                  {row.description ? (
                    <p className="text-sm text-muted-foreground">
                      {row.description}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      );
    }
    case "dataGrid": {
      const layout = section.layout ?? "cards";
      if (layout === "stacked") {
        const pillKey = section.pillColumnKey;
        return (
          <div className="space-y-4">
            {section.title ? (
              <h4 className="text-2xl font-semibold">{section.title}</h4>
            ) : null}
            {section.description ? (
              <p className="text-muted-foreground">{section.description}</p>
            ) : null}
            <Card className="border-border/70 bg-card/90">
              <CardContent className="p-0">
                {section.rows.map((row, rowIndex) => {
                  const pillValue =
                    pillKey && row.values[pillKey] ? row.values[pillKey] : null;
                  const infoColumns = section.columns.filter(
                    (column) => column.key !== pillKey,
                  );
                  return (
                    <div
                      key={`${sectionKey}-stacked-row-${rowIndex}`}
                      className={cn(
                        "flex flex-col gap-4 px-6 py-6",
                        rowIndex > 0 && "border-t border-border/60",
                      )}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <h5 className="text-lg font-semibold text-foreground">
                          {row.title}
                        </h5>
                        {pillValue ? (
                          <Badge className="rounded-full bg-muted px-3 py-1 text-xs font-semibold tracking-wide text-muted-foreground">
                            {pillValue}
                          </Badge>
                        ) : row.badge ? (
                          <Badge variant="outline">{row.badge}</Badge>
                        ) : null}
                      </div>
                      {infoColumns.length ? (
                        <div className="grid gap-4 text-sm text-muted-foreground sm:grid-cols-2">
                          {infoColumns.map((column) => (
                            <div
                              key={`${sectionKey}-${column.key}-${rowIndex}`}
                              className="space-y-1"
                            >
                              <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground/70">
                                {column.label}
                              </span>
                              <p className="text-base text-foreground">
                                {row.values[column.key] ?? "—"}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        );
      }
      return (
        <div className="space-y-4">
          {section.title ? (
            <h4 className="text-2xl font-semibold">{section.title}</h4>
          ) : null}
          {section.description ? (
            <p className="text-muted-foreground">{section.description}</p>
          ) : null}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {section.rows.map((row, rowIndex) => (
              <Card key={`${sectionKey}-row-${rowIndex}`}>
                <CardContent className="space-y-3 p-5">
                  <div className="flex items-center justify-between">
                    <h5 className="text-lg font-semibold text-foreground">
                      {row.title}
                    </h5>
                    {row.badge ? (
                      <Badge variant="outline">{row.badge}</Badge>
                    ) : null}
                  </div>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    {section.columns.map((column) => (
                      <div
                        key={`${sectionKey}-${column.key}-${rowIndex}`}
                        className="flex items-center justify-between gap-3"
                      >
                        <span>{column.label}</span>
                        <span className="font-medium text-foreground">
                          {row.values[column.key] ?? "—"}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      );
    }
    case "callout": {
      const calloutBullets = cleanList(section.bullets);
      const toneClasses =
        section.tone === "warning"
          ? "bg-amber-500/10 border-amber-500/40"
          : section.tone === "muted"
            ? "bg-muted/40 border-border/60"
            : "bg-primary/10 border-primary/30";
      return (
        <Card className={cn("border", toneClasses)}>
          <CardContent className="space-y-3 p-6">
            <h5 className="text-xl font-semibold text-foreground">
              {section.title}
            </h5>
            {section.body ? (
              <p className="text-sm text-muted-foreground">{section.body}</p>
            ) : null}
            {calloutBullets.length ? (
              <ul className="space-y-1 text-sm text-muted-foreground">
                {calloutBullets.map((bullet, index) => (
                  <li key={`${sectionKey}-bullet-${index}`}>• {bullet}</li>
                ))}
              </ul>
            ) : null}
          </CardContent>
        </Card>
      );
    }
    case "mediaSpotlight": {
      const spotlightBullets = cleanList(section.bullets);
      return (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="relative h-72 overflow-hidden rounded-2xl shadow-elegant lg:h-full">
            <Image
              src={section.image.src}
              alt={section.image.alt ?? section.title}
              fill
              className="object-cover"
              sizes="(min-width: 1024px) 50vw, 100vw"
            />
          </div>
          <Card className="self-center">
            <CardContent className="space-y-4 p-6">
              {section.badge ? (
                <Badge
                  variant="outline"
                  className="text-xs uppercase tracking-wide"
                >
                  {section.badge}
                </Badge>
              ) : null}
              <h4 className="text-2xl font-semibold text-foreground">
                {section.title}
              </h4>
              {section.body ? (
                <p className="text-muted-foreground">{section.body}</p>
              ) : null}
              {spotlightBullets.length ? (
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {spotlightBullets.map((bullet, index) => (
                    <li
                      key={`${sectionKey}-spotlight-${index}`}
                      className="flex gap-2"
                    >
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </CardContent>
          </Card>
        </div>
      );
    }
    case "infoPanels":
      return (
        <div className="space-y-4">
          {section.title ? (
            <h4 className="text-2xl font-semibold">{section.title}</h4>
          ) : null}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {section.panels.map((panel, index) => {
              const panelItems = cleanList(panel.items);
              return (
                <Card key={`${sectionKey}-panel-${index}`}>
                  <CardContent className="space-y-3 p-5">
                    <div className="flex items-center justify-between">
                      <h5 className="text-lg font-semibold">{panel.title}</h5>
                      {panel.badge ? (
                        <Badge variant="outline" className="text-xs">
                          {panel.badge}
                        </Badge>
                      ) : null}
                    </div>
                    {panel.description ? (
                      <p className="text-sm text-muted-foreground">
                        {panel.description}
                      </p>
                    ) : null}
                    {panelItems.length ? (
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        {panelItems.map((item, itemIndex) => (
                          <li key={`${sectionKey}-panel-item-${itemIndex}`}>
                            • {item}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      );
    case "hotelShowcase": {
      const hotelsFromMap = hotelMap[sectionKey] ?? [];
      const fallbackEntries = (section.manualFallback ?? []).map((entry) => ({
        title: entry.title,
        description: entry.description,
        amenities: entry.amenities,
        medicalServices: entry.medicalServices,
        priceLabel: entry.priceLabel,
        locationLabel: entry.locationLabel,
        icon: entry.icon,
        starRating: entry.starRating,
        heroImage: entry.heroImage,
        contactPhone: entry.contactPhone,
        contactEmail: entry.contactEmail,
        website: entry.website,
        rating: entry.rating,
        reviewCount: entry.reviewCount,
        addressDetails: entry.addressDetails,
      }));
      const hotels = hotelsFromMap.length > 0 ? hotelsFromMap : fallbackEntries;
      const layoutClass =
        section.layout === "carousel"
          ? "flex gap-4 overflow-x-auto pb-4 [&::-webkit-scrollbar]:hidden"
          : "grid gap-6 md:grid-cols-2";
      const cardClass =
        section.layout === "carousel"
          ? "w-[280px] flex-none sm:w-[320px] lg:w-[360px]"
          : "w-full";
      const safelyEmpty = hotels.length === 0;

      return (
        <div className="space-y-4">
          {section.title ? (
            <h4 className="text-2xl font-semibold">{section.title}</h4>
          ) : null}
          {section.description ? (
            <p className="text-muted-foreground">{section.description}</p>
          ) : null}
          {safelyEmpty ? (
            <div className="rounded-lg border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
              {isPreview
                ? "Add manual fallback entries or publish to see partner hotels."
                : "Partner hotels will appear here once available."}
            </div>
          ) : (
            <div className={layoutClass}>
              {hotels.map((hotel, index) => {
                const Icon = resolveIcon(hotel.icon ?? "Hotel");
                const priceLabel =
                  hotel.priceLabel ??
                  formatPrice(hotel.nightlyRate, hotel.currency);
                const location =
                  hotel.locationLabel ??
                  hotel.addressLabel ??
                  formatDistance(hotel.distanceToFacilityKm);
                const amenities = cleanList(hotel.amenities);
                const medicalServices = cleanList(hotel.medicalServices);
                const ratingSummary = formatRating(
                  hotel.rating,
                  hotel.reviewCount,
                );
                const addressDetails =
                  hotel.addressDetails && hotel.addressDetails !== location
                    ? hotel.addressDetails
                    : null;
                const hasContact =
                  hotel.contactPhone || hotel.contactEmail || hotel.website;
                return (
                  <Card
                    key={hotel.id ?? `${sectionKey}-hotel-${index}`}
                    className={cn(
                      "flex h-full flex-col overflow-hidden border-border/70 bg-card/95 shadow-sm",
                      cardClass,
                    )}
                  >
                    {hotel.heroImage ? (
                      <div className="relative h-40 w-full border-b border-border/60">
                        <Image
                          src={hotel.heroImage}
                          alt={`${hotel.title} showcase image`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 50vw"
                        />
                      </div>
                    ) : null}
                    <CardHeader className="space-y-3">
                      <div className="flex items-center gap-3">
                        {Icon ? (
                          <div className="rounded-full bg-secondary/30 p-2 text-secondary-foreground">
                            <Icon className="h-5 w-5" />
                          </div>
                        ) : null}
                        <div>
                          <CardTitle className="text-xl text-foreground">
                            {hotel.title}
                          </CardTitle>
                          {hotel.starRating ? (
                            <p className="text-xs text-muted-foreground">
                              Rated {hotel.starRating}-star accommodation
                            </p>
                          ) : null}
                        </div>
                      </div>
                      {hotel.description ? (
                        <CardDescription>{hotel.description}</CardDescription>
                      ) : null}
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm text-muted-foreground">
                      {amenities.length ? (
                        <div>
                          <h6 className="text-xs font-semibold uppercase tracking-wide text-foreground">
                            Amenities
                          </h6>
                          <ul className="mt-2 space-y-1">
                            {amenities
                              .slice(0, 6)
                              .map((amenity, amenityIndex) => (
                                <li key={amenityIndex} className="flex gap-2">
                                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                                  <span>{amenity}</span>
                                </li>
                              ))}
                          </ul>
                        </div>
                      ) : null}
                      {medicalServices.length ? (
                        <div className="border border-dashed border-border/60 rounded-md p-3">
                          <h6 className="text-xs font-semibold uppercase tracking-wide text-foreground">
                            Medical services
                          </h6>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {medicalServices.map((service, serviceIndex) => (
                              <Badge key={serviceIndex} variant="outline">
                                {service}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ) : null}
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span>Investment</span>
                          <span className="font-semibold text-foreground">
                            {priceLabel ?? "Contact for pricing"}
                          </span>
                        </div>
                        {location ? (
                          <div className="flex items-center justify-between">
                            <span>Location</span>
                            <span className="text-foreground">{location}</span>
                          </div>
                        ) : null}
                        {addressDetails ? (
                          <div className="flex items-center justify-between">
                            <span>Address</span>
                            <span className="text-foreground">
                              {addressDetails}
                            </span>
                          </div>
                        ) : null}
                        {ratingSummary ? (
                          <div className="flex items-center justify-between">
                            <span>Guest rating</span>
                            <span className="text-foreground">
                              {ratingSummary}
                            </span>
                          </div>
                        ) : null}
                      </div>
                      {hasContact ? (
                        <div className="rounded-md border border-border/50 p-3 text-xs">
                          <h6 className="text-xs font-semibold uppercase tracking-wide text-foreground">
                            Concierge contact
                          </h6>
                          <div className="mt-2 space-y-1 text-foreground">
                            {hotel.contactPhone ? (
                              <p>Phone: {hotel.contactPhone}</p>
                            ) : null}
                            {hotel.contactEmail ? (
                              <p>Email: {hotel.contactEmail}</p>
                            ) : null}
                            {hotel.website ? (
                              <Link
                                href={hotel.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary"
                              >
                                Visit website
                              </Link>
                            ) : null}
                          </div>
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      );
    }
    case "cta":
      return (
        <Card className="bg-gradient-card text-center">
          <CardContent className="space-y-4 p-8">
            {section.eyebrow ? (
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                {section.eyebrow}
              </p>
            ) : null}
            <h4 className="text-2xl font-semibold text-foreground">
              {section.title}
            </h4>
            {section.description ? (
              <p className="text-muted-foreground">{section.description}</p>
            ) : null}
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              {section.actions.map((action, index) => (
                <Button
                  key={`${sectionKey}-cta-${index}`}
                  asChild
                  size="lg"
                  variant={
                    action.variant ?? (index === 0 ? "default" : "outline")
                  }
                >
                  <Link
                    href={action.href}
                    target={action.target ?? "_self"}
                    rel={
                      action.target === "_blank"
                        ? "noopener noreferrer"
                        : undefined
                    }
                  >
                    {action.label}
                  </Link>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      );
    default:
      return null;
  }
}
