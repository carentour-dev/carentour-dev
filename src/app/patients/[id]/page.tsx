"use client";

import { useParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { DoctorReviews } from "@/components/DoctorReviews";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import { Star, MapPin, Calendar, ChevronLeft, Loader2, Quote, Award } from "lucide-react";
import { usePatientProfile } from "@/hooks/usePatientProfile";

export default function PatientProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const { profile, loading, error } = usePatientProfile(id as string);

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading patient testimonials...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <p className="text-destructive mb-4">
              {error || "Patient testimonials not found"}
            </p>
            <Button onClick={() => router.push("/stories")}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Stories
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const { reviews = [], stories = [] } = profile;

  return (
    <div className="min-h-screen">
      <Header />

      <main>
        {/* Back Navigation */}
        <section className="py-4 bg-background border-b border-border">
          <div className="container mx-auto px-4">
            <Button
              variant="ghost"
              onClick={() => router.push("/stories")}
              className="mb-4"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to All Stories
            </Button>
          </div>
        </section>

        {/* Patient Header */}
        <section className="py-12 bg-gradient-card">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <Badge variant="outline" className="mb-4">
                Patient Testimonials
              </Badge>
              <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
                {profile.full_name}&apos;s Journey
              </h1>

              <div className="flex flex-wrap items-center justify-center gap-4 text-muted-foreground">
                {profile.nationality && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{profile.nationality}</span>
                  </div>
                )}

                {profile.home_city && (
                  <div className="flex items-center gap-2">
                    <span>•</span>
                    <span>{profile.home_city}</span>
                  </div>
                )}

                {profile.travel_year && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Traveled in {profile.travel_year}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-center gap-6 mt-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">
                    {profile.published_review_count}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {profile.published_review_count === 1 ? "Review" : "Reviews"}
                  </p>
                </div>

                <Separator orientation="vertical" className="h-12" />

                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">
                    {profile.published_story_count}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {profile.published_story_count === 1 ? "Story" : "Stories"}
                  </p>
                </div>

                {reviews.length > 0 && (
                  <>
                    <Separator orientation="vertical" className="h-12" />

                    <div className="text-center">
                      <div className="flex items-center gap-1 justify-center">
                        <Star className="h-5 w-5 text-yellow-500 fill-current" />
                        <p className="text-3xl font-bold text-foreground">
                          {(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground">Average Rating</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Patient Stories Section */}
        {stories.length > 0 && (
          <section className="py-16 bg-background">
            <div className="container mx-auto px-4">
              <div className="max-w-6xl mx-auto">
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8 text-center">
                  Patient Stories
                </h2>

                <div className="grid grid-cols-1 gap-8">
                  {stories.map((story) => (
                    <Card key={story.id} className="border-border/50">
                      <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <CardTitle className="text-xl mb-2">{story.headline}</CardTitle>
                            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                              {story.treatment_name && (
                                <Badge variant="secondary" className="capitalize">
                                  {story.treatment_name}
                                </Badge>
                              )}
                              {story.doctor_name && (
                                <div className="flex items-center gap-1">
                                  <Award className="h-4 w-4" />
                                  <span>{story.doctor_name}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span>{new Date(story.created_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                          {story.featured && (
                            <Badge variant="default">Featured</Badge>
                          )}
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        {story.excerpt && (
                          <p className="text-muted-foreground italic">{story.excerpt}</p>
                        )}

                        <div className="space-y-4">
                          <Quote className="h-6 w-6 text-primary/30" />
                          <MarkdownRenderer
                            content={story.body_markdown}
                            className="prose prose-sm max-w-none text-foreground"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Patient Reviews Section */}
        {reviews.length > 0 && (
          <section className="py-16 bg-muted/30">
            <div className="container mx-auto px-4">
              <div className="max-w-6xl mx-auto">
                <DoctorReviews reviews={reviews} />
              </div>
            </div>
          </section>
        )}

        {/* CTA Section */}
        <section className="py-20 bg-gradient-hero">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-background mb-4">
              Ready to Start Your Journey?
            </h2>
            <p className="text-xl text-background/90 mb-8 max-w-2xl mx-auto">
              Join {profile.full_name} and thousands of satisfied patients who have chosen Egypt for their medical care
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="accent" onClick={() => router.push("/contact")}>
                Get Free Consultation
              </Button>
              <Button size="lg" variant="hero" onClick={() => router.push("/treatments")}>
                Explore Treatments
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
