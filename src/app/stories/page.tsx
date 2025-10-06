"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Quote, MapPin, Calendar, Loader2, Globe2, Stethoscope } from "lucide-react";
import { usePatientStories } from "@/hooks/useTestimonials";

const StoriesPage = () => {
  const { stories, loading, error } = usePatientStories({ limit: 12 });

  return (
    <div className="min-h-screen">
      <Header />

      <main>
        <section className="py-20 bg-gradient-card">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <Badge variant="outline" className="mb-6">
                Patient Stories
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
                Real Stories from
                <span className="block bg-gradient-hero bg-clip-text text-transparent">
                  Real Patients
                </span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Discover how patients from around the world have transformed their lives through world-class medical care
                in Egypt.
              </p>
            </div>
          </div>
        </section>

        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <Stat label="Successful Procedures" value="5000+" />
              <Stat label="Countries Served" value="50+" />
              <Stat label="Satisfaction Rate" value="98%" />
              <Stat label="Average Savings" value="70%" />
            </div>
          </div>
        </section>

        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Transformative Journeys
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Read about the experiences of patients who chose Egypt for their medical care
              </p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <div className="text-center text-destructive">Failed to load patient stories.</div>
            ) : stories.length === 0 ? (
              <div className="text-center text-muted-foreground">
                Stories are coming soon. Check back to hear from our latest patients.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {stories.map((story) => {
                  const treatmentLabel = story.treatment_name
                    ? story.treatment_name
                    : story.treatment_slug?.replace(/-/g, " ") ?? "Medical Journey";
                  const cleanCopy = (story.excerpt || story.body_markdown)
                    .replace(/[#*_`>/]/g, "")
                    .replace(/\s+/g, " ")
                    .trim();
                  const outcomeHighlight = cleanCopy.split(/[.!?]/).map((segment) => segment.trim()).find(Boolean);
                  const formattedDate = new Date(story.created_at).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });
                  const localeBadge = story.locale?.toUpperCase() ?? "EN";

                  return (
                    <Card
                      key={story.id}
                      className="overflow-hidden border-border/50 hover:shadow-card-hover transition-spring h-full"
                    >
                      <div className="md:grid md:grid-cols-[minmax(220px,260px)_1fr] lg:grid-cols-[280px_1fr] h-full">
                        <div className="relative bg-background p-6 flex h-full flex-col">
                          <span className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-primary/80 via-primary to-accent" />
                          <div className="flex flex-col gap-6">
                            <div className="space-y-2">
                              <p className="text-xs uppercase tracking-wide text-muted-foreground">Treatment Center</p>
                              <Badge variant="secondary" className="px-3 py-1 rounded-full text-sm font-medium">
                                {treatmentLabel}
                              </Badge>
                            </div>

                            {outcomeHighlight && (
                              <div className="rounded-xl bg-muted/40 p-4">
                                <p className="text-xs uppercase tracking-wide text-muted-foreground">Outcome</p>
                                <p className="mt-2 text-sm text-foreground leading-relaxed">
                                  {outcomeHighlight}
                                </p>
                              </div>
                            )}

                            <div className="space-y-3 pt-2 border-t border-border/60">
                              <div className="flex items-start gap-3">
                                <div className="rounded-full bg-primary/15 p-2 text-primary">
                                  <MapPin className="h-4 w-4" />
                                </div>
                                <div>
                                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Patient</p>
                                  <p className="text-sm font-medium text-foreground">
                                    {story.patient_name ?? "International Patient"}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-start gap-3">
                                <div className="rounded-full bg-primary/15 p-2 text-primary">
                                  <Calendar className="h-4 w-4" />
                                </div>
                                <div>
                                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Treatment Date</p>
                                  <p className="text-sm font-medium text-foreground">{formattedDate}</p>
                                </div>
                              </div>

                              <div className="flex items-start gap-3">
                                <div className="rounded-full bg-primary/15 p-2 text-primary">
                                  <Globe2 className="h-4 w-4" />
                                </div>
                                <div>
                                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Language</p>
                                  <Badge variant="outline" className="mt-1 text-xs uppercase tracking-wide">
                                    {localeBadge}
                                  </Badge>
                                </div>
                              </div>

                              {story.doctor_name && (
                                <div className="flex items-start gap-3">
                                  <div className="rounded-full bg-primary/15 p-2 text-primary">
                                    <Stethoscope className="h-4 w-4" />
                                  </div>
                                  <div>
                                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Lead Specialist</p>
                                    <p className="text-sm font-medium text-foreground">{story.doctor_name}</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="bg-muted/20 p-6 flex h-full flex-col">
                          <div className="flex items-start gap-4">
                            <div className="rounded-2xl bg-primary/15 p-3 text-primary">
                              <Quote className="h-6 w-6" />
                            </div>
                            <div className="space-y-3">
                              <h3 className="text-2xl font-semibold text-foreground leading-snug">
                                {story.headline}
                              </h3>
                              <p className="text-base text-muted-foreground leading-relaxed line-clamp-7">
                                {cleanCopy}
                              </p>
                            </div>
                          </div>

                          <div className="mt-auto flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-border/60">
                            <div className="text-sm text-muted-foreground">
                              {story.doctor_name ? `Coordinated with ${story.doctor_name}` : "Personal care from our team"}
                            </div>
                            <div className="flex flex-wrap gap-3">
                              {story.patient_id && (
                                <Button asChild size="sm">
                                  <Link href={`/patients/${story.patient_id}`}>Read full journey</Link>
                                </Button>
                              )}
                              {story.treatment_slug && (
                                <Button asChild size="sm" variant="ghost" className="text-primary hover:text-primary">
                                  <Link href={`/treatments/${story.treatment_slug}`}>Explore treatment</Link>
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}

            <div className="text-center mt-12">
              <Button size="lg" asChild>
                <Link href="/contact">Share Your Story</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="py-20 bg-gradient-hero">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-background mb-4">
              Ready to Write Your Success Story?
            </h2>
            <p className="text-xl text-background/90 mb-8 max-w-2xl mx-auto">
              Join thousands of satisfied patients who have chosen Egypt for their medical care
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="accent" asChild>
                <Link href="/consultation">Get Free Consultation</Link>
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
};

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-4xl font-bold text-primary mb-2">{value}</p>
    <p className="text-muted-foreground">{label}</p>
  </div>
);

export default StoriesPage;
