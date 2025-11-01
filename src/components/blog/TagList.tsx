import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Tag } from "lucide-react";

interface TagListProps {
  tags: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  className?: string;
}

export function TagList({ tags, className }: TagListProps) {
  if (!tags || tags.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      <div className="flex items-center gap-2 flex-wrap">
        <Tag className="h-4 w-4 text-muted-foreground" />
        {tags.map((tag) => (
          <Link key={tag.id} href={`/blog/tag/${tag.slug}`}>
            <Badge
              variant="secondary"
              className="hover:bg-secondary/80 transition-colors"
            >
              {tag.name}
            </Badge>
          </Link>
        ))}
      </div>
    </div>
  );
}
