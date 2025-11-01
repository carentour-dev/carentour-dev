/**
 * Generate table of contents from blog post content
 */

export interface TocItem {
  id: string;
  text: string;
  level: number;
}

/**
 * Extract headings from content and generate TOC
 */
export function generateTableOfContents(content: any): TocItem[] {
  if (!content) return [];

  const { type, data } = content;
  const headings: TocItem[] = [];

  switch (type) {
    case "richtext":
    case "html": {
      // Parse HTML and extract h2, h3, h4 headings
      const tempDiv =
        typeof document !== "undefined" ? document.createElement("div") : null;
      if (!tempDiv) return [];

      tempDiv.innerHTML = data;
      const headingElements = tempDiv.querySelectorAll("h2, h3, h4");

      headingElements.forEach((heading, index) => {
        const text = heading.textContent || "";
        const level = parseInt(heading.tagName.substring(1));
        let id = heading.id;

        // Generate ID if not present
        if (!id) {
          id = `heading-${slugify(text)}-${index}`;
        }

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

  return headings;
}

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
 * Add IDs to headings in HTML content for anchor links
 */
export function addHeadingIds(htmlContent: string): string {
  if (typeof document === "undefined") return htmlContent;

  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = htmlContent;
  const headingElements = tempDiv.querySelectorAll("h2, h3, h4");

  headingElements.forEach((heading, index) => {
    if (!heading.id) {
      const text = heading.textContent || "";
      heading.id = `heading-${slugify(text)}-${index}`;
    }
  });

  return tempDiv.innerHTML;
}
