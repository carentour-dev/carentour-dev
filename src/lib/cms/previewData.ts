import type { PublicLocale } from "@/i18n/routing";
import type {
  BlogBlockContextEntity,
  LocalizedBlogAuthor,
  LocalizedBlogCategory,
  LocalizedBlogPost,
  LocalizedBlogTag,
} from "@/lib/blog/server";

export type CmsBlogPreviewData = {
  locale: PublicLocale;
  pageSlug: string;
  blogContext: BlogBlockContextEntity | null;
  posts: LocalizedBlogPost[];
  taxonomy: {
    categories: LocalizedBlogCategory[];
    tags: LocalizedBlogTag[];
    authors: LocalizedBlogAuthor[];
  };
};
