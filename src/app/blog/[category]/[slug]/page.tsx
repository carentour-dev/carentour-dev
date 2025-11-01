"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Clock, User, Eye, Loader2 } from "lucide-react";
import { useBlogPost } from "@/hooks/useBlogPost";
import { useRelatedPosts } from "@/hooks/useRelatedPosts";
import { useBlogComments } from "@/hooks/useBlogComments";
import { useTableOfContents } from "@/hooks/useTableOfContents";
import { BlogContent } from "@/components/blog/BlogContent";
import { TableOfContents } from "@/components/blog/TableOfContents";
import { SocialShare } from "@/components/blog/SocialShare";
import { ReadingProgress } from "@/components/blog/ReadingProgress";
import { CategoryBadge } from "@/components/blog/CategoryBadge";
import { TagList } from "@/components/blog/TagList";
import { AuthorCard } from "@/components/blog/AuthorCard";
import { CommentForm } from "@/components/blog/CommentForm";
import { CommentThread } from "@/components/blog/CommentThread";
import { RelatedPosts } from "@/components/blog/RelatedPosts";
import { NewsletterSubscribe } from "@/components/blog/NewsletterSubscribe";
// SEO metadata is handled by generateMetadata export in server components
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

interface BlogPostPageProps {
  params: Promise<{ category: string; slug: string }>;
}

export default function BlogPostPage({ params }: BlogPostPageProps) {
  const { category, slug } = use(params);
  const router = useRouter();

  const { data: post, isLoading, error } = useBlogPost(category, slug);
  const { data: relatedPosts, isLoading: relatedLoading } = useRelatedPosts(
    post?.id,
  );
  const { data: comments, isLoading: commentsLoading } = useBlogComments(
    post?.id,
  );

  // All hooks must be called before conditional returns (Rules of Hooks)
  const tocItems = useTableOfContents(post?.content);

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto space-y-8">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-96 w-full" />
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="py-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-2xl font-bold mb-4 text-foreground">
              Article Not Found
            </h1>
            <p className="text-muted-foreground mb-6">
              The article you&apos;re looking for doesn&apos;t exist or has been
              removed.
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

  const approvedComments =
    comments?.filter((c: any) => c.status === "approved") || [];

  return (
    <>
      <ReadingProgress />

      <div className="min-h-screen">
        <Header />

        <main>
          {/* Article Header */}
          <section className="py-12 md:py-20 bg-gradient-card">
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
                {post.category && (
                  <CategoryBadge
                    name={post.category.name}
                    color={post.category.color}
                    className="mb-4"
                  />
                )}

                <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
                  {post.title}
                </h1>

                {post.excerpt && (
                  <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
                    {post.excerpt}
                  </p>
                )}

                {/* Post Meta */}
                <div className="flex flex-wrap items-center gap-4 md:gap-6 text-sm md:text-base text-muted-foreground mb-8">
                  {post.author && (
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span>{post.author.name}</span>
                    </div>
                  )}
                  {post.publish_date && (
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {formatDistanceToNow(new Date(post.publish_date), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  )}
                  {post.reading_time && (
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4" />
                      <span>{post.reading_time} min read</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <Eye className="h-4 w-4" />
                    <span>{post.view_count || 0} views</span>
                  </div>
                </div>

                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                  <div className="mb-8">
                    <TagList tags={post.tags} />
                  </div>
                )}

                {/* Social Share */}
                <SocialShare
                  url={`/blog/${post.category?.slug}/${post.slug}`}
                  title={post.title}
                  description={post.excerpt}
                />
              </div>
            </div>
          </section>

          {/* Featured Image */}
          {post.featured_image && (
            <section className="py-0">
              <div className="container mx-auto px-4">
                <div className="max-w-4xl mx-auto">
                  <div className="relative aspect-video overflow-hidden rounded-lg">
                    <Image
                      src={post.featured_image}
                      alt={post.title}
                      fill
                      className="object-cover"
                      sizes="(min-width: 1024px) 60vw, 100vw"
                      priority
                    />
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Article Content with TOC */}
          <section className="py-12 md:py-16 bg-background">
            <div className="container mx-auto px-4">
              <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_250px] gap-8">
                  {/* Main Content */}
                  <div className="max-w-4xl">
                    <BlogContent content={post.content} />

                    {/* Author Card */}
                    {post.author && (
                      <div className="mt-12 pt-8 border-t border-border">
                        <AuthorCard author={post.author} />
                      </div>
                    )}
                  </div>

                  {/* Sidebar - Table of Contents */}
                  <aside className="hidden lg:block">
                    <div className="sticky top-24">
                      <TableOfContents items={tocItems} />
                    </div>
                  </aside>
                </div>
              </div>
            </div>
          </section>

          {/* Comments Section */}
          {post.enable_comments && (
            <section className="py-16 bg-muted/30">
              <div className="container mx-auto px-4">
                <div className="max-w-4xl mx-auto">
                  <h2 className="text-2xl font-bold text-foreground mb-8">
                    Comments ({approvedComments.length})
                  </h2>

                  {/* Comment Form */}
                  <div className="mb-12">
                    <CommentForm postId={post.id} />
                  </div>

                  {/* Comment Thread */}
                  {commentsLoading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-32" />
                      <Skeleton className="h-32" />
                    </div>
                  ) : approvedComments.length > 0 ? (
                    <CommentThread
                      comments={approvedComments}
                      postId={post.id}
                    />
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      No comments yet. Be the first to share your thoughts!
                    </p>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Newsletter Subscription */}
          <section className="py-16 bg-muted/30">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                <NewsletterSubscribe />
              </div>
            </div>
          </section>

          {/* Related Posts */}
          {relatedPosts && relatedPosts.length > 0 && (
            <section className="py-16 bg-background">
              <div className="container mx-auto px-4">
                <RelatedPosts posts={relatedPosts} />
              </div>
            </section>
          )}

          {/* CTA Section */}
          <section className="py-20 bg-gradient-hero">
            <div className="container mx-auto px-4 text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-background mb-4">
                Ready to Start Your Medical Journey?
              </h2>
              <p className="text-xl text-background/90 mb-8 max-w-2xl mx-auto">
                Get personalized advice and a free consultation for your medical
                needs
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" variant="accent" asChild>
                  <Link href="/consultation">Get Free Consultation</Link>
                </Button>
                <Button size="lg" variant="hero" asChild>
                  <Link href="/contact">Contact Us Today</Link>
                </Button>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
}

// SEO is handled by generateMetadata in the parent layout or through Next.js metadata API
