import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { HomeCtaContent } from "./content";

export function HomeCtaSection({ content }: { content: HomeCtaContent }) {
  return (
    <section className="bg-surface-subtle py-20">
      <div className="container mx-auto px-4 text-center">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-6 text-4xl font-bold text-foreground md:text-5xl">
            {content.headingPrefix}{" "}
            <span className="text-primary">{content.headingHighlight}</span>
          </h2>
          <p className="mb-8 text-xl leading-relaxed text-muted-foreground">
            {content.description}
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Button size="lg" asChild>
              <Link href={content.primaryAction.href}>
                {content.primaryAction.label}
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href={content.secondaryAction.href}>
                {content.secondaryAction.label}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
