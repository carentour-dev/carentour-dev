"use client";

import type { ComponentType } from "react";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useTreatments } from "@/hooks/useTreatments";
import { useDoctors } from "@/hooks/useDoctors";
import PriceComparison from "@/components/PriceComparison";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  ChevronDown,
  ChevronUp,
  Eye,
  Heart,
  Scissors,
  Smile,
  Stethoscope,
  Users,
} from "lucide-react";

const iconMap: Record<string, ComponentType<{ className?: string }>> = {
  "cardiac-surgery": Heart,
  "heart surgery": Heart,
  "cardiology": Heart,
  "eye-surgery": Eye,
  ophthalmology: Eye,
  "dental-care": Smile,
  dental: Smile,
  dentistry: Smile,
  "cosmetic-surgery": Scissors,
  cosmetic: Scissors,
  "general-surgery": Stethoscope,
  general: Stethoscope,
  "orthopedic-surgery": Activity,
  orthopedic: Activity,
};

const priceComparisonMap = {
  "cardiac-surgery": {
    egyptPrice: 8500,
    internationalPrices: [
      { country: "United States", flag: "🇺🇸", price: 45000, currency: "$" },
      { country: "United Kingdom", flag: "🇬🇧", price: 38000, currency: "£" },
      { country: "Germany", flag: "🇩🇪", price: 35000, currency: "€" },
      { country: "Canada", flag: "🇨🇦", price: 42000, currency: "C$" },
    ],
  },
  "eye-surgery": {
    egyptPrice: 1200,
    internationalPrices: [
      { country: "United States", flag: "🇺🇸", price: 4500, currency: "$" },
      { country: "United Kingdom", flag: "🇬🇧", price: 3800, currency: "£" },
      { country: "Germany", flag: "🇩🇪", price: 3200, currency: "€" },
      { country: "Canada", flag: "🇨🇦", price: 3900, currency: "C$" },
    ],
  },
  "dental-care": {
    egyptPrice: 300,
    internationalPrices: [
      { country: "United States", flag: "🇺🇸", price: 2500, currency: "$" },
      { country: "United Kingdom", flag: "🇬🇧", price: 2200, currency: "£" },
      { country: "Germany", flag: "🇩🇪", price: 1800, currency: "€" },
      { country: "Canada", flag: "🇨🇦", price: 2100, currency: "C$" },
    ],
  },
  "cosmetic-surgery": {
    egyptPrice: 2800,
    internationalPrices: [
      { country: "United States", flag: "🇺🇸", price: 12000, currency: "$" },
      { country: "United Kingdom", flag: "🇬🇧", price: 10500, currency: "£" },
      { country: "Germany", flag: "🇩🇪", price: 9800, currency: "€" },
      { country: "Canada", flag: "🇨🇦", price: 11200, currency: "C$" },
    ],
  },
  "general-surgery": {
    egyptPrice: 1500,
    internationalPrices: [
      { country: "United States", flag: "🇺🇸", price: 8500, currency: "$" },
      { country: "United Kingdom", flag: "🇬🇧", price: 7200, currency: "£" },
      { country: "Germany", flag: "🇩🇪", price: 6800, currency: "€" },
      { country: "Canada", flag: "🇨🇦", price: 7800, currency: "C$" },
    ],
  },
  "orthopedic-surgery": {
    egyptPrice: 4200,
    internationalPrices: [
      { country: "United States", flag: "🇺🇸", price: 22000, currency: "$" },
      { country: "United Kingdom", flag: "🇬🇧", price: 18500, currency: "£" },
      { country: "Germany", flag: "🇩🇪", price: 17200, currency: "€" },
      { country: "Canada", flag: "🇨🇦", price: 19800, currency: "C$" },
    ],
  },
} as const;

const formatCurrency = (value: number, currency?: string) => {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 0,
    }).format(value);
  } catch (error) {
    return `$${value.toLocaleString()}`;
  }
};

export default function Treatments() {
  const router = useRouter();
  const { treatments, loading, error } = useTreatments();
  const { doctors } = useDoctors();
  const [expandedComparison, setExpandedComparison] = useState<string | null>(null);

  const cards = useMemo(() => {
    return treatments.map((treatment) => {
      const key = treatment.slug || treatment.category || treatment.name;
      const iconKey = treatment.slug || treatment.category || "";
      const Icon = iconMap[iconKey.toLowerCase()] || Stethoscope;
      const comparison =
        priceComparisonMap[treatment.slug as keyof typeof priceComparisonMap] ||
        priceComparisonMap[(treatment.category as keyof typeof priceComparisonMap) ?? ""];

      return {
        id: treatment.slug,
        title: treatment.name,
        icon: Icon,
        summary: treatment.summary || "World-class treatment delivered by accredited specialists.",
        description: treatment.description,
        basePrice: typeof treatment.base_price === "number" ? treatment.base_price : null,
        currency: treatment.currency || "USD",
        isActive: treatment.is_active !== false,
        comparison,
      };
    });
  }, [treatments]);

  const comparisonEntries = cards.filter(
    (card) => card.basePrice !== null && card.comparison,
  );

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading treatments...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-destructive mb-4">Error loading treatments: {error}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />

      <main>
        <section className="py-20 bg-gradient-card">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <Badge variant="outline" className="mb-6">
                Medical Treatments
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
                Comprehensive
                <span className="block bg-gradient-hero bg-clip-text text-transparent">
                  Medical Services
                </span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Discover our full range of medical treatments performed by certified specialists in state-of-the-art
                facilities across Egypt.
              </p>
            </div>
          </div>
        </section>

        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Our Medical Specialties
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                World-class medical care across multiple specialties with significant cost savings.
              </p>
            </div>

            {cards.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">
                  Treatments will appear here once they are published in the admin dashboard.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {cards.map((category) => {
                  const Icon = category.icon;
                  const basePriceLabel =
                    category.basePrice !== null
                      ? formatCurrency(category.basePrice, category.currency)
                      : "Contact us for pricing";

                  return (
                    <Card key={category.id} className="border-border/50 hover:shadow-card-hover transition-spring group">
                      <CardHeader className="text-center">
                        <Icon className="h-10 w-10 text-primary mx-auto mb-4" />
                        <CardTitle className="text-xl font-bold text-foreground">
                          {category.title}
                        </CardTitle>
                        <p className="text-muted-foreground mt-2">{category.summary}</p>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {category.description ? (
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {category.description}
                            </p>
                          ) : null}

                          <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 text-center">
                            <p className="text-sm font-medium text-primary mb-1">Starting at</p>
                            <p className="text-2xl font-bold text-primary">{basePriceLabel}</p>
                          </div>

                          <div className="grid grid-cols-1 gap-3">
                            <Button
                              className="w-full"
                              variant="outline"
                              onClick={() => router.push(`/treatments/${category.id}`)}
                            >
                              Learn More
                            </Button>

                            {category.comparison && category.basePrice !== null ? (
                              <Button
                                className="w-full"
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  setExpandedComparison(
                                    expandedComparison === category.id ? null : category.id,
                                  )
                                }
                              >
                                {expandedComparison === category.id ? (
                                  <>
                                    Hide Price Comparison
                                    <ChevronUp className="ml-2 h-4 w-4" />
                                  </>
                                ) : (
                                  <>
                                    View Savings
                                    <ChevronDown className="ml-2 h-4 w-4" />
                                  </>
                                )}
                              </Button>
                            ) : null}
                          </div>

                          {expandedComparison === category.id &&
                            category.comparison &&
                            category.basePrice !== null && (
                              <div className="mt-4">
                                <PriceComparison
                                  treatment={category.title}
                                  egyptPrice={category.comparison.egyptPrice}
                                  internationalPrices={category.comparison.internationalPrices}
                                />
                              </div>
                            )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <section className="py-20 bg-primary/5">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Why Choose Egypt for Your Medical Treatment?
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Experience world-class healthcare at a fraction of international costs. Our patients save an average of
                70-85% compared to Western countries.
              </p>
            </div>

            {comparisonEntries.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
                {comparisonEntries.slice(0, 2).map((entry) => (
                  <PriceComparison
                    key={entry.id}
                    treatment={entry.title}
                    egyptPrice={entry.comparison!.egyptPrice}
                    internationalPrices={entry.comparison!.internationalPrices}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground">
                Dynamic price comparisons will appear once treatments include pricing data.
              </div>
            )}

            <div className="text-center mt-12">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                <div className="p-6 bg-background rounded-lg border border-border/50 shadow-sm">
                  <div className="text-3xl font-bold text-primary mb-2">75%</div>
                  <div className="text-foreground font-semibold mb-1">Average Savings</div>
                  <div className="text-sm text-muted-foreground">Compared to US prices</div>
                </div>
                <div className="p-6 bg-background rounded-lg border border-border/50 shadow-sm">
                  <div className="text-3xl font-bold text-primary mb-2">$15K+</div>
                  <div className="text-foreground font-semibold mb-1">Money Saved</div>
                  <div className="text-sm text-muted-foreground">Average per procedure</div>
                </div>
                <div className="p-6 bg-background rounded-lg border border-border/50 shadow-sm">
                  <div className="text-3xl font-bold text-primary mb-2">5000+</div>
                  <div className="text-foreground font-semibold mb-1">Happy Patients</div>
                  <div className="text-sm text-muted-foreground">From around the world</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Meet Our Specialists
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Connect with our experienced doctors who specialize in your treatment area.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 items-center justify-center">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-5 w-5" />
                <span>{doctors.length} Specialist Doctors Available</span>
              </div>
              <Link href="/doctors">
                <Button size="lg" variant="outline">
                  Browse All Doctors
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="py-20 bg-gradient-hero">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-background mb-4">
              Ready to Start Your Treatment Journey?
            </h2>
            <p className="text-xl text-background/90 mb-8 max-w-2xl mx-auto">
              Get a personalized treatment plan and cost estimate from our medical experts.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="accent" asChild>
                <Link href="/contact">Get Free Consultation</Link>
              </Button>
              <Button size="lg" variant="hero" asChild>
                <Link href="/start-journey">Start Your Journey</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
