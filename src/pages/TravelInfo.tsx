import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import { 
  Plane, 
  MapPin, 
  Hotel, 
  FileText, 
  Clock, 
  DollarSign, 
  Wifi, 
  Car, 
  Utensils, 
  Shield,
  Sun,
  Mountain,
  Building,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Check,
  Phone,
  Globe
} from "lucide-react";
import egyptTravelInfo from "@/assets/egypt-travel-info.jpg";
import accommodationEgypt from "@/assets/accommodation-egypt.jpg";

const TravelInfo = () => {
  const visaRequirements = [
    {
      country: "European Union",
      requirement: "Tourist Visa Required",
      duration: "30 days",
      process: "Visa on arrival or e-visa",
      cost: "$25 USD",
      processing: "Instant at airport"
    },
    {
      country: "United States",
      requirement: "Tourist Visa Required", 
      duration: "30 days",
      process: "E-visa recommended",
      cost: "$25 USD",
      processing: "7 business days"
    },
    {
      country: "Canada",
      requirement: "Tourist Visa Required",
      duration: "30 days", 
      process: "Visa on arrival or e-visa",
      cost: "$25 USD",
      processing: "Instant at airport"
    },
    {
      country: "Australia",
      requirement: "Tourist Visa Required",
      duration: "30 days",
      process: "E-visa only",
      cost: "$25 USD", 
      processing: "7 business days"
    },
    {
      country: "GCC Countries",
      requirement: "Visa Free",
      duration: "90 days",
      process: "Passport only",
      cost: "Free",
      processing: "Instant"
    }
  ];

  const accommodationOptions = [
    {
      type: "Luxury Medical Hotels",
      description: "5-star hotels partnered with medical facilities",
      amenities: ["Medical concierge", "24/7 nursing", "Recovery suites", "Specialized diet"],
      priceRange: "$150 - $300/night",
      locations: ["New Cairo", "Zamalek", "Heliopolis"]
    },
    {
      type: "Premium Business Hotels",
      description: "4-star international chain hotels",
      amenities: ["Airport transfer", "Business center", "Fitness center", "International cuisine"],
      priceRange: "$80 - $150/night", 
      locations: ["Downtown Cairo", "Giza", "New Capital"]
    },
    {
      type: "Serviced Apartments",
      description: "Fully furnished apartments for extended stays",
      amenities: ["Kitchen facilities", "Laundry", "Living areas", "Weekly cleaning"],
      priceRange: "$50 - $120/night",
      locations: ["Maadi", "Zamalek", "New Cairo"]
    },
    {
      type: "Recovery Centers",
      description: "Specialized medical tourism facilities",
      amenities: ["Post-op care", "Medical staff", "Therapy rooms", "Nutritionist"],
      priceRange: "$200 - $400/night",
      locations: ["Near partner hospitals"]
    }
  ];

  const egyptInfo = {
    climate: [
      { season: "Winter (Dec-Feb)", temp: "15-25°C", description: "Mild and pleasant, ideal for recovery" },
      { season: "Spring (Mar-May)", temp: "20-30°C", description: "Warm and comfortable weather" },
      { season: "Summer (Jun-Aug)", temp: "25-35°C", description: "Hot and dry, air-conditioned facilities" },
      { season: "Autumn (Sep-Nov)", temp: "20-30°C", description: "Perfect weather for medical tourism" }
    ],
    culture: [
      "English widely spoken in medical facilities",
      "Islamic culture with tolerance for international visitors", 
      "Rich historical heritage and modern amenities",
      "Welcoming hospitality towards medical tourists"
    ],
    currency: {
      name: "Egyptian Pound (EGP)",
      exchange: "1 USD ≈ 31 EGP (varies)",
      cards: "Visa, Mastercard widely accepted",
      cash: "ATMs available throughout cities"
    },
    transportation: [
      { type: "Airport Transfer", description: "Private car service from airport", cost: "$20-30" },
      { type: "Taxi/Uber", description: "Available throughout Cairo", cost: "$5-15 per trip" },
      { type: "Metro", description: "Modern subway system", cost: "$0.50 per trip" },
      { type: "Private Driver", description: "Dedicated driver service", cost: "$40-60/day" }
    ]
  };

  return (
    <div className="min-h-screen">
      <Header />
      
      <main>
        {/* Hero Section */}
        <section className="py-20 bg-gradient-card">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <Badge variant="outline" className="mb-6">Travel Information</Badge>
              <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
                Your Complete Guide to
                <span className="block bg-gradient-hero bg-clip-text text-transparent">
                  Medical Tourism in Egypt
                </span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Everything you need to know about traveling to Egypt for medical treatment, 
                from visa requirements to accommodation options and local information.
              </p>
            </div>
          </div>
        </section>

        {/* Main Content Tabs */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <Tabs defaultValue="visa" className="max-w-6xl mx-auto">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="visa" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Visa & Entry
                </TabsTrigger>
                <TabsTrigger value="accommodation" className="flex items-center gap-2">
                  <Hotel className="h-4 w-4" />
                  Accommodation
                </TabsTrigger>
                <TabsTrigger value="egypt-info" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  About Egypt
                </TabsTrigger>
                <TabsTrigger value="practical" className="flex items-center gap-2">
                  <Plane className="h-4 w-4" />
                  Practical Info
                </TabsTrigger>
              </TabsList>

              {/* Visa & Entry Requirements */}
              <TabsContent value="visa" className="space-y-8">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-foreground mb-4">Visa & Entry Requirements</h2>
                  <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    Simple visa process for medical tourists with multiple convenient options
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                  <Card className="border-border/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle className="h-6 w-6 text-primary" />
                        E-Visa (Recommended)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-muted-foreground">Apply online before travel for a smoother arrival experience.</p>
                      <ul className="space-y-2">
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-primary" />
                          <span className="text-sm">Process: 7 business days</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-primary" />
                          <span className="text-sm">Valid: 30 days single entry</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-primary" />
                          <span className="text-sm">Cost: $25 USD</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-primary" />
                          <span className="text-sm">Extension: Possible for medical treatment</span>
                        </li>
                      </ul>
                      <Button className="w-full" variant="outline">
                        <Globe className="h-4 w-4 mr-2" />
                        Apply for E-Visa
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="border-border/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Plane className="h-6 w-6 text-primary" />
                        Visa on Arrival
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-muted-foreground">Quick visa processing directly at Cairo International Airport.</p>
                      <ul className="space-y-2">
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-primary" />
                          <span className="text-sm">Process: Instant at airport</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-primary" />
                          <span className="text-sm">Valid: 30 days single entry</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-primary" />
                          <span className="text-sm">Cost: $25 USD cash only</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-primary" />
                          <span className="text-sm">Requirements: Passport + return ticket</span>
                        </li>
                      </ul>
                      <Button className="w-full" variant="outline">
                        <FileText className="h-4 w-4 mr-2" />
                        Learn More
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-foreground mb-6">Visa Requirements by Country</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {visaRequirements.map((visa, index) => (
                      <Card key={index} className="border-border/50">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-foreground">{visa.country}</h4>
                            <Badge variant={visa.requirement === "Visa Free" ? "default" : "outline"}>
                              {visa.requirement}
                            </Badge>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Duration:</span>
                              <span>{visa.duration}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Process:</span>
                              <span>{visa.process}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Cost:</span>
                              <span className="font-medium text-primary">{visa.cost}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Processing:</span>
                              <span>{visa.processing}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <Card className="border-border/50 bg-muted/30">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <AlertTriangle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                      <div>
                        <h4 className="font-semibold text-foreground mb-2">Important Notes</h4>
                        <ul className="space-y-1 text-sm text-muted-foreground">
                          <li>• Passport must be valid for at least 6 months from entry date</li>
                          <li>• Medical visa extensions available for extended treatment</li>
                          <li>• Travel insurance recommended but not mandatory</li>
                          <li>• COVID-19 requirements may apply - check current regulations</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Accommodation */}
              <TabsContent value="accommodation" className="space-y-8">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-foreground mb-4">Accommodation Options</h2>
                  <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    Comfortable and convenient lodging options tailored for medical tourists
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                  <div>
                    <img 
                      src={accommodationEgypt} 
                      alt="Premium accommodation for medical tourists in Egypt"
                      className="w-full h-64 object-cover rounded-lg shadow-elegant mb-6"
                    />
                    <Card className="border-border/50">
                      <CardHeader>
                        <CardTitle>Accommodation Booking Service</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-muted-foreground">
                          We handle all accommodation arrangements based on your medical schedule and budget preferences.
                        </p>
                        <ul className="space-y-2">
                          <li className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-primary" />
                            <span className="text-sm">Pre-arrival booking confirmation</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-primary" />
                            <span className="text-sm">Medical-friendly locations</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-primary" />
                            <span className="text-sm">Airport transfer coordination</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-primary" />
                            <span className="text-sm">24/7 support during stay</span>
                          </li>
                        </ul>
                        <Button className="w-full">
                          <Phone className="h-4 w-4 mr-2" />
                          Book Accommodation
                        </Button>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-6">
                    {accommodationOptions.map((option, index) => (
                      <Card key={index} className="border-border/50">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">{option.type}</CardTitle>
                            <Badge variant="outline">{option.priceRange}</Badge>
                          </div>
                          <p className="text-muted-foreground text-sm">{option.description}</p>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                              <h5 className="font-semibold text-sm mb-2">Amenities</h5>
                              <ul className="space-y-1">
                                {option.amenities.map((amenity, idx) => (
                                  <li key={idx} className="text-xs text-muted-foreground flex items-center gap-1">
                                    <div className="w-1 h-1 bg-primary rounded-full"></div>
                                    {amenity}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <h5 className="font-semibold text-sm mb-2">Locations</h5>
                              <ul className="space-y-1">
                                {option.locations.map((location, idx) => (
                                  <li key={idx} className="text-xs text-muted-foreground flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {location}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* About Egypt */}
              <TabsContent value="egypt-info" className="space-y-8">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-foreground mb-4">About Egypt</h2>
                  <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    Essential information about Egypt's climate, culture, and what to expect during your visit
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                  <div>
                    <img 
                      src={egyptTravelInfo} 
                      alt="Egypt travel information and tourism attractions"
                      className="w-full h-64 object-cover rounded-lg shadow-elegant mb-6"
                    />
                  </div>
                  
                  <Card className="border-border/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Sun className="h-6 w-6 text-primary" />
                        Climate & Weather
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {egyptInfo.climate.map((season, index) => (
                          <div key={index} className="flex justify-between items-start">
                            <div>
                              <h5 className="font-semibold text-sm">{season.season}</h5>
                              <p className="text-xs text-muted-foreground">{season.description}</p>
                            </div>
                            <Badge variant="outline">{season.temp}</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <Card className="border-border/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Building className="h-6 w-6 text-primary" />
                        Culture & Language
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        {egyptInfo.culture.map((item, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-muted-foreground">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="border-border/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-6 w-6 text-primary" />
                        Currency & Payments
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h5 className="font-semibold text-sm mb-1">Currency</h5>
                        <p className="text-sm text-muted-foreground">{egyptInfo.currency.name}</p>
                        <p className="text-xs text-muted-foreground">{egyptInfo.currency.exchange}</p>
                      </div>
                      <div>
                        <h5 className="font-semibold text-sm mb-1">Credit Cards</h5>
                        <p className="text-sm text-muted-foreground">{egyptInfo.currency.cards}</p>
                      </div>
                      <div>
                        <h5 className="font-semibold text-sm mb-1">Cash</h5>
                        <p className="text-sm text-muted-foreground">{egyptInfo.currency.cash}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Practical Information */}
              <TabsContent value="practical" className="space-y-8">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-foreground mb-4">Practical Information</h2>
                  <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    Transportation, communication, and other practical details for your medical tourism journey
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <Card className="border-border/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Car className="h-6 w-6 text-primary" />
                        Transportation Options
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {egyptInfo.transportation.map((transport, index) => (
                          <div key={index} className="flex justify-between items-start">
                            <div>
                              <h5 className="font-semibold text-sm">{transport.type}</h5>
                              <p className="text-xs text-muted-foreground">{transport.description}</p>
                            </div>
                            <Badge variant="outline">{transport.cost}</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-border/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Wifi className="h-6 w-6 text-primary" />
                        Communication & Tech
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h5 className="font-semibold text-sm mb-1">Internet & WiFi</h5>
                        <p className="text-sm text-muted-foreground">Free WiFi in hotels, hospitals, and most cafes</p>
                      </div>
                      <div>
                        <h5 className="font-semibold text-sm mb-1">Mobile Service</h5>
                        <p className="text-sm text-muted-foreground">Tourist SIM cards available at airport</p>
                      </div>
                      <div>
                        <h5 className="font-semibold text-sm mb-1">Emergency Numbers</h5>
                        <p className="text-sm text-muted-foreground">Police: 122 | Ambulance: 123 | Tourist Police: 126</p>
                      </div>
                      <div>
                        <h5 className="font-semibold text-sm mb-1">Time Zone</h5>
                        <p className="text-sm text-muted-foreground">GMT+2 (Egypt Standard Time)</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="border-border/50 bg-gradient-card">
                  <CardContent className="p-8 text-center">
                    <h3 className="text-2xl font-bold text-foreground mb-4">Need Assistance?</h3>
                    <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                      Our travel coordination team is here to help with all aspects of your journey to Egypt. 
                      From visa assistance to local arrangements, we've got you covered.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <Button size="lg" asChild>
                        <Link to="/contact">
                          <Phone className="h-4 w-4 mr-2" />
                          Contact Travel Team
                        </Link>
                      </Button>
                      <Button size="lg" variant="outline">
                        <FileText className="h-4 w-4 mr-2" />
                        Download Travel Guide
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default TravelInfo;