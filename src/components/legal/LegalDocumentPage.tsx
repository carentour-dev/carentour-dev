import Link from "next/link";
import { Mail, ShieldCheck } from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { type PublicLocale } from "@/i18n/routing";
import { getLegalDocument } from "@/lib/legalDocuments";
import { getLocalizedPublicPagePathname } from "@/lib/public/page";
import { PUBLIC_CONTACT_EMAIL } from "@/lib/public/contact";

type LegalDocumentPageProps = {
  kind: "terms" | "refund";
  locale: PublicLocale;
};

const markdownComponents: Components = {
  h1: ({ node, ...props }) => (
    <h1
      className="mb-5 text-3xl font-bold tracking-normal text-foreground md:text-4xl"
      {...props}
    />
  ),
  h2: ({ node, ...props }) => (
    <h2
      className="mt-10 text-2xl font-semibold tracking-normal text-foreground first:mt-0"
      {...props}
    />
  ),
  h3: ({ node, ...props }) => (
    <h3
      className="mt-8 text-xl font-semibold tracking-normal text-foreground"
      {...props}
    />
  ),
  p: ({ node, ...props }) => (
    <p className="my-5 text-base leading-8 text-muted-foreground" {...props} />
  ),
  ul: ({ node, ...props }) => (
    <ul
      className="my-5 list-disc space-y-3 ps-6 text-base leading-8 text-muted-foreground"
      {...props}
    />
  ),
  ol: ({ node, ...props }) => (
    <ol
      className="my-5 list-decimal space-y-3 ps-6 text-base leading-8 text-muted-foreground"
      {...props}
    />
  ),
  li: ({ node, ...props }) => <li className="ps-1" {...props} />,
  strong: ({ node, ...props }) => (
    <strong className="font-semibold text-foreground" {...props} />
  ),
  a: ({ node, ...props }) => (
    <a
      className="font-medium text-primary underline-offset-4 hover:underline"
      {...props}
    />
  ),
  table: ({ node, ...props }) => (
    <div className="my-6 overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[720px] text-sm" {...props} />
    </div>
  ),
  thead: ({ node, ...props }) => (
    <thead className="bg-muted/70 text-foreground" {...props} />
  ),
  th: ({ node, ...props }) => (
    <th
      className="border-b border-border px-4 py-3 text-start font-semibold"
      {...props}
    />
  ),
  td: ({ node, ...props }) => (
    <td
      className="border-b border-border px-4 py-3 align-top leading-7 text-muted-foreground last:border-b-0"
      {...props}
    />
  ),
};

export default function LegalDocumentPage({
  kind,
  locale,
}: LegalDocumentPageProps) {
  const document = getLegalDocument(kind);
  const copy = document.locales[locale];
  const contactHref = getLocalizedPublicPagePathname("/contact", locale);

  return (
    <div className="bg-background">
      <section className="border-b border-border bg-muted/30">
        <div className="container mx-auto max-w-5xl px-4 py-16 md:py-20">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-sm font-medium text-muted-foreground">
                <ShieldCheck className="h-4 w-4" />
                {copy.eyebrow}
              </div>
              <h1 className="text-4xl font-bold tracking-normal text-foreground md:text-5xl">
                {copy.title}
              </h1>
              <p className="mt-5 text-lg leading-8 text-muted-foreground">
                {copy.description}
              </p>
              <p className="mt-4 text-sm font-medium text-muted-foreground">
                {copy.lastUpdatedLabel}: {copy.lastUpdated}
              </p>
            </div>

            <Button asChild>
              <Link href={contactHref}>
                <Mail className="h-4 w-4" />
                {copy.contactLabel}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="container mx-auto max-w-5xl px-4 py-10 md:py-14">
        <article className="rounded-lg border border-border bg-background px-5 py-8 shadow-sm md:px-10 md:py-12">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={markdownComponents}
          >
            {copy.markdown}
          </ReactMarkdown>
        </article>
        <p className="mt-5 text-sm text-muted-foreground">
          {locale === "ar"
            ? `راسلنا عبر ${PUBLIC_CONTACT_EMAIL} إذا كانت لديك أسئلة حول هذه الصفحة.`
            : `Email ${PUBLIC_CONTACT_EMAIL} if you have questions about this page.`}
        </p>
      </section>
    </div>
  );
}
