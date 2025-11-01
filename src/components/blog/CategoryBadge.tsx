import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface CategoryBadgeProps {
  name: string;
  color?: string;
  className?: string;
}

export function CategoryBadge({ name, color, className }: CategoryBadgeProps) {
  const badgeStyle = color
    ? {
        backgroundColor: `${color}15`,
        borderColor: `${color}40`,
        color: color,
      }
    : undefined;

  return (
    <Badge
      variant="outline"
      className={cn("font-medium", className)}
      style={badgeStyle}
    >
      {name}
    </Badge>
  );
}
