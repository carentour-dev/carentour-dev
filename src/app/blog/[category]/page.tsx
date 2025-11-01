"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useBlogPosts } from "@/hooks/useBlogPosts";
import { useBlogCategories } from "@/hooks/useBlogCategories";
import { BlogPostCard } from "@/components/blog/BlogPostCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

interface CategoryArchiveProps {
  params: Promise<{ category: string }>;
}

export default function CategoryArchive({ params }: CategoryArchiveProps) {
  const { category: categorySlug } = use(params);
  const router = useRouter();
  const [page, setPage] = useState(1);

  const { data: categoriesData } = useBlogCategories();
  const categories = categoriesData || [];
  const category = categories.find((c: any) => c.slug === categorySlug);

  const { data: postsData, isLoading } = useBlogPosts({
    category: category?.id,
    page,
    limit: 12,
  });

  const posts = postsData?.posts || [];
  const pagination = postsData?.pagination;

  if (!category && !isLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="py-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-2xl font-bold mb-4 text-foreground">
              Category Not Found
            </h1>
            <p className="text-muted-foreground mb-6">
              The category you&apos;re looking for doesn&apos;t exist.
            </p>
            <Button onClick={() => router.push("/blog")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Blog
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />

      <main>
        {/* Header */}
        <section className="py-20 bg-gradient-card">
          <div className="container mx-auto px-4">
            <Button
              variant="outline"
              className="mb-6"
              onClick={() => router.push("/blog")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Blog
            </Button>

            <div className="max-w-4xl mx-auto text-center">
              {category ? (
                <>
                  <Badge
                    className="mb-4"
                    style={{ backgroundColor: category.color }}
                  >
                    {category.name}
                  </Badge>
                  <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                    {category.name}
                  </h1>
                  {category.description && (
                    <p className="text-lg md:text-xl text-muted-foreground">
                      {category.description}
                    </p>
                  )}
                  <div className="mt-6">
                    <p className="text-muted-foreground">
                      {pagination?.total || 0} articles in this category
                    </p>
                  </div>
                </>
              ) : (
                <Skeleton className="h-16 w-64 mx-auto" />
              )}
            </div>
          </div>
        </section>

        {/* Posts Grid */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-[400px]" />
                ))}
              </div>
            ) : posts.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {posts.map((post: any) => (
                    <BlogPostCard key={post.id} post={post} />
                  ))}
                </div>

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-12">
                    <Button
                      variant="outline"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {page} of {pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      onClick={() =>
                        setPage((p) => Math.min(pagination.totalPages, p + 1))
                      }
                      disabled={page === pagination.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">
                  No articles found in this category.
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => router.push("/blog")}
                >
                  View All Articles
                </Button>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
