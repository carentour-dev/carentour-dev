import { BlogContent } from "@/components/blog/BlogContent";
import { TableOfContents } from "@/components/blog/TableOfContents";
import type { BlockInstance } from "@/lib/cms/blocks";
import type { BlogBlockContextEntity } from "@/lib/blog/server";
import { generateTableOfContents } from "@/lib/blog/toc-generator";
import { BlockSurface } from "./BlockSurface";

type BlogArticleBodyContext = {
  blog?: BlogBlockContextEntity | null;
};

function ArticleBodyContent({
  block,
  post,
}: {
  block: BlockInstance<"blogArticleBody">;
  post: Extract<BlogBlockContextEntity, { type: "post" }>["post"];
}) {
  const tocItems = generateTableOfContents(post.content as any);

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_260px]">
      <div className="space-y-10">
        <BlogContent content={post.content as any} />
      </div>
      {block.showTableOfContents ? (
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <TableOfContents items={tocItems} title={block.tocHeading} />
          </div>
        </aside>
      ) : null}
    </div>
  );
}

export function BlogArticleBodyBlock({
  block,
  context,
  locale,
}: {
  block: BlockInstance<"blogArticleBody">;
  context?: BlogArticleBodyContext;
  locale: "en" | "ar";
}) {
  const post = context?.blog?.type === "post" ? context.blog.post : null;

  return (
    <BlockSurface
      block={block}
      defaultPadding={{ top: "2.5rem", bottom: "4rem" }}
      contentClassName="space-y-6"
    >
      {() =>
        post ? (
          <ArticleBodyContent block={block} post={post} />
        ) : (
          <div className="rounded-3xl border border-dashed border-border/70 bg-muted/20 p-8 text-center">
            <h3 className="text-lg font-semibold text-foreground">
              {block.emptyStateHeading}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {block.emptyStateDescription}
            </p>
          </div>
        )
      }
    </BlockSurface>
  );
}
