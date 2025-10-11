"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, Upload, Calendar, DollarSign, User, FileText, Stethoscope, Plane, Check, X, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

const steps = [
  { id: 1, title: 'Basic Information', icon: User },
  { id: 2, title: 'Medical History', icon: Stethoscope },
  { id: 3, title: 'Travel Preferences', icon: Plane },
  { id: 4, title: 'Documents', icon: FileText },
  { id: 5, title: 'Cost Estimation', icon: DollarSign },
  { id: 6, title: 'Schedule Consultation', icon: Calendar },
];

function PatientJourneyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedFiles, setUploadedFiles] = useState({
    passport: null as File | null,
    medicalRecords: [] as File[],
    insurance: null as File | null,
  });
  const [formData, setFormData] = useState({
    // Step 1: Basic Information
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    age: '',
    country: '',
    treatmentType: '',
    timeline: '',
    budgetRange: '',
    
    // Step 2: Medical History
    medicalCondition: '',
    previousTreatments: '',
    currentMedications: '',
    allergies: '',
    doctorPreference: '',
    accessibilityNeeds: '',
    
    // Step 3: Travel Preferences
    preferredDates: '',
    accommodationType: '',
    companionTravelers: '',
    dietaryRequirements: '',
    languagePreference: '',
    
    // Step 4: Documents (file uploads would be handled separately)
    hasInsurance: false,
    hasPassport: false,
    hasMedicalRecords: false,
    
    // Step 5 & 6 are informational/selection steps
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
      setFormData(prev => ({ ...prev, treatmentType: mappedTreatment }));
    }
  }, [searchParams]);

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (fileType: 'passport' | 'medicalRecords' | 'insurance', files: FileList | null) => {
    if (!files) return;

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    const validFiles = Array.from(files).filter(file => {
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not supported. Please upload PDF, JPG, or PNG files.`,
          variant: "destructive",
        });
        return false;
      }
      if (file.size > maxSize) {
        toast({
          title: "File too large",
          description: `${file.name} is over 10MB. Please compress the file.`,
          variant: "destructive",
        });
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      setUploadedFiles(prev => {
        if (fileType === 'medicalRecords') {
          return { ...prev, [fileType]: [...prev.medicalRecords, ...validFiles] };
        } else {
          return { ...prev, [fileType]: validFiles[0] };
        }
      });

      // Auto-check the corresponding checkbox
      updateFormData(`has${fileType.charAt(0).toUpperCase() + fileType.slice(1)}`, true);

      toast({
        title: "File uploaded successfully",
        description: `${validFiles.length} file(s) uploaded for ${fileType.replace(/([A-Z])/g, ' $1').toLowerCase()}.`,
      });
    }
  };

  const removeFile = (fileType: 'passport' | 'medicalRecords' | 'insurance', index?: number) => {
    setUploadedFiles(prev => {
      if (fileType === 'medicalRecords' && typeof index === 'number') {
        const newFiles = [...prev.medicalRecords];
        newFiles.splice(index, 1);
        const hasFiles = newFiles.length > 0;
        updateFormData('hasMedicalRecords', hasFiles);
        return { ...prev, medicalRecords: newFiles };
      } else {
        updateFormData(`has${fileType.charAt(0).toUpperCase() + fileType.slice(1)}`, false);
        return { ...prev, [fileType]: null };
      }
    });
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    // Here you would typically send the data to your backend
    console.log('Form submitted:', formData);
    // Navigate to dashboard or confirmation page
    router.push('/dashboard');
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => updateFormData('firstName', e.target.value)}
                  placeholder="Enter your first name"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => updateFormData('lastName', e.target.value)}
                  placeholder="Enter your last name"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateFormData('email', e.target.value)}
                  placeholder="your.email@example.com"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => updateFormData('phone', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  value={formData.age}
                  onChange={(e) => updateFormData('age', e.target.value)}
                  placeholder="Your age"
                />
              </div>
              <div>
                <Label htmlFor="country">Country</Label>
                <Select onValueChange={(value) => updateFormData('country', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your country" />
                  </SelectTrigger>
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
              </div>
              <div>
                <Label htmlFor="timeline">Preferred Timeline</Label>
                <Select onValueChange={(value) => updateFormData('timeline', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="When do you want treatment?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asap">As soon as possible</SelectItem>
                    <SelectItem value="1-3months">1-3 months</SelectItem>
                    <SelectItem value="3-6months">3-6 months</SelectItem>
                    <SelectItem value="6months+">6+ months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="treatmentType">Treatment of Interest</Label>
              <Select value={formData.treatmentType} onValueChange={(value) => updateFormData('treatmentType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="What treatment are you seeking?" />
                </SelectTrigger>
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
            </div>

            <div>
              <Label htmlFor="budgetRange">Budget Range (USD)</Label>
              <Select onValueChange={(value) => updateFormData('budgetRange', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your budget range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="under5k">Under $5,000</SelectItem>
                  <SelectItem value="5k-10k">$5,000 - $10,000</SelectItem>
                  <SelectItem value="10k-25k">$10,000 - $25,000</SelectItem>
                  <SelectItem value="25k-50k">$25,000 - $50,000</SelectItem>
                  <SelectItem value="50k+">$50,000+</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="medicalCondition">Current Medical Condition</Label>
              <Textarea
                id="medicalCondition"
                value={formData.medicalCondition}
                onChange={(e) => updateFormData('medicalCondition', e.target.value)}
                placeholder="Please describe your current medical condition and symptoms in detail..."
                className="min-h-[100px]"
              />
            </div>

            <div>
              <Label htmlFor="previousTreatments">Previous Treatments/Surgeries</Label>
              <Textarea
                id="previousTreatments"
                value={formData.previousTreatments}
                onChange={(e) => updateFormData('previousTreatments', e.target.value)}
                placeholder="List any previous treatments, surgeries, or procedures you&apos;ve had..."
                className="min-h-[80px]"
              />
            </div>

            <div>
              <Label htmlFor="currentMedications">Current Medications</Label>
              <Textarea
                id="currentMedications"
                value={formData.currentMedications}
                onChange={(e) => updateFormData('currentMedications', e.target.value)}
                placeholder="List all medications you&apos;re currently taking, including dosages..."
                className="min-h-[80px]"
              />
            </div>

            <div>
              <Label htmlFor="allergies">Allergies</Label>
              <Input
                id="allergies"
                value={formData.allergies}
                onChange={(e) => updateFormData('allergies', e.target.value)}
                placeholder="List any known allergies (medications, foods, materials, etc.)"
              />
            </div>

            <div>
              <Label htmlFor="doctorPreference">Doctor/Hospital Preferences</Label>
              <Textarea
                id="doctorPreference"
                value={formData.doctorPreference}
                onChange={(e) => updateFormData('doctorPreference', e.target.value)}
                placeholder="Do you have any specific doctor or hospital preferences? Any certifications or specializations you require?"
                className="min-h-[80px]"
              />
            </div>

            <div>
              <Label htmlFor="accessibilityNeeds">Accessibility Needs</Label>
              <Textarea
                id="accessibilityNeeds"
                value={formData.accessibilityNeeds}
                onChange={(e) => updateFormData('accessibilityNeeds', e.target.value)}
                placeholder="Do you have any mobility, vision, hearing, or other accessibility requirements?"
                className="min-h-[80px]"
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="preferredDates">Preferred Travel Dates</Label>
              <Input
                id="preferredDates"
                value={formData.preferredDates}
                onChange={(e) => updateFormData('preferredDates', e.target.value)}
                placeholder="e.g., March 2024, or flexible"
              />
            </div>

            <div>
              <Label htmlFor="accommodationType">Accommodation Preference</Label>
              <Select onValueChange={(value) => updateFormData('accommodationType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select accommodation type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="luxury">Luxury Hotel (5-star)</SelectItem>
                  <SelectItem value="premium">Premium Hotel (4-star)</SelectItem>
                  <SelectItem value="standard">Standard Hotel (3-star)</SelectItem>
                  <SelectItem value="budget">Budget Accommodation</SelectItem>
                  <SelectItem value="medical">Medical Service Provider Nearby</SelectItem>
                  <SelectItem value="apartment">Service Apartment</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="companionTravelers">Companion Travelers</Label>
              <Select onValueChange={(value) => updateFormData('companionTravelers', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="How many people will accompany you?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Traveling alone</SelectItem>
                  <SelectItem value="1">1 companion</SelectItem>
                  <SelectItem value="2">2 companions</SelectItem>
                  <SelectItem value="3+">3+ companions</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="dietaryRequirements">Dietary Requirements</Label>
              <Textarea
                id="dietaryRequirements"
                value={formData.dietaryRequirements}
                onChange={(e) => updateFormData('dietaryRequirements', e.target.value)}
                placeholder="Any dietary restrictions, allergies, or special meal requirements..."
                className="min-h-[80px]"
              />
            </div>

            <div>
              <Label htmlFor="languagePreference">Language Preference for Medical Interpreter</Label>
              <Select onValueChange={(value) => updateFormData('languagePreference', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select preferred language" />
                </SelectTrigger>
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
            </div>
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

            <div className="space-y-6">
              {/* Passport Upload */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="hasPassport"
                      checked={formData.hasPassport}
                      onCheckedChange={(checked) => updateFormData('hasPassport', checked)}
                    />
                    <Label htmlFor="hasPassport" className="text-sm font-medium">
                      Passport copy (for visa processing)
                    </Label>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => document.getElementById('passport-upload')?.click()}
                    className="flex items-center space-x-2"
                  >
                    <Upload className="h-4 w-4" />
                    <span>Upload</span>
                  </Button>
                  <input
                    id="passport-upload"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={(e) => handleFileUpload('passport', e.target.files)}
                  />
                </div>
                {uploadedFiles.passport && (
                  <div className="ml-6 p-3 bg-muted rounded-lg flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Check className="h-4 w-4 text-green-600" />
                      <span className="text-sm">{uploadedFiles.passport.name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile('passport')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Medical Records Upload */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="hasMedicalRecords"
                      checked={formData.hasMedicalRecords}
                      onCheckedChange={(checked) => updateFormData('hasMedicalRecords', checked)}
                    />
                    <Label htmlFor="hasMedicalRecords" className="text-sm font-medium">
                      Medical records (X-rays, lab results, previous surgical reports)
                    </Label>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => document.getElementById('medical-upload')?.click()}
                    className="flex items-center space-x-2"
                  >
                    <Upload className="h-4 w-4" />
                    <span>Upload</span>
                  </Button>
                  <input
                    id="medical-upload"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFileUpload('medicalRecords', e.target.files)}
                  />
                </div>
                {uploadedFiles.medicalRecords.length > 0 && (
                  <div className="ml-6 space-y-2">
                    {uploadedFiles.medicalRecords.map((file, index) => (
                      <div key={index} className="p-3 bg-muted rounded-lg flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Check className="h-4 w-4 text-green-600" />
                          <span className="text-sm">{file.name}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile('medicalRecords', index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Insurance Upload */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="hasInsurance"
                      checked={formData.hasInsurance}
                      onCheckedChange={(checked) => updateFormData('hasInsurance', checked)}
                    />
                    <Label htmlFor="hasInsurance" className="text-sm font-medium">
                      Insurance information (if applicable)
                    </Label>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => document.getElementById('insurance-upload')?.click()}
                    className="flex items-center space-x-2"
                  >
                    <Upload className="h-4 w-4" />
                    <span>Upload</span>
                  </Button>
                  <input
                    id="insurance-upload"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={(e) => handleFileUpload('insurance', e.target.files)}
                  />
                </div>
                {uploadedFiles.insurance && (
                  <div className="ml-6 p-3 bg-muted rounded-lg flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Check className="h-4 w-4 text-green-600" />
                      <span className="text-sm">{uploadedFiles.insurance.name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile('insurance')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

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
                  {formData.treatmentType && `For ${formData.treatmentType} treatment`}
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
                  <Button className="h-16 flex-col">
                    <span className="font-semibold">Video Consultation</span>
                    <span className="text-sm opacity-80">Available 24/7</span>
                  </Button>
                  <Button variant="outline" className="h-16 flex-col">
                    <span className="font-semibold">Phone Consultation</span>
                    <span className="text-sm opacity-80">Call back within 2 hours</span>
                  </Button>
                </div>
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
              onClick={() => router.push('/')}
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
        <Card>
          <CardContent className="pt-6">
            {renderStep()}
          </CardContent>
        </Card>

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
          ) : (
            <Button onClick={handleSubmit} className="flex items-center">
              Complete Registration
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PatientJourney() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <PatientJourneyContent />
    </Suspense>
  );
}