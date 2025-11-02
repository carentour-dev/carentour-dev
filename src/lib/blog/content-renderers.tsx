import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

const HTML_TAG_PATTERN = /<\/?[a-z][\s\S]*>/i;

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
    /<h([1-4])([^>]*)>(.*?)<\/h\1>/gi,
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

function containsHtmlMarkup(content: string): boolean {
  return HTML_TAG_PATTERN.test(content);
}

function renderMarkdown(markdown: string) {
  let headingCounter = 0;
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children, ...props }) => {
          const text = String(children);
          const id = `heading-${slugify(text)}-${headingCounter++}`;
          return (
            <h1
              id={id}
              className="text-3xl font-semibold tracking-tight text-foreground mt-10 mb-6"
              {...props}
            >
              {children}
            </h1>
          );
        },
        p: ({ children, ...props }) => (
          <p className="leading-relaxed text-muted-foreground mb-4" {...props}>
            {children}
          </p>
        ),
        ul: ({ children, ...props }) => (
          <ul
            className="list-disc pl-6 space-y-2 text-muted-foreground mb-4 marker:text-muted-foreground"
            {...props}
          >
            {children}
          </ul>
        ),
        ol: ({ children, ...props }) => (
          <ol
            className="list-decimal pl-6 space-y-2 text-muted-foreground mb-4 marker:text-muted-foreground"
            {...props}
          >
            {children}
          </ol>
        ),
        li: ({ children, ...props }) => (
          <li className="leading-relaxed text-muted-foreground" {...props}>
            {children}
          </li>
        ),
        h2: ({ children, ...props }) => {
          const text = String(children);
          const id = `heading-${slugify(text)}-${headingCounter++}`;
          return (
            <h2
              id={id}
              className="text-2xl font-semibold tracking-tight text-foreground mt-8 mb-4"
              {...props}
            >
              {children}
            </h2>
          );
        },
        h3: ({ children, ...props }) => {
          const text = String(children);
          const id = `heading-${slugify(text)}-${headingCounter++}`;
          return (
            <h3
              id={id}
              className="text-xl font-semibold tracking-tight text-foreground mt-6 mb-3"
              {...props}
            >
              {children}
            </h3>
          );
        },
        h4: ({ children, ...props }) => {
          const text = String(children);
          const id = `heading-${slugify(text)}-${headingCounter++}`;
          return (
            <h4
              id={id}
              className="text-lg font-semibold tracking-tight text-foreground mt-4 mb-2"
              {...props}
            >
              {children}
            </h4>
          );
        },
        blockquote: ({ children, ...props }) => (
          <blockquote
            className="border-l-4 border-primary/40 pl-4 italic text-muted-foreground my-6"
            {...props}
          >
            {children}
          </blockquote>
        ),
        strong: ({ children, ...props }) => (
          <strong className="font-semibold text-foreground" {...props}>
            {children}
          </strong>
        ),
        em: ({ children, ...props }) => (
          <em className="italic text-muted-foreground" {...props}>
            {children}
          </em>
        ),
        hr: (props) => (
          <hr className="my-10 border-t border-border/60" {...props} />
        ),
        a: ({ children, ...props }) => (
          <a
            className="text-primary underline-offset-4 hover:underline font-medium"
            {...props}
          >
            {children}
          </a>
        ),
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
      {markdown}
    </ReactMarkdown>
  );
}

function stripMarkdown(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, "") // Remove code blocks
    .replace(/`[^`]*`/g, "") // Remove inline code
    .replace(/!\[.*?\]\(.*?\)/g, "") // Remove images
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1") // Replace links with text
    .replace(/[#*_~`]/g, "") // Remove markdown symbols
    .replace(/^>\s+/gm, "") // Remove blockquotes
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Render blog post content based on its format type
 */
export function renderBlogContent(content: any) {
  if (!content) return null;

  const { type, data } = content;
  const stringData = typeof data === "string" ? data : String(data ?? "");

  switch (type) {
    case "richtext":
    case "html":
      return containsHtmlMarkup(stringData) ? (
        <div dangerouslySetInnerHTML={{ __html: addHeadingIds(stringData) }} />
      ) : (
        renderMarkdown(stringData)
      );

    case "markdown":
      return renderMarkdown(stringData);

    default:
      return containsHtmlMarkup(stringData) ? (
        <div dangerouslySetInnerHTML={{ __html: addHeadingIds(stringData) }} />
      ) : (
        renderMarkdown(stringData)
      );
  }
}

/**
 * Extract plain text from content for search/preview purposes
 */
export function extractTextFromContent(content: any): string {
  if (!content) return "";

  const { type, data } = content;
  const stringData = typeof data === "string" ? data : String(data ?? "");

  switch (type) {
    case "richtext":
    case "html":
      return containsHtmlMarkup(stringData)
        ? stringData
            .replace(/<[^>]*>/g, " ")
            .replace(/\s+/g, " ")
            .trim()
        : stripMarkdown(stringData);

    case "markdown":
      return stripMarkdown(stringData);

    default:
      return containsHtmlMarkup(stringData)
        ? stringData
            .replace(/<[^>]*>/g, " ")
            .replace(/\s+/g, " ")
            .trim()
        : stripMarkdown(stringData);
  }
}
