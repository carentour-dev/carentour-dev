import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Baby, Scissors, Stethoscope, Circle } from "lucide-react";
import { TripPlanData } from "../TripPlanningWizard";

interface TreatmentSelectionStepProps {
  data: TripPlanData;
  onUpdate: (data: Partial<TripPlanData>) => void;
}

const TreatmentSelectionStep = ({
  data,
  onUpdate,
}: TreatmentSelectionStepProps) => {
  const treatments = [
    {
      id: "ivf-fertility-treatments",
      name: "IVF & Fertility Treatments",
      icon: Baby,
      description: "Comprehensive IVF cycles and fertility preservation",
      recoveryDays: 14,
      popular: true,
    },
    {
      id: "bariatric-sleeve-surgery",
      name: "Bariatric (Sleeve) Surgery",
      icon: Stethoscope,
      description: "Gastric sleeve surgery with metabolic support",
      recoveryDays: 21,
      popular: true,
    },
    {
      id: "cosmetic-plastic-surgery",
      name: "Cosmetic & Plastic Surgery",
      icon: Scissors,
      description: "360 body contouring, rhinoplasty, and aesthetic surgery",
      recoveryDays: 21,
      popular: true,
    },
    {
      id: "advanced-dental-care",
      name: "Advanced Dental Care",
      icon: Circle,
      description: "Digital smile design, veneers, and full-mouth implants",
      recoveryDays: 10,
      popular: true,
    },
  ];

  const handleTreatmentSelect = (treatment: (typeof treatments)[0]) => {
    onUpdate({
      treatmentType: treatment.id,
      recoveryTimeline: treatment.recoveryDays,
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-foreground mb-2">
          What type of treatment are you seeking?
        </h3>
        <p className="text-muted-foreground">
          Select the treatment that best matches your medical needs. This will
          help us customize your trip plan.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {treatments.map((treatment) => {
          const Icon = treatment.icon;
          const isSelected = data.treatmentType === treatment.id;

          return (
            <Card
              key={treatment.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                isSelected
                  ? "ring-2 ring-primary border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
              onClick={() => handleTreatmentSelect(treatment)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`p-2 rounded-lg ${
                        isSelected
                          ? "bg-primary text-background"
                          : "bg-secondary text-secondary-foreground"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base">
                        {treatment.name}
                      </CardTitle>
                      {treatment.popular && (
                        <Badge variant="secondary" className="text-xs mt-1">
                          Popular
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground mb-3">
                  {treatment.description}
                </p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    Recovery: {treatment.recoveryDays} days
                  </span>
                  {isSelected && (
                    <Badge variant="default" className="text-xs">
                      Selected
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {data.treatmentType && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <Baby className="w-4 h-4 text-background" />
              </div>
              <div>
                <p className="font-medium text-foreground">
                  Treatment Selected
                </p>
                <p className="text-sm text-muted-foreground">
                  We&apos;ll customize your trip plan based on your{" "}
                  {treatments
                    .find((t) => t.id === data.treatmentType)
                    ?.name.toLowerCase()}{" "}
                  requirements.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TreatmentSelectionStep;
