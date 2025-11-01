import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

/**
 * Simple slugify function for generating heading IDs
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
 * Add IDs to headings in HTML content
 */
function addHeadingIds(html: string): string {
  let counter = 0;
  return html.replace(
    /<h([2-4])([^>]*)>(.*?)<\/h\1>/gi,
    (match, level, attrs, content) => {
      // Check if ID already exists
      if (attrs.includes("id=")) {
        return match;
      }
      // Extract text content (remove any HTML tags inside)
      const text = content.replace(/<[^>]*>/g, "");
      const id = `heading-${slugify(text)}-${counter++}`;
      return `<h${level}${attrs} id="${id}">${content}</h${level}>`;
    },
  );
}

/**
 * Render blog post content based on its format type
 */
export function renderBlogContent(content: any) {
  if (!content) return null;

  const { type, data } = content;

  switch (type) {
    case "richtext":
      return <div dangerouslySetInnerHTML={{ __html: addHeadingIds(data) }} />;

    case "html":
      return <div dangerouslySetInnerHTML={{ __html: addHeadingIds(data) }} />;

    case "markdown":
      let headingCounter = 0;
      return (
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h2: ({ children, ...props }) => {
              const text = String(children);
              const id = `heading-${slugify(text)}-${headingCounter++}`;
              return (
                <h2 id={id} {...props}>
                  {children}
                </h2>
              );
            },
            h3: ({ children, ...props }) => {
              const text = String(children);
              const id = `heading-${slugify(text)}-${headingCounter++}`;
              return (
                <h3 id={id} {...props}>
                  {children}
                </h3>
              );
            },
            h4: ({ children, ...props }) => {
              const text = String(children);
              const id = `heading-${slugify(text)}-${headingCounter++}`;
              return (
                <h4 id={id} {...props}>
                  {children}
                </h4>
              );
            },
            code({ node, inline, className, children, ...props }: any) {
              const match = /language-(\w+)/.exec(className || "");
              return !inline && match ? (
                <SyntaxHighlighter
                  style={vscDarkPlus}
                  language={match[1]}
                  PreTag="div"
                  {...props}
                >
                  {String(children).replace(/\n$/, "")}
                </SyntaxHighlighter>
              ) : (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            },
          }}
        >
          {data}
        </ReactMarkdown>
      );

    default:
      return <div>{data}</div>;
  }
}

/**
 * Extract plain text from content for search/preview purposes
 */
export function extractTextFromContent(content: any): string {
  if (!content) return "";

  const { type, data } = content;

  switch (type) {
    case "richtext":
    case "html":
      // Strip HTML tags
      return data
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    case "markdown":
      // Remove markdown syntax
      return data
        .replace(/```[\s\S]*?```/g, "") // Remove code blocks
        .replace(/`[^`]*`/g, "") // Remove inline code
        .replace(/!\[.*?\]\(.*?\)/g, "") // Remove images
        .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1") // Replace links with text
        .replace(/[#*_~`]/g, "") // Remove markdown symbols
        .replace(/^>\s+/gm, "") // Remove blockquotes
        .replace(/\s+/g, " ")
        .trim();

    default:
      return String(data);
  }
}
