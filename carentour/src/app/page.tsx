import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import FeaturedTreatments from "@/components/FeaturedTreatments";
import ProcessSection from "@/components/ProcessSection";
import USPSection from "@/components/USPSection";
import Testimonials from "@/components/Testimonials";
import DoctorsSection from "@/components/DoctorsSection";
import CTASection from "@/components/CTASection";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <FeaturedTreatments />
        <ProcessSection />
        <USPSection />
        <DoctorsSection />
        <Testimonials />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}