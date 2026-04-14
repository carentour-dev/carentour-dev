import Link from "next/link";
import Image from "@/components/OptimizedImage";
import { Card, CardContent } from "@/components/ui/card";
import { Globe, Twitter, Linkedin, Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getAuthorAvatarInitials,
  getAuthorAvatarPresentation,
} from "@/lib/blog/authorAvatar";

interface AuthorCardProps {
  author: {
    id: string;
    slug: string;
    path?: string | null;
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
  const avatarPresentation = getAuthorAvatarPresentation("compact");
  const avatarInitials = getAuthorAvatarInitials(author.name);

  return (
    <Card className={className}>
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          {author.avatar ? (
            <div className={avatarPresentation.frameClassName}>
              <Image
                src={author.avatar}
                alt={author.name}
                fill
                sizes="64px"
                className={avatarPresentation.imageClassName}
              />
            </div>
          ) : (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <span className="text-xl font-semibold tracking-[-0.04em]">
                {avatarInitials}
              </span>
            </div>
          )}

          <div className="flex-1">
            <h3 className="font-semibold text-lg text-foreground mb-1">
              <Link
                href={author.path ?? `/blog/author/${author.slug}`}
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
