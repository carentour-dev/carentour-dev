"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Award, Star, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const PartnerHospitals = () => {
  const hospitals = [
    {
      name: "Cairo Medical Center",
      type: "Multi-Specialty Hospital",
      location: "New Cairo, Egypt",
      image: "/hospital-cairo-medical.jpg",
      accreditations: ["JCI Accredited", "ISO 9001:2015", "CBAHI Certified"],
      specialties: ["Cardiology", "Orthopedics", "Oncology", "Neurology"],
      features: ["500+ Beds", "24/7 Emergency", "International Patients Unit", "Telemedicine"],
      description: "Leading multi-specialty hospital with state-of-the-art facilities and international standards of care.",
      rating: 4.9
    },
    {
      name: "Alexandria Premier Clinic",
      type: "Luxury Medical Facility",
      location: "Alexandria, Egypt",
      image: "/clinic-alexandria-premier.jpg",
      accreditations: ["JCI Gold Seal", "CAP Accredited", "AACI Certified"],
      specialties: ["Plastic Surgery", "Dermatology", "Ophthalmology", "Dental Care"],
      features: ["VIP Suites", "Concierge Service", "Multilingual Staff", "Recovery Spa"],
      description: "Premium medical facility offering luxury healthcare services with personalized patient experiences.",
      rating: 4.8
    },
    {
      name: "Nile Valley Medical Complex",
      type: "Specialized Treatment Center",
      location: "Luxor, Egypt",
      image: "/placeholder.svg",
      accreditations: ["ISO 15189", "NABH Accredited", "TEMOS Certified"],
      specialties: ["Fertility Treatment", "Bariatric Surgery", "Rehabilitation", "Pain Management"],
      features: ["Research Center", "Clinical Trials", "Wellness Programs", "Medical Tourism"],
      description: "Advanced medical complex focusing on specialized treatments with cutting-edge technology.",
      rating: 4.7
    }
  ];

  const certifications = [
    {
      name: "Joint Commission International (JCI)",
      description: "World&apos;s leading healthcare accreditation body ensuring highest standards of patient safety and care quality."
    },
    {
      name: "TEMOS Certification",
      description: "International certification specifically for medical tourism, guaranteeing excellent service for international patients."
    },
    {
      name: "ISO Standards",
      description: "International quality management standards ensuring consistent, high-quality healthcare services."
    },
    {
      name: "CBAHI Accreditation",
      description: "Saudi Central Board for Accreditation of Healthcare Institutions, recognized across the Middle East."
    }
  ];

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-secondary-light rounded-full mb-6">
            <Building2 className="h-8 w-8 text-secondary" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Our Partner Hospitals & Clinics
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            We&apos;ve carefully selected premier medical facilities across Egypt that meet the highest international 
            standards, ensuring you receive world-class healthcare in state-of-the-art environments.
          </p>
        </div>

        {/* Featured Hospitals */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {hospitals.slice(0, 2).map((hospital, index) => (
            <Card key={index} className="overflow-hidden border-border/50 hover:shadow-card-hover transition-spring">
              <div className="aspect-video relative overflow-hidden">
                <Image
                  src={hospital.image}
                  alt={hospital.name}
                  fill
                  className="object-cover"
                  sizes="(min-width: 1024px) 45vw, 100vw"
                />
                <div className="absolute top-4 left-4">
                  <Badge variant="secondary" className="bg-background/90 text-foreground text-center">
                    {hospital.type}
                  </Badge>
                </div>
                <div className="absolute top-4 right-4 flex items-center gap-1 bg-background/90 rounded-full px-2 py-1">
                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  <span className="text-sm font-medium">{hospital.rating}</span>
                </div>
              </div>
              
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {hospital.name}
                  <div className="flex items-center text-muted-foreground">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span className="text-sm">{hospital.location}</span>
                  </div>
                </CardTitle>
                <p className="text-muted-foreground">{hospital.description}</p>
              </CardHeader>

              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Accreditations</h4>
                  <div className="flex flex-wrap gap-2">
                    {hospital.accreditations.map((acc, accIndex) => (
                      <Badge key={accIndex} variant="outline" className="text-xs text-center">
                        <Award className="h-3 w-3 mr-1" />
                        {acc}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Specialties</h4>
                  <div className="flex flex-wrap gap-2">
                    {hospital.specialties.map((specialty, specIndex) => (
                      <Badge key={specIndex} variant="secondary" className="text-xs text-center">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Key Features</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {hospital.features.map((feature, featIndex) => (
                      <div key={featIndex} className="flex items-center text-sm text-muted-foreground">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full mr-2"></div>
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>

                <Button className="w-full mt-4" asChild>
                  <Link href="/contact">
                    <Phone className="h-4 w-4 mr-2" />
                    Contact Facility
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional Hospital */}
        <div className="mb-16">
          <Card className="border-border/50">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                <div>
                  <h3 className="text-xl font-bold mb-2">{hospitals[2].name}</h3>
                  <Badge variant="outline" className="mb-2 text-center">{hospitals[2].type}</Badge>
                  <p className="text-muted-foreground text-sm">{hospitals[2].description}</p>
                  <div className="flex items-center mt-2">
                    <MapPin className="h-4 w-4 mr-1 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{hospitals[2].location}</span>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Specialties</h4>
                  <div className="flex flex-wrap gap-1">
                    {hospitals[2].specialties.map((specialty, index) => (
                      <Badge key={index} variant="secondary" className="text-xs text-center">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-2">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span className="font-semibold">{hospitals[2].rating}</span>
                  </div>
                  <Button variant="outline">Learn More</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Certifications Section */}
        <div className="bg-background rounded-lg p-8">
          <h3 className="text-2xl font-bold text-center mb-8">
            International Accreditations & Certifications
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {certifications.map((cert, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className="w-10 h-10 bg-primary-light rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <Award className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold mb-2">{cert.name}</h4>
                  <p className="text-sm text-muted-foreground">{cert.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PartnerHospitals;