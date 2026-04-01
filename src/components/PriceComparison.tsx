import { useLocale, useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingDown, DollarSign } from "lucide-react";
import type { PublicLocale } from "@/i18n/routing";
import { getPublicNumberLocale } from "@/lib/public/numbers";

interface CountryPrice {
  country: string;
  flag?: string;
  price: number;
  currency: string;
}

interface PriceComparisonProps {
  treatment: string;
  egyptPrice: number;
  internationalPrices: CountryPrice[];
  className?: string;
}

const PriceComparison = ({
  treatment,
  egyptPrice,
  internationalPrices,
  className,
}: PriceComparisonProps) => {
  const t = useTranslations("PriceComparison");
  const locale = useLocale() as PublicLocale;

  if (internationalPrices.length === 0) {
    return null;
  }

  const numberFormatter = new Intl.NumberFormat(getPublicNumberLocale(locale));

  const calculateSavings = (internationalPrice: number) => {
    const savings = internationalPrice - egyptPrice;
    const percentage = Math.round((savings / internationalPrice) * 100);
    return { amount: savings, percentage };
  };

  const averageSavings =
    internationalPrices.reduce((total, country) => {
      return total + calculateSavings(country.price).percentage;
    }, 0) / internationalPrices.length;

  const totalAverageSavings =
    internationalPrices.reduce((total, country) => {
      return total + calculateSavings(country.price).amount;
    }, 0) / internationalPrices.length;

  return (
    <Card className={`border-border/50 ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <DollarSign className="h-5 w-5 text-primary" />
          {t("title", { treatment })}
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge
            variant="secondary"
            className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
          >
            <TrendingDown className="h-3 w-3 mr-1" />
            {t("saveUpTo", { percentage: Math.round(averageSavings) })}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Egypt Price */}
          <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🇪🇬</span>
                <div>
                  <h4 className="font-semibold text-foreground">
                    {t("egypt")}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {t("ourPrice")}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">
                  ${numberFormatter.format(egyptPrice)}
                </p>
                <p className="text-sm text-primary">{t("bestValue")}</p>
              </div>
            </div>
          </div>

          {/* International Prices */}
          <div className="space-y-3">
            {internationalPrices.map((country, index) => {
              const savings = calculateSavings(country.price);
              return (
                <div
                  key={index}
                  className="p-3 bg-muted/30 rounded-lg border border-border/50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{country.flag ?? "🌍"}</span>
                      <div>
                        <h4 className="font-medium text-foreground">
                          {country.country}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {t("typicalCost")}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-foreground">
                        {country.currency}
                        {numberFormatter.format(country.price)}
                      </p>
                      <div className="flex items-center gap-1">
                        <TrendingDown className="h-3 w-3 text-green-600" />
                        <span className="text-sm text-green-600 font-medium">
                          {t("saveAmount", {
                            amount: `$${numberFormatter.format(savings.amount)}`,
                            percentage: savings.percentage,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="text-center">
              <p className="text-sm text-green-700 dark:text-green-300 mb-1">
                {t("averageSavings")}
              </p>
              <p className="text-2xl font-bold text-green-800 dark:text-green-200">
                ${numberFormatter.format(Math.round(totalAverageSavings))}
              </p>
              <p className="text-sm text-green-600 dark:text-green-400">
                {t("averageSavingsDescription", {
                  percentage: Math.round(averageSavings),
                })}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PriceComparison;
