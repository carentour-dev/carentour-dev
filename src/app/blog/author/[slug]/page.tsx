import type { Metadata } from "next";
import { StructuredDataScripts } from "@/components/seo/StructuredDataScripts";
import {
  collectionPageSchema,
  maybeRedirectFromLegacyPath,
  resolveSeo,
} from "@/lib/seo";
import { getSupabaseAdmin } from "@/server/supabase/adminClient";
import BlogAuthorPageClient from "./BlogAuthorPageClient";

export const revalidate = 300;

type PageProps = {
  params: Promise<{ slug: string }>;
};

async function getAuthor(slug: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("blog_authors")
    .select("slug, name, bio, avatar, active, updated_at")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("Failed to load blog author for SEO", { slug, error });
    return null;
  }

  if (data?.active === false) {
    return null;
  }

  return data;
}

async function getSeo(slug: string) {
  const pathname = `/blog/author/${slug}`;
  const author = await getAuthor(slug);

  const defaultTitle = author
    ? `${author.name} | Care N Tour Blog`
    : "Blog Author | Care N Tour";
  const defaultDescription =
    author?.bio ??
    (author
      ? `Articles written by ${author.name}.`
      : "Browse author articles.");

  return resolveSeo({
    routeKey: pathname,
    pathname,
    defaults: {
      title: defaultTitle,
      description: defaultDescription,
    },
    source: author
      ? {
          title: defaultTitle,
          description: defaultDescription,
          ogImageUrl: author.avatar,
        }
      : undefined,
    schema: collectionPageSchema({
      urlPath: pathname,
      title: defaultTitle,
      description: defaultDescription,
      items: author ? [{ name: author.name, path: pathname }] : undefined,
    }),
    indexable: Boolean(author),
    imageUrl: author?.avatar ?? undefined,
    modifiedTime: author?.updated_at ?? undefined,
  });
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const seo = await getSeo(slug);
  return seo.metadata;
}

export default async function BlogAuthorPage({ params }: PageProps) {
  const { slug } = await params;
  const pathname = `/blog/author/${slug}`;

  await maybeRedirectFromLegacyPath(pathname);
  const seo = await getSeo(slug);

  return (
    <>
      <StructuredDataScripts payload={seo.jsonLd} />
      <BlogAuthorPageClient />
    </>
  );
}
