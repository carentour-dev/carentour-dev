"use client";

import Image from "next/image";
import Link from "next/link";
import { Building2, Award, Star, MapPin, Phone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useServiceProviders } from "@/hooks/useServiceProviders";

const FALLBACK_IMAGE = "/placeholder.svg";

const certifications = [
  {
    name: "Joint Commission International (JCI)",
    description:
      "World's leading healthcare accreditation body ensuring highest standards of patient safety and care quality.",
  },
  {
    name: "TEMOS Certification",
    description:
      "International certification specifically for medical tourism, guaranteeing excellent service for international patients.",
  },
  {
    name: "ISO Standards",
    description:
      "International quality management standards ensuring consistent, high-quality healthcare services.",
  },
  {
    name: "CBAHI Accreditation",
    description:
      "Saudi Central Board for Accreditation of Healthcare Institutions, recognized across the Middle East.",
  },
];

export default function PartnerHospitals() {
  const { serviceProviders, loading, error } = useServiceProviders({
    limit: 3,
  });

  if (loading) {
    return (
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-secondary-light rounded-full mb-6">
            <Building2 className="h-8 w-8 text-secondary animate-pulse" />
          </div>
          <p className="text-muted-foreground">Loading service providers...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <p className="text-destructive mb-4">
            Unable to load service providers right now.
          </p>
          <p className="text-sm text-muted-foreground">
            Please try again later or contact our concierge team for
            personalized recommendations.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-secondary-light rounded-full mb-6">
            <Building2 className="h-8 w-8 text-secondary" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Our Partner Hospitals & Clinics
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            We&apos;ve carefully selected premier medical service providers
            across Egypt that meet the highest international standards, ensuring
            you receive world-class healthcare in state-of-the-art environments.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {serviceProviders.slice(0, 2).map((provider) => {
            const address = (provider.address ?? {}) as Record<string, unknown>;
            const location = [address?.["city"], address?.["country"]]
              .filter(Boolean)
              .join(", ");
            const image =
              provider.images && typeof provider.images === "object"
                ? ((provider.images as Record<string, unknown>)["hero"] as
                    | string
                    | undefined)
                : undefined;

            return (
              <Card
                key={provider.id}
                className="overflow-hidden border-border/50 hover:shadow-card-hover transition-spring"
              >
                <div className="aspect-video relative overflow-hidden">
                  <Image
                    src={image || FALLBACK_IMAGE}
                    alt={provider.name}
                    fill
                    className="object-cover"
                    sizes="(min-width: 1024px) 45vw, 100vw"
                  />
                  <div className="absolute top-4 left-4">
                    <Badge
                      variant="secondary"
                      className="bg-background/90 text-foreground text-center"
                    >
                      {provider.facility_type.replace("_", " ")}
                    </Badge>
                  </div>
                  {typeof provider.rating === "number" ? (
                    <div className="absolute top-4 right-4 flex items-center gap-1 bg-background/90 rounded-full px-2 py-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span className="text-sm font-medium">
                        {provider.rating.toFixed(1)}
                      </span>
                    </div>
                  ) : null}
                </div>

                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {provider.name}
                    {location ? (
                      <div className="flex items-center text-muted-foreground">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span className="text-sm">{location}</span>
                      </div>
                    ) : null}
                  </CardTitle>
                  {provider.description ? (
                    <p className="text-muted-foreground">
                      {provider.description}
                    </p>
                  ) : null}
                </CardHeader>

                <CardContent className="space-y-4">
                  {provider.specialties && provider.specialties.length > 0 ? (
                    <div>
                      <h4 className="font-semibold mb-2">Specialties</h4>
                      <div className="flex flex-wrap gap-2">
                        {provider.specialties.map((specialty) => (
                          <Badge
                            key={specialty}
                            variant="secondary"
                            className="text-xs text-center"
                          >
                            {specialty}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {provider.amenities && provider.amenities.length > 0 ? (
                    <div>
                      <h4 className="font-semibold mb-2">Amenities</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {provider.amenities.slice(0, 6).map((feature) => (
                          <div
                            key={feature}
                            className="flex items-center text-sm text-muted-foreground"
                          >
                            <div className="w-1.5 h-1.5 bg-primary rounded-full mr-2" />
                            {feature}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <Button className="w-full mt-4" asChild>
                    <Link href="/contact">
                      <Phone className="h-4 w-4 mr-2" />
                      Contact Service Provider
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {serviceProviders.length > 2 ? (
          <div className="mb-16">
            {(() => {
              const provider = serviceProviders[2];
              const address = (provider.address ?? {}) as Record<
                string,
                unknown
              >;
              const location = [address?.["city"], address?.["country"]]
                .filter(Boolean)
                .join(", ");
              const specialties = provider.specialties ?? [];

              return (
                <Card className="border-border/50">
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                      <div>
                        <h3 className="text-xl font-bold mb-2">
                          {provider.name}
                        </h3>
                        <Badge variant="outline" className="mb-2 text-center">
                          {provider.facility_type.replace("_", " ")}
                        </Badge>
                        {provider.description ? (
                          <p className="text-muted-foreground text-sm">
                            {provider.description}
                          </p>
                        ) : null}
                        {location ? (
                          <div className="flex items-center mt-2">
                            <MapPin className="h-4 w-4 mr-1 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {location}
                            </span>
                          </div>
                        ) : null}
                      </div>

                      <div>
                        {specialties.length > 0 ? (
                          <>
                            <h4 className="font-semibold mb-2">Specialties</h4>
                            <div className="flex flex-wrap gap-1">
                              {specialties.map((specialty) => (
                                <Badge
                                  key={specialty}
                                  variant="secondary"
                                  className="text-xs text-center"
                                >
                                  {specialty}
                                </Badge>
                              ))}
                            </div>
                          </>
                        ) : null}
                      </div>

                      <div className="text-center">
                        {typeof provider.rating === "number" ? (
                          <div className="flex items-center justify-center gap-1 mb-2">
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                            <span className="font-semibold">
                              {provider.rating.toFixed(1)}
                            </span>
                          </div>
                        ) : null}
                        <Button variant="outline" asChild>
                          <Link href="/contact">Learn More</Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })()}
          </div>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {certifications.map((certification) => (
            <Card key={certification.name} className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  {certification.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {certification.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
