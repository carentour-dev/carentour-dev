import { Metadata } from "next";

export interface BlogPostSEO {
  id: string;
  title: string;
  excerpt?: string;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string;
  og_image?: string;
  featured_image?: string;
  author?: {
    name: string;
  };
  category?: {
    name: string;
    slug: string;
  };
  publish_date?: string;
  updated_at?: string;
  slug: string;
}

/**
 * Generate SEO metadata for blog post
 */
export function generateBlogPostMetadata(
  post: BlogPostSEO,
  baseUrl: string = process.env.NEXT_PUBLIC_SITE_URL || "https://carentour.com",
): Metadata {
  const title = post.seo_title || post.title;
  const description = post.seo_description || post.excerpt || "";
  const image = post.og_image || post.featured_image;
  const url = `${baseUrl}/blog/${post.category?.slug}/${post.slug}`;

  const metadata: Metadata = {
    title,
    description,
    keywords: post.seo_keywords?.split(",").map((k) => k.trim()),
    authors: post.author ? [{ name: post.author.name }] : undefined,
    openGraph: {
      title,
      description,
      url,
      type: "article",
      publishedTime: post.publish_date,
      modifiedTime: post.updated_at,
      authors: post.author ? [post.author.name] : undefined,
      tags: post.seo_keywords?.split(",").map((k) => k.trim()),
      images: image
        ? [
            {
              url: image.startsWith("http") ? image : `${baseUrl}${image}`,
              alt: title,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image
        ? [image.startsWith("http") ? image : `${baseUrl}${image}`]
        : undefined,
    },
  };

  return metadata;
}

/**
 * Generate JSON-LD structured data for blog post
 */
export function generateBlogPostStructuredData(
  post: BlogPostSEO,
  baseUrl: string = process.env.NEXT_PUBLIC_SITE_URL || "https://carentour.com",
) {
  const url = `${baseUrl}/blog/${post.category?.slug}/${post.slug}`;
  const image = post.og_image || post.featured_image;

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt || "",
    image: image
      ? image.startsWith("http")
        ? image
        : `${baseUrl}${image}`
      : undefined,
    datePublished: post.publish_date,
    dateModified: post.updated_at || post.publish_date,
    author: post.author
      ? {
          "@type": "Person",
          name: post.author.name,
        }
      : undefined,
    publisher: {
      "@type": "Organization",
      name: "Care N Tour",
      logo: {
        "@type": "ImageObject",
        url: `${baseUrl}/carentour-logo-light.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
  };
}

/**
 * Generate metadata for blog listing page
 */
export function generateBlogListingMetadata(
  category?: { name: string; description?: string },
  baseUrl: string = process.env.NEXT_PUBLIC_SITE_URL || "https://carentour.com",
): Metadata {
  const title = category
    ? `${category.name} Articles | Care N Tour Blog`
    : "Health Insights & Travel Guides | Care N Tour Blog";
  const description =
    category?.description ||
    "Expert insights, patient stories, and comprehensive guides to help you make informed decisions about your medical tourism journey to Egypt.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url: `${baseUrl}/blog`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}
