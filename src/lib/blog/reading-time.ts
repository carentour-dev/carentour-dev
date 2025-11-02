const HTML_TAG_PATTERN = /<\/?[a-z][\s\S]*>/i;

function stripMarkdown(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, "") // Remove code blocks
    .replace(/`[^`]*`/g, "") // Remove inline code
    .replace(/!\[.*?\]\(.*?\)/g, "") // Remove images
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1") // Replace links with text
    .replace(/[#*_~`]/g, "") // Remove markdown symbols
    .replace(/^>\s+/gm, ""); // Remove blockquotes
}

/**
 * Calculate reading time for blog post content
 * Assumes average reading speed of 200 words per minute
 */
export function calculateReadingTime(content: any): number {
  if (!content) return 0;

  let text = "";

  // Extract text based on content type
  if (typeof content === "string") {
    text = content;
  } else if (content.type && content.data) {
    const data =
      typeof content.data === "string"
        ? content.data
        : String(content.data ?? "");

    switch (content.type) {
      case "richtext":
      case "html":
        // If the stored value doesn't contain HTML tags, treat it as markdown/plain text
        text = HTML_TAG_PATTERN.test(data)
          ? data.replace(/<[^>]*>/g, " ")
          : stripMarkdown(data);
        break;
      case "markdown":
        text = stripMarkdown(data);
        break;
      default:
        text = data;
    }
  }

  // Count words
  const words = text
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0);

  const wordCount = words.length;

  // Calculate reading time (200 words per minute)
  const minutes = Math.ceil(wordCount / 200);

  return Math.max(1, minutes); // Minimum 1 minute
}

/**
 * Format reading time for display
 */
export function formatReadingTime(minutes: number): string {
  if (minutes === 1) {
    return "1 min read";
  }
  return `${minutes} min read`;
}
