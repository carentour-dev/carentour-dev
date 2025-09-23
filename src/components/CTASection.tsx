import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const CTASection = () => {
  return (
    <section className="py-20 bg-gradient-card">
      <div className="container mx-auto px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Ready to Start Your <span className="bg-gradient-hero bg-clip-text text-transparent">Health Journey</span>?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
            Our medical coordinators are available 24/7 to answer your questions and help you plan your treatment. Get personalized care and support every step of the way.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link to="/contact">Get Free Consultation</Link>
            </Button>
            <Button variant="outline" size="lg">
              Schedule Consultation
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;