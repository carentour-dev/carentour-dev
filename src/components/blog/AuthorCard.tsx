import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Globe, Twitter, Linkedin, Github } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AuthorCardProps {
  author: {
    id: string;
    slug: string;
    name: string;
    bio?: string;
    avatar?: string;
    website?: string;
    social_links?: {
      twitter?: string;
      linkedin?: string;
      github?: string;
    };
  };
  className?: string;
}

export function AuthorCard({ author, className }: AuthorCardProps) {
  return (
    <Card className={className}>
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          {author.avatar ? (
            <Image
              src={author.avatar}
              alt={author.name}
              width={64}
              height={64}
              className="rounded-full"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-2xl font-semibold text-primary">
                {author.name.charAt(0)}
              </span>
            </div>
          )}

          <div className="flex-1">
            <h3 className="font-semibold text-lg text-foreground mb-1">
              <Link
                href={`/blog/author/${author.slug}`}
                className="hover:text-primary transition-colors"
              >
                {author.name}
              </Link>
            </h3>

            {author.bio && (
              <p className="text-sm text-muted-foreground mb-3">{author.bio}</p>
            )}

            <div className="flex items-center gap-2">
              {author.website && (
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                  <a
                    href={author.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Website"
                  >
                    <Globe className="h-4 w-4" />
                  </a>
                </Button>
              )}

              {author.social_links?.twitter && (
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                  <a
                    href={author.social_links.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Twitter"
                  >
                    <Twitter className="h-4 w-4" />
                  </a>
                </Button>
              )}

              {author.social_links?.linkedin && (
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                  <a
                    href={author.social_links.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="LinkedIn"
                  >
                    <Linkedin className="h-4 w-4" />
                  </a>
                </Button>
              )}

              {author.social_links?.github && (
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                  <a
                    href={author.social_links.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="GitHub"
                  >
                    <Github className="h-4 w-4" />
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
