import type { PublicLocale } from "@/i18n/routing";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { resolveIcon } from "@/lib/icons";
import { localizeOptionalDigits } from "@/lib/public/numbers";
import type { Differentiator } from "./content";

export function DifferentiatorsSection({
  eyebrow = "Why Choose Care N Tour",
  title = "What Makes Us",
  highlight = "Different",
  description = "Experience the perfect blend of world-class medical care, cost savings, and Egyptian hospitality with our comprehensive medical tourism services",
  items,
  locale = "en",
}: {
  eyebrow?: string;
  title?: string;
  highlight?: string;
  description?: string;
  items: Differentiator[];
  locale?: PublicLocale;
}) {
  return (
    <section className="bg-gradient-to-b from-background to-muted/30 py-20">
      <div className="container mx-auto px-4">
        <div className="mb-16 text-center">
          <Badge variant="outline" className="mb-6 text-center">
            {localizeOptionalDigits(eyebrow, locale)}
          </Badge>
          <h2 className="mb-4 text-4xl font-bold text-foreground md:text-5xl">
            {localizeOptionalDigits(title, locale)}{" "}
            <span className="text-primary">
              {localizeOptionalDigits(highlight, locale)}
            </span>
          </h2>
          <p className="mx-auto max-w-3xl text-xl text-muted-foreground">
            {localizeOptionalDigits(description, locale)}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => {
            const Icon = resolveIcon(item.icon);

            return (
              <Card
                key={`${item.title}-${index}`}
                className="group overflow-hidden border-border/50 transition-spring hover:shadow-elegant"
              >
                <CardContent className="p-8">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
                        {Icon ? (
                          <Icon className="h-6 w-6 text-background" />
                        ) : null}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <h3 className="text-lg font-semibold text-foreground">
                          {localizeOptionalDigits(item.title, locale)}
                        </h3>
                        <Badge
                          variant="secondary"
                          className="text-center text-xs"
                        >
                          {localizeOptionalDigits(item.highlight, locale)}
                        </Badge>
                      </div>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {localizeOptionalDigits(item.description, locale)}
                      </p>
                    </div>
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
