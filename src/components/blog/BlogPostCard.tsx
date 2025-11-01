import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Clock, Eye, Calendar } from "lucide-react";
import { CategoryBadge } from "./CategoryBadge";
import { formatDistanceToNow } from "date-fns";

interface BlogPostCardProps {
  post: {
    id: string;
    slug: string;
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
}

export function BlogPostCard({ post }: BlogPostCardProps) {
  const postUrl = post.category
    ? `/blog/${post.category.slug}/${post.slug}`
    : `/blog/${post.slug}`;

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
            {post.publish_date && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>
                  {formatDistanceToNow(new Date(post.publish_date), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            )}

            {post.reading_time && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{post.reading_time} min</span>
              </div>
            )}

            {post.view_count !== undefined && post.view_count > 0 && (
              <div className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                <span>{post.view_count}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
