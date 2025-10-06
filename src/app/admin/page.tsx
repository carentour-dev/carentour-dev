"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Building2, Hotel, Inbox, Stethoscope, Users, Sparkles } from "lucide-react";

// Surface the main admin areas for quick navigation.
const quickLinks = [
  {
    title: "Contact Requests",
    href: "/admin/requests",
    description: "Log new inquiries and assign follow-up actions.",
    icon: Inbox,
  },
  {
    title: "Manage Doctors",
    href: "/admin/doctors",
    description: "Keep specialist profiles accurate and up to date.",
    icon: Stethoscope,
  },
  {
    title: "Review Patients",
    href: "/admin/patients",
    description: "Assist coordinators with patient intake and planning.",
    icon: Users,
  },
  {
    title: "Curate Treatments",
    href: "/admin/treatments",
    description: "Maintain pricing, durations, and medical guidance.",
    icon: Building2,
  },
  {
    title: "Patient Testimonials",
    href: "/admin/testimonials",
    description: "Approve reviews and stories that highlight patient success.",
    icon: Sparkles,
  },
  {
    title: "Partner Hotels",
    href: "/admin/hotels",
    description: "Update recovery-friendly accommodations and perks.",
    icon: Hotel,
  },
];

export default function AdminOverviewPage() {
  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Admin Overview</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Centralize operations for Care N Tour’s doctors, patients, and travel partners. Use the quick
          links below to jump into each domain.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {quickLinks.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.href} className="transition hover:shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                  <Icon className="h-5 w-5 text-primary" />
                  {item.title}
                </CardTitle>
                <Button asChild variant="ghost" size="icon">
                  <Link href={item.href}>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
