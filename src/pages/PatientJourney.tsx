import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, ArrowRight, Upload, Calendar, DollarSign, User, FileText, Stethoscope, Plane } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  basicInfoSchema, 
  medicalHistorySchema, 
  travelPreferencesSchema, 
  documentsValidationSchema,
  fullPatientJourneySchema,
  type FullPatientJourneyFormData 
} from '@/schemas/patientJourneySchemas';

const steps = [
  { id: 1, title: 'Basic Information', icon: User },
  { id: 2, title: 'Medical History', icon: Stethoscope },
  { id: 3, title: 'Travel Preferences', icon: Plane },
  { id: 4, title: 'Documents', icon: FileText },
  { id: 5, title: 'Cost Estimation', icon: DollarSign },
  { id: 6, title: 'Schedule Consultation', icon: Calendar },
];

export default function PatientJourney() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [consultationType, setConsultationType] = useState<string>('');

  // Form setup with default values
  const form = useForm<FullPatientJourneyFormData>({
    resolver: zodResolver(fullPatientJourneySchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      age: '',
      country: '',
      treatmentType: '',
      timeline: '',
      budgetRange: '',
      medicalCondition: '',
      previousTreatments: '',
      currentMedications: '',
      allergies: '',
      doctorPreference: '',
      accessibilityNeeds: '',
      preferredDates: '',
      accommodationType: '',
      companionTravelers: '',
      dietaryRequirements: '',
      languagePreference: '',
      hasInsurance: false,
      hasPassport: false,
      hasMedicalRecords: false,
      consultationType: '',
    },
    mode: 'onChange',
  });

  // Pre-populate treatment type from URL parameter
  useEffect(() => {
    const treatmentParam = searchParams.get('treatment');
    if (treatmentParam) {
      const treatmentMap: { [key: string]: string } = {
        'cardiac-surgery': 'cardiac',
        'eye-surgery': 'eye',
        'dental-care': 'dental',
        'cosmetic-surgery': 'cosmetic',
        'general-surgery': 'other',
        'orthopedic-surgery': 'orthopedic'
      };
      
      const mappedTreatment = treatmentMap[treatmentParam] || 'other';
      form.setValue('treatmentType', mappedTreatment);
    }
  }, [searchParams, form]);

  const validateCurrentStep = async () => {
    let isValid = false;
    
    switch (currentStep) {
      case 1:
        isValid = await form.trigger([
          'firstName', 'lastName', 'email', 'phone', 'age', 
          'country', 'treatmentType', 'timeline', 'budgetRange'
        ]);
        break;
      case 2:
        isValid = await form.trigger(['medicalCondition', 'allergies']);
        break;
      case 3:
        isValid = await form.trigger([
          'preferredDates', 'accommodationType', 'companionTravelers', 'languagePreference'
        ]);
        break;
      case 4:
        const { hasPassport, hasMedicalRecords, hasInsurance } = form.getValues();
        isValid = hasPassport || hasMedicalRecords || hasInsurance;
        if (!isValid) {
          form.setError('hasPassport', { message: 'Please confirm you have at least one required document' });
        }
        break;
      case 5:
        isValid = true; // No validation needed for cost estimation step
        break;
      case 6:
        isValid = !!consultationType;
        break;
      default:
        isValid = true;
    }
    
    return isValid;
  };

  const nextStep = async () => {
    const isValid = await validateCurrentStep();
    if (isValid && currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!consultationType) {
      alert('Please select a consultation type before submitting.');
      return;
    }
    
    const isValid = await form.trigger();
    if (isValid) {
      const formData = { ...form.getValues(), consultationType };
      console.log('Form submitted:', formData);
      navigate('/dashboard');
    } else {
      alert('Please complete all required fields before submitting.');
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your first name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your last name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="your.email@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number *</FormLabel>
                    <FormControl>
                      <Input placeholder="+1 (555) 123-4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="age"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Age *</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Your age" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your country" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="us">United States</SelectItem>
                        <SelectItem value="uk">United Kingdom</SelectItem>
                        <SelectItem value="ca">Canada</SelectItem>
                        <SelectItem value="au">Australia</SelectItem>
                        <SelectItem value="de">Germany</SelectItem>
                        <SelectItem value="fr">France</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="timeline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred Timeline *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="When do you want treatment?" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="asap">As soon as possible</SelectItem>
                        <SelectItem value="1-3months">1-3 months</SelectItem>
                        <SelectItem value="3-6months">3-6 months</SelectItem>
                        <SelectItem value="6months+">6+ months</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="treatmentType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Treatment of Interest *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="What treatment are you seeking?" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="cardiac">Cardiac Surgery</SelectItem>
                      <SelectItem value="orthopedic">Orthopedic Surgery</SelectItem>
                      <SelectItem value="cosmetic">Cosmetic Surgery</SelectItem>
                      <SelectItem value="dental">Dental Care</SelectItem>
                      <SelectItem value="eye">Eye Surgery (LASIK)</SelectItem>
                      <SelectItem value="cancer">Cancer Treatment</SelectItem>
                      <SelectItem value="fertility">Fertility Treatment</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="budgetRange"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Budget Range (USD) *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your budget range" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="under5k">Under $5,000</SelectItem>
                      <SelectItem value="5k-10k">$5,000 - $10,000</SelectItem>
                      <SelectItem value="10k-25k">$10,000 - $25,000</SelectItem>
                      <SelectItem value="25k-50k">$25,000 - $50,000</SelectItem>
                      <SelectItem value="50k+">$50,000+</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="medicalCondition"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Medical Condition *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Please describe your current medical condition and symptoms in detail..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="allergies"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Allergies *</FormLabel>
                  <FormControl>
                    <Input placeholder="List any known allergies (write 'None' if no allergies)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="previousTreatments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Previous Treatments/Surgeries</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="List any previous treatments, surgeries, or procedures you've had..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="currentMedications"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Medications</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="List all medications you're currently taking, including dosages..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="doctorPreference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Doctor/Hospital Preferences</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Do you have any specific doctor or hospital preferences? Any certifications or specializations you require?"
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="accessibilityNeeds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Accessibility Needs</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Do you have any mobility, vision, hearing, or other accessibility requirements?"
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="preferredDates"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferred Travel Dates *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., March 2024, or flexible" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="accommodationType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Accommodation Preference *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select accommodation type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="luxury">Luxury Hotel (5-star)</SelectItem>
                      <SelectItem value="premium">Premium Hotel (4-star)</SelectItem>
                      <SelectItem value="standard">Standard Hotel (3-star)</SelectItem>
                      <SelectItem value="budget">Budget Accommodation</SelectItem>
                      <SelectItem value="medical">Medical Facility Nearby</SelectItem>
                      <SelectItem value="apartment">Service Apartment</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="companionTravelers"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Companion Travelers *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="How many people will accompany you?" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="0">Traveling alone</SelectItem>
                      <SelectItem value="1">1 companion</SelectItem>
                      <SelectItem value="2">2 companions</SelectItem>
                      <SelectItem value="3+">3+ companions</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="languagePreference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Language Preference for Medical Interpreter *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select preferred language" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="english">English (no interpreter needed)</SelectItem>
                      <SelectItem value="spanish">Spanish</SelectItem>
                      <SelectItem value="french">French</SelectItem>
                      <SelectItem value="german">German</SelectItem>
                      <SelectItem value="arabic">Arabic</SelectItem>
                      <SelectItem value="chinese">Chinese</SelectItem>
                      <SelectItem value="russian">Russian</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dietaryRequirements"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dietary Requirements</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any dietary restrictions, allergies, or special meal requirements..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Document Upload</h3>
              <p className="text-muted-foreground">
                Please prepare the following documents. You can upload them now or later through your patient dashboard.
              </p>
            </div>

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="hasPassport"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Passport copy (for visa processing)</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hasMedicalRecords"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Medical records (X-rays, lab results, previous surgical reports)</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hasInsurance"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Insurance information (if applicable)</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            {form.formState.errors.hasPassport && (
              <p className="text-sm text-destructive mt-2">
                {form.formState.errors.hasPassport.message}
              </p>
            )}

            <Card>
              <CardContent className="pt-6">
                <h4 className="font-semibold mb-2">Important Notes:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• All documents are encrypted and stored securely</li>
                  <li>• Only your assigned medical team will have access</li>
                  <li>• You can upload documents later through your patient dashboard</li>
                  <li>• High-quality scans or photos are preferred</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        );

      case 5:
        const treatmentType = form.getValues('treatmentType');
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <DollarSign className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="text-lg font-semibold mb-2">Preliminary Cost Estimation</h3>
              <p className="text-muted-foreground">
                Based on your selected treatment and preferences
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Estimated Treatment Package</CardTitle>
                <CardDescription>
                  {treatmentType && `For ${treatmentType} treatment`}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Medical Procedure</span>
                  <span className="font-semibold">$8,000 - $15,000</span>
                </div>
                <div className="flex justify-between">
                  <span>Hospital Stay (3-5 days)</span>
                  <span className="font-semibold">$1,200 - $2,000</span>
                </div>
                <div className="flex justify-between">
                  <span>Accommodation (7 days)</span>
                  <span className="font-semibold">$700 - $2,100</span>
                </div>
                <div className="flex justify-between">
                  <span>Airport Transfers & Local Transport</span>
                  <span className="font-semibold">$200 - $400</span>
                </div>
                <div className="flex justify-between">
                  <span>Concierge Services</span>
                  <span className="font-semibold">$500 - $800</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total Estimated Cost</span>
                    <span className="text-primary">$10,600 - $20,300</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h4 className="font-semibold mb-2">Cost Comparison</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Similar treatment in your home country: <span className="font-semibold">$25,000 - $40,000</span>
                </p>
                <p className="text-sm font-semibold text-green-600">
                  Potential Savings: $14,400 - $19,700 (58% - 68% savings)
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h4 className="font-semibold mb-2">Payment Options</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Flexible payment plans available</li>
                  <li>• Multiple payment methods accepted</li>
                  <li>• Travel insurance recommendations provided</li>
                  <li>• No hidden fees or surprise charges</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="text-lg font-semibold mb-2">Schedule Your Consultation</h3>
              <p className="text-muted-foreground">
                Connect with our medical specialists for a personalized treatment plan
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Free Initial Consultation</CardTitle>
                <CardDescription>
                  15-minute video call with our medical coordinator
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button 
                    type="button"
                    variant={consultationType === 'video' ? 'default' : 'outline'}
                    className="h-16 flex-col"
                    onClick={() => setConsultationType('video')}
                  >
                    <span className="font-semibold">Video Consultation</span>
                    <span className="text-sm opacity-80">Available 24/7</span>
                  </Button>
                  <Button 
                    type="button"
                    variant={consultationType === 'phone' ? 'default' : 'outline'}
                    className="h-16 flex-col"
                    onClick={() => setConsultationType('phone')}
                  >
                    <span className="font-semibold">Phone Consultation</span>
                    <span className="text-sm opacity-80">Call back within 2 hours</span>
                  </Button>
                </div>
                {!consultationType && currentStep === 6 && (
                  <p className="text-sm text-destructive">Please select a consultation type</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>What to Expect</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start">
                    <span className="inline-block w-6 h-6 bg-primary/10 text-primary rounded-full text-xs font-bold flex items-center justify-center mt-0.5 mr-3">1</span>
                    Review your medical history and treatment goals
                  </li>
                  <li className="flex items-start">
                    <span className="inline-block w-6 h-6 bg-primary/10 text-primary rounded-full text-xs font-bold flex items-center justify-center mt-0.5 mr-3">2</span>
                    Match you with the most suitable specialists
                  </li>
                  <li className="flex items-start">
                    <span className="inline-block w-6 h-6 bg-primary/10 text-primary rounded-full text-xs font-bold flex items-center justify-center mt-0.5 mr-3">3</span>
                    Provide detailed treatment timeline and costs
                  </li>
                  <li className="flex items-start">
                    <span className="inline-block w-6 h-6 bg-primary/10 text-primary rounded-full text-xs font-bold flex items-center justify-center mt-0.5 mr-3">4</span>
                    Plan your complete travel and treatment journey
                  </li>
                </ul>
              </CardContent>
            </Card>

            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                By proceeding, you agree to our Terms of Service and Privacy Policy
              </p>
              <Button size="lg" onClick={handleSubmit} className="w-full md:w-auto">
                Complete Registration & Schedule Consultation
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const progressPercentage = (currentStep / steps.length) * 100;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/')}
              className="flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
            <h1 className="text-xl font-semibold">Start Your Medical Journey</h1>
            <div className="w-24" /> {/* Spacer */}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              Step {currentStep} of {steps.length}: {steps[currentStep - 1]?.title}
            </h2>
            <span className="text-sm text-muted-foreground">
              {Math.round(progressPercentage)}% Complete
            </span>
          </div>
          <Progress value={progressPercentage} className="mb-4" />
          
          {/* Step indicators */}
          <div className="hidden md:flex justify-between">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isCompleted = index + 1 < currentStep;
              const isCurrent = index + 1 === currentStep;
              
              return (
                <div key={step.id} className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                    isCompleted ? 'bg-primary text-primary-foreground' :
                    isCurrent ? 'bg-primary/20 text-primary border-2 border-primary' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    <StepIcon className="h-5 w-5" />
                  </div>
                  <span className={`text-xs text-center ${
                    isCurrent ? 'text-primary font-medium' : 'text-muted-foreground'
                  }`}>
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Content */}
        <Form {...form}>
          <Card>
            <CardContent className="pt-6">
              {renderStep()}
            </CardContent>
          </Card>
        </Form>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <Button 
            variant="outline" 
            onClick={prevStep}
            disabled={currentStep === 1}
            className="flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          
          {currentStep < steps.length ? (
            <Button onClick={nextStep} className="flex items-center">
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}