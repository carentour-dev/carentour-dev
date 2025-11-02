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
const HTML_TAG_PATTERN = /<\/?[a-z][\s\S]*>/i;

export function generateTableOfContents(content: any): TocItem[] {
  if (!content) return [];

  const { type, data } = content;
  const stringData = typeof data === "string" ? data : String(data ?? "");
  const headings: TocItem[] = [];

  const addMarkdownHeadings = (markdown: string) => {
    const lines = markdown.split("\n");
    let counter = 0;

    lines.forEach((line: string) => {
      const match = line.match(/^(#{1,4})\s+(.+)$/);
      if (match) {
        const level = Math.max(2, match[1].length);
        const text = match[2].trim();
        const id = `heading-${slugify(text)}-${counter}`;
        headings.push({ id, text, level });
        counter++;
      }
    });
  };

  switch (type) {
    case "richtext":
    case "html": {
      // Parse HTML and extract h2, h3, h4 headings
      if (!HTML_TAG_PATTERN.test(stringData)) {
        addMarkdownHeadings(stringData);
        break;
      }

      const tempDiv =
        typeof document !== "undefined" ? document.createElement("div") : null;
      if (!tempDiv) return [];

      tempDiv.innerHTML = stringData;
      const headingElements = tempDiv.querySelectorAll("h1, h2, h3, h4");

      headingElements.forEach((heading, index) => {
        const text = heading.textContent || "";
        const level = Math.max(2, parseInt(heading.tagName.substring(1), 10));
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
      addMarkdownHeadings(stringData);
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
  const headingElements = tempDiv.querySelectorAll("h1, h2, h3, h4");

  headingElements.forEach((heading, index) => {
    if (!heading.id) {
      const text = heading.textContent || "";
      heading.id = `heading-${slugify(text)}-${index}`;
    }
  });

  return tempDiv.innerHTML;
}
