import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Hotel, Building, Home, Palmtree, MapPin, Star, Wifi, Car, UtensilsCrossed } from "lucide-react";
import { TripPlanData } from "../TripPlanningWizard";
import { supabase } from "@/integrations/supabase/client";

interface TripPlanAccommodation {
  id: string;
  name: string;
  type: string;
  star_rating: number;
  price_per_night: number;
  distance_to_hospital_km: number;
  amenities: string[];
  location: any; // JSON field from database
  special_medical_features: string[];
}

interface AccommodationStepProps {
  data: TripPlanData;
  onUpdate: (data: Partial<TripPlanData>) => void;
}

const AccommodationStep = ({ data, onUpdate }: AccommodationStepProps) => {
  const [accommodations, setAccommodations] = useState<TripPlanAccommodation[]>([]);
  const [selectedAccommodation, setSelectedAccommodation] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAccommodations();
  }, []);

  const fetchAccommodations = async () => {
    try {
      const { data: accommodationData, error } = await supabase
        .from("trip_plan_accommodations")
        .select("*")
        .eq("is_active", true)
        .order("distance_to_hospital_km", { ascending: true });

      if (error) throw error;
      setAccommodations(accommodationData || []);
    } catch (error) {
      console.error("Error fetching accommodations:", error);
    } finally {
      setLoading(false);
    }
  };

  const accommodationTypes = [
    {
      id: "medical_hotel",
      name: "Medical Hotel",
      icon: Hotel,
      description: "Hotels specifically designed for medical tourists",
      benefits: ["On-site medical support", "Recovery-friendly rooms", "Specialized staff"]
    },
    {
      id: "hotel",
      name: "Luxury Hotel",
      icon: Building,
      description: "High-end hotels with premium amenities",
      benefits: ["Concierge services", "Spa facilities", "Fine dining"]
    },
    {
      id: "apartment",
      name: "Serviced Apartment",
      icon: Home,
      description: "Home-like environment with kitchen facilities",
      benefits: ["More space", "Self-catering", "Cost-effective for longer stays"]
    },
    {
      id: "resort",
      name: "Resort",
      icon: Palmtree,
      description: "Resort properties for relaxation and recovery",
      benefits: ["Wellness programs", "Recreational facilities", "Scenic locations"]
    }
  ];

  const handleTypeSelection = (type: string) => {
    onUpdate({
      accommodationPreferences: {
        ...data.accommodationPreferences,
        hotelType: type,
      },
    });
  };

  const handleSpecialRequirementToggle = (requirement: string, checked: boolean) => {
    const currentRequirements = data.accommodationPreferences.specialRequirements || [];
    const updatedRequirements = checked
      ? [...currentRequirements, requirement]
      : currentRequirements.filter(req => req !== requirement);

    onUpdate({
      accommodationPreferences: {
        ...data.accommodationPreferences,
        specialRequirements: updatedRequirements,
      },
    });
  };

  const getIconForType = (type: string) => {
    const typeData = accommodationTypes.find(t => t.id === type);
    return typeData?.icon || Hotel;
  };

  const specialRequirements = [
    "Ground floor access",
    "Wheelchair accessibility",
    "Medical equipment storage",
    "Refrigerator for medications",
    "Quiet environment",
    "Air conditioning",
    "Private bathroom",
    "Balcony or terrace",
    "Room service",
    "Laundry facilities"
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <p>Loading accommodation options...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Choose Your Accommodation Type
        </h3>
        <p className="text-muted-foreground">
          Select the type of accommodation that best suits your recovery needs and preferences.
        </p>
      </div>

      {/* Accommodation Type Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {accommodationTypes.map((type) => {
          const Icon = type.icon;
          const isSelected = data.accommodationPreferences.hotelType === type.id;
          
          return (
            <Card
              key={type.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                isSelected
                  ? "ring-2 ring-primary border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
              onClick={() => handleTypeSelection(type.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${
                    isSelected ? "bg-primary text-background" : "bg-secondary text-secondary-foreground"
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{type.name}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground mb-3">
                  {type.description}
                </p>
                <div className="space-y-1">
                  {type.benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center text-xs">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full mr-2"></span>
                      {benefit}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Available Accommodations */}
      {data.accommodationPreferences.hotelType && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Available Options</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {accommodations
                .filter(acc => acc.type === data.accommodationPreferences.hotelType)
                .map((accommodation) => {
                  const Icon = getIconForType(accommodation.type);
                  
                  return (
                    <Card
                      key={accommodation.id}
                      className={`cursor-pointer transition-all ${
                        selectedAccommodation === accommodation.id
                          ? "ring-2 ring-primary border-primary"
                          : "hover:shadow-md"
                      }`}
                      onClick={() => setSelectedAccommodation(accommodation.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <Icon className="w-5 h-5 text-primary" />
                            <div>
                              <h4 className="font-medium text-sm">{accommodation.name}</h4>
                              <div className="flex items-center space-x-1 mt-1">
                                {[...Array(accommodation.star_rating)].map((_, i) => (
                                  <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-sm">${accommodation.price_per_night}</p>
                            <p className="text-xs text-muted-foreground">per night</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-1 mb-2 text-xs text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          <span>{accommodation.distance_to_hospital_km}km to hospital</span>
                        </div>
                        
                        <div className="flex flex-wrap gap-1 mb-3">
                          {accommodation.amenities.slice(0, 3).map((amenity, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {amenity}
                            </Badge>
                          ))}
                          {accommodation.amenities.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{accommodation.amenities.length - 3} more
                            </Badge>
                          )}
                        </div>
                        
                        {accommodation.special_medical_features.length > 0 && (
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-primary">Medical Features:</p>
                            {accommodation.special_medical_features.slice(0, 2).map((feature, index) => (
                              <div key={index} className="flex items-center text-xs">
                                <span className="w-1 h-1 bg-primary rounded-full mr-2"></span>
                                {feature}
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Special Requirements */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Special Requirements</CardTitle>
          <p className="text-sm text-muted-foreground">
            Select any specific needs or preferences for your accommodation.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {specialRequirements.map((requirement) => (
              <div key={requirement} className="flex items-center space-x-2">
                <Checkbox
                  id={requirement}
                  checked={data.accommodationPreferences.specialRequirements?.includes(requirement) || false}
                  onCheckedChange={(checked) => handleSpecialRequirementToggle(requirement, checked as boolean)}
                />
                <Label htmlFor={requirement} className="text-sm">
                  {requirement}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Proximity to Hospital */}
      <Card className="bg-secondary/50">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="proximityToHospital"
              checked={data.accommodationPreferences.proximityToHospital}
              onCheckedChange={(checked) => 
                onUpdate({
                  accommodationPreferences: {
                    ...data.accommodationPreferences,
                    proximityToHospital: checked as boolean,
                  },
                })
              }
            />
            <Label htmlFor="proximityToHospital" className="text-sm font-medium">
              Prioritize proximity to medical service providers
            </Label>
          </div>
          <p className="text-xs text-muted-foreground mt-2 ml-6">
            Staying close to your treatment provider reduces travel time and stress during recovery.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccommodationStep;