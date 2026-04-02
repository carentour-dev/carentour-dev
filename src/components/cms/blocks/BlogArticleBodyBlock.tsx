import { BlogContent } from "@/components/blog/BlogContent";
import { TableOfContents } from "@/components/blog/TableOfContents";
import type { BlockInstance } from "@/lib/cms/blocks";
import { resolveBlogUiText } from "@/lib/blog/localization";
import type { BlogBlockContextEntity } from "@/lib/blog/server";
import { generateTableOfContents } from "@/lib/blog/toc-generator";
import { BlockSurface } from "./BlockSurface";

type BlogArticleBodyContext = {
  blog?: BlogBlockContextEntity | null;
};

function ArticleBodyContent({
  block,
  locale,
  post,
}: {
  block: BlockInstance<"blogArticleBody">;
  locale: "en" | "ar";
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
            <TableOfContents
              items={tocItems}
              title={resolveBlogUiText("tocHeading", locale, block.tocHeading)}
              locale={locale}
            />
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
  const emptyStateHeading = resolveBlogUiText(
    "articleBodyEmptyStateHeading",
    locale,
    block.emptyStateHeading,
  );
  const emptyStateDescription = resolveBlogUiText(
    "articleBodyEmptyStateDescription",
    locale,
    block.emptyStateDescription,
  );

  return (
    <BlockSurface
      block={block}
      defaultPadding={{ top: "2.5rem", bottom: "4rem" }}
      contentClassName="space-y-6"
    >
      {() =>
        post ? (
          <ArticleBodyContent block={block} post={post} locale={locale} />
        ) : (
          <div className="rounded-3xl border border-dashed border-border/70 bg-muted/20 p-8 text-center">
            <h3 className="text-lg font-semibold text-foreground">
              {emptyStateHeading}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {emptyStateDescription}
            </p>
          </div>
        )
      }
    </BlockSurface>
  );
}
