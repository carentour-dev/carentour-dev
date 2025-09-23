import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ChevronRight, ChevronLeft, Calendar, Users, MapPin, DollarSign, CheckCircle } from "lucide-react";
import TreatmentSelectionStep from "./trip-planning/TreatmentSelectionStep";
import TravelDatesStep from "./trip-planning/TravelDatesStep";
import AccommodationStep from "./trip-planning/AccommodationStep";
import BudgetPreferencesStep from "./trip-planning/BudgetPreferencesStep";
import ReviewPlanStep from "./trip-planning/ReviewPlanStep";

export interface TripPlanData {
  treatmentType: string;
  travelDates: {
    startDate: string;
    endDate: string;
    flexible: boolean;
  };
  companionCount: number;
  accommodationPreferences: {
    hotelType: string;
    proximityToHospital: boolean;
    specialRequirements: string[];
  };
  budgetRange: {
    min: number;
    max: number;
    currency: string;
  };
  specialRequirements: string[];
  culturalInterests: string[];
  travelInsuranceNeeded: boolean;
  visaAssistanceNeeded: boolean;
  transportationPreferences: {
    airportTransfer: boolean;
    dailyTransport: boolean;
    sightseeing: boolean;
  };
  recoveryTimeline: number;
}

const TripPlanningWizard = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [tripPlanData, setTripPlanData] = useState<TripPlanData>({
    treatmentType: "",
    travelDates: {
      startDate: "",
      endDate: "",
      flexible: false,
    },
    companionCount: 0,
    accommodationPreferences: {
      hotelType: "",
      proximityToHospital: true,
      specialRequirements: [],
    },
    budgetRange: {
      min: 0,
      max: 0,
      currency: "USD",
    },
    specialRequirements: [],
    culturalInterests: [],
    travelInsuranceNeeded: false,
    visaAssistanceNeeded: false,
    transportationPreferences: {
      airportTransfer: true,
      dailyTransport: true,
      sightseeing: false,
    },
    recoveryTimeline: 0,
  });

  const steps = [
    {
      id: 1,
      title: "Treatment Selection",
      description: "Choose your treatment type",
      icon: MapPin,
      component: TreatmentSelectionStep,
    },
    {
      id: 2,
      title: "Travel Dates",
      description: "Select your preferred dates",
      icon: Calendar,
      component: TravelDatesStep,
    },
    {
      id: 3,
      title: "Accommodation",
      description: "Choose your stay preferences",
      icon: Users,
      component: AccommodationStep,
    },
    {
      id: 4,
      title: "Budget & Preferences",
      description: "Set your budget and preferences",
      icon: DollarSign,
      component: BudgetPreferencesStep,
    },
    {
      id: 5,
      title: "Review & Submit",
      description: "Review your trip plan",
      icon: CheckCircle,
      component: ReviewPlanStep,
    },
  ];

  const currentStepData = steps.find(step => step.id === currentStep);
  const CurrentStepComponent = currentStepData?.component;
  const progress = (currentStep / steps.length) * 100;

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const updateTripPlanData = (newData: Partial<TripPlanData>) => {
    setTripPlanData(prev => ({ ...prev, ...newData }));
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <Badge variant="outline" className="mb-4">Interactive Trip Planner</Badge>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
          Plan Your Perfect <span className="bg-gradient-hero bg-clip-text text-transparent">Medical Journey</span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Let us guide you through creating a personalized treatment and travel experience tailored to your needs.
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm font-medium text-muted-foreground">
            Step {currentStep} of {steps.length}
          </span>
          <span className="text-sm font-medium text-muted-foreground">
            {Math.round(progress)}% Complete
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step Navigation */}
      <div className="hidden md:flex justify-between mb-8">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = step.id === currentStep;
          const isCompleted = step.id < currentStep;
          
          return (
            <div
              key={step.id}
              className={`flex items-center ${index < steps.length - 1 ? 'flex-1' : ''}`}
            >
              <div className={`flex items-center space-x-3 ${isActive ? 'text-primary' : isCompleted ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                  isActive ? 'border-primary bg-primary text-background' : 
                  isCompleted ? 'border-primary bg-primary text-background' : 
                  'border-muted-foreground'
                }`}>
                  {isCompleted ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>
                <div className="hidden lg:block">
                  <div className="font-medium text-sm">{step.title}</div>
                  <div className="text-xs text-muted-foreground">{step.description}</div>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-4 ${isCompleted ? 'bg-primary' : 'bg-muted'}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Current Step Content */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center space-x-3">
            {currentStepData && (
              <>
                <currentStepData.icon className="w-6 h-6 text-primary" />
                <div>
                  <CardTitle>{currentStepData.title}</CardTitle>
                  <p className="text-muted-foreground text-sm">{currentStepData.description}</p>
                </div>
              </>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {CurrentStepComponent && (
            <CurrentStepComponent
              data={tripPlanData}
              onUpdate={updateTripPlanData}
            />
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 1}
          className="flex items-center space-x-2"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous</span>
        </Button>
        
        <Button
          onClick={handleNext}
          disabled={currentStep === steps.length}
          className="flex items-center space-x-2"
        >
          <span>{currentStep === steps.length ? 'Submit Plan' : 'Next'}</span>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default TripPlanningWizard;