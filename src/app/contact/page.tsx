"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  MessageCircle,
  FileText,
  CreditCard,
  Hotel,
  HeartHandshake,
  ArrowRight,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import * as z from "zod";
import { useAuth } from "@/contexts/AuthContext";

const formSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
  country: z.string().optional(),
  treatment: z.string().optional(),
  message: z.string().min(10, "Message must be at least 10 characters long"),
});

export default function Contact() {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { session } = useAuth();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      country: "",
      treatment: "",
      message: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      console.log("Sending contact form submission:", values);

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }

      const response = await fetch("/api/contact", {
        method: "POST",
        headers,
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error ?? "Failed to submit contact request");
      }

      console.log("Contact request stored with ID:", data?.contactRequestId);

      toast({
        title: "Message Sent Successfully!",
        description:
          "Thanks for reaching out—our coordinators see your request instantly and will be in touch within 2 hours.",
      });

      // Reset form after successful submission
      form.reset();
    } catch (error: any) {
      console.error("Error sending contact form:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactInfo = [
    {
      icon: Phone,
      title: "Phone Support",
      content: "+20 100 1741666",
      description: "Available 24/7 for emergencies",
    },
    {
      icon: Mail,
      title: "Email Us",
      content: "info@carentour.com",
      description: "Response within 2 hours",
    },
    {
      icon: MapPin,
      title: "Visit Our Office",
      content: "Cairo Medical District, Egypt",
      description: "Monday - Saturday: 9AM - 6PM",
    },
    {
      icon: MessageCircle,
      title: "Live Chat",
      content: "Available on website",
      description: "Instant support online",
    },
  ];

  return (
    <div className="min-h-screen">
      <Header />

      <main>
        {/* Hero Section */}
        <section className="py-20 bg-gradient-card">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <Badge variant="outline" className="mb-6">
                Contact Us
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
                Get in Touch with
                <span className="block bg-gradient-hero bg-clip-text text-transparent">
                  Our Medical Team
                </span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Our medical coordinators are ready to help you plan your
                treatment journey. Reach out for a free consultation or any
                questions about our services.
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
                    <CardTitle className="text-2xl">
                      Send Us a Message
                    </CardTitle>
                    <p className="text-muted-foreground">
                      Fill out the form below and we&apos;ll get back to you
                      within 2 hours
                    </p>
                  </CardHeader>
                  <CardContent>
                    <Form {...form}>
                      <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-6"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="firstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>First Name *</FormLabel>
                                <FormControl>
                                  <Input placeholder="John" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="lastName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Last Name *</FormLabel>
                                <FormControl>
                                  <Input placeholder="Doe" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email Address *</FormLabel>
                              <FormControl>
                                <Input
                                  type="email"
                                  placeholder="john@example.com"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone Number</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="+1 (555) 123-4567"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="country"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Country</FormLabel>
                              <FormControl>
                                <Input placeholder="United States" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="treatment"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Treatment of Interest</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="e.g., Cardiac Surgery, LASIK, Dental Implants"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="message"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Message *</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Please describe your medical needs and any questions you have..."
                                  className="min-h-[120px]"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Button
                          type="submit"
                          size="lg"
                          className="w-full"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? "Sending..." : "Send Message"}
                        </Button>
                      </form>
                    </Form>

                    <p className="text-sm text-muted-foreground text-center">
                      By submitting this form, you agree to our privacy policy
                      and terms of service.
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
                    Our dedicated team is available around the clock to assist
                    you with any questions or concerns about your medical
                    tourism journey.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {contactInfo.map((info, index) => {
                    const Icon = info.icon;
                    return (
                      <Card
                        key={index}
                        className="border-border/50 hover:shadow-card-hover transition-spring"
                      >
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
                        <h3 className="font-semibold text-xl mb-2">
                          24/7 Emergency Support
                        </h3>
                        <p className="text-background/90 mb-2">
                          For urgent medical questions or emergencies during
                          your treatment
                        </p>
                        <p className="text-accent font-semibold">
                          Emergency Hotline: +20 100 1741666
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Quick Access */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-muted-foreground mb-8">
              Find quick answers to common questions about medical tourism in
              Egypt
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              {/* Visa Requirements Section */}
              <Card className="hover:shadow-card-hover transition-spring">
                <CardContent className="p-6">
                  <div
                    className="flex items-center gap-2 mb-4 cursor-pointer hover:text-primary transition-colors"
                    onClick={() => router.push("/faq#visa-travel")}
                  >
                    <FileText className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-lg">Visa & Travel</h3>
                    <ArrowRight className="h-4 w-4 ml-auto opacity-60" />
                  </div>
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem
                      value="visa-question-1"
                      className="border-none"
                    >
                      <AccordionTrigger className="text-sm font-medium hover:no-underline py-2">
                        Do I need a visa to visit Egypt for medical treatment?
                      </AccordionTrigger>
                      <AccordionContent className="text-xs text-muted-foreground pb-2">
                        Most nationalities require a visa. We assist with
                        medical visa applications with expedited processing.
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem
                      value="visa-question-2"
                      className="border-none"
                    >
                      <AccordionTrigger className="text-sm font-medium hover:no-underline py-2">
                        What documents do I need?
                      </AccordionTrigger>
                      <AccordionContent className="text-xs text-muted-foreground pb-2">
                        Valid passport, visa, medical records, and insurance
                        documentation. We provide a comprehensive checklist.
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>

              {/* Treatment Costs Section */}
              <Card className="hover:shadow-card-hover transition-spring">
                <CardContent className="p-6">
                  <div
                    className="flex items-center gap-2 mb-4 cursor-pointer hover:text-primary transition-colors"
                    onClick={() => router.push("/faq#costs-payment")}
                  >
                    <CreditCard className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-lg">Costs & Payment</h3>
                    <ArrowRight className="h-4 w-4 ml-auto opacity-60" />
                  </div>
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem
                      value="cost-question-1"
                      className="border-none"
                    >
                      <AccordionTrigger className="text-sm font-medium hover:no-underline py-2">
                        How much can I save compared to my home country?
                      </AccordionTrigger>
                      <AccordionContent className="text-xs text-muted-foreground pb-2">
                        Patients typically save 50-70% while receiving the same
                        quality of care.
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem
                      value="cost-question-2"
                      className="border-none"
                    >
                      <AccordionTrigger className="text-sm font-medium hover:no-underline py-2">
                        What payment methods do you accept?
                      </AccordionTrigger>
                      <AccordionContent className="text-xs text-muted-foreground pb-2">
                        Bank transfers, credit cards, and cash payments. Payment
                        plans available for complex treatments.
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>

              {/* Accommodation Section */}
              <Card className="hover:shadow-card-hover transition-spring">
                <CardContent className="p-6">
                  <div
                    className="flex items-center gap-2 mb-4 cursor-pointer hover:text-primary transition-colors"
                    onClick={() => router.push("/faq#stay-transport")}
                  >
                    <Hotel className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-lg">Stay & Transport</h3>
                    <ArrowRight className="h-4 w-4 ml-auto opacity-60" />
                  </div>
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem
                      value="accommodation-question-1"
                      className="border-none"
                    >
                      <AccordionTrigger className="text-sm font-medium hover:no-underline py-2">
                        What accommodation options are available?
                      </AccordionTrigger>
                      <AccordionContent className="text-xs text-muted-foreground pb-2">
                        5-star hotels to comfortable apartments near hospitals,
                        all carefully selected for comfort and proximity.
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem
                      value="accommodation-question-2"
                      className="border-none"
                    >
                      <AccordionTrigger className="text-sm font-medium hover:no-underline py-2">
                        Can my family accompany me?
                      </AccordionTrigger>
                      <AccordionContent className="text-xs text-muted-foreground pb-2">
                        Yes, we arrange accommodation for companions and provide
                        guidance on visa requirements.
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>

              {/* Recovery & Support Section */}
              <Card className="hover:shadow-card-hover transition-spring">
                <CardContent className="p-6">
                  <div
                    className="flex items-center gap-2 mb-4 cursor-pointer hover:text-primary transition-colors"
                    onClick={() => router.push("/faq#recovery-support")}
                  >
                    <HeartHandshake className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-lg">
                      Recovery & Support
                    </h3>
                    <ArrowRight className="h-4 w-4 ml-auto opacity-60" />
                  </div>
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem
                      value="recovery-question-1"
                      className="border-none"
                    >
                      <AccordionTrigger className="text-sm font-medium hover:no-underline py-2">
                        What follow-up care is provided?
                      </AccordionTrigger>
                      <AccordionContent className="text-xs text-muted-foreground pb-2">
                        Comprehensive aftercare including check-ups, medication
                        management, and coordination with home physicians.
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem
                      value="recovery-question-2"
                      className="border-none"
                    >
                      <AccordionTrigger className="text-sm font-medium hover:no-underline py-2">
                        What if complications arise after I return home?
                      </AccordionTrigger>
                      <AccordionContent className="text-xs text-muted-foreground pb-2">
                        Our doctors remain available for consultation and can
                        provide guidance to your local physicians.
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            </div>

            <div className="mt-8">
              <Button
                onClick={() => (window.location.href = "/faq")}
                variant="outline"
              >
                View All FAQs
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
