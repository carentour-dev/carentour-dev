import { useEffect, useState } from "react";
import { TocItem } from "@/lib/blog/toc-generator";

/**
 * Simple slugify function
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

/**
 * Generate TOC from blog content on the client side
 * This hook extracts headings from the content and generates TOC items
 */
export function useTableOfContents(content: any): TocItem[] {
  const [tocItems, setTocItems] = useState<TocItem[]>([]);

  useEffect(() => {
    if (!content) {
      setTocItems([]);
      return;
    }

    const { type, data } = content;
    const headings: TocItem[] = [];

    switch (type) {
      case "richtext":
      case "html": {
        // Parse HTML string to extract headings
        const parser = new DOMParser();
        const doc = parser.parseFromString(data, "text/html");
        const headingElements = doc.querySelectorAll("h2, h3, h4");

        headingElements.forEach((heading, index) => {
          const text = heading.textContent || "";
          const level = parseInt(heading.tagName.substring(1));
          const id = `heading-${slugify(text)}-${index}`;

          headings.push({ id, text, level });
        });
        break;
      }

      case "markdown": {
        // Parse markdown headings
        const lines = data.split("\n");
        let counter = 0;

        lines.forEach((line: string) => {
          const match = line.match(/^(#{2,4})\s+(.+)$/);
          if (match) {
            const level = match[1].length;
            const text = match[2].trim();
            const id = `heading-${slugify(text)}-${counter}`;
            headings.push({ id, text, level });
            counter++;
          }
        });
        break;
      }
    }

    setTocItems(headings);
  }, [content]);

  return tocItems;
}
