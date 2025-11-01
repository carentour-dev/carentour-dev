import { useQuery } from "@tanstack/react-query";

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  post_count?: number;
}

export function useBlogCategories() {
  return useQuery({
    queryKey: ["blog-categories"],
    queryFn: async () => {
      const response = await fetch("/api/blog/categories");
      if (!response.ok) {
        throw new Error("Failed to fetch blog categories");
      }

      const data = await response.json();
      return data.categories as BlogCategory[];
    },
  });
}
