import { BlockRenderer } from "@/components/cms/BlockRenderer";
import { cookies, headers } from "next/headers";
import { getSupabaseAdmin } from "@/server/supabase/adminClient";
import { resolveAuthorizationFromAccessToken } from "@/server/auth/requireAdmin";
import { getPublicDirection } from "@/lib/public/routing";
import type { PublicLocale } from "@/i18n/routing";

const PREVIEW_COOKIE_NAME = "cms-preview-access-token";

type PreviewProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ locale?: string }>;
};

export const dynamic = "force-dynamic";

export default async function CmsPreviewPage({
  params,
  searchParams,
}: PreviewProps) {
  const { slug } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const locale: PublicLocale =
    resolvedSearchParams?.locale === "ar" ? "ar" : "en";
  const headerStore = await headers();
  const cookieStore = await cookies();
  const authHeader = headerStore.get("authorization");
  const previewCookieToken = cookieStore.get(PREVIEW_COOKIE_NAME)?.value;
  let token: string | undefined;

  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.slice(7).trim();
  } else if (previewCookieToken) {
    token = previewCookieToken;
  }

  if (!token) {
    return <main className="container mx-auto px-4 py-8">Unauthorized</main>;
  }

  let authorization;
  try {
    authorization = await resolveAuthorizationFromAccessToken(token);
  } catch {
    return <main className="container mx-auto px-4 py-8">Unauthorized</main>;
  }

  if (!authorization.hasPermission("cms.read")) {
    return <main className="container mx-auto px-4 py-8">Forbidden</main>;
  }

  const admin = getSupabaseAdmin();
  const { data } = await admin
    .from("cms_pages")
    .select("id, content")
    .eq("slug", slug)
    .maybeSingle();

  if (!data) {
    return (
      <main className="container mx-auto px-4 py-8">No preview available</main>
    );
  }

  let previewContent = (data.content as any[]) ?? [];

  if (locale === "ar") {
    const translationResult = await (admin as any)
      .from("cms_page_translations")
      .select("content")
      .eq("cms_page_id", data.id)
      .eq("locale", "ar")
      .maybeSingle();

    if (translationResult.error) {
      console.error("Failed to load Arabic preview content", {
        slug,
        error: translationResult.error,
      });
    } else if (translationResult.data?.content) {
      previewContent = (translationResult.data.content as any[]) ?? [];
    }
  }

  if (!previewContent.length) {
    return (
      <main className="container mx-auto px-4 py-8">No preview available</main>
    );
  }

  return (
    <main className="py-8" lang={locale} dir={getPublicDirection(locale)}>
      <BlockRenderer blocks={previewContent} />
    </main>
  );
}
