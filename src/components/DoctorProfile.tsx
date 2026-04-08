"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Star,
  Award,
  Users,
  Languages,
  BookOpen,
  Stethoscope,
} from "lucide-react";
import Link from "next/link";
import type { PublicLocale } from "@/i18n/routing";
import type { ClientDoctor } from "@/lib/doctors";
import { localizePublicPathnameWithFallback } from "@/lib/public/routing";

interface DoctorProfileProps {
  doctor: ClientDoctor;
  className?: string;
  locale?: PublicLocale;
}

export const DoctorProfile = ({
  doctor,
  className,
  locale = "en",
}: DoctorProfileProps) => {
  const copy =
    locale === "ar"
      ? {
          years: "سنوات",
          reviews: "مراجعة",
          education: "التعليم",
          languages: "اللغات",
          procedures: "الإجراءات",
          completed: "مكتملة",
          research: "الأبحاث",
          publications: "منشورات",
          achievements: "أبرز الإنجازات",
          certifications: "الاعتمادات",
          viewProfile: "عرض الملف الكامل",
        }
      : {
          years: "years",
          reviews: "reviews",
          education: "Education",
          languages: "Languages",
          procedures: "Procedures",
          completed: "completed",
          research: "Research",
          publications: "publications",
          achievements: "Key Achievements",
          certifications: "Certifications",
          viewProfile: "View Full Profile",
        };

  return (
    <Card
      className={`border-border/50 hover:shadow-card-hover transition-spring ${className}`}
    >
      <CardHeader>
        <div className="flex items-start gap-4">
          <Avatar className="w-20 h-20">
            <AvatarImage src={doctor.avatar_url} alt={doctor.name} />
            <AvatarFallback className="text-lg font-semibold bg-primary/10">
              {doctor.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-2">
            <div>
              <h3 className="text-xl font-bold text-foreground mb-1">
                {doctor.name}
              </h3>
              <Badge variant="outline" className="mb-2">
                {doctor.title}
              </Badge>
              <p className="text-primary font-medium">
                {doctor.specialization}
              </p>
            </div>

            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Award className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">
                  {doctor.experience_years}+ {copy.years}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-500" />
                <span className="text-muted-foreground">
                  {doctor.patient_rating.toFixed(1)} ({doctor.total_reviews}{" "}
                  {copy.reviews})
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {doctor.bio && (
          <p className="text-muted-foreground text-sm leading-relaxed">
            {doctor.bio}
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="h-4 w-4 text-primary" />
              <span className="font-medium text-foreground">
                {copy.education}
              </span>
            </div>
            <p className="text-muted-foreground">{doctor.education}</p>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Languages className="h-4 w-4 text-primary" />
              <span className="font-medium text-foreground">
                {copy.languages}
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {doctor.languages.map((language, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {language}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Stethoscope className="h-4 w-4 text-primary" />
              <span className="font-medium text-foreground">
                {copy.procedures}
              </span>
            </div>
            <p className="text-muted-foreground">
              {doctor.successful_procedures.toLocaleString()}+ {copy.completed}
            </p>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-primary" />
              <span className="font-medium text-foreground">
                {copy.research}
              </span>
            </div>
            <p className="text-muted-foreground">
              {doctor.research_publications} {copy.publications}
            </p>
          </div>
        </div>

        {doctor.achievements.length > 0 && (
          <div className="pt-4 border-t border-border">
            <h4 className="font-medium text-foreground mb-2">
              {copy.achievements}
            </h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              {doctor.achievements.map((achievement, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="w-1 h-1 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                  {achievement}
                </li>
              ))}
            </ul>
          </div>
        )}

        {doctor.certifications.length > 0 && (
          <div className="pt-4 border-t border-border">
            <h4 className="font-medium text-foreground mb-2">
              {copy.certifications}
            </h4>
            <div className="flex flex-wrap gap-1">
              {doctor.certifications.map((cert, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {cert}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-border">
          <Link
            href={localizePublicPathnameWithFallback(
              `/doctors/${doctor.id}`,
              locale,
            )}
          >
            <Button variant="outline" className="w-full">
              {copy.viewProfile}
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};
