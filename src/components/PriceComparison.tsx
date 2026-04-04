import { useLocale, useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingDown, DollarSign } from "lucide-react";
import type { PublicLocale } from "@/i18n/routing";
import { getPublicNumberLocale } from "@/lib/public/numbers";
import { localizeCompanyName } from "@/lib/public/brand";
import { localizeCountryName } from "@/lib/public/countries";

interface CountryPrice {
  country: string;
  flag?: string;
  price: number;
  currency: string;
}

interface PriceComparisonProps {
  treatment: string;
  egyptPrice: number;
  egyptCurrency?: string;
  internationalPrices: CountryPrice[];
  className?: string;
}

const CURRENCY_CODE_BY_VALUE: Record<string, string> = {
  USD: "USD",
  $: "USD",
  US$: "USD",
  GBP: "GBP",
  "£": "GBP",
  BRL: "BRL",
  R$: "BRL",
  EGP: "EGP",
  "E£": "EGP",
  "ج.م": "EGP",
};

const PriceComparison = ({
  treatment,
  egyptPrice,
  egyptCurrency = "USD",
  internationalPrices,
  className,
}: PriceComparisonProps) => {
  const t = useTranslations("PriceComparison");
  const locale = useLocale() as PublicLocale;

  if (internationalPrices.length === 0) {
    return null;
  }

  const numberLocale = getPublicNumberLocale(locale);
  const numberFormatter = new Intl.NumberFormat(numberLocale);

  const formatMoney = (value: number, currency: string) => {
    const normalizedCurrency = currency.trim();
    const currencyCode =
      CURRENCY_CODE_BY_VALUE[normalizedCurrency.toUpperCase()] ??
      CURRENCY_CODE_BY_VALUE[normalizedCurrency];

    if (currencyCode) {
      try {
        return new Intl.NumberFormat(numberLocale, {
          style: "currency",
          currency: currencyCode,
          maximumFractionDigits: 0,
        }).format(value);
      } catch {
        // Fall through to symbol-based formatting.
      }
    }

    const formattedValue = numberFormatter.format(value);
    return locale === "ar"
      ? `${formattedValue}${normalizedCurrency}`
      : `${normalizedCurrency}${formattedValue}`;
  };

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
          {t("title", { treatment: localizeCompanyName(treatment, locale) })}
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
                  {formatMoney(egyptPrice, egyptCurrency)}
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
                          {localizeCountryName(country.country, locale)}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {t("typicalCost")}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-foreground">
                        {formatMoney(country.price, country.currency)}
                      </p>
                      <div className="flex items-center gap-1">
                        <TrendingDown className="h-3 w-3 text-green-600" />
                        <span className="text-sm text-green-600 font-medium">
                          {t("saveAmount", {
                            amount: formatMoney(
                              savings.amount,
                              country.currency,
                            ),
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
                {formatMoney(Math.round(totalAverageSavings), egyptCurrency)}
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
