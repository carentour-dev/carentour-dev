import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const components: Components = {
  h1: ({ node, ...props }) => (
    <h1 className="text-3xl font-semibold tracking-tight text-foreground" {...props} />
  ),
  h2: ({ node, ...props }) => (
    <h2 className="text-2xl font-semibold tracking-tight text-foreground mt-6" {...props} />
  ),
  h3: ({ node, ...props }) => (
    <h3 className="text-xl font-semibold tracking-tight text-foreground mt-4" {...props} />
  ),
  p: ({ node, ...props }) => <p className="leading-relaxed text-foreground" {...props} />,
  ul: ({ node, ...props }) => <ul className="list-disc pl-6 space-y-2 text-foreground" {...props} />,
  ol: ({ node, ...props }) => <ol className="list-decimal pl-6 space-y-2 text-foreground" {...props} />,
  blockquote: ({ node, ...props }) => (
    <blockquote className="border-l-4 border-primary/40 pl-4 italic text-muted-foreground" {...props} />
  ),
  strong: ({ node, ...props }) => <strong className="font-semibold text-foreground" {...props} />,
  em: ({ node, ...props }) => <em className="italic text-foreground" {...props} />,
  a: ({ node, ...props }) => (
    <a className="text-primary underline-offset-4 hover:underline" {...props} />
  ),
  li: ({ node, ...props }) => <li className="leading-relaxed" {...props} />,
};

const MarkdownRenderer = ({ content, className }: MarkdownRendererProps) => {
  if (!content?.trim()) {
    return null;
  }

  return (
    <div className={className}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
