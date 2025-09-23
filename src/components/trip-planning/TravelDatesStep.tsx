import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, Info, Clock } from "lucide-react";
import { TripPlanData } from "../TripPlanningWizard";

interface TravelDatesStepProps {
  data: TripPlanData;
  onUpdate: (data: Partial<TripPlanData>) => void;
}

const TravelDatesStep = ({ data, onUpdate }: TravelDatesStepProps) => {
  const [localDates, setLocalDates] = useState({
    startDate: data.travelDates.startDate,
    endDate: data.travelDates.endDate,
    flexible: data.travelDates.flexible,
  });

  const handleDateChange = (field: string, value: string | boolean) => {
    const newDates = { ...localDates, [field]: value };
    setLocalDates(newDates);
    onUpdate({
      travelDates: newDates,
    });
  };

  const handleCompanionCountChange = (count: number) => {
    onUpdate({ companionCount: count });
  };

  const getMinDate = () => {
    const today = new Date();
    today.setDate(today.getDate() + 14); // Minimum 2 weeks from now
    return today.toISOString().split('T')[0];
  };

  const getMinEndDate = () => {
    if (!localDates.startDate) return getMinDate();
    const startDate = new Date(localDates.startDate);
    startDate.setDate(startDate.getDate() + (data.recoveryTimeline || 7));
    return startDate.toISOString().split('T')[0];
  };

  const optimalSeasons = [
    {
      season: "Spring (Mar-May)",
      description: "Mild weather, perfect for recovery",
      recommended: true,
    },
    {
      season: "Fall (Sep-Nov)",
      description: "Comfortable temperatures, fewer tourists",
      recommended: true,
    },
    {
      season: "Winter (Dec-Feb)",
      description: "Cool weather, peak tourist season",
      recommended: false,
    },
    {
      season: "Summer (Jun-Aug)",
      description: "Hot weather, may affect recovery",
      recommended: false,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-foreground mb-2">
          When would you like to travel?
        </h3>
        <p className="text-muted-foreground">
          Choose your preferred travel dates and tell us about your travel companions.
        </p>
      </div>

      {/* Date Selection */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-primary" />
            <CardTitle className="text-base">Travel Dates</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Preferred Arrival Date</Label>
              <Input
                id="startDate"
                type="date"
                value={localDates.startDate}
                min={getMinDate()}
                onChange={(e) => handleDateChange("startDate", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Preferred Departure Date</Label>
              <Input
                id="endDate"
                type="date"
                value={localDates.endDate}
                min={getMinEndDate()}
                onChange={(e) => handleDateChange("endDate", e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="flexible"
              checked={localDates.flexible}
              onCheckedChange={(checked) => handleDateChange("flexible", checked)}
            />
            <Label htmlFor="flexible">I'm flexible with my dates (±7 days)</Label>
          </div>
          
          {localDates.flexible && (
            <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="flex items-start space-x-2">
                <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-foreground">Flexible dates benefit</p>
                  <p className="text-muted-foreground">
                    Being flexible with your dates can save up to 20% on accommodation and may offer better doctor availability.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Travel Companions */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-primary" />
            <CardTitle className="text-base">Travel Companions</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Label>How many people will be traveling with you?</Label>
            <div className="flex space-x-2">
              {[0, 1, 2, 3, 4].map((count) => (
                <Button
                  key={count}
                  variant={data.companionCount === count ? "default" : "outline"}
                  onClick={() => handleCompanionCountChange(count)}
                  className="w-12 h-12"
                >
                  {count}
                </Button>
              ))}
              <Button
                variant={data.companionCount > 4 ? "default" : "outline"}
                onClick={() => handleCompanionCountChange(5)}
                className="px-4"
              >
                5+
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Including the patient. Companions can provide emotional support during recovery.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Recovery Timeline Info */}
      {data.recoveryTimeline > 0 && (
        <Card className="bg-secondary/50">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <Clock className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-foreground">Recommended Stay Duration</p>
                <p className="text-sm text-muted-foreground">
                  Based on your selected treatment, we recommend staying for at least {data.recoveryTimeline} days 
                  for proper recovery. This includes pre-procedure consultations and post-procedure care.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Optimal Travel Seasons */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Best Time to Visit Egypt</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {optimalSeasons.map((season, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${
                  season.recommended
                    ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950"
                    : "border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">{season.season}</span>
                  <Badge
                    variant={season.recommended ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {season.recommended ? "Recommended" : "Consider"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{season.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TravelDatesStep;