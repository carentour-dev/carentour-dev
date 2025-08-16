import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import FeaturedTreatments from "@/components/FeaturedTreatments";
import ProcessSection from "@/components/ProcessSection";
import Testimonials from "@/components/Testimonials";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <FeaturedTreatments />
        <ProcessSection />
        <Testimonials />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
