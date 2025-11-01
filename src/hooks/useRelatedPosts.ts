import { useQuery } from "@tanstack/react-query";
import { BlogPost } from "./useBlogPosts";

export function useRelatedPosts(postId: string, limit: number = 4) {
  return useQuery({
    queryKey: ["related-posts", postId, limit],
    queryFn: async () => {
      const response = await fetch(
        `/api/blog/related/${postId}?limit=${limit}`,
      );
      if (!response.ok) {
        throw new Error("Failed to fetch related posts");
      }

      const data = await response.json();
      return data.posts as BlogPost[];
    },
    enabled: !!postId,
  });
}
