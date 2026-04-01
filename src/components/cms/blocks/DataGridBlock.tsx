import { getLocale } from "next-intl/server";
import type { PublicLocale } from "@/i18n/routing";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { BlockInstance } from "@/lib/cms/blocks";
import { localizeOptionalDigits } from "@/lib/public/numbers";
import { cn } from "@/lib/utils";
import { BlockSurface } from "./BlockSurface";

function Header({
  eyebrow,
  heading,
  description,
  locale,
}: {
  eyebrow?: string;
  heading?: string;
  description?: string;
  locale: PublicLocale;
}) {
  if (!eyebrow && !heading && !description) return null;

  return (
    <div className="mx-auto max-w-3xl space-y-4 text-center">
      {eyebrow ? (
        <span className="inline-flex items-center rounded-full border border-primary/15 bg-primary/5 px-4 py-2 text-xs font-medium uppercase tracking-[0.24em] text-primary">
          {localizeOptionalDigits(eyebrow, locale)}
        </span>
      ) : null}
      {heading ? (
        <h2 className="text-3xl font-semibold tracking-[-0.03em] text-foreground md:text-5xl">
          {localizeOptionalDigits(heading, locale)}
        </h2>
      ) : null}
      {description ? (
        <p className="text-base leading-8 text-muted-foreground md:text-lg">
          {localizeOptionalDigits(description, locale)}
        </p>
      ) : null}
    </div>
  );
}

export async function DataGridBlock({
  block,
}: {
  block: BlockInstance<"dataGrid">;
}) {
  const locale = (await getLocale()) as PublicLocale;
  const layout = block.layout ?? "cards";
  const pillKey = block.pillColumnKey;

  return (
    <BlockSurface
      block={block}
      className="border-y border-border/40 bg-background"
      defaultPadding={{ top: "5rem", bottom: "5rem" }}
      contentClassName="space-y-10"
    >
      {() => (
        <>
          <Header
            eyebrow={block.eyebrow}
            heading={block.heading}
            description={block.description}
            locale={locale}
          />

          {layout === "stacked" ? (
            <Card className="overflow-hidden rounded-[2rem] border border-border/60 bg-card/90 shadow-sm">
              <CardContent className="p-0">
                {block.rows.map((row, rowIndex) => {
                  const pillValue =
                    pillKey && row.values[pillKey] ? row.values[pillKey] : null;
                  const infoColumns = block.columns.filter(
                    (column) => column.key !== pillKey,
                  );

                  return (
                    <div
                      key={`${row.title}-${rowIndex}`}
                      className={cn(
                        "flex flex-col gap-4 px-6 py-6 md:px-8",
                        rowIndex > 0 && "border-t border-border/60",
                      )}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <h3 className="text-xl font-semibold text-foreground">
                          {localizeOptionalDigits(row.title, locale)}
                        </h3>
                        {pillValue ? (
                          <Badge className="rounded-full bg-muted px-3 py-1 text-xs font-semibold tracking-wide text-muted-foreground">
                            {localizeOptionalDigits(pillValue, locale)}
                          </Badge>
                        ) : row.badge ? (
                          <Badge variant="outline">
                            {localizeOptionalDigits(row.badge, locale)}
                          </Badge>
                        ) : null}
                      </div>

                      <div className="grid gap-4 text-sm text-muted-foreground sm:grid-cols-2 xl:grid-cols-4">
                        {infoColumns.map((column) => (
                          <div
                            key={`${row.title}-${column.key}`}
                            className="space-y-1"
                          >
                            <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-muted-foreground/70">
                              {localizeOptionalDigits(column.label, locale)}
                            </span>
                            <p className="text-base text-foreground">
                              {localizeOptionalDigits(
                                row.values[column.key] ?? "—",
                                locale,
                              )}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {block.rows.map((row, rowIndex) => (
                <Card
                  key={`${row.title}-${rowIndex}`}
                  className="h-full rounded-[1.75rem] border border-border/60 bg-card/90 shadow-sm"
                >
                  <CardHeader className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <CardTitle className="text-xl text-foreground">
                        {localizeOptionalDigits(row.title, locale)}
                      </CardTitle>
                      {row.badge ? (
                        <Badge variant="outline">
                          {localizeOptionalDigits(row.badge, locale)}
                        </Badge>
                      ) : null}
                    </div>
                    {block.description ? (
                      <CardDescription className="sr-only">
                        {block.description}
                      </CardDescription>
                    ) : null}
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-muted-foreground">
                    {block.columns.map((column) => (
                      <div
                        key={`${row.title}-${column.key}`}
                        className="flex items-center justify-between gap-3"
                      >
                        <span>
                          {localizeOptionalDigits(column.label, locale)}
                        </span>
                        <span className="text-right font-medium text-foreground">
                          {localizeOptionalDigits(
                            row.values[column.key] ?? "—",
                            locale,
                          )}
                        </span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </BlockSurface>
  );
}
