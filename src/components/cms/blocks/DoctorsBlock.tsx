import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { BlockValue } from "@/lib/cms/blocks";
import { getDoctorsForBlock } from "@/lib/cms/server";

const initials = (name: string) =>
  name
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();

export async function DoctorsBlock({ block }: { block: BlockValue<"doctors"> }) {
  const doctors = await getDoctorsForBlock(block);

  if (!doctors.length) {
    return null;
  }

  const layoutClass =
    block.layout === "carousel"
      ? "flex gap-4 overflow-x-auto pb-4"
      : "grid gap-6 md:grid-cols-2 xl:grid-cols-3";

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="mb-10 max-w-3xl">
          <Badge variant="outline" className="text-xs uppercase tracking-wide">Doctors</Badge>
          {block.title ? <h2 className="mt-4 text-3xl font-semibold text-foreground">{block.title}</h2> : null}
          {block.description ? <p className="mt-2 text-muted-foreground">{block.description}</p> : null}
        </div>

        <div className={layoutClass}>
          {doctors.map((doctor) => (
            <Card key={doctor.id} className="min-w-[260px] border-border/60 bg-card/90 shadow-sm hover:shadow-card-hover">
              <CardHeader className="flex items-center gap-3">
                <Avatar className="h-12 w-12 border border-primary/30">
                  <AvatarImage src={doctor.avatar_url ?? undefined} alt={doctor.name} />
                  <AvatarFallback>{initials(doctor.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-lg text-foreground">{doctor.name}</CardTitle>
                  <p className="text-xs text-muted-foreground">{doctor.title}</p>
                  <p className="text-xs text-muted-foreground capitalize">{doctor.specialization}</p>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-4">
                  {typeof doctor.patient_rating === "number" ? (
                    <div>
                      <span className="font-semibold text-foreground">{doctor.patient_rating.toFixed(1)}</span>
                      <span className="ml-1">rating</span>
                    </div>
                  ) : null}
                  {typeof doctor.total_reviews === "number" ? <div>{doctor.total_reviews}+ reviews</div> : null}
                  {typeof doctor.successful_procedures === "number" ? (
                    <div>{doctor.successful_procedures}+ procedures</div>
                  ) : null}
                </div>
                {doctor.languages && doctor.languages.length ? (
                  <div className="flex flex-wrap gap-1">
                    {doctor.languages.slice(0, 4).map((language) => (
                      <Badge key={language} variant="outline" className="text-[11px]">
                        {language}
                      </Badge>
                    ))}
                  </div>
                ) : null}
                <div className="flex gap-2 pt-2">
                  <Button asChild size="sm" className="flex-1">
                    <Link href={`/doctors/${doctor.id}`}>View profile</Link>
                  </Button>
                  <Button asChild size="sm" variant="outline" className="flex-1">
                    <Link href={`/start-journey?doctor=${doctor.id}`}>Book consult</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
