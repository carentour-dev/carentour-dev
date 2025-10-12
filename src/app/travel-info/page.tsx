

import { BlockRenderer } from "@/components/cms/BlockRenderer";
import { getPublishedPageBySlug } from "@/lib/cms/server";
import TravelInfoFallbackClient from "./TravelInfoFallbackClient";

export const revalidate = 300;
export async function generateMetadata() {
  const cmsPage = await getPublishedPageBySlug("travel-info");
  return {
    title: cmsPage?.seo?.title ?? "Travel Info | Care N Tour",
    description: cmsPage?.seo?.description ?? undefined,
    openGraph: cmsPage?.seo?.ogImage ? { images: [cmsPage.seo.ogImage] } : undefined,
  } as any;
}
import Header from "@/components/Header";
import Footer from "@/components/Footer";

// no client hooks here; fallback UI is rendered via a client component

export default async function TravelInfo() {
  const cmsPage = await getPublishedPageBySlug("travel-info");
  if (cmsPage?.content?.length) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="py-10 container mx-auto px-4">
          <BlockRenderer blocks={cmsPage.content} />
        </main>
        <Footer />
      </div>
    );
  }
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

  const fallbackAccommodationOptions = [
      {
        type: "Luxury Medical Hotels",
        description: "5-star hotels partnered with medical service providers",
        amenities: ["Medical concierge", "24/7 nursing", "Recovery suites", "Specialized diet"],
        priceRange: "$150 - $300/night",
        locations: ["New Cairo", "Zamalek", "Heliopolis"],
      },
      {
        type: "Premium Business Hotels",
        description: "4-star international chain hotels",
        amenities: ["Airport transfer", "Business center", "Fitness center", "International cuisine"],
        priceRange: "$80 - $150/night",
        locations: ["Downtown Cairo", "Giza", "New Capital"],
      },
      {
        type: "Serviced Apartments",
        description: "Fully furnished apartments for extended stays",
        amenities: ["Kitchen facilities", "Laundry", "Living areas", "Weekly cleaning"],
        priceRange: "$50 - $120/night",
        locations: ["Maadi", "Zamalek", "New Cairo"],
      },
      {
        type: "Recovery Centers",
        description: "Specialized medical tourism recovery centers",
        amenities: ["Post-op care", "Medical staff", "Therapy rooms", "Nutritionist"],
        priceRange: "$200 - $400/night",
        locations: ["Near partner hospitals"],
      },
  ];

  const egyptInfo = {
    climate: [
      { season: "Winter (Dec-Feb)", temp: "15-25°C", description: "Mild and pleasant, ideal for recovery" },
      { season: "Spring (Mar-May)", temp: "20-30°C", description: "Warm and comfortable weather" },
      { season: "Summer (Jun-Aug)", temp: "25-35°C", description: "Hot and dry, air-conditioned treatment centers" },
      { season: "Autumn (Sep-Nov)", temp: "20-30°C", description: "Perfect weather for medical tourism" }
    ],
    culture: [
      "English widely spoken across medical service providers",
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

  return <TravelInfoFallbackClient />;
};
