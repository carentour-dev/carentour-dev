import { revalidatePath } from "next/cache";
import { normalizePath } from "@/lib/seo/utils";

export function revalidateSeoPaths(paths: string[]) {
  const seen = new Set<string>();

  for (const path of paths) {
    const normalized = normalizePath(path);
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    revalidatePath(normalized);
  }

  // Keep generated crawl/AI artifacts fresh after any SEO change.
  revalidatePath("/sitemap.xml");
  revalidatePath("/robots.txt");
  revalidatePath("/llms.txt");
}
