import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { PublicLocale } from "@/i18n/routing";
import type { BlockInstance } from "@/lib/cms/blocks";
import { getSafeManagedHref } from "@/lib/managedHrefs";
import { localizeDigits, localizeOptionalDigits } from "@/lib/public/numbers";
import { BlockSurface } from "./BlockSurface";
import { resolveIcon } from "./utils";

export function ServiceCatalogBlock({
  block,
  locale = "en",
}: {
  block: BlockInstance<"serviceCatalog">;
  locale?: PublicLocale;
}) {
  const languagesLabel = locale === "ar" ? "اللغات" : "Languages";

  return (
    <BlockSurface
      block={block}
      className="border-y border-border/40 bg-background"
      defaultPadding={{ top: "6rem", bottom: "6rem" }}
      contentClassName="space-y-12"
    >
      {() => (
        <>
          {(block.eyebrow || block.heading || block.description) && (
            <div className="grid gap-6 border-b border-border/50 pb-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-end">
              <div className="space-y-4">
                {block.eyebrow ? (
                  <span className="inline-flex items-center rounded-full border border-primary/15 bg-primary/5 px-4 py-2 text-xs font-medium uppercase tracking-[0.24em] text-primary">
                    {localizeOptionalDigits(block.eyebrow, locale)}
                  </span>
                ) : null}
                {block.heading ? (
                  <h2 className="max-w-2xl text-3xl font-semibold tracking-[-0.03em] text-foreground md:text-5xl">
                    {localizeOptionalDigits(block.heading, locale)}
                  </h2>
                ) : null}
              </div>
              {block.description ? (
                <p className="max-w-2xl text-base leading-8 text-muted-foreground md:text-lg">
                  {localizeOptionalDigits(block.description, locale)}
                </p>
              ) : null}
            </div>
          )}

          <div className="divide-y divide-border/50">
            {block.items.map((item, index) => {
              const Icon = resolveIcon(item.icon);

              return (
                <article
                  key={`${item.title}-${index}`}
                  className="grid gap-8 py-8 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)] lg:gap-12"
                >
                  <div className="space-y-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
                            {localizeDigits(
                              String(index + 1).padStart(2, "0"),
                              locale,
                            )}
                          </span>
                          {item.availability ? (
                            <span className="inline-flex items-center rounded-full border border-border/70 bg-muted/50 px-3 py-1 text-[0.7rem] font-medium uppercase tracking-[0.18em] text-foreground/80">
                              {localizeOptionalDigits(
                                item.availability,
                                locale,
                              )}
                            </span>
                          ) : null}
                        </div>
                        <h3 className="max-w-lg text-2xl font-semibold tracking-[-0.03em] text-foreground md:text-[2rem]">
                          {localizeOptionalDigits(item.title, locale)}
                        </h3>
                      </div>
                      {Icon ? (
                        <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10 text-primary">
                          <Icon size={22} strokeWidth={1.8} />
                        </div>
                      ) : null}
                    </div>

                    {item.description ? (
                      <p className="max-w-xl text-base leading-8 text-muted-foreground">
                        {localizeOptionalDigits(item.description, locale)}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-6">
                    {item.bullets?.length ? (
                      <ul className="grid gap-4 md:grid-cols-2">
                        {item.bullets.map((bullet, bulletIndex) => (
                          <li
                            key={`${item.title}-bullet-${bulletIndex}`}
                            className="flex items-start gap-3 text-sm leading-7 text-muted-foreground md:text-[0.98rem]"
                          >
                            <span
                              aria-hidden
                              className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                            />
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}

                    <div className="grid gap-6 border-t border-border/50 pt-5 lg:grid-cols-[minmax(0,1fr)_minmax(14rem,0.7fr)]">
                      <div className="space-y-4">
                        {item.languages?.length ? (
                          <div className="space-y-2">
                            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                              {languagesLabel}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {item.languages.map((language, languageIndex) => (
                                <span
                                  key={`${item.title}-language-${languageIndex}`}
                                  className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground"
                                >
                                  {localizeOptionalDigits(language, locale)}
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : null}

                        {item.note ? (
                          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                            {localizeOptionalDigits(item.note, locale)}
                          </p>
                        ) : null}
                      </div>

                      {item.action ? (
                        <div className="flex items-end lg:justify-end">
                          <Link
                            href={getSafeManagedHref(item.action.href)}
                            target={item.action.target ?? "_self"}
                            rel={
                              item.action.target === "_blank"
                                ? "noopener noreferrer"
                                : undefined
                            }
                            className="inline-flex items-center gap-2 text-sm font-medium text-foreground transition-colors hover:text-primary"
                          >
                            {localizeOptionalDigits(item.action.label, locale)}
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}
    </BlockSurface>
  );
}
