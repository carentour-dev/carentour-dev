import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";

const iconRegistry = Icons as Record<string, LucideIcon>;

export function resolveIcon(name?: string): LucideIcon | null {
  if (!name) return null;
  const normalized = name.trim();
  if (!normalized) return null;
  const candidate = iconRegistry[normalized as keyof typeof iconRegistry];
  if (candidate) return candidate;
  const fallback = iconRegistry[`${normalized}Icon` as keyof typeof iconRegistry];
  return (fallback as LucideIcon) ?? null;
}
