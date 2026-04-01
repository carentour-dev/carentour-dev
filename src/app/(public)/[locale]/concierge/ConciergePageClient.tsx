"use client";

import { useLocale, useTranslations } from "next-intl";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { usePatientReviews } from "@/hooks/useTestimonials";
import type { PublicLocale } from "@/i18n/routing";
import {
  localizePublicPathname,
  localizePublicPathnameWithFallback,
} from "@/lib/public/routing";
import {
  Phone,
  Car,
  MapPin,
  Users,
  Heart,
  Hotel,
  FileText,
  Shield,
  Star,
  CheckCircle,
  ArrowRight,
  Loader2,
} from "lucide-react";

export default function ConciergeServices() {
  const t = useTranslations("ConciergePage");
  const locale = useLocale() as PublicLocale;
  const languages = {
    english: t("languages.english"),
    arabic: t("languages.arabic"),
    french: t("languages.french"),
    german: t("languages.german"),
    spanish: t("languages.spanish"),
    italian: t("languages.italian"),
    russian: t("languages.russian"),
    portuguese: t("languages.portuguese"),
  };

  const services = [
    {
      category: t("services.medicalCoordination.category"),
      icon: Heart,
      description: t("services.medicalCoordination.description"),
      services: [
        t("services.medicalCoordination.items.1"),
        t("services.medicalCoordination.items.2"),
        t("services.medicalCoordination.items.3"),
        t("services.medicalCoordination.items.4"),
        t("services.medicalCoordination.items.5"),
        t("services.medicalCoordination.items.6"),
      ],
      availability: t("services.medicalCoordination.availability"),
      languages: [
        languages.english,
        languages.arabic,
        languages.french,
        languages.german,
        languages.spanish,
        languages.italian,
      ],
    },
    {
      category: t("services.travelTransportation.category"),
      icon: Car,
      description: t("services.travelTransportation.description"),
      services: [
        t("services.travelTransportation.items.1"),
        t("services.travelTransportation.items.2"),
        t("services.travelTransportation.items.3"),
        t("services.travelTransportation.items.4"),
        t("services.travelTransportation.items.5"),
        t("services.travelTransportation.items.6"),
      ],
      availability: t("services.travelTransportation.availability"),
      languages: [
        languages.english,
        languages.arabic,
        languages.german,
        languages.russian,
      ],
    },
    {
      category: t("services.accommodationServices.category"),
      icon: Hotel,
      description: t("services.accommodationServices.description"),
      services: [
        t("services.accommodationServices.items.1"),
        t("services.accommodationServices.items.2"),
        t("services.accommodationServices.items.3"),
        t("services.accommodationServices.items.4"),
        t("services.accommodationServices.items.5"),
        t("services.accommodationServices.items.6"),
      ],
      availability: t("services.accommodationServices.availability"),
      languages: [
        languages.english,
        languages.arabic,
        languages.french,
        languages.spanish,
      ],
    },
    {
      category: t("services.personalAssistant.category"),
      icon: Users,
      description: t("services.personalAssistant.description"),
      services: [
        t("services.personalAssistant.items.1"),
        t("services.personalAssistant.items.2"),
        t("services.personalAssistant.items.3"),
        t("services.personalAssistant.items.4"),
        t("services.personalAssistant.items.5"),
        t("services.personalAssistant.items.6"),
      ],
      availability: t("services.personalAssistant.availability"),
      languages: [
        languages.english,
        languages.arabic,
        languages.italian,
        languages.portuguese,
      ],
    },
    {
      category: t("services.familySupport.category"),
      icon: Shield,
      description: t("services.familySupport.description"),
      services: [
        t("services.familySupport.items.1"),
        t("services.familySupport.items.2"),
        t("services.familySupport.items.3"),
        t("services.familySupport.items.4"),
        t("services.familySupport.items.5"),
        t("services.familySupport.items.6"),
      ],
      availability: t("services.familySupport.availability"),
      languages: [
        languages.english,
        languages.arabic,
        languages.french,
        languages.german,
      ],
    },
    {
      category: t("services.culturalTourism.category"),
      icon: MapPin,
      description: t("services.culturalTourism.description"),
      services: [
        t("services.culturalTourism.items.1"),
        t("services.culturalTourism.items.2"),
        t("services.culturalTourism.items.3"),
        t("services.culturalTourism.items.4"),
        t("services.culturalTourism.items.5"),
        t("services.culturalTourism.items.6"),
      ],
      availability: t("services.culturalTourism.availability"),
      languages: [
        languages.english,
        languages.arabic,
        languages.french,
        languages.german,
        languages.spanish,
      ],
    },
  ];

  const packages = [
    {
      name: t("packages.essential.name"),
      price: "$200",
      duration: t("packages.duration"),
      description: t("packages.essential.description"),
      features: [
        t("packages.essential.features.1"),
        t("packages.essential.features.2"),
        t("packages.essential.features.3"),
        t("packages.essential.features.4"),
        t("packages.essential.features.5"),
      ],
      recommended: false,
    },
    {
      name: t("packages.complete.name"),
      price: "$350",
      duration: t("packages.duration"),
      description: t("packages.complete.description"),
      features: [
        t("packages.complete.features.1"),
        t("packages.complete.features.2"),
        t("packages.complete.features.3"),
        t("packages.complete.features.4"),
        t("packages.complete.features.5"),
        t("packages.complete.features.6"),
        t("packages.complete.features.7"),
      ],
      recommended: true,
    },
    {
      name: t("packages.vip.name"),
      price: "$500",
      duration: t("packages.duration"),
      description: t("packages.vip.description"),
      features: [
        t("packages.vip.features.1"),
        t("packages.vip.features.2"),
        t("packages.vip.features.3"),
        t("packages.vip.features.4"),
        t("packages.vip.features.5"),
        t("packages.vip.features.6"),
        t("packages.vip.features.7"),
        t("packages.vip.features.8"),
      ],
      recommended: false,
    },
  ];

  const { reviews: conciergeReviews, loading: conciergeReviewsLoading } =
    usePatientReviews({
      highlightOnly: true,
      limit: 3,
    });

  return (
    <div className="min-h-screen">
      <Header />

      <main>
        {/* Hero Section */}
        <section className="bg-surface-subtle py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <Badge variant="outline" className="mb-6">
                {t("hero.badge")}
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
                {t("hero.titleLead")}
                <span className="block text-primary">
                  {t("hero.titleAccent")}
                </span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                {t("hero.description")}
              </p>
            </div>
          </div>
        </section>

        {/* Overview Section */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
              <div>
                <h2 className="text-3xl font-bold text-foreground mb-6">
                  {t("overview.heading")}
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                  {t("overview.description")}
                </p>
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary mb-1">
                      24/7
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {t("overview.stats.supportAvailable")}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary mb-1">
                      12+
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {t("overview.stats.languagesSpoken")}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary mb-1">
                      500+
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {t("overview.stats.satisfiedFamilies")}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary mb-1">
                      99%
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {t("overview.stats.satisfactionRate")}
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <Button size="lg" asChild>
                    <Link href={localizePublicPathname("/contact", locale)}>
                      <Phone className="h-4 w-4 mr-2" />
                      {t("overview.contactTeam")}
                    </Link>
                  </Button>
                </div>
              </div>
              <div className="relative h-96">
                <Image
                  src="/concierge-services.jpg"
                  alt={t("overview.imageAlt")}
                  fill
                  className="object-cover rounded-lg shadow-elegant"
                  sizes="(min-width: 1024px) 40vw, 100vw"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                {t("servicesSection.heading")}
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                {t("servicesSection.description")}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {services.map((service, index) => {
                const Icon = service.icon;
                return (
                  <Card
                    key={index}
                    className="border-border/50 hover:shadow-card-hover transition-spring h-full"
                  >
                    <CardHeader>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-primary-light rounded-full flex items-center justify-center">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">
                            {service.category}
                          </CardTitle>
                          <Badge variant="outline" className="text-xs mt-1">
                            {service.availability}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-muted-foreground text-sm">
                        {service.description}
                      </p>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col">
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground mb-3">
                          {t("servicesSection.includedServices")}
                        </h4>
                        <ul className="space-y-2 mb-4">
                          {service.services.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                              <span className="text-sm text-muted-foreground">
                                {item}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="mt-4 pt-4 border-t border-border">
                        <p className="text-xs text-muted-foreground mb-2">
                          {t("servicesSection.languagesAvailable")}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {service.languages.map((language, langIdx) => (
                            <Badge
                              key={langIdx}
                              variant="secondary"
                              className="text-xs"
                            >
                              {language}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Service Packages */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                {t("packages.heading")}
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                {t("packages.description")}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {packages.map((pkg, index) => (
                <Card
                  key={index}
                  className={`overflow-visible border-border/50 hover:shadow-card-hover transition-spring relative ${
                    pkg.recommended ? "ring-2 ring-primary" : ""
                  }`}
                >
                  {pkg.recommended && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground">
                        <Star className="h-3 w-3 mr-1" />
                        {t("packages.mostPopular")}
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="text-center">
                    <CardTitle className="text-xl">{pkg.name}</CardTitle>
                    <div className="mt-2">
                      <span className="text-3xl font-bold text-primary">
                        {t("packages.getQuotation")}
                      </span>
                    </div>
                    <p className="text-muted-foreground text-sm mt-2">
                      {pkg.description}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-3">
                      {pkg.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-muted-foreground">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      className="w-full mt-6"
                      variant={pkg.recommended ? "default" : "outline"}
                    >
                      {pkg.recommended
                        ? t("packages.getStarted")
                        : t("packages.choosePackage")}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                {t("testimonials.heading")}
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {t("testimonials.description")}
              </p>
            </div>

            {conciergeReviewsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : conciergeReviews.length > 0 ? (
              <div className="flex flex-wrap justify-center gap-8 max-w-5xl mx-auto">
                {conciergeReviews.map((review) => (
                  <Card
                    key={review.id}
                    className="border-border/50 w-full sm:w-[22rem]"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center gap-1 mb-4">
                        {[...Array(Math.round(review.rating))].map((_, i) => (
                          <Star
                            key={i}
                            className="h-4 w-4 text-yellow-500 fill-current"
                          />
                        ))}
                      </div>

                      <p className="text-muted-foreground italic leading-relaxed mb-4">
                        &ldquo;{review.review_text}&rdquo;
                      </p>

                      <div className="border-t border-border pt-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-foreground">
                              {review.patient_name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {review.patient_country ??
                                t("testimonials.internationalPatient")}
                            </p>
                          </div>
                          {review.treatment_slug && (
                            <Badge
                              variant="outline"
                              className="text-xs capitalize"
                            >
                              {review.treatment_slug.replace(/-/g, " ")}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground">
                {t("testimonials.empty")}
              </div>
            )}
          </div>
        </section>

        {/* Contact Section */}
        <section className="bg-surface-brand py-20">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-background mb-4">
              {t("cta.heading")}
            </h2>
            <p className="text-xl text-background/90 mb-8 max-w-2xl mx-auto">
              {t("cta.description")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="premium" asChild>
                <Link
                  href={localizePublicPathnameWithFallback(
                    "/consultation",
                    locale,
                  )}
                  className="text-center"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  {t("cta.getFreeConsultation")}
                </Link>
              </Button>
              <Button size="lg" variant="hero">
                <FileText className="h-4 w-4 mr-2" />
                {t("cta.downloadServiceGuide")}
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
