"use client";

import { useState, useEffect, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Search,
  Globe,
  FileText,
  Stethoscope,
  CreditCard,
  Hotel,
  HeartHandshake,
  Shield,
  Phone,
  Mail,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CTASection from "@/components/CTASection";

export default function FAQ() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("general");
  const [hash, setHash] = useState("");

  const fragmentToTab = useMemo(
    () => ({
      "visa-travel": "visa",
      "costs-payment": "costs",
      "stay-transport": "accommodation",
      "recovery-support": "aftercare",
    }),
    [],
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const updateHash = () => {
      setHash(window.location.hash.replace("#", ""));
    };

    updateHash();
    window.addEventListener("hashchange", updateHash);

    return () => {
      window.removeEventListener("hashchange", updateHash);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !hash) {
      return;
    }

    const mappedTab = fragmentToTab[hash as keyof typeof fragmentToTab];
    if (!mappedTab) {
      return;
    }

    setActiveTab(mappedTab);

    const waitForActiveTab = () => {
      const activeTabContent = document.querySelector(
        '[data-state="active"][data-orientation="horizontal"]',
      );
      if (activeTabContent) {
        const targetElement =
          activeTabContent.querySelector(`#${hash}`) ?? activeTabContent;
        targetElement.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }

      const tabsSection =
        document.querySelector('[role="tablist"]')?.parentElement;
      if (tabsSection) {
        tabsSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "data-state"
        ) {
          const target = mutation.target as Element;
          if (target.getAttribute("data-state") === "active") {
            observer.disconnect();
            window.setTimeout(waitForActiveTab, 100);
          }
        }
      });
    });

    const tabContents = document.querySelectorAll(
      '[data-orientation="horizontal"]',
    );
    tabContents.forEach((content) => {
      observer.observe(content, {
        attributes: true,
        attributeFilter: ["data-state"],
      });
    });

    const fallbackTimeout = window.setTimeout(() => {
      observer.disconnect();
      waitForActiveTab();
    }, 2000);

    return () => {
      observer.disconnect();
      window.clearTimeout(fallbackTimeout);
    };
  }, [hash, fragmentToTab]);

  const categories = [
    {
      id: "general",
      title: "General Information",
      icon: Globe,
      description: "About medical tourism in Egypt",
      color: "bg-blue-500/10 text-blue-600 border-blue-200",
    },
    {
      id: "visa",
      title: "Visa & Travel",
      icon: FileText,
      description: "Documentation and travel requirements",
      color: "bg-green-500/10 text-green-600 border-green-200",
    },
    {
      id: "treatments",
      title: "Medical Procedures",
      icon: Stethoscope,
      description: "Treatment processes and specialties",
      color: "bg-purple-500/10 text-purple-600 border-purple-200",
    },
    {
      id: "costs",
      title: "Costs & Payment",
      icon: CreditCard,
      description: "Pricing and payment options",
      color: "bg-orange-500/10 text-orange-600 border-orange-200",
    },
    {
      id: "accommodation",
      title: "Stay & Transport",
      icon: Hotel,
      description: "Hotels and transportation services",
      color: "bg-cyan-500/10 text-cyan-600 border-cyan-200",
    },
    {
      id: "aftercare",
      title: "Recovery & Support",
      icon: HeartHandshake,
      description: "Post-treatment care and follow-ups",
      color: "bg-pink-500/10 text-pink-600 border-pink-200",
    },
    {
      id: "emergency",
      title: "Emergency & Safety",
      icon: Shield,
      description: "24/7 support and emergency procedures",
      color: "bg-red-500/10 text-red-600 border-red-200",
    },
  ];

  const faqData = {
    general: [
      {
        question: "What is medical tourism and why choose Egypt?",
        answer:
          "Medical tourism involves traveling to another country for medical treatment. Egypt offers world-class healthcare service providers, internationally trained doctors, significant cost savings (50-70% less than Western countries), and the opportunity to recover in a historically rich environment with excellent hospitality.",
      },
      {
        question:
          "Are Egyptian medical service providers up to international standards?",
        answer:
          "Yes, our partner hospitals are internationally accredited (JCI, ISO) with state-of-the-art equipment and internationally trained doctors. Many Egyptian physicians have trained in Europe, the US, or Canada and hold international certifications.",
      },
      {
        question: "What languages are spoken by medical staff?",
        answer:
          "All our partner doctors and medical coordinators are fluent in English. Many also speak Arabic, French, German, and other languages. We provide translation services when needed to ensure clear communication throughout your treatment.",
      },
      {
        question:
          "How do I know if I&apos;m a candidate for treatment in Egypt?",
        answer:
          "Our medical coordinators will review your medical history and current condition through a free consultation. We&apos;ll connect you with specialists who will assess your case and recommend the best treatment options available.",
      },
    ],
    visa: [
      {
        question: "Do I need a visa to visit Egypt for medical treatment?",
        answer:
          "Most nationalities require a visa to enter Egypt. We assist with medical visa applications, which often have expedited processing. Tourist visas are also acceptable for medical tourism. We provide detailed guidance based on your nationality.",
      },
      {
        question: "What documents do I need for medical treatment in Egypt?",
        answer:
          "You&apos;ll need a valid passport, visa, medical records, insurance documentation (if applicable), and any relevant test results. We provide a comprehensive checklist and assist with document preparation and translation if needed.",
      },
      {
        question: "How long can I stay in Egypt for treatment?",
        answer:
          "Tourist visas typically allow 30-day stays with possible extensions. Medical visas can accommodate longer treatment periods. We help coordinate visa duration with your treatment timeline and recovery needs.",
      },
      {
        question: "Do you provide airport pickup and assistance?",
        answer:
          "Yes, we offer complimentary airport pickup and drop-off services. Our team will meet you at Cairo International Airport and assist with all arrival procedures, including transportation to your accommodation or hospital.",
      },
    ],
    treatments: [
      {
        question: "What medical specialties are available?",
        answer:
          "We offer comprehensive medical services including cardiac surgery, orthopedics, cosmetic surgery, dental care, oncology, neurosurgery, fertility treatments, bariatric surgery, ophthalmology (LASIK), and organ transplants.",
      },
      {
        question: "How do I choose the right doctor for my treatment?",
        answer:
          "Our medical coordinators will match you with specialists based on your condition, preferred treatment approach, and doctor qualifications. You can review doctor profiles, credentials, and patient testimonials before making your decision.",
      },
      {
        question: "Can I get a second opinion before treatment?",
        answer:
          "Absolutely. We encourage second opinions and can arrange consultations with multiple specialists. This ensures you&apos;re completely confident in your treatment plan before proceeding.",
      },
      {
        question: "What is the typical treatment timeline?",
        answer:
          "Treatment timelines vary by procedure. Simple treatments may require 3-7 days, while complex surgeries might need 2-4 weeks including recovery. We provide detailed timelines during your consultation and help plan accordingly.",
      },
    ],
    costs: [
      {
        question:
          "How much can I save compared to treatment in my home country?",
        answer:
          "Patients typically save 50-70% compared to US/European prices while receiving the same quality of care. For example, a heart bypass surgery costing $100,000+ in the US might cost $15,000-25,000 in Egypt, including accommodation and care.",
      },
      {
        question: "What is included in the treatment package?",
        answer:
          "Our packages include medical consultation, treatment/surgery, hospital stay, medications, follow-up visits, airport transfers, and medical coordination. Accommodation and additional services can be added based on your preferences.",
      },
      {
        question: "What payment methods do you accept?",
        answer:
          "We accept bank transfers, credit cards (Visa, MasterCard), and cash payments. Payment plans can be arranged for complex treatments. We provide detailed cost breakdowns and transparent pricing with no hidden fees.",
      },
      {
        question: "Will my insurance cover treatment in Egypt?",
        answer:
          "Some international insurance plans cover overseas medical treatment. We assist with insurance documentation and pre-authorization requests. Even with travel costs, many patients find significant savings compared to domestic treatment.",
      },
    ],
    accommodation: [
      {
        question: "What accommodation options are available?",
        answer:
          "We offer various options from 5-star hotels to comfortable apartments and medical hotels near hospitals. All accommodations are carefully selected for comfort, cleanliness, and proximity to medical service providers.",
      },
      {
        question: "Can my family accompany me during treatment?",
        answer:
          "Yes, we encourage family support during your medical journey. We can arrange accommodation for companions and provide guidance on their visa requirements. Many of our partner hotels offer family-friendly amenities.",
      },
      {
        question: "How is transportation handled during my stay?",
        answer:
          "We provide comprehensive transportation including airport transfers, hospital visits, and local sightseeing if your recovery allows. Our vehicles are comfortable and our drivers are experienced with medical tourism requirements.",
      },
      {
        question:
          "What amenities are available at your partner accommodations?",
        answer:
          "Our accommodations feature WiFi, 24/7 room service, medical-friendly amenities, proximity to hospitals, and comfortable environments for recovery. Many offer special services for medical tourists including nurse visits and dietary accommodations.",
      },
    ],
    aftercare: [
      {
        question: "What follow-up care is provided after treatment?",
        answer:
          "We provide comprehensive aftercare including post-operative check-ups, medication management, physical therapy if needed, and coordination with your home country physicians for ongoing care. Our support continues after you return home.",
      },
      {
        question: "How do you coordinate care with my doctor at home?",
        answer:
          "We provide detailed medical reports, imaging results, and treatment summaries to your home physicians. Our doctors can consult directly with your local healthcare team to ensure seamless care transition.",
      },
      {
        question: "What if complications arise after I return home?",
        answer:
          "Our doctors remain available for consultation after your return. We maintain communication channels and can provide guidance to your local physicians. In rare cases requiring additional treatment, we assist with return arrangements.",
      },
      {
        question: "Is rehabilitation therapy available in Egypt?",
        answer:
          "Yes, we have excellent rehabilitation service providers and experienced physical therapists. Extended recovery programs can be arranged in Egypt&apos;s favorable climate, often providing better outcomes than immediate return home.",
      },
    ],
    emergency: [
      {
        question: "What emergency support is available 24/7?",
        answer:
          "Our medical coordinators are available 24/7 for emergencies. We have direct connections to all partner hospitals and can arrange immediate medical attention. Emergency contact numbers are provided to all patients.",
      },
      {
        question: "What safety measures are in place during treatment?",
        answer:
          "All partner service providers follow international safety protocols. We maintain comprehensive medical insurance, have emergency response procedures, and ensure all treatments are performed in accredited service providers with proper safety measures.",
      },
      {
        question: "How do you handle medical emergencies?",
        answer:
          "We have established protocols for medical emergencies including immediate hospital access, specialist consultations, family notification procedures, and coordination with embassies if needed. Your safety is our top priority.",
      },
      {
        question: "What if I need to return home urgently?",
        answer:
          "We assist with emergency travel arrangements including medical clearance for travel, escort services if needed, and coordination with airlines for medical accommodations. We work with international medical assistance companies when required.",
      },
    ],
  };

  const allFAQs = Object.values(faqData).flat();
  const filteredFAQs = searchTerm
    ? allFAQs.filter(
        (faq) =>
          faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
          faq.answer.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : [];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="py-20 bg-gradient-card">
        <div className="container mx-auto px-4 text-center">
          <Badge variant="secondary" className="mb-6 text-sm">
            Frequently Asked Questions
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            Your Questions{" "}
            <span className="bg-gradient-hero bg-clip-text text-transparent">
              Answered
            </span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
            Find comprehensive answers to all your medical tourism questions.
            From treatment options to travel arrangements, we&apos;ve got you
            covered.
          </p>

          {/* Search Bar */}
          <div className="max-w-md mx-auto relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search frequently asked questions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </section>

      {/* Search Results */}
      {searchTerm && (
        <section className="py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold mb-6">
              Search Results ({filteredFAQs.length} found)
            </h2>
            {filteredFAQs.length > 0 ? (
              <Accordion type="single" collapsible className="space-y-4">
                {filteredFAQs.map((faq, index) => (
                  <AccordionItem
                    key={index}
                    value={`search-${index}`}
                    className="border rounded-lg px-4"
                  >
                    <AccordionTrigger className="text-left">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <p className="text-muted-foreground">
                No results found. Try different keywords or browse categories
                below.
              </p>
            )}
          </div>
        </section>
      )}

      {/* Categories and FAQ Content */}
      {!searchTerm && (
        <>
          {/* Category Cards */}
          <section className="py-12">
            <div className="container mx-auto px-4">
              <h2 className="text-3xl font-bold text-center mb-12">
                Browse by Category
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {categories.map((category) => {
                  const IconComponent = category.icon;
                  return (
                    <Card
                      key={category.id}
                      className="hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => setActiveTab(category.id)}
                    >
                      <CardHeader>
                        <div
                          className={`w-12 h-12 rounded-lg ${category.color} flex items-center justify-center mb-4`}
                        >
                          <IconComponent className="h-6 w-6" />
                        </div>
                        <CardTitle className="text-lg">
                          {category.title}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {category.description}
                        </p>
                      </CardHeader>
                    </Card>
                  );
                })}
              </div>
            </div>
          </section>

          {/* FAQ Tabs */}
          <section className="py-12">
            <div className="container mx-auto px-4">
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="space-y-8"
              >
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
                  {categories.map((category) => (
                    <TabsTrigger
                      key={category.id}
                      value={category.id}
                      className="text-xs lg:text-sm"
                    >
                      {category.title.split(" ")[0]}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {categories.map((category) => {
                  // Map category IDs to fragment names for anchor linking
                  const getFragmentId = (categoryId: string) => {
                    const tabToFragment = {
                      visa: "visa-travel",
                      costs: "costs-payment",
                      accommodation: "stay-transport",
                      aftercare: "recovery-support",
                    };
                    return (
                      tabToFragment[categoryId as keyof typeof tabToFragment] ||
                      categoryId
                    );
                  };

                  return (
                    <TabsContent
                      key={category.id}
                      value={category.id}
                      id={getFragmentId(category.id)}
                    >
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <category.icon className="h-5 w-5" />
                            {category.title}
                          </CardTitle>
                          <p className="text-muted-foreground">
                            {category.description}
                          </p>
                        </CardHeader>
                        <CardContent>
                          <Accordion
                            type="single"
                            collapsible
                            className="space-y-4"
                          >
                            {faqData[category.id as keyof typeof faqData].map(
                              (faq, index) => (
                                <AccordionItem
                                  key={index}
                                  value={`${category.id}-${index}`}
                                  className="border rounded-lg px-4"
                                >
                                  <AccordionTrigger className="text-left">
                                    {faq.question}
                                  </AccordionTrigger>
                                  <AccordionContent className="text-muted-foreground">
                                    {faq.answer}
                                  </AccordionContent>
                                </AccordionItem>
                              ),
                            )}
                          </Accordion>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  );
                })}
              </Tabs>
            </div>
          </section>
        </>
      )}

      {/* Contact Support Section */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Still Have Questions?</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Our medical coordinators are available 24/7 to provide personalized
            answers to your specific questions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button size="lg" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Call Now: +20 100 1741666
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="flex items-center gap-2"
            >
              <Mail className="h-4 w-4" />
              Email: info@carentour.com
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Available 24/7 in English, Arabic, and other languages
          </p>
        </div>
      </section>

      <CTASection />
      <Footer />
    </div>
  );
}
