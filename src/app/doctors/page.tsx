"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { DoctorProfile } from "@/components/DoctorProfile";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { Search, Filter } from "lucide-react";
import { useDoctors } from "@/hooks/useDoctors";
import { useState } from "react";

export default function Doctors() {
  const { doctors, loading, error } = useDoctors();
  const [searchTerm, setSearchTerm] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("all");
  const [languageFilter, setLanguageFilter] = useState("all");

  // Get unique specializations and languages for filters
  const specializations = [...new Set(doctors.map(doctor => doctor.specialization))];
  const languages = [...new Set(doctors.flatMap(doctor => doctor.languages || []))];

  // Filter doctors based on search and filters
  const filteredDoctors = doctors.filter(doctor => {
    const matchesSearch = doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSpecialty = specialtyFilter === "all" || doctor.specialization === specialtyFilter;
    const matchesLanguage = languageFilter === "all" || doctor.languages?.includes(languageFilter);

    return matchesSearch && matchesSpecialty && matchesLanguage;
  });

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading doctors...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-destructive mb-4">Error loading doctors: {error}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        </div>
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
            <div className="max-w-4xl mx-auto text-center">
              <Badge variant="outline" className="mb-6">Our Medical Team</Badge>
              <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
                Meet Our
                <span className="block bg-gradient-hero bg-clip-text text-transparent">
                  Specialist Doctors
                </span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                World-class physicians with international training and extensive experience
                in their respective specialties.
              </p>
            </div>
          </div>
        </section>

        {/* Search and Filters */}
        <section className="py-12 bg-background border-b border-border">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search doctors by name or specialty..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
                    <SelectTrigger className="w-48">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Filter by specialty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Specialties</SelectItem>
                      {specializations.map(specialty => (
                        <SelectItem key={specialty} value={specialty}>{specialty}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={languageFilter} onValueChange={setLanguageFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Languages</SelectItem>
                      {languages.map(language => (
                        <SelectItem key={language} value={language}>{language}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="mt-4 text-sm text-muted-foreground">
                Showing {filteredDoctors.length} of {doctors.length} doctors
              </div>
            </div>
          </div>
        </section>

        {/* Doctors Grid */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            {filteredDoctors.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">No doctors found matching your criteria.</p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setSpecialtyFilter("all");
                    setLanguageFilter("all");
                  }}
                  className="mt-4"
                >
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {filteredDoctors.map((doctor) => (
                  <DoctorProfile key={doctor.id} doctor={doctor} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-hero">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-background mb-4">
              Schedule a Consultation
            </h2>
            <p className="text-xl text-background/90 mb-8 max-w-2xl mx-auto">
              Ready to meet with one of our specialists? Book a consultation to discuss your treatment options.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="accent" asChild>
                <Link href="/consultation">Get Free Consultation</Link>
              </Button>
              <Button size="lg" variant="hero" asChild>
                <Link href="/start-journey">Start Your Journey</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
