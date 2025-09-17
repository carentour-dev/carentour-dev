import { useParams, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, DollarSign, Star, Check, Users } from "lucide-react";

const TreatmentDetails = () => {
  const { category } = useParams();
  const navigate = useNavigate();

  const treatmentData: Record<string, any> = {
    "cardiac-surgery": {
      title: "Cardiac Surgery",
      description: "Advanced cardiovascular procedures performed by board-certified cardiac surgeons",
      procedures: [
        {
          name: "Coronary Artery Bypass Surgery",
          description: "Surgical procedure to restore blood flow to the heart muscle by creating new pathways around blocked arteries.",
          duration: "4-6 hours",
          recovery: "6-8 weeks",
          price: "$12,500 - $18,000",
          success_rate: "95%"
        },
        {
          name: "Heart Valve Replacement",
          description: "Replacement of damaged heart valves with mechanical or biological valve prosthetics.",
          duration: "3-4 hours",
          recovery: "4-6 weeks",
          price: "$15,000 - $22,000",
          success_rate: "92%"
        },
        {
          name: "Angioplasty & Stenting",
          description: "Minimally invasive procedure to open blocked coronary arteries using balloon inflation and stent placement.",
          duration: "1-2 hours",
          recovery: "2-3 days",
          price: "$8,500 - $12,000",
          success_rate: "97%"
        }
      ]
    },
    "eye-surgery": {
      title: "Eye Surgery",
      description: "Comprehensive ophthalmological procedures using cutting-edge laser technology",
      procedures: [
        {
          name: "LASIK Eye Surgery",
          description: "Laser vision correction to treat nearsightedness, farsightedness, and astigmatism.",
          duration: "15-30 minutes per eye",
          recovery: "1-2 weeks",
          price: "$1,200 - $2,500",
          success_rate: "96%"
        },
        {
          name: "Cataract Surgery",
          description: "Removal of clouded natural lens and replacement with artificial intraocular lens.",
          duration: "20-30 minutes",
          recovery: "4-6 weeks",
          price: "$2,000 - $3,500",
          success_rate: "98%"
        },
        {
          name: "Retinal Surgery",
          description: "Surgical treatment for retinal detachment, macular holes, and diabetic retinopathy.",
          duration: "1-3 hours",
          recovery: "2-6 weeks",
          price: "$3,500 - $6,000",
          success_rate: "85%"
        }
      ]
    },
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
        },
        {
          name: "Porcelain Veneers",
          description: "Thin ceramic shells bonded to front teeth for cosmetic enhancement.",
          duration: "2-3 visits",
          recovery: "1 week",
          price: "$300 - $600 per tooth",
          success_rate: "98%"
        },
        {
          name: "Root Canal Treatment",
          description: "Removal of infected tooth pulp and sealing to save the natural tooth.",
          duration: "1-2 hours",
          recovery: "3-5 days",
          price: "$200 - $400",
          success_rate: "90%"
        }
      ]
    },
    "cosmetic-surgery": {
      title: "Cosmetic Surgery",
      description: "Aesthetic procedures performed by certified plastic surgeons",
      procedures: [
        {
          name: "Rhinoplasty (Nose Job)",
          description: "Surgical reshaping of the nose for aesthetic or functional improvement.",
          duration: "2-4 hours",
          recovery: "2-3 weeks",
          price: "$2,800 - $4,500",
          success_rate: "92%"
        },
        {
          name: "Liposuction",
          description: "Removal of excess fat deposits through minimally invasive suction technique.",
          duration: "1-3 hours",
          recovery: "2-4 weeks",
          price: "$2,200 - $3,800",
          success_rate: "94%"
        },
        {
          name: "Breast Augmentation",
          description: "Enhancement of breast size and shape using silicone or saline implants.",
          duration: "1-2 hours",
          recovery: "4-6 weeks",
          price: "$3,500 - $5,500",
          success_rate: "96%"
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
        },
        {
          name: "Hernia Repair",
          description: "Surgical correction of hernias using mesh reinforcement technique.",
          duration: "1-2 hours",
          recovery: "2-4 weeks",
          price: "$1,200 - $2,000",
          success_rate: "95%"
        },
        {
          name: "Appendectomy",
          description: "Surgical removal of appendix through laparoscopic approach.",
          duration: "30-60 minutes",
          recovery: "1-3 weeks",
          price: "$1,800 - $2,800",
          success_rate: "99%"
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
        },
        {
          name: "Knee Replacement Surgery",
          description: "Replacement of damaged knee joint with artificial joint components.",
          duration: "1-2 hours",
          recovery: "8-12 weeks",
          price: "$4,500 - $7,000",
          success_rate: "93%"
        },
        {
          name: "Spine Surgery",
          description: "Surgical treatment for herniated discs, spinal fusion, and decompression.",
          duration: "2-4 hours",
          recovery: "6-16 weeks",
          price: "$5,500 - $12,000",
          success_rate: "88%"
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

        {/* Procedures Section */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Available Procedures
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Detailed information about each procedure including costs and recovery times
              </p>
            </div>

            <div className="space-y-8">
              {treatment.procedures.map((procedure: any, index: number) => (
                <Card key={index} className="border-border/50 hover:shadow-card-hover transition-spring">
                  <CardHeader>
                    <CardTitle className="text-2xl">{procedure.name}</CardTitle>
                    <p className="text-muted-foreground text-lg">{procedure.description}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                    
                    <div className="mt-6 pt-6 border-t border-border">
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

        {/* Why Choose Us Section */}
        <section className="py-20 bg-gradient-card">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Why Choose CarenTour for {treatment.title}?
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
              Get a personalized treatment plan and detailed cost estimate
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