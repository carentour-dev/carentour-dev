import { useQuery } from "@tanstack/react-query";

export interface BlogPostDetail {
  id: string;
  slug: string;
  title: string;
  excerpt?: string;
  content: {
    type: "richtext" | "markdown" | "html";
    data: string;
  };
  featured_image?: string;
  category_id?: string;
  publish_date?: string;
  reading_time?: number;
  view_count?: number;
  featured?: boolean;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string;
  og_image?: string;
  created_at?: string;
  updated_at?: string;
  category?: {
    id: string;
    name: string;
    slug: string;
    color?: string;
    description?: string;
  };
  author?: {
    id: string;
    name: string;
    slug: string;
    bio?: string;
    avatar?: string;
    website?: string;
    social_links?: any;
  };
  tags?: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
}

export function useBlogPost(categorySlug: string, slug: string) {
  return useQuery({
    queryKey: ["blog-post", categorySlug, slug],
    queryFn: async () => {
      const response = await fetch(`/api/blog/posts/${categorySlug}/${slug}`);
      if (!response.ok) {
        throw new Error("Failed to fetch blog post");
      }

      const data = await response.json();
      return data.post as BlogPostDetail;
    },
    enabled: !!categorySlug && !!slug,
  });
}
