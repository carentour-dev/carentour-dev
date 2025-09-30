import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Quote } from "lucide-react";

interface DoctorReview {
  id: string;
  patient_name: string;
  patient_country: string;
  procedure_name: string;
  rating: number;
  review_text: string;
  recovery_time: string;
  is_verified: boolean;
  created_at: string;
}

interface DoctorReviewsProps {
  reviews: DoctorReview[];
  className?: string;
}

export const DoctorReviews = ({ reviews, className }: DoctorReviewsProps) => {
  if (reviews.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="text-center">
        <h3 className="text-2xl font-bold text-foreground mb-2">Patient Reviews</h3>
        <p className="text-muted-foreground">
          Real experiences from verified patients
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reviews.map((review) => (
          <Card key={review.id} className="border-border/50 relative">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{review.patient_name}</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {review.patient_country}
                    </Badge>
                    {review.is_verified && (
                      <Badge variant="secondary" className="text-xs">
                        Verified
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
                        i < review.rating ? 'text-yellow-500 fill-current' : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground">{review.procedure_name}</span>
              </div>
            </CardHeader>
            
            <CardContent>
              <p className="text-muted-foreground leading-relaxed mb-4">
                &ldquo;{review.review_text}&rdquo;
              </p>
              
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Recovery: {review.recovery_time}</span>
                <span>{new Date(review.created_at).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};