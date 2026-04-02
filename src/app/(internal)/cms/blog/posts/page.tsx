"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  Eye,
  RefreshCcw,
  Loader2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CmsLocaleSwitcher } from "@/components/cms/CmsLocaleSwitcher";
import {
  buildAdminLocaleHref,
  resolveAdminLocale,
} from "@/lib/public/adminLocale";

export default function BlogPostsPage() {
  const searchParams = useSearchParams();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const locale = resolveAdminLocale(
    new URLSearchParams(searchParams.toString()),
  );
  const isArabicLocale = locale === "ar";

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["blog-posts-cms", locale, statusFilter],
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      const params = new URLSearchParams({ limit: "1000", locale });
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }

      const res = await fetch(`/api/cms/blog/posts?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      return data.posts || [];
    },
  });

  const filteredPosts = useMemo(() => {
    if (!data) return [];
    if (!searchTerm.trim()) return data;

    const query = searchTerm.toLowerCase();
    return data.filter(
      (post: any) =>
        (post.title || "").toLowerCase().includes(query) ||
        (post.excerpt || "").toLowerCase().includes(query) ||
        (locale === "ar"
          ? (post.base_title || "").toLowerCase().includes(query)
          : false),
    );
  }, [data, locale, searchTerm]);

  const handleDelete = async (postId: string, postTitle: string) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch(
        `/api/cms/blog/posts/${postId}?locale=${locale}`,
        {
          method: "DELETE",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
      );

      if (!res.ok) {
        throw new Error("Failed to delete post");
      }

      toast({
        title: isArabicLocale ? "Arabic translation deleted" : "Post deleted",
        description: isArabicLocale
          ? `"${postTitle}" Arabic content has been removed.`
          : `"${postTitle}" has been deleted.`,
      });

      refetch();
    } catch (error) {
      toast({
        title: "Delete failed",
        description: "Could not delete the post. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <CmsLocaleSwitcher
        locale={locale}
        description={
          isArabicLocale
            ? "Arabic mode edits translated titles, body content, SEO, and adjacent block zones for existing posts."
            : "English owns base posts, category assignments, tags, featured images, and publish defaults."
        }
      />
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Blog Posts</h1>
          <p className="text-muted-foreground mt-1">
            {isArabicLocale
              ? "Translate and publish Arabic versions of existing blog posts"
              : "Manage all your blog posts"}
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            {isFetching ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCcw className="mr-2 h-4 w-4" />
            )}
            Refresh
          </Button>
          {isArabicLocale ? (
            <Button disabled>
              <Plus className="mr-2 h-4 w-4" />
              English Post Required
            </Button>
          ) : (
            <Button asChild>
              <Link href={buildAdminLocaleHref("/cms/blog/posts/new", locale)}>
                <Plus className="mr-2 h-4 w-4" />
                New Post
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full max-w-lg">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search posts..."
                className="pl-9"
              />
            </div>
            <Tabs value={statusFilter} onValueChange={setStatusFilter}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="published">Published</TabsTrigger>
                <TabsTrigger value="draft">Drafts</TabsTrigger>
                <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Posts Grid */}
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-80" />
          ))}
        </div>
      ) : filteredPosts.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredPosts.map((post: any) => (
            <PostCard
              key={post.id}
              post={post}
              locale={locale}
              onDelete={() => handleDelete(post.id, post.title)}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">
              {searchTerm
                ? "No posts found matching your search."
                : isArabicLocale
                  ? "No posts found. Create or open an English post, then switch to Arabic."
                  : "No posts found. Create your first post!"}
            </p>
            {!searchTerm && !isArabicLocale && (
              <Button className="mt-4" asChild>
                <Link
                  href={buildAdminLocaleHref("/cms/blog/posts/new", locale)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Post
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function PostCard({
  post,
  onDelete,
  locale,
}: {
  post: any;
  onDelete: () => void;
  locale: "en" | "ar";
}) {
  const [deleting, setDeleting] = useState(false);

  const statusColors: Record<string, string> = {
    published: "bg-green-500/10 text-green-700 dark:text-green-400",
    draft: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    scheduled: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {post.featured_image && (
        <div className="relative aspect-video bg-muted">
          <Image
            src={post.featured_image}
            alt={post.title || post.base_title || "Blog post"}
            fill
            className="object-cover"
            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
          />
        </div>
      )}

      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <Badge className={statusColors[post.status] || ""}>
            {post.status}
          </Badge>
          {post.featured && (
            <Badge variant="secondary" className="text-xs">
              Featured
            </Badge>
          )}
        </div>

        <h3 className="font-semibold text-lg leading-tight line-clamp-2">
          {post.title ||
            (locale === "ar"
              ? "Arabic translation not started"
              : "Untitled post")}
        </h3>

        {post.excerpt && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {post.excerpt}
          </p>
        )}

        <div className="flex items-center gap-3 text-xs text-muted-foreground pt-2 border-t">
          {post.category && (
            <span className="truncate">{post.category.name}</span>
          )}
          {post.view_count > 0 && (
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              <span>{post.view_count}</span>
            </div>
          )}
        </div>

        <div className="text-xs text-muted-foreground">
          Updated{" "}
          {formatDistanceToNow(new Date(post.updated_at), { addSuffix: true })}
        </div>

        <div className="flex items-center gap-2 pt-2">
          <Button size="sm" variant="outline" className="flex-1" asChild>
            <Link
              href={buildAdminLocaleHref(
                `/cms/blog/posts/${post.id}/edit`,
                locale,
              )}
            >
              <Edit3 className="mr-2 h-3 w-3" />
              {locale === "ar" ? "Translate" : "Edit"}
            </Link>
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="destructive" disabled={deleting}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this post?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. &quot;{post.title}&quot; will be
                  permanently deleted.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={async () => {
                    setDeleting(true);
                    await onDelete();
                    setDeleting(false);
                  }}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
