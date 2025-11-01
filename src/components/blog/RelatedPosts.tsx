"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BlogPostCard } from "./BlogPostCard";
import { useRelatedPosts } from "@/hooks/useRelatedPosts";
import { Skeleton } from "@/components/ui/skeleton";

interface RelatedPostsProps {
  postId: string;
  limit?: number;
}

export function RelatedPosts({ postId, limit = 3 }: RelatedPostsProps) {
  const { data: posts, isLoading } = useRelatedPosts(postId, limit);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: limit }).map((_, i) => (
          <Skeleton key={i} className="h-[400px]" />
        ))}
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return null;
  }

  return (
    <section>
      <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8">
        Related Articles
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => (
          <BlogPostCard key={post.id} post={post} />
        ))}
      </div>
    </section>
  );
}
