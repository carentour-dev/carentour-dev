import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { DollarSign, Plane, Shield, Globe, Camera, UtensilsCrossed, Car, Heart } from "lucide-react";
import { TripPlanData } from "../TripPlanningWizard";

interface BudgetPreferencesStepProps {
  data: TripPlanData;
  onUpdate: (data: Partial<TripPlanData>) => void;
}

const BudgetPreferencesStep = ({ data, onUpdate }: BudgetPreferencesStepProps) => {
  const [budgetRange, setBudgetRange] = useState([
    data.budgetRange.min || 3000,
    data.budgetRange.max || 15000
  ]);

  const handleBudgetChange = (values: number[]) => {
    setBudgetRange(values);
    onUpdate({
      budgetRange: {
        min: values[0],
        max: values[1],
        currency: data.budgetRange.currency || "USD",
      },
    });
  };

  const handleCurrencyChange = (currency: string) => {
    onUpdate({
      budgetRange: {
        ...data.budgetRange,
        currency,
      },
    });
  };

  const handleToggle = (field: keyof TripPlanData, value: boolean) => {
    onUpdate({ [field]: value });
  };

  const handleTransportationToggle = (key: keyof TripPlanData['transportationPreferences'], value: boolean) => {
    onUpdate({
      transportationPreferences: {
        ...data.transportationPreferences,
        [key]: value,
      },
    });
  };

  const handleCulturalInterestToggle = (interest: string, checked: boolean) => {
    const currentInterests = data.culturalInterests || [];
    const updatedInterests = checked
      ? [...currentInterests, interest]
      : currentInterests.filter(i => i !== interest);

    onUpdate({ culturalInterests: updatedInterests });
  };

  const currencies = [
    { code: "USD", symbol: "$", name: "US Dollar" },
    { code: "EUR", symbol: "€", name: "Euro" },
    { code: "GBP", symbol: "£", name: "British Pound" },
    { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
    { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  ];

  const budgetBreakdown = {
    treatment: Math.round((budgetRange[1] * 0.6)),
    accommodation: Math.round((budgetRange[1] * 0.2)),
    flights: Math.round((budgetRange[1] * 0.1)),
    other: Math.round((budgetRange[1] * 0.1)),
  };

  const culturalInterests = [
    { id: "historical-sites", name: "Historical Sites", icon: Globe },
    { id: "museums", name: "Museums & Culture", icon: Camera },
    { id: "local-cuisine", name: "Local Cuisine", icon: UtensilsCrossed },
    { id: "wellness-spa", name: "Wellness & Spa", icon: Heart },
    { id: "shopping", name: "Shopping", icon: Car },
    { id: "photography", name: "Photography Tours", icon: Camera },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Budget & Preferences
        </h3>
        <p className="text-muted-foreground">
          Set your budget range and tell us about your preferences for a personalized experience.
        </p>
      </div>

      {/* Budget Range */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-primary" />
            <CardTitle className="text-base">Total Trip Budget</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Currency Selection */}
          <div className="space-y-2">
            <Label>Currency</Label>
            <div className="flex flex-wrap gap-2">
              {currencies.map((currency) => (
                <Button
                  key={currency.code}
                  variant={data.budgetRange.currency === currency.code ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleCurrencyChange(currency.code)}
                >
                  {currency.symbol} {currency.code}
                </Button>
              ))}
            </div>
          </div>

          {/* Budget Slider */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>Budget Range</Label>
              <div className="text-sm font-medium">
                {data.budgetRange.currency === "USD" ? "$" : currencies.find(c => c.code === data.budgetRange.currency)?.symbol}
                {budgetRange[0].toLocaleString()} - {data.budgetRange.currency === "USD" ? "$" : currencies.find(c => c.code === data.budgetRange.currency)?.symbol}
                {budgetRange[1].toLocaleString()}
              </div>
            </div>
            <Slider
              value={budgetRange}
              onValueChange={handleBudgetChange}
              min={1000}
              max={50000}
              step={500}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>$1,000</span>
              <span>$50,000+</span>
            </div>
          </div>

          {/* Budget Breakdown */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="text-center p-3 bg-secondary/50 rounded-lg">
              <p className="text-xs text-muted-foreground">Treatment</p>
              <p className="font-semibold text-sm">
                ${budgetBreakdown.treatment.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">60%</p>
            </div>
            <div className="text-center p-3 bg-secondary/50 rounded-lg">
              <p className="text-xs text-muted-foreground">Accommodation</p>
              <p className="font-semibold text-sm">
                ${budgetBreakdown.accommodation.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">20%</p>
            </div>
            <div className="text-center p-3 bg-secondary/50 rounded-lg">
              <p className="text-xs text-muted-foreground">Flights</p>
              <p className="font-semibold text-sm">
                ${budgetBreakdown.flights.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">10%</p>
            </div>
            <div className="text-center p-3 bg-secondary/50 rounded-lg">
              <p className="text-xs text-muted-foreground">Other</p>
              <p className="font-semibold text-sm">
                ${budgetBreakdown.other.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">10%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transportation Preferences */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Car className="w-5 h-5 text-primary" />
            <CardTitle className="text-base">Transportation Services</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="airportTransfer">Airport Transfer</Label>
              <p className="text-sm text-muted-foreground">Private transfer to/from airport</p>
            </div>
            <Switch
              id="airportTransfer"
              checked={data.transportationPreferences.airportTransfer}
              onCheckedChange={(checked) => handleTransportationToggle("airportTransfer", checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="dailyTransport">Daily Transportation</Label>
              <p className="text-sm text-muted-foreground">Transport for medical appointments</p>
            </div>
            <Switch
              id="dailyTransport"
              checked={data.transportationPreferences.dailyTransport}
              onCheckedChange={(checked) => handleTransportationToggle("dailyTransport", checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="sightseeing">Sightseeing Tours</Label>
              <p className="text-sm text-muted-foreground">Optional tours during recovery</p>
            </div>
            <Switch
              id="sightseeing"
              checked={data.transportationPreferences.sightseeing}
              onCheckedChange={(checked) => handleTransportationToggle("sightseeing", checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Insurance and Assistance */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-primary" />
            <CardTitle className="text-base">Insurance & Assistance</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="travelInsurance">Travel Insurance</Label>
              <p className="text-sm text-muted-foreground">Comprehensive medical travel insurance</p>
            </div>
            <Switch
              id="travelInsurance"
              checked={data.travelInsuranceNeeded}
              onCheckedChange={(checked) => handleToggle("travelInsuranceNeeded", checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="visaAssistance">Visa Assistance</Label>
              <p className="text-sm text-muted-foreground">Help with visa application process</p>
            </div>
            <Switch
              id="visaAssistance"
              checked={data.visaAssistanceNeeded}
              onCheckedChange={(checked) => handleToggle("visaAssistanceNeeded", checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Cultural Interests */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cultural Interests</CardTitle>
          <p className="text-sm text-muted-foreground">
            What would you like to experience during your recovery time? (Optional)
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {culturalInterests.map((interest) => {
              const Icon = interest.icon;
              return (
                <div key={interest.id} className="flex items-center space-x-3">
                  <Checkbox
                    id={interest.id}
                    checked={data.culturalInterests?.includes(interest.id) || false}
                    onCheckedChange={(checked) => handleCulturalInterestToggle(interest.id, checked as boolean)}
                  />
                  <div className="flex items-center space-x-2">
                    <Icon className="w-4 h-4 text-primary" />
                    <Label htmlFor={interest.id} className="text-sm">
                      {interest.name}
                    </Label>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      {budgetRange[1] > 0 && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <DollarSign className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-foreground">Budget Summary</p>
                <p className="text-sm text-muted-foreground">
                  Your total budget range of ${budgetRange[0].toLocaleString()} - ${budgetRange[1].toLocaleString()} 
                  includes treatment, accommodation, transportation, and activities. We'll create a detailed 
                  cost breakdown in your final plan.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BudgetPreferencesStep;