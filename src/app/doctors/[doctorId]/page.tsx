"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { DoctorReviews } from "@/components/DoctorReviews";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Star,
  Calendar,
  Users,
  Award,
  GraduationCap,
  Languages,
  FileText,
  ChevronLeft,
  MessageCircle,
  Phone
} from "lucide-react";
import { useDoctors, useDoctorReviews } from "@/hooks/useDoctors";

export default function DoctorDetail() {
  const { doctorId } = useParams();
  const router = useRouter();
  const { doctors, loading, error } = useDoctors();
  const doctor = doctors.find(d => d.id === doctorId);
  const { reviews, loading: reviewsLoading } = useDoctorReviews(doctorId as string || "");

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading doctor details...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !doctor) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-destructive mb-4">Doctor not found</p>
            <Button onClick={() => router.push('/doctors')}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Doctors
            </Button>
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
        {/* Back Navigation */}
        <section className="py-4 bg-background border-b border-border">
          <div className="container mx-auto px-4">
            <Button
              variant="ghost"
              onClick={() => router.push('/doctors')}
              className="mb-4"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to All Doctors
            </Button>
          </div>
        </section>

        {/* Doctor Header */}
        <section className="py-12 bg-gradient-card">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <Avatar className="w-32 h-32 border-4 border-background shadow-lg">
                  <AvatarImage src={doctor.avatar_url} alt={doctor.name} />
                  <AvatarFallback className="text-2xl">
                    {doctor.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <Badge variant="outline" className="mb-2">{doctor.specialization}</Badge>
                  <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                    {doctor.name}
                  </h1>
                  <p className="text-xl text-muted-foreground mb-4">{doctor.title}</p>

                  <div className="flex flex-wrap gap-4 mb-6">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span className="font-semibold">{doctor.patient_rating}</span>
                      <span className="text-muted-foreground">({doctor.total_reviews} reviews)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span>{doctor.experience_years} years experience</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      <span>{doctor.successful_procedures} procedures</span>
                    </div>
                  </div>

                  <Button size="lg" asChild>
                    <Link href="/consultation">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Schedule Consultation
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Doctor Details */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">

              {/* Main Content */}
              <div className="lg:col-span-2 space-y-8">

                {/* About */}
                {doctor.bio && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        About Dr. {doctor.name.split(' ')[1] || doctor.name.split(' ')[0]}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground leading-relaxed">{doctor.bio}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Education */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <GraduationCap className="h-5 w-5" />
                      Education & Training
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{doctor.education}</p>
                  </CardContent>
                </Card>

                {/* Achievements */}
                {doctor.achievements && doctor.achievements.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5" />
                        Achievements & Awards
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {doctor.achievements.map((achievement, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <Award className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                            <span className="text-muted-foreground">{achievement}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Certifications */}
                {doctor.certifications && doctor.certifications.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Certifications</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {doctor.certifications.map((cert, index) => (
                          <Badge key={index} variant="secondary">{cert}</Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Reviews */}
                {!reviewsLoading && reviews.length > 0 && (
                  <DoctorReviews reviews={reviews} />
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">

                {/* Quick Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Experience</span>
                      <span className="font-semibold">{doctor.experience_years} years</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Procedures</span>
                      <span className="font-semibold">{doctor.successful_procedures}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Publications</span>
                      <span className="font-semibold">{doctor.research_publications}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Patient Rating</span>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <span className="font-semibold">{doctor.patient_rating}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Languages */}
                {doctor.languages && doctor.languages.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Languages className="h-5 w-5" />
                        Languages
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {doctor.languages.map((language, index) => (
                          <Badge key={index} variant="outline">{language}</Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Contact CTA */}
                <Card className="bg-gradient-card">
                  <CardHeader>
                    <CardTitle>Ready to Schedule?</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Book a consultation with Dr. {doctor.name.split(' ')[1] || doctor.name.split(' ')[0]} to discuss your treatment options.
                    </p>
                    <Button className="w-full" size="lg" asChild>
                      <Link href="/consultation">Schedule Consultation</Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
