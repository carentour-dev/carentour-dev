import { useParams, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Clock, DollarSign, Star, Check, Users, Heart, Award, Quote, AlertTriangle, CheckCircle } from "lucide-react";
import drAhmedMansour from "@/assets/doctor-ahmed-mansour.jpg";
import drLaylaKhalil from "@/assets/doctor-layla-khalil.jpg";
import drOmarFarouk from "@/assets/doctor-omar-farouk.jpg";

const TreatmentDetails = () => {
  const { category } = useParams();
  const navigate = useNavigate();

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
      doctors: [
        {
          name: "Dr. Ahmed Mansour",
          title: "Chief Cardiac Surgeon",
          specialization: "Minimally Invasive Cardiac Surgery",
          experience: "18+ years",
          education: "Cairo University, Harvard Medical Fellowship",
          languages: ["English", "Arabic", "French"],
          image: drAhmedMansour,
          achievements: ["1,500+ successful surgeries", "Published 40+ research papers", "International training in Germany"]
        }
      ],
      testimonials: [
        {
          name: "Robert Johnson",
          country: "United States",
          procedure: "Coronary Bypass Surgery",
          rating: 5,
          text: "Dr. Mansour and his team saved my life. The quality of care was exceptional, and the cost was a fraction of what I would pay in the US. The hospital facilities were world-class.",
          recoveryTime: "6 weeks"
        },
        {
          name: "Maria Schmidt",
          country: "Germany",
          procedure: "Heart Valve Replacement",
          rating: 5,
          text: "Outstanding experience from consultation to recovery. The medical team was professional, and the coordinator spoke perfect German. I'm completely satisfied with my results.",
          recoveryTime: "4 weeks"
        }
      ],
      procedures: [
        {
          name: "Coronary Artery Bypass Surgery",
          description: "Surgical procedure to restore blood flow to the heart muscle by creating new pathways around blocked arteries using grafts from other blood vessels.",
          duration: "4-6 hours",
          recovery: "6-8 weeks",
          price: "$12,500 - $18,000",
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
          success_rate: "92%",
          candidateRequirements: ["Severe valve stenosis", "Valve regurgitation", "Failed valve repair"],
          recoveryStages: [
            { stage: "Days 1-2", description: "ICU monitoring, anticoagulation management" },
            { stage: "Days 3-5", description: "Ward care, breathing exercises" },
            { stage: "Weeks 1-4", description: "Home recovery, medication adjustment" },
            { stage: "Weeks 4-6", description: "Gradual activity increase" }
          ]
        },
        {
          name: "Angioplasty & Stenting",
          description: "Minimally invasive procedure to open blocked coronary arteries using balloon inflation and stent placement to restore blood flow.",
          duration: "1-2 hours",
          recovery: "2-3 days",
          price: "$8,500 - $12,000",
          success_rate: "97%",
          candidateRequirements: ["Single or double vessel disease", "Suitable lesion anatomy", "Good overall health"],
          recoveryStages: [
            { stage: "Day 1", description: "Observation, bed rest for 4-6 hours" },
            { stage: "Day 2", description: "Discharge home, light activities" },
            { stage: "Week 1", description: "Gradual return to normal activities" },
            { stage: "Month 1", description: "Full activity clearance" }
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
      doctors: [
        {
          name: "Dr. Layla Khalil",
          title: "Chief Ophthalmologist",
          specialization: "Refractive & Cataract Surgery",
          experience: "15+ years",
          education: "Alexandria University, Johns Hopkins Fellowship",
          languages: ["English", "Arabic", "Italian"],
          image: drLaylaKhalil,
          achievements: ["5,000+ LASIK procedures", "Pioneer in Egypt for advanced IOLs", "International speaker at eye conferences"]
        }
      ],
      testimonials: [
        {
          name: "Sarah Williams",
          country: "United Kingdom",
          procedure: "LASIK Surgery",
          rating: 5,
          text: "Perfect vision after 20 years of glasses! Dr. Khalil was incredibly thorough during the consultation. The procedure was quick and painless. Best decision I ever made.",
          recoveryTime: "1 week"
        },
        {
          name: "Giuseppe Romano",
          country: "Italy",
          procedure: "Cataract Surgery",
          rating: 5,
          text: "Excellent results with premium lens implants. Dr. Khalil speaks fluent Italian, which made me feel comfortable. My vision is better than it was 20 years ago!",
          recoveryTime: "3 weeks"
        }
      ],
      procedures: [
        {
          name: "LASIK Eye Surgery",
          description: "Advanced laser vision correction to treat nearsightedness, farsightedness, and astigmatism using precise corneal reshaping.",
          duration: "15-30 minutes per eye",
          recovery: "1-2 weeks",
          price: "$1,200 - $2,500",
          success_rate: "96%",
          candidateRequirements: ["Stable prescription for 1+ year", "Adequate corneal thickness", "No severe dry eyes"],
          recoveryStages: [
            { stage: "Day 1", description: "Rest, use prescribed drops" },
            { stage: "Days 2-7", description: "Gradual vision improvement" },
            { stage: "Week 2", description: "Most activities resumed" },
            { stage: "Month 1", description: "Final vision assessment" }
          ]
        },
        {
          name: "Cataract Surgery",
          description: "Removal of clouded natural lens and replacement with advanced artificial intraocular lens for clear vision.",
          duration: "20-30 minutes",
          recovery: "4-6 weeks",
          price: "$2,000 - $3,500",
          success_rate: "98%",
          candidateRequirements: ["Significant vision impairment from cataracts", "Healthy eye structure", "Realistic expectations"],
          recoveryStages: [
            { stage: "Day 1", description: "Eye shield, rest required" },
            { stage: "Week 1", description: "Gradual vision clearing" },
            { stage: "Weeks 2-4", description: "Vision stabilization" },
            { stage: "Weeks 4-6", description: "Final prescription fitting" }
          ]
        },
        {
          name: "Retinal Surgery",
          description: "Specialized surgical treatment for retinal detachment, macular holes, and diabetic retinopathy using microsurgical techniques.",
          duration: "1-3 hours",
          recovery: "2-6 weeks",
          price: "$3,500 - $6,000",
          success_rate: "85%",
          candidateRequirements: ["Diagnosed retinal condition", "Suitable for surgery", "Commitment to post-op care"],
          recoveryStages: [
            { stage: "Days 1-3", description: "Strict positioning, eye drops" },
            { stage: "Week 1", description: "Limited activities, monitoring" },
            { stage: "Weeks 2-4", description: "Gradual improvement" },
            { stage: "Weeks 4-6", description: "Activity clearance" }
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
      doctors: [
        {
          name: "Dr. Omar Farouk",
          title: "Chief Plastic Surgeon",
          specialization: "Aesthetic & Reconstructive Surgery",
          experience: "16+ years",
          education: "Cairo University, Beverly Hills Fellowship",
          languages: ["English", "Arabic", "Spanish"],
          image: drOmarFarouk,
          achievements: ["2,000+ aesthetic procedures", "Celebrity surgeon", "International aesthetic surgery trainer"]
        }
      ],
      testimonials: [
        {
          name: "Jennifer Lopez",
          country: "United States",
          procedure: "Rhinoplasty",
          rating: 5,
          text: "Dr. Farouk gave me the nose I always dreamed of. The results look completely natural, and the recovery was smoother than expected. Highly recommend!",
          recoveryTime: "2 weeks"
        },
        {
          name: "Ana Rodriguez",
          country: "Spain",
          procedure: "Breast Augmentation",
          rating: 5,
          text: "Fantastic results! Dr. Farouk understood exactly what I wanted. The Spanish-speaking coordinator made everything easy. I'm thrilled with my new look.",
          recoveryTime: "4 weeks"
        }
      ],
      procedures: [
        {
          name: "Rhinoplasty (Nose Job)",
          description: "Surgical reshaping of the nose for aesthetic improvement or functional correction, creating natural-looking results.",
          duration: "2-4 hours",
          recovery: "2-3 weeks",
          price: "$2,800 - $4,500",
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
    // ... keeping other treatments with similar comprehensive data structure
    "dental-care": {
      title: "Dental Care",
      description: "Complete dental treatments and cosmetic procedures with modern techniques",
      procedures: [
        {
          name: "Dental Implants",
          description: "Permanent tooth replacement using titanium implants and ceramic crowns.",
          duration: "2-3 sessions over 3-6 months",
          recovery: "3-6 months",
          price: "$800 - $1,500 per implant",
          success_rate: "95%"
        }
      ]
    },
    "general-surgery": {
      title: "General Surgery", 
      description: "Wide range of surgical procedures using minimally invasive techniques",
      procedures: [
        {
          name: "Laparoscopic Gallbladder Surgery",
          description: "Minimally invasive removal of gallbladder through small incisions.",
          duration: "1-2 hours",
          recovery: "1-2 weeks", 
          price: "$1,500 - $2,500",
          success_rate: "98%"
        }
      ]
    },
    "orthopedic-surgery": {
      title: "Orthopedic Surgery",
      description: "Joint replacement and bone treatments by experienced orthopedic specialists", 
      procedures: [
        {
          name: "Hip Replacement Surgery",
          description: "Total or partial hip joint replacement with titanium and ceramic prosthetics.",
          duration: "1-2 hours",
          recovery: "6-12 weeks",
          price: "$4,200 - $6,500", 
          success_rate: "95%"
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
            <h1 className="text-2xl font-bold mb-4">Treatment Not Found</h1>
            <Button onClick={() => navigate("/treatments")}>
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
        {/* Hero Section */}
        <section className="py-20 bg-gradient-card">
          <div className="container mx-auto px-4">
            <Button 
              variant="outline" 
              className="mb-6"
              onClick={() => navigate("/treatments")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Treatments
            </Button>
            <div className="max-w-4xl mx-auto">
              <Badge variant="outline" className="mb-6">Medical Specialty</Badge>
              <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
                {treatment.title}
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                {treatment.description}
              </p>
            </div>
          </div>
        </section>

        {/* Treatment Overview */}
        {treatment.overview && (
          <section className="py-16 bg-background">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-3xl font-bold text-foreground mb-6">Treatment Overview</h2>
                <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                  {treatment.overview}
                </p>
                
                {treatment.idealCandidates && (
                  <Card className="border-border/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle className="h-6 w-6 text-primary" />
                        Ideal Candidates
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {treatment.idealCandidates.map((candidate: string, index: number) => (
                          <li key={index} className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-primary flex-shrink-0" />
                            <span className="text-muted-foreground">{candidate}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Specialist Doctors */}
        {treatment.doctors && (
          <section className="py-16 bg-muted/30">
            <div className="container mx-auto px-4">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-foreground mb-4">Our Specialist Doctors</h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Meet our expert medical team with international training and extensive experience
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {treatment.doctors.map((doctor: any, index: number) => (
                  <Card key={index} className="border-border/50">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <Avatar className="w-24 h-24">
                          <AvatarImage src={doctor.image} alt={doctor.name} />
                          <AvatarFallback className="text-lg font-semibold">
                            {doctor.name.split(' ').map((n: string) => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-foreground mb-1">{doctor.name}</h3>
                          <Badge variant="outline" className="mb-2">{doctor.title}</Badge>
                          <p className="text-primary font-medium mb-3">{doctor.specialization}</p>
                          
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <Award className="h-4 w-4 text-primary" />
                              <span className="text-muted-foreground">{doctor.experience} Experience</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Star className="h-4 w-4 text-primary" />
                              <span className="text-muted-foreground">{doctor.education}</span>
                            </div>
                          </div>

                          <div className="mt-3">
                            <p className="text-xs text-muted-foreground mb-2">Languages:</p>
                            <div className="flex flex-wrap gap-1">
                              {doctor.languages.map((language: string, langIndex: number) => (
                                <Badge key={langIndex} variant="secondary" className="text-xs">
                                  {language}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          {doctor.achievements && (
                            <div className="mt-4 pt-3 border-t border-border">
                              <p className="text-xs font-semibold mb-2">Key Achievements:</p>
                              <ul className="text-xs text-muted-foreground space-y-1">
                                {doctor.achievements.map((achievement: string, achIndex: number) => (
                                  <li key={achIndex} className="flex items-center gap-1">
                                    <div className="w-1 h-1 bg-primary rounded-full"></div>
                                    {achievement}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}

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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-10 h-10 bg-primary-light rounded-full">
                          <Clock className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">Duration</p>
                          <p className="text-muted-foreground">{procedure.duration}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-10 h-10 bg-primary-light rounded-full">
                          <Check className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">Recovery</p>
                          <p className="text-muted-foreground">{procedure.recovery}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-10 h-10 bg-primary-light rounded-full">
                          <DollarSign className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">Cost</p>
                          <p className="text-primary font-bold">{procedure.price}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-10 h-10 bg-primary-light rounded-full">
                          <Star className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">Success Rate</p>
                          <p className="text-muted-foreground">{procedure.success_rate}</p>
                        </div>
                      </div>
                    </div>

                    {/* Detailed Information */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Candidate Requirements */}
                      {procedure.candidateRequirements && (
                        <div>
                          <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-primary" />
                            Candidate Requirements
                          </h4>
                          <ul className="space-y-2">
                            {procedure.candidateRequirements.map((requirement: string, reqIndex: number) => (
                              <li key={reqIndex} className="flex items-start gap-2">
                                <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                <span className="text-muted-foreground text-sm">{requirement}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Recovery Stages */}
                      {procedure.recoveryStages && (
                        <div>
                          <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                            <Clock className="h-5 w-5 text-primary" />
                            Recovery Timeline
                          </h4>
                          <div className="space-y-3">
                            {procedure.recoveryStages.map((stage: any, stageIndex: number) => (
                              <div key={stageIndex} className="flex gap-3">
                                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                                <div>
                                  <p className="font-medium text-foreground text-sm">{stage.stage}</p>
                                  <p className="text-muted-foreground text-sm">{stage.description}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-8 pt-6 border-t border-border">
                      <Button className="w-full sm:w-auto">
                        Get Quote for {procedure.name}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Patient Testimonials */}
        {treatment.testimonials && (
          <section className="py-16 bg-muted/30">
            <div className="container mx-auto px-4">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-foreground mb-4">Patient Success Stories</h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Real experiences from patients who chose our medical tourism services
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {treatment.testimonials.map((testimonial: any, index: number) => (
                  <Card key={index} className="border-border/50">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-1 mb-4">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 text-yellow-500 fill-current" />
                        ))}
                      </div>
                      
                      <div className="mb-4">
                        <Quote className="h-6 w-6 text-primary mb-2" />
                        <p className="text-muted-foreground italic leading-relaxed">
                          "{testimonial.text}"
                        </p>
                      </div>

                      <div className="border-t border-border pt-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-foreground">{testimonial.name}</p>
                            <p className="text-sm text-muted-foreground">{testimonial.country}</p>
                            <Badge variant="outline" className="mt-1 text-xs">
                              {testimonial.procedure}
                            </Badge>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Recovery Time</p>
                            <p className="font-medium text-primary">{testimonial.recoveryTime}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Why Choose Us Section */}
        <section className="py-20 bg-gradient-card">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Why Choose Care N Tour for {treatment.title}?
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="text-center">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-center w-16 h-16 bg-primary-light rounded-full mb-4 mx-auto">
                    <Users className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Expert Surgeons</h3>
                  <p className="text-muted-foreground">Board-certified specialists with international training and experience</p>
                </CardContent>
              </Card>
              
              <Card className="text-center">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-center w-16 h-16 bg-primary-light rounded-full mb-4 mx-auto">
                    <DollarSign className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Cost Savings</h3>
                  <p className="text-muted-foreground">Save 60-80% compared to US/EU prices without compromising quality</p>
                </CardContent>
              </Card>
              
              <Card className="text-center">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-center w-16 h-16 bg-primary-light rounded-full mb-4 mx-auto">
                    <Star className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Premium Care</h3>
                  <p className="text-muted-foreground">State-of-the-art facilities with personalized patient care</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-hero">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-background mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-background/90 mb-8 max-w-2xl mx-auto">
              Get a personalized treatment plan and detailed cost estimate from our medical experts
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="accent">
                Get Free Quote
              </Button>
              <Button size="lg" variant="hero">
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

export default TreatmentDetails;