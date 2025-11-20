"use client";

import { useMemo, type ComponentType } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DoctorProfile } from "@/components/DoctorProfile";
import { DoctorReviews } from "@/components/DoctorReviews";
import PriceComparison from "@/components/PriceComparison";
import { useDoctors } from "@/hooks/useDoctors";
import { useTreatments } from "@/hooks/useTreatments";
import { usePatientReviews, usePatientStories } from "@/hooks/useTestimonials";
import { selectPrimaryProcedure } from "@/lib/treatments";
import {
  ArrowLeft,
  Clock,
  DollarSign,
  Star,
  Check,
  Users,
  Heart,
  CheckCircle,
  Loader2,
  FileDown,
} from "lucide-react";

export default function TreatmentDetails() {
  const params = useParams();
  const category = params?.category as string;
  const router = useRouter();
  const { treatments, loading: treatmentsLoading } = useTreatments();

  const slug = (category || "").toLowerCase();

  const formatCurrency = (value: number, currency?: string | null) => {
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

  const dynamicTreatment = useMemo(() => {
    if (!slug || treatments.length === 0) return null;
    return (
      treatments.find((treatment) => {
        const treatmentSlug = (
          treatment.slug ||
          treatment.category ||
          ""
        ).toLowerCase();
        return treatmentSlug === slug;
      }) || null
    );
  }, [slug, treatments]);

  const normalizedTreatment = dynamicTreatment;

  const treatmentId =
    normalizedTreatment?.id ?? dynamicTreatment?.id ?? undefined;
  const treatmentSlugValue =
    normalizedTreatment?.slug ?? dynamicTreatment?.slug ?? undefined;

  const rawDoctorCategory = normalizedTreatment?.category ?? undefined;
  const doctorCategorySlug = rawDoctorCategory
    ? rawDoctorCategory.trim().toLowerCase()
    : undefined;

  const { doctors, loading: doctorsLoading } = useDoctors(doctorCategorySlug);
  const { reviews: patientReviews, loading: patientReviewsLoading } =
    usePatientReviews({
      treatmentId,
      treatmentSlug: treatmentSlugValue,
    });
  const { stories: patientStories, loading: patientStoriesLoading } =
    usePatientStories({
      treatmentId,
      treatmentSlug: treatmentSlugValue,
    });

  const treatment = useMemo(() => {
    if (!normalizedTreatment) return null;

    return {
      title: normalizedTreatment.name,
      description:
        normalizedTreatment.summary ||
        normalizedTreatment.description ||
        "Learn more about this treatment option available through Care N Tour.",
      overview:
        normalizedTreatment.overview ||
        normalizedTreatment.description ||
        "Our medical experts craft individualized treatment plans combining top specialists and service providers.",
      idealCandidates: normalizedTreatment.idealCandidates,
      procedures: normalizedTreatment.procedures,
      downloadUrl: normalizedTreatment.downloadUrl ?? null,
      quickFacts: {
        duration: normalizedTreatment.durationDays,
        recovery: normalizedTreatment.recoveryTimeDays,
        price: normalizedTreatment.basePrice,
        currency: normalizedTreatment.currency,
        successRate: normalizedTreatment.successRate,
      },
    };
  }, [normalizedTreatment]);

  const quickFacts = useMemo(() => {
    if (normalizedTreatment) {
      const primaryProcedure = selectPrimaryProcedure(
        normalizedTreatment.procedures,
      );

      const fallbackDuration =
        typeof primaryProcedure?.duration === "string"
          ? primaryProcedure.duration.trim()
          : "";
      const durationLabel = normalizedTreatment.durationDays
        ? `${normalizedTreatment.durationDays} day${normalizedTreatment.durationDays === 1 ? "" : "s"}`
        : fallbackDuration || undefined;

      const fallbackRecovery =
        typeof primaryProcedure?.recovery === "string"
          ? primaryProcedure.recovery.trim()
          : "";
      const recoveryLabel = normalizedTreatment.recoveryTimeDays
        ? `${normalizedTreatment.recoveryTimeDays} day${normalizedTreatment.recoveryTimeDays === 1 ? "" : "s"}`
        : fallbackRecovery || undefined;

      const priceValue =
        normalizedTreatment.basePrice ??
        primaryProcedure?.egyptPrice ??
        undefined;

      const fallbackSuccess =
        typeof primaryProcedure?.successRate === "string"
          ? primaryProcedure.successRate.trim()
          : "";
      const successRateLabel =
        normalizedTreatment.successRate !== undefined &&
        normalizedTreatment.successRate !== null
          ? `${normalizedTreatment.successRate}%`
          : fallbackSuccess || undefined;

      return {
        durationLabel,
        recoveryLabel,
        priceValue,
        currency: normalizedTreatment.currency ?? "USD",
        successRateLabel,
      };
    }

    return null;
  }, [normalizedTreatment]);

  const quickFactsHasContent =
    !!quickFacts &&
    Boolean(
      quickFacts.durationLabel ||
        quickFacts.recoveryLabel ||
        (typeof quickFacts.priceValue === "number" &&
          !Number.isNaN(quickFacts.priceValue)) ||
        quickFacts.successRateLabel,
    );
  const hasQuickFacts = quickFactsHasContent || Boolean(treatment?.downloadUrl);

  if (treatmentsLoading && !treatment) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="py-20">
          <div className="container mx-auto px-4 text-center text-muted-foreground">
            Loading treatment details...
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!treatment) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="py-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-3xl font-bold text-foreground mb-4">
              Treatment Not Found
            </h1>
            <p className="text-muted-foreground mb-8">
              The requested treatment category could not be found.
            </p>
            <Button onClick={() => router.push("/treatments")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Treatments
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />

      <main>
        {/* Breadcrumb Navigation */}
        <section className="py-8 bg-muted/30">
          <div className="container mx-auto px-4">
            <button
              onClick={() => router.push("/treatments")}
              className="flex items-center text-primary hover:text-primary/80 transition-colors mb-6"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to All Treatments
            </button>

            <div className="max-w-4xl">
              <Badge variant="outline" className="mb-4">
                {treatment.title}
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                {treatment.title}
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                {treatment.description}
              </p>
              <div className="mt-6 flex flex-wrap gap-4" />
            </div>
          </div>
        </section>

        {/* Treatment Overview */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              <div className="lg:col-span-2">
                <h2 className="text-3xl font-bold text-foreground mb-6">
                  Treatment Overview
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                  {treatment.overview}
                </p>

                <div className="bg-gradient-card rounded-lg p-6 border border-border/50">
                  <h3 className="text-xl font-semibold text-foreground mb-4">
                    Ideal Candidates
                  </h3>
                  {treatment.idealCandidates.length > 0 ? (
                    <ul className="space-y-3">
                      {treatment.idealCandidates.map(
                        (candidate: string, index: number) => (
                          <li key={index} className="flex items-start gap-3">
                            <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                            <span className="text-muted-foreground">
                              {candidate}
                            </span>
                          </li>
                        ),
                      )}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Candidate suitability is confirmed during your
                      consultation to ensure the treatment matches your health
                      profile.
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Card className="border-primary/20 bg-gradient-card">
                  <CardHeader>
                    <CardTitle className="text-xl text-foreground">
                      Quick Facts
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {quickFacts?.durationLabel ? (
                      <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 text-primary" />
                        <div>
                          <div className="font-medium text-foreground">
                            Treatment duration
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {quickFacts.durationLabel}
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {quickFacts?.recoveryLabel ? (
                      <div className="flex items-center gap-3">
                        <Heart className="h-5 w-5 text-primary" />
                        <div>
                          <div className="font-medium text-foreground">
                            Recovery timeline
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {quickFacts.recoveryLabel}
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {typeof quickFacts?.priceValue === "number" ? (
                      <div className="flex items-center gap-3">
                        <DollarSign className="h-5 w-5 text-primary" />
                        <div>
                          <div className="font-medium text-foreground">
                            Estimated cost
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatCurrency(
                              quickFacts.priceValue,
                              quickFacts.currency,
                            )}
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {quickFacts?.successRateLabel ? (
                      <div className="flex items-center gap-3">
                        <Star className="h-5 w-5 text-primary" />
                        <div>
                          <div className="font-medium text-foreground">
                            Success rate
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {quickFacts.successRateLabel}
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {treatment?.downloadUrl ? (
                      <div className="flex items-center gap-3">
                        <FileDown className="h-5 w-5 text-primary" />
                        <div>
                          <div className="font-medium text-foreground">
                            Treatment PDF
                          </div>
                          <a
                            href={treatment.downloadUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm text-primary underline-offset-4 hover:underline"
                          >
                            Download overview
                          </a>
                        </div>
                      </div>
                    ) : null}

                    {!hasQuickFacts && (
                      <div className="flex items-start gap-3 rounded-md border border-border/60 px-3 py-2">
                        <Users className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                          <div className="font-medium text-foreground">
                            Personalized consultation
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Our medical coordinators finalize pricing, duration,
                            and recovery timelines based on your unique case.
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Procedures Section */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Available Procedures
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Comprehensive information about each procedure including
                recovery details and candidate requirements
              </p>
            </div>

            <div className="space-y-12">
              {treatment.procedures && treatment.procedures.length > 0 ? (
                treatment.procedures.map((procedure, index) => {
                  const detailItems: {
                    label: string;
                    value: string | undefined;
                    icon: ComponentType<{ className?: string }>;
                  }[] = [
                    {
                      label: "Duration",
                      value: procedure.duration?.trim(),
                      icon: Clock,
                    },
                    {
                      label: "Recovery",
                      value: procedure.recovery?.trim(),
                      icon: Heart,
                    },
                    {
                      label: "Price",
                      value: procedure.price?.trim(),
                      icon: DollarSign,
                    },
                    {
                      label: "Success Rate",
                      value: procedure.successRate?.trim(),
                      icon: Star,
                    },
                  ];
                  const visibleDetails = detailItems.filter(
                    (
                      detail,
                    ): detail is {
                      label: string;
                      value: string;
                      icon: ComponentType<{ className?: string }>;
                    } => Boolean(detail.value),
                  );
                  const hasProcedureSummary =
                    visibleDetails.length > 0 || Boolean(procedure.pdfUrl);
                  const hasCandidateRequirements =
                    Array.isArray(procedure.candidateRequirements) &&
                    procedure.candidateRequirements.length > 0;

                  return (
                    <Card
                      key={index}
                      className="border-border/50 hover:shadow-card-hover transition-spring"
                    >
                      <CardHeader>
                        <CardTitle className="text-2xl">
                          {procedure.name}
                        </CardTitle>
                        <p className="text-muted-foreground text-lg">
                          {procedure.description}
                        </p>
                      </CardHeader>
                      <CardContent>
                        {hasProcedureSummary ? (
                          <div className="mb-8 space-y-6">
                            {visibleDetails.length > 0 ? (
                              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                                {visibleDetails.map((detail) => {
                                  const Icon = detail.icon;
                                  return (
                                    <div
                                      key={detail.label}
                                      className="text-center p-4 bg-muted/50 rounded-lg"
                                    >
                                      <Icon className="h-6 w-6 text-primary mx-auto mb-2" />
                                      <div className="text-sm font-medium text-foreground">
                                        {detail.label}
                                      </div>
                                      <div className="text-sm text-muted-foreground">
                                        {detail.value}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : null}
                            {procedure.pdfUrl ? (
                              <div className="flex flex-col gap-4 rounded-lg border border-primary/30 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                                    <FileDown className="h-5 w-5" />
                                  </div>
                                  <div>
                                    <div className="text-sm font-semibold text-foreground">
                                      Procedure PDF
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                      Download a detailed overview for this
                                      procedure.
                                    </p>
                                  </div>
                                </div>
                                <Button asChild variant="outline" size="sm">
                                  <a
                                    href={procedure.pdfUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    Download
                                  </a>
                                </Button>
                              </div>
                            ) : null}
                          </div>
                        ) : null}

                        {/* Candidate Requirements */}
                        <div className="mb-8">
                          <h4 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-primary" />
                            Candidate Requirements
                          </h4>
                          {hasCandidateRequirements ? (
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {procedure.candidateRequirements.map(
                                (req: string, reqIndex: number) => (
                                  <li
                                    key={reqIndex}
                                    className="flex items-start gap-2"
                                  >
                                    <Check className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                                    <span className="text-muted-foreground">
                                      {req}
                                    </span>
                                  </li>
                                ),
                              )}
                            </ul>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              Candidate suitability is confirmed during your
                              consultation to ensure the treatment matches your
                              health profile.
                            </p>
                          )}
                        </div>

                        {/* Additional Notes */}
                        {procedure.additionalNotes ? (
                          <div className="mb-8 rounded-lg border border-border/60 bg-muted/40 p-4 text-left">
                            <h4 className="text-lg font-semibold text-foreground">
                              Additional Notes
                            </h4>
                            <p className="mt-2 text-sm text-muted-foreground whitespace-pre-line">
                              {procedure.additionalNotes}
                            </p>
                          </div>
                        ) : null}

                        {/* Recovery Timeline */}
                        {procedure.recoveryStages &&
                        procedure.recoveryStages.length > 0 ? (
                          <div className="mb-8">
                            <h4 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                              <Clock className="h-5 w-5 text-primary" />
                              Recovery Timeline
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                              {procedure.recoveryStages.map(
                                (stage: any, stageIndex: number) => (
                                  <div
                                    key={stageIndex}
                                    className="p-4 border border-border rounded-lg"
                                  >
                                    <div className="text-sm font-medium text-primary mb-2">
                                      {stage.stage}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      {stage.description}
                                    </div>
                                  </div>
                                ),
                              )}
                            </div>
                          </div>
                        ) : null}

                        {/* Price Comparison */}
                        {procedure.internationalPrices &&
                        procedure.internationalPrices.length > 0 &&
                        procedure.egyptPrice ? (
                          <div className="mb-8">
                            <PriceComparison
                              treatment={procedure.name}
                              egyptPrice={procedure.egyptPrice}
                              internationalPrices={
                                procedure.internationalPrices
                              }
                            />
                          </div>
                        ) : null}

                        {/* Start Your Journey CTA */}
                        <div className="mt-8 pt-6 border-t border-border/50">
                          <Button
                            className="w-full"
                            onClick={() => {
                              const params = new URLSearchParams({
                                treatment: category,
                                procedure: procedure.id,
                              });
                              router.push(
                                `/start-journey?${params.toString()}`,
                              );
                            }}
                          >
                            Start Your Journey
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <div className="text-center text-muted-foreground">
                  Detailed procedure information for this treatment will be
                  provided during your consultation.
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Specialist Doctors */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Our Specialist Doctors
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Meet our internationally trained specialists who combine years
                of experience with cutting-edge techniques to deliver
                exceptional results.
              </p>
            </div>

            {doctorsLoading ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
                {[1, 2].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-muted rounded-lg h-64"></div>
                  </div>
                ))}
              </div>
            ) : doctors.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
                {doctors.map((doctor) => (
                  <DoctorProfile key={doctor.id} doctor={doctor} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  No specialists found for this treatment category.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Patient Reviews */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            {patientReviewsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : patientReviews.length > 0 ? (
              <DoctorReviews
                reviews={patientReviews.map((review) => ({
                  ...review,
                  patient_country: review.patient_country ?? "International",
                  procedure_name: review.procedure_name ?? undefined,
                  recovery_time: review.recovery_time ?? "",
                  is_verified: true,
                }))}
              />
            ) : (
              <div className="text-center py-16">
                <h3 className="text-2xl font-semibold text-foreground mb-2">
                  Patient Reviews
                </h3>
                <p className="text-muted-foreground">
                  Testimonials for this treatment will appear here as soon as
                  patients publish their stories.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Patient Stories */}
        <section className="py-20 bg-muted/20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Patient Stories
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Follow the journeys of patients who travelled with Care N Tour
                for this treatment.
              </p>
            </div>

            {patientStoriesLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : patientStories.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {patientStories.map((story) => (
                  <Card key={story.id} className="border-border/50 shadow-sm">
                    <CardHeader>
                      <Badge
                        variant="secondary"
                        className="w-fit mb-2 uppercase tracking-wide"
                      >
                        {story.locale?.toUpperCase() ?? "EN"}
                      </Badge>
                      <CardTitle className="text-2xl text-foreground">
                        {story.headline}
                      </CardTitle>
                      {story.excerpt && (
                        <p className="text-muted-foreground text-sm leading-relaxed">
                          {story.excerpt}
                        </p>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-6">
                        {story.body_markdown.replace(/[#*_`>/]/g, "")}
                      </p>
                      <div className="text-xs text-muted-foreground flex items-center justify-between">
                        {story.featured && (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700">
                            Featured success
                          </span>
                        )}
                        <span>
                          {new Date(story.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-16">
                No patient stories published yet. Check back soon for real-case
                journeys.
              </div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-hero">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-background mb-4">
              Ready to Start Your {treatment.title} Journey?
            </h2>
            <p className="text-xl text-background/90 mb-8 max-w-2xl mx-auto">
              Get a personalized treatment plan and cost estimate from our
              medical experts
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                variant="accent"
                onClick={() =>
                  router.push(`/start-journey?treatment=${category}`)
                }
              >
                Start Your Journey
              </Button>
              <Button
                size="lg"
                variant="hero"
                onClick={() => router.push("/consultation")}
              >
                Schedule Consultation
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
