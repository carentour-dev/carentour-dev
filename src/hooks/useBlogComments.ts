import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface BlogComment {
  id: string;
  post_id: string;
  parent_id?: string;
  author_name: string;
  author_email: string;
  content: string;
  created_at: string;
  replies?: BlogComment[];
}

export function useBlogComments(postId: string) {
  return useQuery({
    queryKey: ["blog-comments", postId],
    queryFn: async () => {
      const response = await fetch(`/api/blog/comments?post_id=${postId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch comments");
      }

      const data = await response.json();
      return data.comments as BlogComment[];
    },
    enabled: !!postId,
  });
}

interface SubmitCommentData {
  post_id: string;
  parent_id?: string;
  author_name: string;
  author_email: string;
  content: string;
}

export function useSubmitComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: SubmitCommentData) => {
      const response = await fetch("/api/blog/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to submit comment");
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      // Invalidate comments query for this post
      queryClient.invalidateQueries({
        queryKey: ["blog-comments", variables.post_id],
      });
    },
  });
}
