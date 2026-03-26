import type { Metadata } from "next";
import { StructuredDataScripts } from "@/components/seo/StructuredDataScripts";
import {
  collectionPageSchema,
  maybeRedirectFromLegacyPath,
  resolveSeo,
} from "@/lib/seo";
import { getSupabaseAdmin } from "@/server/supabase/adminClient";
import BlogTagPageClient from "./BlogTagPageClient";

export const revalidate = 300;

type PageProps = {
  params: Promise<{ slug: string }>;
};

async function getTag(slug: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("blog_tags")
    .select("slug, name")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("Failed to load blog tag for SEO", { slug, error });
    return null;
  }

  return data;
}

async function getSeo(slug: string) {
  const pathname = `/blog/tag/${slug}`;
  const tag = await getTag(slug);

  const defaultTitle = tag
    ? `#${tag.name} Articles | Care N Tour Blog`
    : "Blog Tag | Care N Tour";
  const defaultDescription = tag
    ? `Explore blog posts tagged with ${tag.name}.`
    : "Browse tagged articles.";

  return resolveSeo({
    routeKey: pathname,
    pathname,
    defaults: {
      title: defaultTitle,
      description: defaultDescription,
    },
    source: tag
      ? {
          title: defaultTitle,
          description: defaultDescription,
        }
      : undefined,
    schema: collectionPageSchema({
      urlPath: pathname,
      title: defaultTitle,
      description: defaultDescription,
      items: tag ? [{ name: tag.name, path: pathname }] : undefined,
    }),
    indexable: Boolean(tag),
  });
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const seo = await getSeo(slug);
  return seo.metadata;
}

export default async function BlogTagPage({ params }: PageProps) {
  const { slug } = await params;
  const pathname = `/blog/tag/${slug}`;

  await maybeRedirectFromLegacyPath(pathname);
  const seo = await getSeo(slug);

  return (
    <>
      <StructuredDataScripts payload={seo.jsonLd} />
      <BlogTagPageClient />
    </>
  );
}
