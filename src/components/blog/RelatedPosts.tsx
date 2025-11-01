"use client";

import { BlogPostCard } from "./BlogPostCard";
import { BlogPost } from "@/hooks/useBlogPosts";
import { cn } from "@/lib/utils";

interface RelatedPostsProps {
  posts: BlogPost[];
  className?: string;
  title?: string;
}

export function RelatedPosts({
  posts,
  className,
  title = "Related Articles",
}: RelatedPostsProps) {
  if (!posts || posts.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-6", className)}>
      <h2 className="text-2xl md:text-3xl font-bold text-foreground">
        {title}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => (
          <BlogPostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}
