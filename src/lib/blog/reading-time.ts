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
    switch (content.type) {
      case "richtext":
      case "html":
        // Strip HTML tags
        text = content.data.replace(/<[^>]*>/g, " ");
        break;
      case "markdown":
        // Remove markdown syntax
        text = content.data
          .replace(/```[\s\S]*?```/g, "") // Remove code blocks
          .replace(/`[^`]*`/g, "") // Remove inline code
          .replace(/!\[.*?\]\(.*?\)/g, "") // Remove images
          .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1") // Replace links with text
          .replace(/[#*_~`]/g, "") // Remove markdown symbols
          .replace(/^>\s+/gm, ""); // Remove blockquotes
        break;
      default:
        text = content.data;
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
