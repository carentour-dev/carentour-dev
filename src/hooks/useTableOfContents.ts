import { useEffect, useState } from "react";
import { TocItem } from "@/lib/blog/toc-generator";

const HEADING_SELECTOR = "h1, h2, h3, h4";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

/**
 * Generate a table of contents from the rendered blog content.
 * By reading the DOM we avoid mismatches between generated IDs
 * and what the renderer produced.
 */
export function useTableOfContents(content: any): TocItem[] {
  const [tocItems, setTocItems] = useState<TocItem[]>([]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (!content) {
      setTocItems([]);
      return;
    }

    const handle = window.requestAnimationFrame(() => {
      const container = document.querySelector("[data-toc-root]");
      if (!container) {
        setTocItems([]);
        return;
      }

      const headingElements = Array.from(
        container.querySelectorAll<HTMLHeadingElement>(HEADING_SELECTOR),
      );

      if (headingElements.length === 0) {
        setTocItems([]);
        return;
      }

      const items: TocItem[] = headingElements.map((heading, index) => {
        const level = Math.max(2, parseInt(heading.tagName.substring(1), 10));
        const text = (heading.textContent || "").trim();

        if (!heading.id || heading.id.trim().length === 0) {
          const baseId = slugify(text || `section-${index}`);
          const duplicateCount = headingElements.filter((el) => {
            return (el.textContent || "").trim() === text;
          }).length;

          heading.id =
            duplicateCount > 1
              ? `${baseId}-${index}`
              : baseId || `section-${index}`;
        }

        return { id: heading.id, text, level };
      });

      setTocItems(items);
    });

    return () => window.cancelAnimationFrame(handle);
  }, [content]);

  return tocItems;
}
