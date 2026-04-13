"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

import type { PublicLocale } from "@/i18n/routing";
import type { LocalizedBlogPost } from "@/lib/blog/server";
import type { BlockInstance } from "@/lib/cms/blocks";
import { Button } from "@/components/ui/button";

import type { BlogPostFeedBlockContext } from "./BlogPostFeedBlockContent";
import { BlogPostFeedSection } from "./BlogPostFeedSection";

type BlogArchiveScope = "latest" | "category" | "tag" | "author";

export type BlogPostFeedInfiniteArchiveRequest = {
  scope: BlogArchiveScope;
  locale: PublicLocale;
  limit: number;
  slug?: string;
};

type BlogArchiveResponse = {
  posts: LocalizedBlogPost[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

function mergeUniquePosts(
  existingPosts: LocalizedBlogPost[],
  incomingPosts: LocalizedBlogPost[],
) {
  const seenPostIds = new Set(existingPosts.map((post) => post.id));
  const nextPosts = [...existingPosts];

  for (const post of incomingPosts) {
    if (seenPostIds.has(post.id)) {
      continue;
    }

    seenPostIds.add(post.id);
    nextPosts.push(post);
  }

  return nextPosts;
}

export function BlogPostFeedInfiniteArchive({
  block,
  locale,
  context,
  request,
  initialPosts,
  initialPagination,
}: {
  block: BlockInstance<"blogPostFeed">;
  locale: "en" | "ar";
  context?: BlogPostFeedBlockContext;
  request: BlogPostFeedInfiniteArchiveRequest;
  initialPosts: LocalizedBlogPost[];
  initialPagination: BlogArchiveResponse["pagination"];
}) {
  const [posts, setPosts] = useState(initialPosts);
  const [pagination, setPagination] = useState(initialPagination);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const canLoadMore = pagination.page < pagination.totalPages;
  const queryString = useMemo(() => {
    const searchParams = new URLSearchParams({
      scope: request.scope,
      locale: request.locale,
      limit: String(request.limit),
    });

    if (request.slug) {
      searchParams.set("slug", request.slug);
    }

    return searchParams;
  }, [request.limit, request.locale, request.scope, request.slug]);

  const loadNextPage = useCallback(async () => {
    if (isLoading || !canLoadMore) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const nextPage = pagination.page + 1;
      const response = await fetch(
        `/api/blog/archive?${queryString.toString()}&page=${nextPage}`,
        { cache: "no-store" },
      );

      if (!response.ok) {
        throw new Error(
          `Archive request failed with status ${response.status}`,
        );
      }

      const payload = (await response.json()) as BlogArchiveResponse;
      setPosts((currentPosts) => mergeUniquePosts(currentPosts, payload.posts));
      setPagination(payload.pagination);
    } catch (requestError) {
      console.error("Failed to load additional blog archive posts", {
        request,
        requestError,
      });
      setError(
        locale === "ar"
          ? "تعذر تحميل المزيد من المقالات."
          : "Could not load more articles.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [canLoadMore, isLoading, locale, pagination.page, queryString, request]);

  useEffect(() => {
    if (!canLoadMore || typeof IntersectionObserver === "undefined") {
      return;
    }

    const target = sentinelRef.current;
    if (!target) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) {
          return;
        }

        void loadNextPage();
      },
      {
        rootMargin: "0px 0px 320px 0px",
        threshold: 0,
      },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [canLoadMore, loadNextPage]);

  const loadMoreLabel =
    locale === "ar" ? "تحميل المزيد من المقالات" : "Load more articles";
  const loadingLabel =
    locale === "ar" ? "جارٍ تحميل المزيد..." : "Loading more articles...";
  const showFooter = canLoadMore || isLoading || Boolean(error);

  return (
    <BlogPostFeedSection
      block={block}
      posts={posts}
      context={context}
      locale={locale}
      footer={
        showFooter ? (
          <div className="flex flex-col items-center gap-4 border-t border-border/60 pt-6">
            {canLoadMore ? (
              <div ref={sentinelRef} className="h-px w-full" />
            ) : null}
            {isLoading ? (
              <div
                className="flex items-center gap-2 text-sm text-muted-foreground"
                aria-live="polite"
              >
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{loadingLabel}</span>
              </div>
            ) : canLoadMore ? (
              <Button variant="outline" onClick={() => void loadNextPage()}>
                {loadMoreLabel}
              </Button>
            ) : null}
            {error ? (
              <p className="text-sm text-destructive" aria-live="polite">
                {error}
              </p>
            ) : null}
          </div>
        ) : null
      }
    />
  );
}
