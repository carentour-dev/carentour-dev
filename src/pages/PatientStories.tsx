import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Quote, MapPin, Calendar } from "lucide-react";

const PatientStories = () => {
  const stories = [
    {
      name: "Sarah Johnson",
      country: "United States",
      flag: "🇺🇸",
      treatment: "LASIK Eye Surgery",
      date: "March 2024",
      rating: 5,
      image: "/api/placeholder/400/300",
      story: "I came to Egypt for LASIK surgery and couldn't be happier with the results. The medical team was incredibly professional, and the cost was 70% less than what I would have paid back home. The recovery was smooth, and I can now see perfectly without glasses.",
      savings: "$4,200",
      quote: "The best decision I've made for my vision and my wallet!"
    },
    {
      name: "Ahmed Al-Rashid",
      country: "Saudi Arabia",
      flag: "🇸🇦",
      treatment: "Cardiac Surgery",
      date: "January 2024",
      rating: 5,
      image: "/api/placeholder/400/300",
      story: "After my heart surgery at one of Care N Tour's partner hospitals, I feel like I have a new lease on life. The cardiologist was world-class, and the follow-up care has been exceptional. My family and I felt supported throughout the entire process.",
      savings: "$15,000",
      quote: "They saved my life and treated me like family."
    },
    {
      name: "Emma Thompson",
      country: "United Kingdom",
      flag: "🇬🇧",
      treatment: "Dental Implants",
      date: "February 2024",
      rating: 5,
      image: "/api/placeholder/400/300",
      story: "I needed multiple dental implants and was quoted an astronomical amount in London. Care N Tour connected me with an excellent dentist in Cairo. The quality of work is outstanding, and I saved thousands while enjoying a mini vacation in Egypt.",
      savings: "$8,500",
      quote: "Perfect teeth and an unforgettable experience!"
    },
    {
      name: "Michael Schmidt",
      country: "Germany",
      flag: "🇩🇪",
      treatment: "Hip Replacement",
      date: "December 2023",
      rating: 5,
      image: "/api/placeholder/400/300",
      story: "My hip replacement surgery was performed flawlessly. The orthopedic surgeon explained everything clearly, and the rehabilitation program was comprehensive. I'm back to hiking and feeling better than I have in years.",
      savings: "$12,000",
      quote: "Back to an active lifestyle thanks to expert care."
    },
    {
      name: "Lisa Chen",
      country: "Canada",
      flag: "🇨🇦",
      treatment: "Cosmetic Surgery",
      date: "November 2023",
      rating: 5,
      image: "/api/placeholder/400/300",
      story: "I traveled to Egypt for rhinoplasty and the results exceeded my expectations. The plastic surgeon was an artist, and the results look completely natural. The care team made sure I was comfortable throughout my stay.",
      savings: "$6,800",
      quote: "Natural results that boosted my confidence!"
    },
    {
      name: "Roberto Silva",
      country: "Brazil",
      flag: "🇧🇷",
      treatment: "Gastric Sleeve",
      date: "October 2023",
      rating: 5,
      image: "/api/placeholder/400/300",
      story: "My weight loss surgery changed my life completely. The bariatric surgeon and nutritionist team provided ongoing support even after I returned home. I've lost 80 pounds and gained a new perspective on health.",
      savings: "$9,200",
      quote: "A life-changing journey with incredible support!"
    }
  ];

  return (
    <div className="min-h-screen">
      <Header />
      
      <main>
        {/* Hero Section */}
        <section className="py-20 bg-gradient-card">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <Badge variant="outline" className="mb-6">Patient Stories</Badge>
              <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
                Real Stories from 
                <span className="block bg-gradient-hero bg-clip-text text-transparent">
                  Real Patients
                </span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Discover how patients from around the world have transformed their lives 
                through world-class medical care in Egypt.
              </p>
            </div>
          </div>
        </section>

        {/* Success Stats */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <p className="text-4xl font-bold text-primary mb-2">5000+</p>
                <p className="text-muted-foreground">Successful Procedures</p>
              </div>
              <div>
                <p className="text-4xl font-bold text-primary mb-2">50+</p>
                <p className="text-muted-foreground">Countries Served</p>
              </div>
              <div>
                <p className="text-4xl font-bold text-primary mb-2">98%</p>
                <p className="text-muted-foreground">Satisfaction Rate</p>
              </div>
              <div>
                <p className="text-4xl font-bold text-primary mb-2">70%</p>
                <p className="text-muted-foreground">Average Savings</p>
              </div>
            </div>
          </div>
        </section>

        {/* Patient Stories Grid */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Transformative Journeys
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Read about the experiences of patients who chose Egypt for their medical care
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {stories.map((story, index) => (
                <Card key={index} className="border-border/50 hover:shadow-card-hover transition-spring">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-primary-light rounded-full flex items-center justify-center text-2xl">
                          {story.flag}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{story.name}</CardTitle>
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span>{story.country}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>{story.date}</span>
                          </div>
                        </div>
                      </div>
                      <Badge variant="secondary">{story.treatment}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-1">
                      {[...Array(story.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 text-accent fill-current" />
                      ))}
                    </div>
                    
                    <div className="relative">
                      <Quote className="h-6 w-6 text-primary/30 absolute -top-2 -left-2" />
                      <p className="text-muted-foreground leading-relaxed pl-4">
                        {story.story}
                      </p>
                    </div>
                    
                    <div className="bg-accent-light rounded-lg p-4">
                      <p className="font-semibold text-foreground italic">
                        "{story.quote}"
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <span className="text-sm text-muted-foreground">Total Savings:</span>
                      <span className="text-lg font-bold text-primary">{story.savings}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center mt-12">
              <Button size="lg">
                Share Your Story
              </Button>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-hero">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-background mb-4">
              Ready to Write Your Success Story?
            </h2>
            <p className="text-xl text-background/90 mb-8 max-w-2xl mx-auto">
              Join thousands of satisfied patients who have chosen Egypt for their medical care
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="accent">
                Start Your Journey
              </Button>
              <Button size="lg" variant="hero">
                Get Free Consultation
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default PatientStories;