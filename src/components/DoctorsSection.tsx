import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Star, Users, Award } from "lucide-react";
import { Link } from "react-router-dom";
import { useDoctors } from "@/hooks/useDoctors";

const DoctorsSection = () => {
  const { doctors, loading } = useDoctors();
  
  // Show top 3 doctors based on rating and reviews
  const featuredDoctors = doctors
    .sort((a, b) => b.patient_rating - a.patient_rating)
    .slice(0, 3);

  if (loading || featuredDoctors.length === 0) {
    return null;
  }

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 text-center">Our Medical Team</Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Meet Our 
            <span className="bg-gradient-hero bg-clip-text text-transparent"> Top Specialists</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            World-class physicians with international training and exceptional patient outcomes
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {featuredDoctors.map((doctor) => (
            <Card key={doctor.id} className="border-border/50 hover:shadow-card-hover transition-spring group">
              <CardHeader className="text-center">
                <Avatar className="w-20 h-20 mx-auto mb-4 border-2 border-primary/20">
                  <AvatarImage src={doctor.avatar_url} alt={doctor.name} />
                  <AvatarFallback className="text-lg">
                    {doctor.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <CardTitle className="text-xl">{doctor.name}</CardTitle>
                <p className="text-muted-foreground">{doctor.title}</p>
                <Badge variant="secondary" className="mt-2 text-center">{doctor.specialization}</Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span className="font-semibold">{doctor.patient_rating}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-primary" />
                    <span>{doctor.successful_procedures}+</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Award className="h-4 w-4 text-primary" />
                    <span>{doctor.experience_years}y</span>
                  </div>
                </div>
                
                {doctor.languages && doctor.languages.length > 0 && (
                  <div className="flex flex-wrap gap-1 justify-center">
                    {doctor.languages.slice(0, 3).map((language, index) => (
                      <Badge key={index} variant="outline" className="text-xs text-center">
                        {language}
                      </Badge>
                    ))}
                  </div>
                )}

                <Link to={`/doctors/${doctor.id}`}>
                  <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-background transition-smooth">
                    View Profile
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Link to="/doctors">
            <Button size="lg" variant="outline">
              View All Doctors
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default DoctorsSection;