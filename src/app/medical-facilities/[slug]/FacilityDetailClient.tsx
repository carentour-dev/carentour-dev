"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useMedicalFacility } from "@/hooks/useMedicalFacility";
import {
  buildProcedureMap,
  formatFacilityLocation,
  getProceduresForProvider,
  pickFacilityImage,
  type MedicalFacilityDetail,
} from "@/lib/medical-facilities";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Globe,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Star,
} from "lucide-react";

type Props = {
  slug: string;
  initialData: MedicalFacilityDetail;
};

type ContactInfo = Record<string, unknown>;

const extractField = (keys: string[], source: ContactInfo) => {
  for (const key of keys) {
    const value = source?.[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return undefined;
};

export default function FacilityDetailClient({ slug, initialData }: Props) {
  const { data, isLoading, isFetching, error } = useMedicalFacility(
    slug,
    initialData,
  );

  const detail = data ?? initialData;
  const provider = detail?.provider;
  const proceduresMap = useMemo(
    () => buildProcedureMap(detail?.procedures ?? []),
    [detail?.procedures],
  );
  const procedures = provider
    ? getProceduresForProvider(provider, proceduresMap)
    : [];
  const location = provider ? formatFacilityLocation(provider) : "";
  const heroImage = provider ? pickFacilityImage(provider) : "";
  const contactInfo = (provider?.contact_info ?? {}) as ContactInfo;
  const address = (provider?.address ?? {}) as Record<string, unknown>;
  const infrastructure = (provider?.infrastructure ?? null) as Record<
    string,
    unknown
  > | null;
  const gallery = Array.isArray(provider?.gallery_urls)
    ? provider.gallery_urls.filter(Boolean)
    : [];

  const phone = extractField(
    ["phone", "phone_number", "telephone", "mobile"],
    contactInfo,
  );
  const email = extractField(["email", "contact_email"], contactInfo);
  const website = extractField(["website", "url", "site"], contactInfo);
  const whatsapp = extractField(["whatsapp", "whatsapp_number"], contactInfo);
  const normalizedWebsite =
    website && (website.startsWith("http") ? website : `https://${website}`);
  const toText = (value: unknown) =>
    typeof value === "string" && value.trim() ? value.trim() : undefined;
  const addressLine1 = toText(address["line1"]);
  const addressLine2 = toText(address["line2"]);
  const addressState = toText(address["state"] ?? address["region"]);
  const postalCode = toText(address["postal_code"] ?? address["postalCode"]);

  const isNotFound = (error as { status?: number } | null)?.status === 404;

  if (isLoading && !provider) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="flex min-h-screen items-center justify-center">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading medical facility...
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!provider || isNotFound) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="flex min-h-screen items-center justify-center">
          <div className="space-y-4 text-center">
            <p className="text-lg font-semibold text-foreground">
              Medical facility not found
            </p>
            <p className="text-muted-foreground">
              The facility you are looking for may have been removed or is not
              available to view.
            </p>
            <Button asChild>
              <Link href="/medical-facilities">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Medical Facilities
              </Link>
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <section className="relative isolate overflow-hidden bg-gradient-card">
          <div className="absolute inset-0">
            <Image
              src={heroImage}
              alt={provider.name}
              fill
              sizes="100vw"
              className="object-cover opacity-40"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-background/50" />
          </div>
          <div className="relative z-10">
            <div className="container mx-auto px-4 py-12 sm:py-16 lg:py-20">
              <div className="mb-6 flex items-center gap-3 text-sm text-muted-foreground">
                <ArrowLeft className="h-4 w-4" />
                <Link
                  href="/medical-facilities"
                  className="inline-flex items-center gap-2 text-foreground underline-offset-4 hover:underline"
                >
                  Back to Medical Facilities
                </Link>
              </div>
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge variant="secondary" className="bg-background/90">
                      <Building2 className="mr-1 h-4 w-4" />
                      {provider.facility_type.replace("_", " ")}
                    </Badge>
                    {location ? (
                      <Badge variant="outline" className="bg-background/80">
                        <MapPin className="mr-1 h-4 w-4" />
                        {location}
                      </Badge>
                    ) : null}
                    {provider.is_partner === false ? null : (
                      <Badge variant="outline" className="bg-background/80">
                        <CheckCircle2 className="mr-1 h-4 w-4 text-green-500" />
                        Partner facility
                      </Badge>
                    )}
                  </div>
                  <h1 className="text-3xl font-bold leading-tight text-foreground sm:text-4xl">
                    {provider.name}
                  </h1>
                  {(provider.overview || provider.description) && (
                    <p className="max-w-3xl text-base text-muted-foreground sm:text-lg">
                      {provider.overview ?? provider.description}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-4">
                    {typeof provider.rating === "number" ? (
                      <div className="inline-flex items-center gap-2 rounded-full bg-background/80 px-4 py-2 text-sm font-semibold shadow-sm">
                        <Star className="h-4 w-4 text-yellow-500" />
                        {provider.rating.toFixed(1)}
                        {provider.review_count ? (
                          <span className="text-muted-foreground">
                            ({provider.review_count} reviews)
                          </span>
                        ) : null}
                      </div>
                    ) : provider.review_count ? (
                      <div className="inline-flex items-center gap-2 rounded-full bg-background/80 px-4 py-2 text-sm font-semibold shadow-sm">
                        <Star className="h-4 w-4 text-yellow-500" />
                        {provider.review_count} reviews
                      </div>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button asChild size="lg" variant="secondary">
                      <Link href="/contact">Contact</Link>
                    </Button>
                    <Button asChild size="lg">
                      <Link href="/start-journey">Start your journey</Link>
                    </Button>
                  </div>
                  {isFetching ? (
                    <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Updating latest details...
                    </div>
                  ) : null}
                </div>
                {provider.logo_url ? (
                  <div className="relative aspect-square w-full max-w-[22rem] lg:w-[22rem] overflow-hidden rounded-2xl border border-border/60 bg-background/80 p-10 shadow-sm backdrop-blur">
                    <Image
                      src={provider.logo_url}
                      alt={`${provider.name} logo`}
                      fill
                      sizes="(min-width: 1024px) 22rem, 90vw"
                      className="object-contain"
                    />
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-background py-12 sm:py-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              <div className="space-y-6 lg:col-span-2">
                {(provider.overview || provider.description) && (
                  <Card>
                    <CardHeader>
                      <CardTitle>About this facility</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="leading-relaxed text-muted-foreground">
                        {provider.overview ?? provider.description}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {provider.specialties && provider.specialties.length > 0 ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>Specialties</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {provider.specialties.map((specialty) => (
                          <Badge key={specialty} variant="outline">
                            {specialty}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ) : null}

                {procedures.length > 0 ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>Procedures</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {procedures.map((procedure) => (
                          <Badge key={procedure.id} variant="secondary">
                            {procedure.name}
                            {procedure.treatmentName
                              ? ` • ${procedure.treatmentName}`
                              : ""}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ) : null}

                {provider.facilities && provider.facilities.length > 0 ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>Facilities provided</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {provider.facilities.map((item) => (
                          <Badge key={item} variant="outline">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ) : null}

                {provider.amenities && provider.amenities.length > 0 ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>Amenities</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {provider.amenities.map((item) => (
                          <Badge key={item} variant="outline">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ) : null}

                {infrastructure && Object.keys(infrastructure).length > 0 ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>Infrastructure &amp; technology</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {Object.entries(infrastructure).map(([key, value]) => (
                        <div key={key} className="flex justify-between gap-4">
                          <span className="text-muted-foreground capitalize">
                            {key.replace(/_/g, " ")}
                          </span>
                          <span className="text-foreground">
                            {typeof value === "string"
                              ? value
                              : Array.isArray(value)
                                ? value.join(", ")
                                : value !== null && typeof value === "object"
                                  ? JSON.stringify(value)
                                  : String(value)}
                          </span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ) : null}

                {gallery.length > 0 ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>Gallery</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {gallery.map((url) => (
                          <div
                            key={url}
                            className="relative h-48 overflow-hidden rounded-lg"
                          >
                            <Image
                              src={url}
                              alt={`${provider.name} gallery`}
                              fill
                              sizes="(min-width: 768px) 50vw, 100vw"
                              className="object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ) : null}
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Key details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        Facility type
                      </span>
                      <span className="font-semibold capitalize">
                        {provider.facility_type.replace("_", " ")}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Location</span>
                      <span className="font-semibold">{location || "—"}</span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Partner</span>
                      <span className="font-semibold">
                        {provider.is_partner === false ? "No" : "Yes"}
                      </span>
                    </div>
                    {typeof provider.rating === "number" ? (
                      <>
                        <Separator />
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Rating</span>
                          <span className="font-semibold">
                            {provider.rating.toFixed(1)}
                          </span>
                        </div>
                      </>
                    ) : null}
                    {typeof provider.review_count === "number" ? (
                      <>
                        <Separator />
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Reviews</span>
                          <span className="font-semibold">
                            {provider.review_count}
                          </span>
                        </div>
                      </>
                    ) : null}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Contact &amp; location</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {phone ? (
                      <div className="flex items-center gap-3">
                        <Phone className="h-4 w-4 text-primary" />
                        <span className="text-foreground">{phone}</span>
                      </div>
                    ) : null}
                    {email ? (
                      <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4 text-primary" />
                        <span className="text-foreground">{email}</span>
                      </div>
                    ) : null}
                    {website ? (
                      <div className="flex items-center gap-3">
                        <Globe className="h-4 w-4 text-primary" />
                        <Link
                          href={normalizedWebsite}
                          target="_blank"
                          rel="noreferrer"
                          className="text-foreground underline-offset-4 hover:underline"
                        >
                          {website}
                        </Link>
                      </div>
                    ) : null}
                    {whatsapp ? (
                      <div className="flex items-center gap-3">
                        <Phone className="h-4 w-4 text-primary" />
                        <span className="text-foreground">
                          WhatsApp: {whatsapp}
                        </span>
                      </div>
                    ) : null}
                    <div className="space-y-1 text-sm">
                      {addressLine1 ? (
                        <p className="text-foreground">{addressLine1}</p>
                      ) : null}
                      {addressLine2 ? (
                        <p className="text-foreground">{addressLine2}</p>
                      ) : null}
                      {addressState ? (
                        <p className="text-muted-foreground">{addressState}</p>
                      ) : null}
                      {location ? (
                        <p className="text-muted-foreground">{location}</p>
                      ) : null}
                      {postalCode ? (
                        <p className="text-muted-foreground">{postalCode}</p>
                      ) : null}
                    </div>
                    {provider.coordinates ? (
                      <div className="rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">
                        <div className="font-semibold text-foreground">
                          Coordinates
                        </div>
                        <div>
                          {JSON.stringify(provider.coordinates, null, 0)}
                        </div>
                      </div>
                    ) : null}
                    <div className="flex flex-wrap gap-2">
                      <Button asChild variant="outline">
                        <Link href="/contact">Contact</Link>
                      </Button>
                      <Button asChild>
                        <Link href="/start-journey">Start your journey</Link>
                      </Button>
                    </div>
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
