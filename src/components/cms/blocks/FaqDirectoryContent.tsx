"use client";

import {
  startTransition,
  useDeferredValue,
  useId,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { BlockValue } from "@/lib/cms/blocks";
import {
  buildFaqCategories,
  type FaqCategory,
  type FaqEntry,
} from "@/lib/faq/data";
import type { FaqSource } from "@/lib/faq/queries";
import { cn } from "@/lib/utils";
import { ArrowUpRight, Search } from "lucide-react";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";

type FaqDirectoryContentProps = Pick<
  BlockValue<"faqDirectory">,
  | "clearSearchLabel"
  | "description"
  | "emptyStateDescription"
  | "emptyStateHeading"
  | "eyebrow"
  | "heading"
  | "layout"
  | "navigationHeading"
  | "searchPlaceholder"
  | "showCategoryDescriptions"
  | "showSearch"
  | "showSourceBadge"
> & {
  faqs: FaqEntry[];
  categories: FaqCategory[];
  source: FaqSource;
};

export function FaqDirectoryContent({
  categories,
  clearSearchLabel,
  description,
  emptyStateDescription,
  emptyStateHeading,
  eyebrow,
  faqs,
  heading,
  layout,
  navigationHeading,
  searchPlaceholder,
  showCategoryDescriptions,
  showSearch,
  showSourceBadge,
  source,
}: FaqDirectoryContentProps) {
  const searchInputId = useId();
  const [searchTerm, setSearchTerm] = useState("");
  const deferredSearchTerm = useDeferredValue(searchTerm);

  const categoryBuckets = useMemo(
    () => buildFaqCategories(faqs, categories),
    [faqs, categories],
  );

  const visibleBuckets = useMemo(() => {
    const query = deferredSearchTerm.trim().toLowerCase();

    if (!query) {
      return categoryBuckets;
    }

    return categoryBuckets
      .map((bucket) => ({
        ...bucket,
        items: bucket.items.filter((faq) =>
          [faq.question, faq.answer, bucket.meta.label, bucket.meta.description]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(query),
        ),
      }))
      .filter((bucket) => bucket.items.length > 0);
  }, [categoryBuckets, deferredSearchTerm]);

  const totalQuestions = faqs.length;
  const visibleQuestionCount = visibleBuckets.reduce(
    (count, bucket) => count + bucket.items.length,
    0,
  );
  const hasSearchTerm = deferredSearchTerm.trim().length > 0;
  const usesSidebarLayout = layout === "sidebar";
  const searchSummary = hasSearchTerm
    ? `Showing ${visibleQuestionCount} of ${totalQuestions} questions`
    : `${totalQuestions} questions across ${categoryBuckets.length} topics`;

  return (
    <div className="space-y-10">
      {(eyebrow || heading || description) && (
        <div className="mx-auto max-w-4xl space-y-5 text-center">
          {eyebrow ? (
            <span className="inline-flex items-center rounded-full border border-border/60 bg-background/85 px-4 py-2 text-xs font-medium uppercase tracking-[0.24em] text-primary dark:border-slate-200 dark:bg-white dark:text-slate-500">
              {eyebrow}
            </span>
          ) : null}
          {heading ? (
            <h2 className="text-3xl font-semibold tracking-[-0.03em] text-foreground dark:text-slate-950 md:text-5xl">
              {heading}
            </h2>
          ) : null}
          {description ? (
            <p className="mx-auto max-w-3xl text-lg leading-8 text-muted-foreground dark:text-slate-600">
              {description}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Badge
              variant="outline"
              className="rounded-full border-border/60 px-4 py-1.5 text-sm text-muted-foreground dark:border-slate-200 dark:text-slate-600"
            >
              {searchSummary}
            </Badge>
            {source === "fallback" && showSourceBadge ? (
              <Badge
                variant="outline"
                className="rounded-full border-amber-300 bg-amber-50 px-4 py-1.5 text-sm text-amber-700"
              >
                Showing fallback FAQ content
              </Badge>
            ) : null}
          </div>
        </div>
      )}

      <div
        className={cn(
          "grid gap-8",
          usesSidebarLayout
            ? "lg:grid-cols-[19rem_minmax(0,1fr)]"
            : "grid-cols-1",
        )}
      >
        <aside
          className={cn(
            usesSidebarLayout && "lg:sticky lg:top-24 lg:self-start",
          )}
        >
          <div className="overflow-hidden rounded-[2rem] border border-[hsl(var(--editorial-ink-foreground)/0.1)] bg-[hsl(var(--editorial-ink))] shadow-[0_24px_70px_rgba(15,23,42,0.14)]">
            <div className="space-y-6 p-6 text-[hsl(var(--editorial-ink-foreground))]">
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-[0.24em] text-[hsl(var(--editorial-accent))]">
                  {navigationHeading}
                </p>
                <p className="text-sm leading-7 text-[hsl(var(--editorial-ink-muted))]">
                  Jump directly to the topic that matches your question.
                </p>
              </div>

              {showSearch ? (
                <div className="space-y-3">
                  <label htmlFor={searchInputId} className="sr-only">
                    Search frequently asked questions
                  </label>
                  <div className="relative">
                    <Search
                      aria-hidden="true"
                      className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(var(--editorial-ink-muted))]"
                    />
                    <Input
                      id={searchInputId}
                      type="search"
                      placeholder={searchPlaceholder}
                      value={searchTerm}
                      onChange={(event) => {
                        const value = event.target.value;
                        startTransition(() => {
                          setSearchTerm(value);
                        });
                      }}
                      className="h-12 rounded-full border-[hsl(var(--editorial-ink-foreground)/0.12)] bg-[hsl(var(--editorial-ink-soft))] pl-11 text-[hsl(var(--editorial-ink-foreground))] placeholder:text-[hsl(var(--editorial-ink-muted))]"
                      aria-label="Search frequently asked questions"
                    />
                  </div>
                  <p className="text-sm text-[hsl(var(--editorial-ink-muted))]">
                    {searchSummary}
                  </p>
                </div>
              ) : null}

              <div className="space-y-3">
                {visibleBuckets.map((bucket) => (
                  <Link
                    key={bucket.id}
                    href={`#${bucket.meta.fragment}`}
                    className="group flex items-start justify-between gap-4 rounded-[1.25rem] border border-[hsl(var(--editorial-ink-foreground)/0.08)] bg-[hsl(var(--editorial-ink-soft)/0.92)] px-4 py-4 transition-colors hover:border-[hsl(var(--editorial-accent)/0.32)] hover:bg-[hsl(var(--editorial-ink-foreground)/0.06)]"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-[hsl(var(--editorial-ink-foreground))]">
                        {bucket.meta.label}
                      </p>
                      {showCategoryDescriptions ? (
                        <p className="text-sm leading-6 text-[hsl(var(--editorial-ink-muted))]">
                          {bucket.meta.description}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-[hsl(var(--editorial-accent))]">
                      <span>{bucket.items.length}</span>
                      <ArrowUpRight
                        aria-hidden="true"
                        className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <div className="space-y-6">
          {visibleBuckets.length === 0 ? (
            <div className="rounded-[2rem] border border-dashed border-border/60 bg-surface-subtle px-6 py-14 text-center shadow-sm dark:border-slate-200 dark:bg-white">
              <h3 className="text-2xl font-semibold text-foreground dark:text-slate-950">
                {emptyStateHeading}
              </h3>
              <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-muted-foreground dark:text-slate-600">
                {emptyStateDescription}
              </p>
              {hasSearchTerm ? (
                <Button
                  variant="outline"
                  className="mt-6"
                  onClick={() => setSearchTerm("")}
                >
                  {clearSearchLabel}
                </Button>
              ) : null}
            </div>
          ) : (
            visibleBuckets.map((bucket) => {
              const Icon = bucket.meta.icon;
              return (
                <section
                  key={bucket.id}
                  id={bucket.meta.fragment}
                  className="scroll-mt-28 overflow-hidden rounded-[2rem] border border-border/60 bg-card/95 shadow-[0_18px_46px_rgba(15,23,42,0.08)] dark:border-slate-200 dark:bg-white dark:shadow-[0_14px_36px_rgba(15,23,42,0.08)]"
                >
                  <div className="border-b border-border/60 bg-surface-subtle/70 px-6 py-6 dark:border-slate-200 dark:bg-slate-50">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-start gap-4">
                        <div
                          className={cn(
                            "inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border",
                            bucket.meta.color,
                          )}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="space-y-1.5">
                          <h3 className="text-2xl font-semibold tracking-[-0.02em] text-foreground dark:text-slate-950">
                            {bucket.meta.label}
                          </h3>
                          {showCategoryDescriptions ? (
                            <p className="max-w-3xl text-base leading-7 text-muted-foreground dark:text-slate-600">
                              {bucket.meta.description}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      <Badge
                        variant="outline"
                        className="rounded-full border-border/60 px-4 py-1.5 text-sm text-muted-foreground dark:border-slate-200 dark:text-slate-600"
                      >
                        {bucket.items.length} questions
                      </Badge>
                    </div>
                  </div>

                  <Accordion
                    type="multiple"
                    className="divide-y divide-border/60 dark:divide-slate-200"
                  >
                    {bucket.items.map((faq) => (
                      <AccordionItem
                        key={faq.id}
                        value={`${bucket.id}-${faq.id}`}
                        className="border-none px-6"
                      >
                        <AccordionTrigger className="py-5 text-left text-base font-semibold leading-7 text-foreground hover:no-underline dark:text-slate-950 md:text-lg">
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent className="pb-6 pt-1">
                          <div className="prose prose-sm max-w-none text-muted-foreground dark:prose-invert dark:text-slate-600">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              rehypePlugins={[rehypeSanitize]}
                            >
                              {faq.answer}
                            </ReactMarkdown>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </section>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
