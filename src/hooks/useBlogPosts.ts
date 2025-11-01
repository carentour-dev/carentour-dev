import { useQuery } from "@tanstack/react-query";

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt?: string;
  featured_image?: string;
  category_id?: string;
  publish_date?: string;
  reading_time?: number;
  view_count?: number;
  featured?: boolean;
  category?: {
    id: string;
    name: string;
    slug: string;
    color?: string;
  };
  author?: {
    id: string;
    name: string;
    slug: string;
    avatar?: string;
  };
  tags?: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
}

interface UseBlogPostsOptions {
  category?: string;
  tag?: string;
  author?: string;
  search?: string;
  featured?: boolean;
  page?: number;
  limit?: number;
}

export function useBlogPosts(options: UseBlogPostsOptions = {}) {
  const {
    category,
    tag,
    author,
    search,
    featured,
    page = 1,
    limit = 12,
  } = options;

  return useQuery({
    queryKey: [
      "blog-posts",
      category,
      tag,
      author,
      search,
      featured,
      page,
      limit,
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (category) params.append("category", category);
      if (tag) params.append("tag", tag);
      if (author) params.append("author", author);
      if (search) params.append("search", search);
      if (featured) params.append("featured", "true");
      params.append("page", page.toString());
      params.append("limit", limit.toString());

      const response = await fetch(`/api/blog/posts?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch blog posts");
      }

      return response.json();
    },
  });
}
