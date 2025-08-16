import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, Mail, MapPin, Clock, MessageCircle } from "lucide-react";

const Contact = () => {
  const contactInfo = [
    {
      icon: Phone,
      title: "Phone Support",
      content: "+20 123 456 789",
      description: "Available 24/7 for emergencies"
    },
    {
      icon: Mail,
      title: "Email Us",
      content: "info@medtourism.com",
      description: "Response within 2 hours"
    },
    {
      icon: MapPin,
      title: "Visit Our Office",
      content: "Cairo Medical District, Egypt",
      description: "Monday - Saturday: 9AM - 6PM"
    },
    {
      icon: MessageCircle,
      title: "Live Chat",
      content: "Available on website",
      description: "Instant support online"
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
              <Badge variant="outline" className="mb-6">Contact Us</Badge>
              <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
                Get in Touch with 
                <span className="block bg-gradient-hero bg-clip-text text-transparent">
                  Our Medical Team
                </span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Our medical coordinators are ready to help you plan your treatment journey. 
                Reach out for a free consultation or any questions about our services.
              </p>
            </div>
          </div>
        </section>

        {/* Contact Form and Info */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Contact Form */}
              <div>
                <Card className="border-border/50 shadow-card-hover">
                  <CardHeader>
                    <CardTitle className="text-2xl">Send Us a Message</CardTitle>
                    <p className="text-muted-foreground">
                      Fill out the form below and we'll get back to you within 2 hours
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">
                          First Name *
                        </label>
                        <Input placeholder="John" />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">
                          Last Name *
                        </label>
                        <Input placeholder="Doe" />
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Email Address *
                      </label>
                      <Input type="email" placeholder="john@example.com" />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Phone Number
                      </label>
                      <Input placeholder="+1 (555) 123-4567" />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Country
                      </label>
                      <Input placeholder="United States" />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Treatment of Interest
                      </label>
                      <Input placeholder="e.g., Cardiac Surgery, LASIK, Dental Implants" />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Message *
                      </label>
                      <Textarea 
                        placeholder="Please describe your medical needs and any questions you have..."
                        className="min-h-[120px]"
                      />
                    </div>
                    
                    <Button size="lg" className="w-full">
                      Send Message
                    </Button>
                    
                    <p className="text-sm text-muted-foreground text-center">
                      By submitting this form, you agree to our privacy policy and terms of service.
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Contact Information */}
              <div className="space-y-8">
                <div>
                  <h2 className="text-3xl font-bold text-foreground mb-6">
                    Contact Information
                  </h2>
                  <p className="text-muted-foreground leading-relaxed mb-8">
                    Our dedicated team is available around the clock to assist you with any questions 
                    or concerns about your medical tourism journey.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {contactInfo.map((info, index) => {
                    const Icon = info.icon;
                    return (
                      <Card key={index} className="border-border/50 hover:shadow-card-hover transition-spring">
                        <CardContent className="p-6">
                          <div className="flex items-start space-x-4">
                            <div className="flex-shrink-0">
                              <div className="w-12 h-12 bg-primary-light rounded-lg flex items-center justify-center">
                                <Icon className="h-6 w-6 text-primary" />
                              </div>
                            </div>
                            <div>
                              <h3 className="font-semibold text-foreground mb-1">
                                {info.title}
                              </h3>
                              <p className="text-primary font-medium mb-1">
                                {info.content}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {info.description}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Emergency Contact */}
                <Card className="bg-gradient-hero text-background border-0">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <Clock className="h-8 w-8 text-accent" />
                      <div>
                        <h3 className="font-semibold text-xl mb-2">24/7 Emergency Support</h3>
                        <p className="text-background/90 mb-2">
                          For urgent medical questions or emergencies during your treatment
                        </p>
                        <p className="text-accent font-semibold">
                          Emergency Hotline: +20 100 000 0000
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Quick Links */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-muted-foreground mb-8">
              Find quick answers to common questions about medical tourism in Egypt
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button variant="outline">Visa Requirements</Button>
              <Button variant="outline">Treatment Costs</Button>
              <Button variant="outline">Accommodation</Button>
              <Button variant="outline">Insurance Coverage</Button>
              <Button variant="outline">Recovery Time</Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Contact;