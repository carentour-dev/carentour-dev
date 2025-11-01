"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { BlogPostEditor } from "@/components/cms/BlogPostEditor";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { calculateReadingTime } from "@/lib/blog/reading-time";
import { Skeleton } from "@/components/ui/skeleton";

interface EditBlogPostPageProps {
  params: Promise<{ id: string }>;
}

export default function EditBlogPostPage({ params }: EditBlogPostPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();

  // Fetch post data
  const { data: post, isLoading } = useQuery({
    queryKey: ["blog-post-edit", id],
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch(`/api/cms/blog/posts/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) {
        throw new Error("Failed to fetch post");
      }

      const data = await res.json();
      return data.post;
    },
  });

  const handleSave = async (postData: any, status: "draft" | "published") => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      // Calculate reading time
      let contentText = "";
      if (postData.content.type === "html") {
        contentText = postData.content.data.replace(/<[^>]*>/g, "");
      } else if (postData.content.type === "markdown") {
        contentText = postData.content.data;
      } else if (postData.content.type === "richtext") {
        contentText = postData.content.data;
      }
      const readingTime = calculateReadingTime(contentText);

      const payload = {
        ...postData,
        status,
        reading_time: readingTime,
        publish_date:
          status === "published" && !post.publish_date
            ? new Date().toISOString()
            : post.publish_date,
      };

      const res = await fetch(`/api/cms/blog/posts/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to save post");
      }

      toast({
        title: status === "published" ? "Post published!" : "Changes saved!",
        description: `Your blog post has been ${status === "published" ? "published" : "saved"}.`,
      });

      // Optionally refresh the data
      // queryClient.invalidateQueries(["blog-post-edit", id]);
    } catch (error: any) {
      toast({
        title: "Save failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-64" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Post Not Found</h2>
        <Button onClick={() => router.push("/cms/blog/posts")}>
          Back to Posts
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/cms/blog/posts")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Edit Post</h1>
            <p className="text-muted-foreground mt-1">{post.title}</p>
          </div>
        </div>
      </div>

      {/* Editor */}
      <BlogPostEditor initialData={post} onSave={handleSave} />
    </div>
  );
}
