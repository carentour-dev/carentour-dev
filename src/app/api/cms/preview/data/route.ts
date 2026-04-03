import { NextRequest, NextResponse } from "next/server";

import type { PublicLocale } from "@/i18n/routing";
import type { CmsBlogPreviewData } from "@/lib/cms/previewData";
import { buildLocalizedBlogLandingPath } from "@/lib/blog/paths";
import {
  BLOG_AUTHOR_TEMPLATE_SLUG,
  BLOG_CATEGORY_TEMPLATE_SLUG,
  BLOG_POST_TEMPLATE_SLUG,
  BLOG_TAG_TEMPLATE_SLUG,
  listLocalizedBlogPosts,
  listLocalizedBlogTaxonomy,
} from "@/lib/blog/server";
import { requirePermission } from "@/server/auth/requireAdmin";

function resolvePreviewLocale(value: string | null): PublicLocale {
  return value === "ar" ? "ar" : "en";
}

export async function GET(req: NextRequest) {
  await requirePermission("cms.read");

  const pageSlug = req.nextUrl.searchParams.get("pageSlug")?.trim();
  if (!pageSlug) {
    return NextResponse.json(
      { error: "pageSlug is required" },
      { status: 400 },
    );
  }

  const locale = resolvePreviewLocale(req.nextUrl.searchParams.get("locale"));
  const [postsResult, categoryItems, tagItems, authorItems] = await Promise.all(
    [
      listLocalizedBlogPosts({
        locale,
        limit: 24,
        publishedOnly: true,
      }),
      listLocalizedBlogTaxonomy({
        locale,
        type: "categories",
        publishedOnly: true,
      }),
      listLocalizedBlogTaxonomy({
        locale,
        type: "tags",
        publishedOnly: true,
      }),
      listLocalizedBlogTaxonomy({
        locale,
        type: "authors",
        publishedOnly: true,
      }),
    ],
  );
  const categories =
    categoryItems as CmsBlogPreviewData["taxonomy"]["categories"];
  const tags = tagItems as CmsBlogPreviewData["taxonomy"]["tags"];
  const authors = authorItems as CmsBlogPreviewData["taxonomy"]["authors"];

  const payload: CmsBlogPreviewData = {
    locale,
    pageSlug,
    blogContext: null,
    posts: postsResult.posts,
    taxonomy: {
      categories,
      tags,
      authors,
    },
  };

  if (pageSlug === "blog") {
    payload.blogContext = {
      type: "landing",
      pagePath: buildLocalizedBlogLandingPath(locale),
    };
  } else if (pageSlug === BLOG_CATEGORY_TEMPLATE_SLUG && categories[0]) {
    payload.blogContext = {
      type: "category",
      category: categories[0],
      pagePath: categories[0].path ?? buildLocalizedBlogLandingPath(locale),
    };
  } else if (pageSlug === BLOG_TAG_TEMPLATE_SLUG && tags[0]) {
    payload.blogContext = {
      type: "tag",
      tag: tags[0],
      pagePath: tags[0].path ?? buildLocalizedBlogLandingPath(locale),
    };
  } else if (pageSlug === BLOG_AUTHOR_TEMPLATE_SLUG && authors[0]) {
    payload.blogContext = {
      type: "author",
      author: authors[0],
      pagePath: authors[0].path ?? buildLocalizedBlogLandingPath(locale),
    };
  } else if (pageSlug === BLOG_POST_TEMPLATE_SLUG && postsResult.posts[0]) {
    payload.blogContext = {
      type: "post",
      post: postsResult.posts[0],
      pagePath:
        postsResult.posts[0].path ?? buildLocalizedBlogLandingPath(locale),
    };
  }

  return NextResponse.json(payload);
}
