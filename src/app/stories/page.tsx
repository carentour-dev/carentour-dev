"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Quote, MapPin, Calendar, Loader2 } from "lucide-react";
import { usePatientStories } from "@/hooks/useTestimonials";

const StoriesPage = () => {
  const { stories, loading, error } = usePatientStories(undefined, { limit: 12 });

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
                {stories.map((story) => (
                  <Card key={story.id} className="border-border/50 hover:shadow-card-hover transition-spring">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <CardTitle className="text-lg text-foreground">{story.headline}</CardTitle>
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span>{story.patient_name ?? "International Patient"}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(story.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <Badge variant="secondary" className="capitalize">
                          {story.treatment_slug.replace(/-/g, " ")}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="relative">
                        <Quote className="h-6 w-6 text-primary/30 absolute -top-2 -left-2" />
                        <p className="text-muted-foreground leading-relaxed pl-4 line-clamp-6">
                          {(story.excerpt || story.body_markdown).replace(/[#*_`>/]/g, "")}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-border text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          {story.doctor_name && <span>Lead specialist: {story.doctor_name}</span>}
                          {story.patient_id && (
                            <>
                              <span>•</span>
                              <Link
                                href={`/patients/${story.patient_id}`}
                                className="text-primary hover:underline"
                              >
                                View patient journey
                              </Link>
                            </>
                          )}
                        </div>
                        <span>{story.locale?.toUpperCase() ?? "EN"}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
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
};

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-4xl font-bold text-primary mb-2">{value}</p>
    <p className="text-muted-foreground">{label}</p>
  </div>
);

export default StoriesPage;
