"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  User,
  Globe,
  Twitter,
  Linkedin,
  Github,
} from "lucide-react";
import { useBlogPosts } from "@/hooks/useBlogPosts";
import { BlogPostCard } from "@/components/blog/BlogPostCard";
import { Skeleton } from "@/components/ui/skeleton";

interface AuthorArchiveProps {
  params: Promise<{ slug: string }>;
}

export default function AuthorArchive({ params }: AuthorArchiveProps) {
  const { slug: authorSlug } = use(params);
  const router = useRouter();
  const [page, setPage] = useState(1);

  // Fetch author details
  const { data: author, isLoading: authorLoading } = useQuery({
    queryKey: ["blog-author", authorSlug],
    queryFn: async () => {
      const res = await fetch(`/api/blog/authors/${authorSlug}`);
      if (!res.ok) return null;
      const data = await res.json();
      return data.author;
    },
  });

  const { data: postsData, isLoading: postsLoading } = useBlogPosts({
    author: author?.id,
    page,
    limit: 12,
  });

  const posts = postsData?.posts || [];
  const pagination = postsData?.pagination;
  const isLoading = authorLoading || postsLoading;

  if (!author && !isLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="py-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-2xl font-bold mb-4 text-foreground">
              Author Not Found
            </h1>
            <p className="text-muted-foreground mb-6">
              The author you&apos;re looking for doesn&apos;t exist.
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
        {/* Author Profile Header */}
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

            <div className="max-w-4xl mx-auto">
              {author ? (
                <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {author.avatar ? (
                      <Image
                        src={author.avatar}
                        alt={author.name}
                        width={160}
                        height={160}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-40 h-40 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-20 w-20 text-primary" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 text-center md:text-left">
                    <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                      {author.name}
                    </h1>

                    {author.bio && (
                      <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                        {author.bio}
                      </p>
                    )}

                    {/* Social Links */}
                    {(author.website ||
                      author.social_links?.twitter ||
                      author.social_links?.linkedin ||
                      author.social_links?.github) && (
                      <div className="flex items-center gap-4 justify-center md:justify-start mb-6">
                        {author.website && (
                          <a
                            href={author.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-primary transition-colors"
                          >
                            <Globe className="h-5 w-5" />
                          </a>
                        )}
                        {author.social_links?.twitter && (
                          <a
                            href={author.social_links.twitter}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-primary transition-colors"
                          >
                            <Twitter className="h-5 w-5" />
                          </a>
                        )}
                        {author.social_links?.linkedin && (
                          <a
                            href={author.social_links.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-primary transition-colors"
                          >
                            <Linkedin className="h-5 w-5" />
                          </a>
                        )}
                        {author.social_links?.github && (
                          <a
                            href={author.social_links.github}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-primary transition-colors"
                          >
                            <Github className="h-5 w-5" />
                          </a>
                        )}
                      </div>
                    )}

                    <Badge variant="secondary">
                      {pagination?.total || 0} articles published
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-8">
                  <Skeleton className="w-40 h-40 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-4">
                    <Skeleton className="h-12 w-64" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-3/4" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Author's Posts */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-foreground">
                Articles by {author?.name}
              </h2>
            </div>

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
                  No articles published yet.
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
