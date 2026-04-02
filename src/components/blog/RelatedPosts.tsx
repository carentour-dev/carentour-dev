"use client";

import type { PublicLocale } from "@/i18n/routing";
import { resolveBlogUiText } from "@/lib/blog/localization";
import { BlogPostCard } from "./BlogPostCard";
import { BlogPost } from "@/hooks/useBlogPosts";
import { cn } from "@/lib/utils";

interface RelatedPostsProps {
  posts: BlogPost[];
  className?: string;
  title?: string;
  locale?: PublicLocale;
}

export function RelatedPosts({
  posts,
  className,
  title = "Related Articles",
  locale = "en",
}: RelatedPostsProps) {
  if (!posts || posts.length === 0) {
    return null;
  }

  const resolvedTitle = resolveBlogUiText("relatedHeading", locale, title);

  return (
    <div className={cn("space-y-6", className)}>
      <h2 className="text-2xl md:text-3xl font-bold text-foreground">
        {resolvedTitle}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => (
          <BlogPostCard key={post.id} post={post} locale={locale} />
        ))}
      </div>
    </div>
  );
}
