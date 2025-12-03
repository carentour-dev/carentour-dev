import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TeamSection from "@/components/TeamSection";
import PartnerHospitals from "@/components/PartnerHospitals";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Heart, Award, Users, Globe, Shield, Clock } from "lucide-react";
import Image from "next/image";
import { BlockRenderer } from "@/components/cms/BlockRenderer";
import { getPublishedPageBySlug } from "@/lib/cms/server";

export const revalidate = 300;
export async function generateMetadata() {
  const cmsPage = await getPublishedPageBySlug("about");
  return {
    title: cmsPage?.seo?.title ?? "About | Care N Tour",
    description: cmsPage?.seo?.description ?? undefined,
    openGraph: cmsPage?.seo?.ogImage
      ? { images: [cmsPage.seo.ogImage] }
      : undefined,
  } as any;
}

export default async function About() {
  const cmsPage = await getPublishedPageBySlug("about");
  if (cmsPage?.content?.length) {
    return (
      <div className="min-h-screen">
        <Header />
        <main>
          <BlockRenderer blocks={cmsPage.content} />
        </main>
        <Footer />
      </div>
    );
  }
  const stats = [
    { icon: Heart, label: "Successful Procedures", value: "5000+" },
    { icon: Users, label: "Medical Specialists", value: "200+" },
    { icon: Globe, label: "Countries Served", value: "50+" },
    { icon: Award, label: "Years of Experience", value: "10+" },
  ];

  const values = [
    {
      icon: Shield,
      title: "Safety First",
      description:
        "We maintain the highest safety standards with internationally accredited service providers and certified medical professionals.",
    },
    {
      icon: Heart,
      title: "Patient-Centered Care",
      description:
        "Every treatment plan is personalized to meet your specific needs, ensuring optimal outcomes and comfort.",
    },
    {
      icon: Clock,
      title: "24/7 Support",
      description:
        "Our dedicated team provides round-the-clock assistance throughout your entire medical journey.",
    },
  ];

  return (
    <div className="min-h-screen">
      <Header />

      <main>
        {/* Hero Section */}
        <section className="py-20 bg-gradient-card">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <Badge variant="outline" className="mb-6">
                About Care N Tour
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
                Transforming Lives Through
                <span className="block bg-gradient-hero bg-clip-text text-transparent">
                  World-Class Healthcare
                </span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                For over a decade, we&apos;ve been connecting patients from
                around the world with Egypt&apos;s finest medical service
                providers, delivering exceptional healthcare experiences that
                combine clinical excellence with warm hospitality.
              </p>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div key={index} className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-light rounded-full mb-4">
                      <Icon className="h-8 w-8 text-primary" />
                    </div>
                    <p className="text-3xl font-bold text-foreground">
                      {stat.value}
                    </p>
                    <p className="text-muted-foreground">{stat.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Our Story Section */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto space-y-10">
              <div className="space-y-4">
                <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                  Our Story
                </h2>
                <div className="space-y-4 text-muted-foreground leading-relaxed">
                  <p>
                    Care N Tour is a leading medical tourism provider based in
                    Egypt, dedicated to helping patients access premium
                    healthcare with confidence, comfort, and ease. Formally
                    established in 2025, the company grew from years of
                    groundwork, partnerships, and practical experience in the
                    medical, digital transformation, and service-delivery
                    fields. We connect trusted Egyptian medical experts with
                    patients seeking world-class treatment abroad and guide them
                    through a seamless journey from consultation to recovery.
                  </p>
                  <p>
                    Care N Tour is led by a founding team with diverse
                    backgrounds in healthcare, medical tourism, digital
                    platforms, customer experience, and international travel
                    services. The team has worked with accredited hospitals,
                    reputable medical institutions, and major transformation
                    programs, which ensures a strong foundation in governance,
                    quality, and operational excellence.
                  </p>
                  <p>
                    We collaborate with top hospitals, accredited specialists,
                    and experienced medical professionals across Egypt to
                    provide care that is tailored to each patient&apos;s needs.
                    Our role includes helping patients choose the right doctors,
                    providing support for travel and accommodation arrangements,
                    and providing follow-up support. Every detail is handled
                    with precision and compassion.
                  </p>
                  <p>
                    The idea for Care N Tour emerged from a clear need in the
                    market. Many medical travelers previously had to manage
                    everything on their own, from verifying hospitals and
                    comparing costs to arranging travel and coordinating
                    appointments. This often led to unclear pricing, fragmented
                    services, and a stressful experience. Care N Tour brings
                    everything together in one trusted place, offering verified
                    medical providers, transparent treatment packages,
                    integrated travel arrangements, and dedicated case
                    management.
                  </p>
                  <div>
                    <p className="font-semibold text-foreground mb-2">
                      Our approach is built on three main strengths:
                    </p>
                    <ul className="list-disc pl-5 space-y-2">
                      <li>Carefully selected and verified medical partners</li>
                      <li>
                        Complete end-to-end coordination supported by technology
                      </li>
                      <li>A personalized, concierge-style experience</li>
                    </ul>
                  </div>
                  <p>
                    We believe that medical care should feel accessible,
                    transparent, and worry-free. By combining medical expertise
                    with personal guidance, we help patients and their families
                    feel supported before, during, and after treatment.
                  </p>
                  <p>
                    At Care N Tour, we are not just coordinators. We are
                    partners in your health journey. Our mission is to help you
                    access safe, advanced, and affordable treatment in Egypt.
                    Our vision is to be leaders in the medical tourism industry
                    and to help position the country as the trusted go-to global
                    destination for high-quality healthcare.
                  </p>
                  <p>
                    Your health, comfort, and peace of mind come first, and we
                    are here to guide you every step of the way.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-3">
                  <h3 className="text-2xl font-semibold text-foreground">
                    Mission
                  </h3>
                  <div className="text-muted-foreground leading-relaxed space-y-3">
                    <p>
                      Care N Tour is committed to guiding patients from around
                      the world to premium and accessible medical care in Egypt.
                      We connect them with trusted doctors and accredited
                      hospitals, while coordinating travel, accommodation, and
                      follow-up in a simple and supportive way.
                    </p>
                    <p>
                      Our mission is to create a safe and smooth medical journey
                      that feels personal, well-organized, and reassuring. With
                      a team that understands healthcare, digital services, and
                      patient needs, we work to make every step clear,
                      comfortable, and truly empowering.
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-semibold text-foreground">
                    Vision
                  </h3>
                  <div className="text-muted-foreground leading-relaxed space-y-3">
                    <p>
                      Our vision is to lead the medical tourism industry in a
                      way that helps position Egypt as a trusted first-choice
                      global destination for high-quality healthcare. We aim to
                      offer exceptional patient experiences through verified
                      medical partners, clear and honest information, and
                      thoughtful, concierge-style support.
                    </p>
                    <p>
                      By combining strong medical expertise and cutting-edge
                      digital innovation with reliable coordination and a
                      personal touch, we hope to become the most trusted partner
                      for people seeking world-class treatment in Egypt.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Our Core Values
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                The principles that guide everything we do in delivering
                exceptional medical tourism experiences
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {values.map((value, index) => {
                const Icon = value.icon;
                return (
                  <Card
                    key={index}
                    className="text-center border-border/50 hover:shadow-card-hover transition-spring"
                  >
                    <CardHeader>
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-secondary-light rounded-full mb-4 mx-auto">
                        <Icon className="h-8 w-8 text-secondary" />
                      </div>
                      <CardTitle className="text-xl">{value.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground leading-relaxed">
                        {value.description}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Team Section */}
        <TeamSection />

        {/* Partner Hospitals Section */}
        <PartnerHospitals />

        {/* CTA Section */}
        <section className="py-20 bg-gradient-hero">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-background mb-4">
              Ready to Begin Your Journey?
            </h2>
            <p className="text-xl text-background/90 mb-8 max-w-2xl mx-auto">
              Join thousands of satisfied patients who have trusted us with
              their healthcare journey
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
}
