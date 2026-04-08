import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Quote, ExternalLink } from "lucide-react";
import type { PublicLocale } from "@/i18n/routing";

interface DoctorReview {
  id: string;
  patient_id?: string | null;
  patient_name: string;
  patient_country?: string | null;
  procedure_name?: string | null;
  rating: number;
  review_text: string;
  recovery_time?: string | null;
  is_verified?: boolean | null;
  created_at: string;
}

interface DoctorReviewsProps {
  reviews: DoctorReview[];
  className?: string;
  locale?: PublicLocale;
}

export const DoctorReviews = ({
  reviews,
  className,
  locale = "en",
}: DoctorReviewsProps) => {
  if (reviews.length === 0) {
    return null;
  }

  const isArabicLocale = locale === "ar";
  const copy = {
    heading: isArabicLocale ? "آراء المرضى" : "Patient Reviews",
    description: isArabicLocale
      ? "تجارب حقيقية من مرضى موثّقين"
      : "Real experiences from verified patients",
    international: isArabicLocale ? "دولي" : "International",
    verified: isArabicLocale ? "موثّق" : "Verified",
    recovery: isArabicLocale ? "التعافي" : "Recovery",
    patientJourney: isArabicLocale ? "عرض رحلة المريض" : "View patient journey",
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="text-center">
        <h3 className="text-2xl font-bold text-foreground mb-2">
          {copy.heading}
        </h3>
        <p className="text-muted-foreground">{copy.description}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reviews.map((review) => (
          <Card key={review.id} className="border-border/50 relative">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">
                    {review.patient_name}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {review.patient_country ?? copy.international}
                    </Badge>
                    {review.is_verified !== false && (
                      <Badge variant="secondary" className="text-xs">
                        {copy.verified}
                      </Badge>
                    )}
                  </div>
                </div>
                <Quote className="h-6 w-6 text-primary/30" />
              </div>

              <div className="flex items-center gap-4 text-sm pt-2">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < review.rating
                          ? "text-yellow-500 fill-current"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-muted-foreground">•</span>
                {review.procedure_name && (
                  <span className="text-muted-foreground">
                    {review.procedure_name}
                  </span>
                )}
              </div>
            </CardHeader>

            <CardContent>
              <p className="text-muted-foreground leading-relaxed mb-4">
                &ldquo;{review.review_text}&rdquo;
              </p>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  {review.recovery_time && (
                    <span>
                      {copy.recovery}: {review.recovery_time}
                    </span>
                  )}
                  {review.patient_id && (
                    <>
                      <span>•</span>
                      <Link
                        href={`/patients/${review.patient_id}`}
                        className="text-primary hover:underline inline-flex items-center gap-1"
                      >
                        {copy.patientJourney}
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </>
                  )}
                </div>
                <span>{new Date(review.created_at).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
