"use client";

import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DoctorProfile } from "@/components/DoctorProfile";
import { DoctorReviews } from "@/components/DoctorReviews";
import PriceComparison from "@/components/PriceComparison";
import { useDoctors, useDoctorReviews } from "@/hooks/useDoctors";
import { ArrowLeft, Clock, DollarSign, Star, Check, Users, Heart, Award, Quote, AlertTriangle, CheckCircle } from "lucide-react";

export default function TreatmentDetails() {
  const params = useParams();
  const category = params?.category as string;
  const router = useRouter();
  const { doctors, loading: doctorsLoading } = useDoctors(category);

  const treatmentData: Record<string, any> = {
    "cardiac-surgery": {
      title: "Cardiac Surgery",
      description: "Advanced cardiovascular procedures performed by board-certified cardiac surgeons using the latest minimally invasive techniques",
      overview: "Our cardiac surgery program combines cutting-edge technology with experienced surgeons to deliver exceptional outcomes for complex heart conditions. We specialize in both traditional open-heart procedures and minimally invasive techniques that reduce recovery time and scarring.",
      idealCandidates: [
        "Patients with coronary artery disease",
        "Those requiring valve repair or replacement",
        "Individuals with congenital heart defects",
        "Patients with aortic aneurysms",
        "Cases requiring arrhythmia surgery"
      ],
      procedures: [
        {
          name: "Coronary Artery Bypass Surgery",
          description: "Surgical procedure to restore blood flow to the heart muscle by creating new pathways around blocked arteries using grafts from other blood vessels.",
          duration: "4-6 hours",
          recovery: "6-8 weeks",
          price: "$12,500 - $18,000",
          egyptPrice: 15250,
          internationalPrices: [
            { country: "United States", flag: "🇺🇸", price: 150000, currency: "$" },
            { country: "United Kingdom", flag: "🇬🇧", price: 35000, currency: "£" },
            { country: "Germany", flag: "🇩🇪", price: 45000, currency: "€" },
            { country: "Canada", flag: "🇨🇦", price: 65000, currency: "C$" }
          ],
          success_rate: "95%",
          candidateRequirements: ["Severe coronary artery disease", "Failed angioplasty", "Multiple vessel blockages"],
          recoveryStages: [
            { stage: "Days 1-3", description: "ICU monitoring, pain management" },
            { stage: "Week 1", description: "Hospital stay, gradual mobilization" },
            { stage: "Weeks 2-6", description: "Home recovery, cardiac rehabilitation" },
            { stage: "Weeks 6-12", description: "Return to normal activities" }
          ]
        },
        {
          name: "Heart Valve Replacement",
          description: "Replacement of damaged heart valves with mechanical or biological valve prosthetics to restore proper blood flow through the heart.",
          duration: "3-4 hours",
          recovery: "4-6 weeks",
          price: "$15,000 - $22,000",
          egyptPrice: 18500,
          internationalPrices: [
            { country: "United States", flag: "🇺🇸", price: 180000, currency: "$" },
            { country: "United Kingdom", flag: "🇬🇧", price: 42000, currency: "£" },
            { country: "Germany", flag: "🇩🇪", price: 55000, currency: "€" },
            { country: "Canada", flag: "🇨🇦", price: 75000, currency: "C$" }
          ],
          success_rate: "92%",
          candidateRequirements: ["Severe valve stenosis", "Valve regurgitation", "Failed valve repair"],
          recoveryStages: [
            { stage: "Days 1-2", description: "ICU monitoring, anticoagulation management" },
            { stage: "Days 3-5", description: "Ward care, breathing exercises" },
            { stage: "Weeks 1-4", description: "Home recovery, medication adjustment" },
            { stage: "Weeks 4-6", description: "Gradual activity increase" }
          ]
        }
      ]
    },
    "eye-surgery": {
      title: "Eye Surgery",
      description: "Comprehensive ophthalmological procedures using cutting-edge laser technology and advanced surgical techniques",
      overview: "Our ophthalmology department offers the latest in vision correction and eye disease treatment. Using state-of-the-art laser systems and microsurgical techniques, we provide precise, safe procedures with excellent visual outcomes.",
      idealCandidates: [
        "Patients with refractive errors (myopia, hyperopia, astigmatism)",
        "Individuals with cataracts affecting vision",
        "Those with retinal conditions",
        "Patients seeking vision correction surgery",
        "Cases requiring specialized eye treatments"
      ],
      procedures: [
        {
          name: "LASIK Eye Surgery",
          description: "Advanced laser vision correction to treat nearsightedness, farsightedness, and astigmatism using precise corneal reshaping.",
          duration: "15-30 minutes per eye",
          recovery: "1-2 weeks",
          price: "$1,200 - $2,500",
          egyptPrice: 1850,
          internationalPrices: [
            { country: "United States", flag: "🇺🇸", price: 4500, currency: "$" },
            { country: "United Kingdom", flag: "🇬🇧", price: 3200, currency: "£" },
            { country: "Germany", flag: "🇩🇪", price: 3800, currency: "€" },
            { country: "Canada", flag: "🇨🇦", price: 5200, currency: "C$" }
          ],
          success_rate: "96%",
          candidateRequirements: ["Stable prescription for 1+ year", "Adequate corneal thickness", "No severe dry eyes"],
          recoveryStages: [
            { stage: "Day 1", description: "Rest, use prescribed drops" },
            { stage: "Days 2-7", description: "Gradual vision improvement" },
            { stage: "Week 2", description: "Most activities resumed" },
            { stage: "Month 1", description: "Final vision assessment" }
          ]
        }
      ]
    },
    "cosmetic-surgery": {
      title: "Cosmetic Surgery",
      description: "Aesthetic procedures performed by certified plastic surgeons for natural-looking enhancement and rejuvenation",
      overview: "Our cosmetic surgery department combines artistic vision with surgical excellence to achieve natural-looking results. We use the latest techniques and technologies to ensure optimal outcomes with minimal downtime.",
      idealCandidates: [
        "Individuals seeking aesthetic enhancement",
        "Patients with realistic expectations",
        "Those in good overall health",
        "People wanting to improve self-confidence",
        "Cases requiring reconstructive procedures"
      ],
      procedures: [
        {
          name: "Rhinoplasty (Nose Job)",
          description: "Surgical reshaping of the nose for aesthetic improvement or functional correction, creating natural-looking results.",
          duration: "2-4 hours",
          recovery: "2-3 weeks",
          price: "$2,800 - $4,500",
          egyptPrice: 3650,
          internationalPrices: [
            { country: "United States", flag: "🇺🇸", price: 12000, currency: "$" },
            { country: "United Kingdom", flag: "🇬🇧", price: 8500, currency: "£" },
            { country: "Germany", flag: "🇩🇪", price: 9200, currency: "€" },
            { country: "Canada", flag: "🇨🇦", price: 11500, currency: "C$" }
          ],
          success_rate: "92%",
          candidateRequirements: ["Mature facial features", "Realistic expectations", "Good nasal health"],
          recoveryStages: [
            { stage: "Week 1", description: "Splint removal, initial swelling" },
            { stage: "Weeks 2-3", description: "Gradual swelling reduction" },
            { stage: "Months 2-3", description: "Refined results emerge" },
            { stage: "Month 12", description: "Final results achieved" }
          ]
        }
      ]
    },
    "dental-care": {
      title: "Dental Care",
      description: "Complete dental treatments and cosmetic procedures with modern techniques and advanced materials",
      overview: "Our dental department offers comprehensive oral healthcare services using the latest technology and materials. From routine treatments to complex cosmetic procedures, we ensure optimal oral health and beautiful smiles with internationally trained specialists.",
      idealCandidates: [
        "Patients seeking dental implants or tooth replacement",
        "Individuals wanting cosmetic smile enhancement",
        "Those requiring complex dental treatments",
        "Patients needing endodontic procedures",
        "Cases requiring oral surgery or periodontal treatment"
      ],
      procedures: [
        {
          name: "Dental Implants",
          description: "Permanent tooth replacement using titanium implants and ceramic crowns for natural-looking, long-lasting results.",
          duration: "2-3 sessions over 3-6 months",
          recovery: "3-6 months",
          price: "$800 - $1,500 per implant",
          egyptPrice: 1150,
          internationalPrices: [
            { country: "United States", flag: "🇺🇸", price: 5500, currency: "$" },
            { country: "United Kingdom", flag: "🇬🇧", price: 3800, currency: "£" },
            { country: "Germany", flag: "🇩🇪", price: 4200, currency: "€" },
            { country: "Canada", flag: "🇨🇦", price: 4800, currency: "C$" }
          ],
          success_rate: "95%",
          candidateRequirements: ["Adequate bone density", "Good oral hygiene", "Non-smoker preferred", "Healthy gums"],
          recoveryStages: [
            { stage: "Day 1-3", description: "Initial healing, soft diet required" },
            { stage: "Weeks 1-2", description: "Swelling subsides, suture removal" },
            { stage: "Months 1-3", description: "Osseointegration period" },
            { stage: "Months 3-6", description: "Crown placement and final restoration" }
          ]
        }
      ]
    },
    "general-surgery": {
      title: "General Surgery", 
      description: "Wide range of surgical procedures using minimally invasive techniques for faster recovery",
      overview: "Our general surgery department specializes in minimally invasive laparoscopic procedures that reduce pain, scarring, and recovery time. Our experienced surgeons use advanced techniques to treat a variety of conditions with excellent outcomes.",
      idealCandidates: [
        "Patients requiring gallbladder removal",
        "Individuals with hernia conditions",
        "Those needing appendix removal",
        "Patients with digestive system issues",
        "Cases requiring minimally invasive procedures"
      ],
      procedures: [
        {
          name: "Laparoscopic Gallbladder Surgery",
          description: "Minimally invasive removal of the gallbladder through small incisions using advanced laparoscopic techniques.",
          duration: "1-2 hours",
          recovery: "1-2 weeks",
          price: "$2,500 - $4,000",
          egyptPrice: 3250,
          internationalPrices: [
            { country: "United States", flag: "🇺🇸", price: 18000, currency: "$" },
            { country: "United Kingdom", flag: "🇬🇧", price: 12500, currency: "£" },
            { country: "Germany", flag: "🇩🇪", price: 14000, currency: "€" },
            { country: "Canada", flag: "🇨🇦", price: 16000, currency: "C$" }
          ],
          success_rate: "98%",
          candidateRequirements: ["Gallstones or gallbladder inflammation", "Good overall health", "No severe adhesions"],
          recoveryStages: [
            { stage: "Day 1", description: "Same-day or overnight stay" },
            { stage: "Days 2-7", description: "Light activities, prescribed diet" },
            { stage: "Week 2", description: "Return to normal activities" },
            { stage: "Month 1", description: "Full recovery achieved" }
          ]
        }
      ]
    },
    "orthopedic-surgery": {
      title: "Orthopedic Surgery",
      description: "Joint replacement and bone treatments using advanced surgical techniques",
      overview: "Our orthopedic surgery department uses the latest techniques in joint replacement, sports medicine, and bone treatments. We focus on restoring mobility and reducing pain with minimally invasive approaches when possible.",
      idealCandidates: [
        "Patients with joint pain and limited mobility",
        "Individuals with arthritis affecting daily life",
        "Those with sports injuries",
        "Patients requiring joint replacement",
        "Cases involving bone fractures or deformities"
      ],
      procedures: [
        {
          name: "Hip Replacement Surgery",
          description: "Complete or partial replacement of hip joint with artificial prosthetics to restore mobility and reduce pain.",
          duration: "2-3 hours",
          recovery: "6-12 weeks",
          price: "$8,000 - $12,000",
          egyptPrice: 10000,
          internationalPrices: [
            { country: "United States", flag: "🇺🇸", price: 65000, currency: "$" },
            { country: "United Kingdom", flag: "🇬🇧", price: 28000, currency: "£" },
            { country: "Germany", flag: "🇩🇪", price: 32000, currency: "€" },
            { country: "Canada", flag: "🇨🇦", price: 45000, currency: "C$" }
          ],
          success_rate: "95%",
          candidateRequirements: ["Severe hip arthritis", "Failed conservative treatment", "Good overall health"],
          recoveryStages: [
            { stage: "Days 1-3", description: "Hospital stay, pain management" },
            { stage: "Weeks 1-6", description: "Physical therapy, gradual mobility" },
            { stage: "Weeks 6-12", description: "Increased activity, strengthening" },
            { stage: "Months 3-6", description: "Full recovery and return to activities" }
          ]
        }
      ]
    }
  };

  const treatment = treatmentData[category || ""];

  if (!treatment) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="py-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-3xl font-bold text-foreground mb-4">Treatment Not Found</h1>
            <p className="text-muted-foreground mb-8">The requested treatment category could not be found.</p>
            <Button onClick={() => router.push("/treatments")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Treatments
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      
      <main>
        {/* Breadcrumb Navigation */}
        <section className="py-8 bg-muted/30">
          <div className="container mx-auto px-4">
            <button
              onClick={() => router.push("/treatments")}
              className="flex items-center text-primary hover:text-primary/80 transition-colors mb-6"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to All Treatments
            </button>
            
            <div className="max-w-4xl">
              <Badge variant="outline" className="mb-4">{treatment.title}</Badge>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                {treatment.title}
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                {treatment.description}
              </p>
            </div>
          </div>
        </section>

        {/* Treatment Overview */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              <div className="lg:col-span-2">
                <h2 className="text-3xl font-bold text-foreground mb-6">Treatment Overview</h2>
                <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                  {treatment.overview}
                </p>
                
                <div className="bg-gradient-card rounded-lg p-6 border border-border/50">
                  <h3 className="text-xl font-semibold text-foreground mb-4">Ideal Candidates</h3>
                  <ul className="space-y-3">
                    {treatment.idealCandidates.map((candidate: string, index: number) => (
                      <li key={index} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground">{candidate}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              <div>
                <Card className="border-primary/20 bg-gradient-card">
                  <CardHeader>
                    <CardTitle className="text-xl text-foreground">Quick Facts</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-primary" />
                      <div>
                        <div className="font-medium text-foreground">Expert Surgeons</div>
                        <div className="text-sm text-muted-foreground">Board-certified specialists</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Star className="h-5 w-5 text-primary" />
                      <div>
                        <div className="font-medium text-foreground">Success Rate</div>
                        <div className="text-sm text-muted-foreground">95%+ patient satisfaction</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Heart className="h-5 w-5 text-primary" />
                      <div>
                        <div className="font-medium text-foreground">Aftercare</div>
                        <div className="text-sm text-muted-foreground">Comprehensive recovery support</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Specialist Doctors */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">Our Specialist Doctors</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Meet our internationally trained specialists who combine years of experience with 
                cutting-edge techniques to deliver exceptional results.
              </p>
            </div>

            {doctorsLoading ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
                {[1, 2].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-muted rounded-lg h-64"></div>
                  </div>
                ))}
              </div>
            ) : doctors.length > 0 ? (
              <div className="space-y-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
                  {doctors.map((doctor, index) => (
                    <DoctorProfile 
                      key={doctor.id} 
                      doctor={doctor} 
                    />
                  ))}
                </div>
                
                {/* Doctor Reviews */}
                {doctors.length > 0 && <DoctorReviewsSection doctors={doctors} />}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No specialists found for this treatment category.</p>
              </div>
            )}
          </div>
        </section>

        {/* Procedures Section */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Available Procedures
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Comprehensive information about each procedure including recovery details and candidate requirements
              </p>
            </div>

            <div className="space-y-12">
              {treatment.procedures.map((procedure: any, index: number) => (
                <Card key={index} className="border-border/50 hover:shadow-card-hover transition-spring">
                  <CardHeader>
                    <CardTitle className="text-2xl">{procedure.name}</CardTitle>
                    <p className="text-muted-foreground text-lg">{procedure.description}</p>
                  </CardHeader>
                  <CardContent>
                    {/* Basic Info Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <Clock className="h-6 w-6 text-primary mx-auto mb-2" />
                        <div className="text-sm font-medium text-foreground">Duration</div>
                        <div className="text-sm text-muted-foreground">{procedure.duration}</div>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <Heart className="h-6 w-6 text-primary mx-auto mb-2" />
                        <div className="text-sm font-medium text-foreground">Recovery</div>
                        <div className="text-sm text-muted-foreground">{procedure.recovery}</div>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <DollarSign className="h-6 w-6 text-primary mx-auto mb-2" />
                        <div className="text-sm font-medium text-foreground">Price</div>
                        <div className="text-sm text-muted-foreground">{procedure.price}</div>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <Star className="h-6 w-6 text-primary mx-auto mb-2" />
                        <div className="text-sm font-medium text-foreground">Success Rate</div>
                        <div className="text-sm text-muted-foreground">{procedure.success_rate}</div>
                      </div>
                    </div>

                    {/* Candidate Requirements */}
                    <div className="mb-8">
                      <h4 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-primary" />
                        Candidate Requirements
                      </h4>
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {procedure.candidateRequirements.map((req: string, reqIndex: number) => (
                          <li key={reqIndex} className="flex items-start gap-2">
                            <Check className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                            <span className="text-muted-foreground">{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Price Comparison */}
                    {procedure.internationalPrices && (
                      <div className="mb-8">
                        <PriceComparison
                          treatment={procedure.name}
                          egyptPrice={procedure.egyptPrice}
                          internationalPrices={procedure.internationalPrices}
                        />
                      </div>
                    )}

                    {/* Recovery Timeline */}
                    <div>
                      <h4 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                        <Clock className="h-5 w-5 text-primary" />
                        Recovery Timeline
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {procedure.recoveryStages.map((stage: any, stageIndex: number) => (
                          <div key={stageIndex} className="p-4 border border-border rounded-lg">
                            <div className="text-sm font-medium text-primary mb-2">{stage.stage}</div>
                            <div className="text-sm text-muted-foreground">{stage.description}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-hero">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-background mb-4">
              Ready to Start Your {treatment.title} Journey?
            </h2>
            <p className="text-xl text-background/90 mb-8 max-w-2xl mx-auto">
              Get a personalized treatment plan and cost estimate from our medical experts
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                variant="accent"
                onClick={() => router.push(`/start-journey?treatment=${category}`)}
              >
                Start Your Journey
              </Button>
              <Button 
                size="lg" 
                variant="hero"
                onClick={() => router.push('/contact')}
              >
                Schedule Consultation
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

// Component to handle doctor reviews section
const DoctorReviewsSection = ({ doctors }: { doctors: any[] }) => {
  // Get reviews for the first doctor as an example (in a real app, you might show all or let users select)
  const { reviews } = useDoctorReviews(doctors[0]?.id || '');
  
  if (reviews.length === 0) return null;
  
  return (
    <div className="max-w-6xl mx-auto">
      <DoctorReviews reviews={reviews} />
    </div>
  );
};

