"use client";

import { renderBlogContent } from "@/lib/blog/content-renderers";
import { cn } from "@/lib/utils";

interface BlogContentProps {
  content: {
    type: "richtext" | "markdown" | "html";
    data: string;
  };
  className?: string;
}

export function BlogContent({ content, className }: BlogContentProps) {
  return (
    <div
      data-toc-root
      className={cn(
        "prose prose-lg max-w-none",
        "prose-headings:font-bold prose-headings:text-foreground",
        "prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4",
        "prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3",
        "prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:mb-4",
        "prose-ul:my-4 prose-ul:space-y-2",
        "prose-ol:my-4 prose-ol:space-y-2",
        "prose-li:text-muted-foreground",
        "prose-strong:text-foreground prose-strong:font-semibold",
        "prose-a:text-primary prose-a:no-underline hover:prose-a:underline",
        "prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground",
        "prose-code:text-primary prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded",
        "prose-pre:bg-muted prose-pre:border prose-pre:border-border",
        "prose-img:rounded-lg prose-img:shadow-md",
        className,
      )}
    >
      {renderBlogContent(content)}
    </div>
  );
}
