"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart3,
  Edit3,
  FileText,
  Eye,
  Plus,
  ArrowRight,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

export default function BlogDashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["blog-stats"],
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      const postsRes = await fetch("/api/cms/blog/posts?limit=1000", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const postsData = await postsRes.json();

      const totalPosts = postsData.pagination?.total || 0;
      const publishedPosts =
        postsData.posts?.filter((p: any) => p.status === "published").length ||
        0;
      const draftPosts =
        postsData.posts?.filter((p: any) => p.status === "draft").length || 0;
      const totalViews =
        postsData.posts?.reduce(
          (sum: number, p: any) => sum + (p.view_count || 0),
          0,
        ) || 0;

      return {
        totalPosts,
        publishedPosts,
        draftPosts,
        totalViews,
      };
    },
  });

  const { data: recentPosts, isLoading: postsLoading } = useQuery({
    queryKey: ["blog-recent-posts"],
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch("/api/cms/blog/posts?limit=5", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      return data.posts || [];
    },
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Blog Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Manage your blog posts, categories, tags, and authors
          </p>
        </div>
        <div className="flex gap-3">
          <Button asChild>
            <Link href="/cms/blog/posts/new">
              <Plus className="mr-2 h-4 w-4" />
              New Post
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/cms/blog/posts">View All Posts</Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Posts"
          value={stats?.totalPosts}
          icon={<FileText className="h-4 w-4" />}
          loading={statsLoading}
        />
        <StatCard
          title="Published"
          value={stats?.publishedPosts}
          icon={<BarChart3 className="h-4 w-4" />}
          loading={statsLoading}
          variant="success"
        />
        <StatCard
          title="Drafts"
          value={stats?.draftPosts}
          icon={<Edit3 className="h-4 w-4" />}
          loading={statsLoading}
          variant="warning"
        />
        <StatCard
          title="Total Views"
          value={stats?.totalViews}
          icon={<Eye className="h-4 w-4" />}
          loading={statsLoading}
        />
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <QuickActionButton
              href="/cms/blog/posts"
              icon={<FileText className="h-5 w-5" />}
              title="Manage Posts"
              description="View and edit all posts"
            />
            <QuickActionButton
              href="/cms/blog/categories"
              icon={<BarChart3 className="h-5 w-5" />}
              title="Categories"
              description="Organize content"
            />
            <QuickActionButton
              href="/cms/blog/authors"
              icon={<Edit3 className="h-5 w-5" />}
              title="Authors"
              description="Manage authors"
            />
          </div>
        </CardContent>
      </Card>

      {/* Recent Posts */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Posts</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/cms/blog/posts">
              View All
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {postsLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
          ) : recentPosts && recentPosts.length > 0 ? (
            <div className="space-y-4">
              {recentPosts.map((post: any) => (
                <div
                  key={post.id}
                  className="flex items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0"
                >
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/cms/blog/posts/${post.id}/edit`}
                      className="font-medium text-foreground hover:text-primary transition-colors"
                    >
                      {post.title}
                    </Link>
                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                      <Badge
                        variant={
                          post.status === "published" ? "default" : "secondary"
                        }
                      >
                        {post.status}
                      </Badge>
                      {post.category && (
                        <span className="text-xs">{post.category.name}</span>
                      )}
                      <span className="text-xs">
                        {formatDistanceToNow(new Date(post.updated_at), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/cms/blog/posts/${post.id}/edit`}>
                      <Edit3 className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No posts yet. Create your first blog post!</p>
              <Button className="mt-4" asChild>
                <Link href="/cms/blog/posts/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Post
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  loading,
  variant,
}: {
  title: string;
  value?: number;
  icon: React.ReactNode;
  loading: boolean;
  variant?: "success" | "warning" | "info";
}) {
  let variantClass = "border-border/70 bg-card";
  if (variant === "success") {
    variantClass =
      "border-emerald-500/40 bg-emerald-500/10 dark:bg-emerald-500/20";
  } else if (variant === "warning") {
    variantClass = "border-amber-500/40 bg-amber-500/10 dark:bg-amber-500/20";
  } else if (variant === "info") {
    variantClass = "border-primary/50 bg-primary/10 dark:bg-primary/20";
  }

  return (
    <Card className={variantClass}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <div className="text-2xl font-bold text-foreground">
            {value?.toLocaleString() || 0}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function QuickActionButton({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link href={href}>
      <Card className="hover:border-primary/50 hover:shadow-md transition-all cursor-pointer">
        <CardContent className="flex items-start gap-3 p-4">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            {icon}
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
