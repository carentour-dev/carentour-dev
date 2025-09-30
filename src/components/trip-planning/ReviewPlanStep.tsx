import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Calendar, 
  Users, 
  MapPin, 
  DollarSign, 
  Plane, 
  Shield, 
  Heart,
  CheckCircle,
  Clock,
  Send
} from "lucide-react";
import { TripPlanData } from "../TripPlanningWizard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface ReviewPlanStepProps {
  data: TripPlanData;
  onUpdate: (data: Partial<TripPlanData>) => void;
}

const ReviewPlanStep = ({ data, onUpdate }: ReviewPlanStepProps) => {
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const treatmentNames: { [key: string]: string } = {
    "cardiac-surgery": "Cardiac Surgery",
    "cosmetic-surgery": "Cosmetic Surgery",
    "eye-surgery": "Eye Surgery",
    "dental-treatment": "Dental Treatment",
    "general-surgery": "General Surgery",
    "neurosurgery": "Neurosurgery",
    "orthopedic": "Orthopedic Surgery",
    "fertility": "Fertility Treatment",
  };

  const accommodationNames: { [key: string]: string } = {
    "medical_hotel": "Medical Hotel",
    "hotel": "Luxury Hotel",
    "apartment": "Serviced Apartment",
    "resort": "Resort",
  };

  const handleSubmitPlan = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to submit your trip plan.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("trip_plans")
        .insert([
          {
            user_id: user.id,
            treatment_type: data.treatmentType,
            preferred_travel_dates: data.travelDates,
            companion_count: data.companionCount,
            accommodation_preferences: data.accommodationPreferences,
            budget_range: data.budgetRange,
            special_requirements: [...(data.specialRequirements || []), additionalNotes].filter(Boolean),
            cultural_interests: data.culturalInterests,
            travel_insurance_needed: data.travelInsuranceNeeded,
            visa_assistance_needed: data.visaAssistanceNeeded,
            transportation_preferences: data.transportationPreferences,
            recovery_timeline: data.recoveryTimeline,
            total_estimated_cost: data.budgetRange.max,
            status: "submitted",
          },
        ]);

      if (error) throw error;

      toast({
        title: "Trip Plan Submitted!",
        description: "Our medical coordinators will review your plan and contact you within 24 hours.",
      });

      // Reset form or navigate to a success page
    } catch (error) {
      console.error("Error submitting trip plan:", error);
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your plan. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateTotalDays = () => {
    if (!data.travelDates.startDate || !data.travelDates.endDate) return 0;
    const start = new Date(data.travelDates.startDate);
    const end = new Date(data.travelDates.endDate);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Not specified";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Review Your Trip Plan
        </h3>
        <p className="text-muted-foreground">
          Please review all details before submitting. Our medical coordinators will contact you within 24 hours.
        </p>
      </div>

      {/* Treatment Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Heart className="w-5 h-5 text-primary" />
            <CardTitle className="text-base">Treatment Details</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Treatment Type:</span>
            <span className="font-medium">{treatmentNames[data.treatmentType] || "Not specified"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Recovery Timeline:</span>
            <span className="font-medium">{data.recoveryTimeline} days</span>
          </div>
        </CardContent>
      </Card>

      {/* Travel Details */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-primary" />
            <CardTitle className="text-base">Travel Details</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Arrival Date:</span>
            <span className="font-medium">{formatDate(data.travelDates.startDate)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Departure Date:</span>
            <span className="font-medium">{formatDate(data.travelDates.endDate)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Duration:</span>
            <span className="font-medium">{calculateTotalDays()} days</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Flexible Dates:</span>
            <Badge variant={data.travelDates.flexible ? "default" : "secondary"}>
              {data.travelDates.flexible ? "Yes" : "No"}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Travel Companions:</span>
            <span className="font-medium">{data.companionCount} people</span>
          </div>
        </CardContent>
      </Card>

      {/* Accommodation */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-primary" />
            <CardTitle className="text-base">Accommodation Preferences</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Type:</span>
            <span className="font-medium">
              {accommodationNames[data.accommodationPreferences.hotelType] || "Not specified"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Close to Hospital:</span>
            <Badge variant={data.accommodationPreferences.proximityToHospital ? "default" : "secondary"}>
              {data.accommodationPreferences.proximityToHospital ? "Yes" : "No"}
            </Badge>
          </div>
          {data.accommodationPreferences.specialRequirements?.length > 0 && (
            <div>
              <span className="text-muted-foreground">Special Requirements:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {data.accommodationPreferences.specialRequirements.map((req, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {req}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Budget */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-primary" />
            <CardTitle className="text-base">Budget & Services</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Budget Range:</span>
            <span className="font-medium">
              ${data.budgetRange.min?.toLocaleString()} - ${data.budgetRange.max?.toLocaleString()} {data.budgetRange.currency}
            </span>
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Transportation Services:</h4>
            <div className="grid grid-cols-1 gap-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Airport Transfer:</span>
                <Badge variant={data.transportationPreferences.airportTransfer ? "default" : "secondary"} className="text-xs">
                  {data.transportationPreferences.airportTransfer ? "Included" : "Not included"}
                </Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Daily Transport:</span>
                <Badge variant={data.transportationPreferences.dailyTransport ? "default" : "secondary"} className="text-xs">
                  {data.transportationPreferences.dailyTransport ? "Included" : "Not included"}
                </Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Sightseeing Tours:</span>
                <Badge variant={data.transportationPreferences.sightseeing ? "default" : "secondary"} className="text-xs">
                  {data.transportationPreferences.sightseeing ? "Included" : "Not included"}
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <h4 className="font-medium text-sm">Additional Services:</h4>
            <div className="grid grid-cols-1 gap-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Travel Insurance:</span>
                <Badge variant={data.travelInsuranceNeeded ? "default" : "secondary"} className="text-xs">
                  {data.travelInsuranceNeeded ? "Required" : "Not required"}
                </Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Visa Assistance:</span>
                <Badge variant={data.visaAssistanceNeeded ? "default" : "secondary"} className="text-xs">
                  {data.visaAssistanceNeeded ? "Required" : "Not required"}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cultural Interests */}
      {data.culturalInterests && data.culturalInterests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cultural Interests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {data.culturalInterests.map((interest, index) => (
                <Badge key={index} variant="outline">
                  {interest.replace("-", " ").replace(/\b\w/g, l => l.toUpperCase())}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Additional Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Additional Notes (Optional)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="additionalNotes">
              Any specific requests or additional information you&apos;d like to share?
            </Label>
            <Textarea
              id="additionalNotes"
              placeholder="Please include any special medical requirements, dietary restrictions, or other preferences..."
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <CheckCircle className="w-12 h-12 text-primary mx-auto" />
            <div>
              <h3 className="font-semibold text-foreground mb-2">Ready to Submit Your Plan?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Once submitted, our medical coordinators will review your requirements and create a detailed 
                itinerary with specific pricing, doctor recommendations, and booking options.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
              <div className="flex items-start space-x-2">
                <Clock className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium">Within 24 Hours</p>
                  <p className="text-xs text-muted-foreground">Initial review & contact</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <Heart className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium">Doctor Matching</p>
                  <p className="text-xs text-muted-foreground">Best specialists for your needs</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <Plane className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium">Complete Itinerary</p>
                  <p className="text-xs text-muted-foreground">Detailed travel & treatment plan</p>
                </div>
              </div>
            </div>

            <Button 
              onClick={handleSubmitPlan} 
              disabled={isSubmitting || !user}
              size="lg"
              className="w-full md:w-auto"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Submitting Plan...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit My Trip Plan
                </>
              )}
            </Button>

            {!user && (
              <p className="text-xs text-muted-foreground">
                Please <a href="/auth" className="text-primary hover:underline">log in</a> to submit your trip plan.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReviewPlanStep;