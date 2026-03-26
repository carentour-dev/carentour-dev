import type { Metadata } from "next";
import { StructuredDataScripts } from "@/components/seo/StructuredDataScripts";
import {
  blogPostingSchema,
  maybeRedirectFromLegacyPath,
  resolveSeo,
  webPageSchema,
} from "@/lib/seo";
import { getSupabaseAdmin } from "@/server/supabase/adminClient";
import BlogPostPageClient from "./BlogPostPageClient";

export const revalidate = 300;

type PageProps = {
  params: Promise<{ category: string; slug: string }>;
};

type BlogPostSeoRecord = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string | null;
  og_image: string | null;
  featured_image: string | null;
  publish_date: string | null;
  updated_at: string | null;
  category: { slug: string; name: string } | null;
  author: { name: string } | null;
};

async function getBlogPost(categorySlug: string, slug: string) {
  const supabase = getSupabaseAdmin();

  const { data: category, error: categoryError } = await supabase
    .from("blog_categories")
    .select("id, slug")
    .eq("slug", categorySlug)
    .maybeSingle();

  if (categoryError) {
    console.error("Failed to load blog category for post SEO", {
      categorySlug,
      error: categoryError,
    });
    return null;
  }

  if (!category) {
    return null;
  }

  const nowIso = new Date().toISOString();

  const { data: post, error: postError } = await supabase
    .from("blog_posts")
    .select(
      "id, slug, title, excerpt, seo_title, seo_description, seo_keywords, og_image, featured_image, publish_date, updated_at, category:blog_categories(slug, name), author:blog_authors(name)",
    )
    .eq("slug", slug)
    .eq("category_id", category.id)
    .eq("status", "published")
    .or(`publish_date.is.null,publish_date.lte.${nowIso}`)
    .maybeSingle();

  if (postError) {
    console.error("Failed to load blog post for SEO", {
      categorySlug,
      slug,
      error: postError,
    });
    return null;
  }

  return post as BlogPostSeoRecord | null;
}

function parseSeoKeywords(keywords: string | null): string[] | undefined {
  if (!keywords) return undefined;

  const normalized = keywords
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

  return normalized.length > 0 ? normalized : undefined;
}

async function getSeo(categorySlug: string, slug: string) {
  const pathname = `/blog/${categorySlug}/${slug}`;
  const post = await getBlogPost(categorySlug, slug);

  const postTitle = post?.seo_title ?? post?.title;
  const postDescription = post?.seo_description ?? post?.excerpt;
  const defaultTitle = postTitle ?? "Blog Article | Care N Tour";
  const defaultDescription = postDescription ?? "Read the latest blog article.";

  return resolveSeo({
    routeKey: pathname,
    pathname,
    defaults: {
      title: defaultTitle,
      description: defaultDescription,
    },
    source: post
      ? {
          title: postTitle,
          description: postDescription,
          keywords: parseSeoKeywords(post.seo_keywords),
          ogImageUrl: post.og_image ?? post.featured_image,
        }
      : undefined,
    schema: post
      ? [
          webPageSchema({
            urlPath: pathname,
            title: defaultTitle,
            description: defaultDescription,
            breadcrumbs: [
              { name: "Blog", path: "/blog" },
              {
                name: post.category?.name ?? "Category",
                path: `/blog/${post.category?.slug ?? categorySlug}`,
              },
              { name: post.title, path: pathname },
            ],
          }),
          blogPostingSchema({
            title: post.title,
            description: postDescription,
            path: pathname,
            imageUrl: post.og_image ?? post.featured_image,
            publishedTime: post.publish_date,
            modifiedTime: post.updated_at,
            authorName: post.author?.name,
            keywords: parseSeoKeywords(post.seo_keywords),
          }),
        ]
      : webPageSchema({
          urlPath: pathname,
          title: defaultTitle,
          description: defaultDescription,
        }),
    indexable: Boolean(post),
    openGraphType: "article",
    imageUrl: post?.og_image ?? post?.featured_image,
    publishedTime: post?.publish_date ?? undefined,
    modifiedTime: post?.updated_at ?? undefined,
  });
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { category, slug } = await params;
  const seo = await getSeo(category, slug);
  return seo.metadata;
}

export default async function BlogPostPage({ params }: PageProps) {
  const { category, slug } = await params;
  const pathname = `/blog/${category}/${slug}`;

  await maybeRedirectFromLegacyPath(pathname);
  const seo = await getSeo(category, slug);

  return (
    <>
      <StructuredDataScripts payload={seo.jsonLd} />
      <BlogPostPageClient />
    </>
  );
}
