import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Users, Star, Award } from "lucide-react";

const TeamSection = () => {
  const teamMembers = [
    {
      name: "Dr. Sarah Ahmed",
      role: "Chief Medical Officer",
      specialization: "Cardiothoracic Surgery",
      experience: "15+ years",
      education: "Cairo University Medical School",
      languages: ["English", "Arabic", "French"],
      image: "/team-dr-sarah-ahmed.jpg",
      bio: "Dr. Ahmed leads our medical team with extensive experience in complex cardiac procedures and medical tourism coordination.",
    },
    {
      name: "Dr. Mohamed Hassan",
      role: "Senior Consultant",
      specialization: "Orthopedic Surgery",
      experience: "12+ years",
      education: "Alexandria University Medical School",
      languages: ["English", "Arabic", "German"],
      image: "/team-dr-mohamed-hassan.jpg",
      bio: "Specializing in joint replacement and sports medicine, Dr. Hassan has successfully treated hundreds of international patients.",
    },
    {
      name: "Amira Khalil",
      role: "Patient Care Coordinator",
      specialization: "Medical Tourism",
      experience: "8+ years",
      education: "American University Cairo",
      languages: ["English", "Arabic", "Spanish", "Italian"],
      image: "/team-amira-khalil.jpg",
      bio: "Amira ensures seamless patient journeys from initial consultation through recovery, specializing in international patient care.",
    },
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-light rounded-full mb-6">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Meet Our Expert Team
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Our dedicated professionals combine world-class medical expertise
            with compassionate care, ensuring every patient receives exceptional
            treatment throughout their medical journey.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {teamMembers.map((member, index) => (
            <Card
              key={index}
              className="text-center border-border/50 hover:shadow-card-hover transition-spring"
            >
              <CardHeader className="pb-4">
                <div className="mx-auto mb-4">
                  <Avatar className="w-24 h-24 mx-auto">
                    <AvatarImage src={member.image} alt={member.name} />
                    <AvatarFallback className="text-lg font-semibold">
                      {member.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <CardTitle className="text-xl mb-2">{member.name}</CardTitle>
                <div className="flex justify-center">
                  <Badge variant="outline" className="mb-2 text-center">
                    {member.role}
                  </Badge>
                </div>
                <p className="text-primary font-medium">
                  {member.specialization}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {member.bio}
                </p>

                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-2">
                    <Award className="h-4 w-4 text-primary" />
                    <span className="text-sm text-muted-foreground">
                      {member.experience} Experience
                    </span>
                  </div>

                  <div className="flex items-center justify-center gap-2">
                    <Star className="h-4 w-4 text-primary" />
                    <span className="text-sm text-muted-foreground">
                      {member.education}
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <p className="text-xs text-muted-foreground mb-2">
                    Languages:
                  </p>
                  <div className="flex flex-wrap justify-center gap-1">
                    {member.languages.map((language, langIndex) => (
                      <Badge
                        key={langIndex}
                        variant="secondary"
                        className="text-xs text-center"
                      >
                        {language}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TeamSection;
