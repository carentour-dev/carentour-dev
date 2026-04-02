import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Clock, Eye, Calendar } from "lucide-react";
import type { PublicLocale } from "@/i18n/routing";
import {
  formatBlogCardDate,
  formatBlogNumber,
  formatBlogReadingTime,
} from "@/lib/blog/localization";
import { CategoryBadge } from "./CategoryBadge";
import { formatDistanceToNow } from "date-fns";

interface BlogPostCardProps {
  post: {
    id: string;
    slug: string;
    path?: string | null;
    title: string;
    excerpt?: string;
    featured_image?: string;
    category?: {
      id: string;
      name: string;
      slug: string;
      color?: string;
    };
    author?: {
      id: string;
      name: string;
      avatar?: string;
    };
    publish_date?: string;
    reading_time?: number;
    view_count?: number;
  };
  locale?: PublicLocale;
}

export function BlogPostCard({ post, locale = "en" }: BlogPostCardProps) {
  const postUrl =
    post.path ??
    (post.category
      ? `/blog/${post.category.slug}/${post.slug}`
      : `/blog/${post.slug}`);
  const publishDateLabel =
    post.publish_date && locale === "ar"
      ? formatBlogCardDate(post.publish_date, locale)
      : post.publish_date
        ? formatDistanceToNow(new Date(post.publish_date), {
            addSuffix: true,
          })
        : null;
  const readingTimeLabel = formatBlogReadingTime(
    post.reading_time,
    locale,
    "compact",
  );
  const viewCountLabel = formatBlogNumber(post.view_count, locale);

  return (
    <Link href={postUrl}>
      <Card className="h-full border-border/50 hover:shadow-card-hover transition-all overflow-hidden group">
        {post.featured_image && (
          <div className="relative aspect-video bg-muted overflow-hidden">
            <Image
              src={post.featured_image}
              alt={post.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
            />
          </div>
        )}

        <CardHeader className="pb-3">
          {post.category && (
            <CategoryBadge
              name={post.category.name}
              color={post.category.color}
              className="w-fit mb-2"
            />
          )}
          <h3 className="text-xl font-semibold text-foreground leading-tight group-hover:text-primary transition-colors">
            {post.title}
          </h3>
        </CardHeader>

        <CardContent className="space-y-4">
          {post.excerpt && (
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
              {post.excerpt}
            </p>
          )}

          <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
            {publishDateLabel && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{publishDateLabel}</span>
              </div>
            )}

            {readingTimeLabel && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{readingTimeLabel}</span>
              </div>
            )}

            {viewCountLabel &&
              post.view_count !== undefined &&
              post.view_count > 0 && (
                <div className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  <span>{viewCountLabel}</span>
                </div>
              )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
