"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Eye,
  Loader2,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { PageBuilder } from "@/components/cms/editor/PageBuilder";
import { normalizeBlocks, type BlockInstance } from "@/lib/cms/blocks";
import {
  HOME_HERO_IMAGE_REQUIREMENTS,
  HOME_HERO_IMAGE_REQUIREMENTS_TEXT,
  resolveHomePageLayoutMode,
  sanitizeCmsPageSettings,
  type CmsPageSettings,
} from "@/lib/cms/pageSettings";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CmsLocaleSwitcher } from "@/components/cms/CmsLocaleSwitcher";
import {
  buildAdminLocaleHref,
  resolveAdminLocale,
} from "@/lib/public/adminLocale";
import { localizePublicPathname } from "@/lib/public/routing";

type PageSeo = {
  title?: string;
  description?: string;
  ogImage?: string;
};

type PageRecord = {
  id: string;
  slug: string;
  title: string;
  status: "draft" | "published";
  seo: PageSeo | null;
  settings: CmsPageSettings;
  content: BlockInstance[];
  updated_at?: string;
};

type ApiPageResponse = {
  page: {
    id: string;
    slug: string;
    title: string;
    status: "draft" | "published";
    seo: PageSeo | null;
    settings: unknown;
    content: unknown;
    updated_at?: string;
  };
};

const statusCopy: Record<
  PageRecord["status"],
  { label: string; tone: string }
> = {
  draft: { label: "Draft", tone: "bg-muted text-muted-foreground" },
  published: { label: "Published", tone: "bg-emerald-100 text-emerald-700" },
};

const toPublicPath = (slug: string) =>
  slug === "home" ? "/" : `/${slug.replace(/^\/+/, "")}`;

export default function CmsEditPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const locale = resolveAdminLocale(
    new URLSearchParams(searchParams.toString()),
  );
  const isArabicLocale = locale === "ar";
  const cmsIndexHref = buildAdminLocaleHref("/cms", locale);

  const [page, setPage] = useState<PageRecord | null>(null);
  const [initialPage, setInitialPage] = useState<PageRecord | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token ?? null;
      setAuthToken(token);

      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const listRes = await fetch(`/api/cms/pages?locale=${locale}`, {
        headers,
      });
      if (!listRes.ok) {
        setLoading(false);
        toast({ title: "Unable to load pages", variant: "destructive" });
        return;
      }
      const json = await listRes.json();
      const found = (json.pages as Array<{ slug: string; id: string }>).find(
        (p) => p.slug === params.slug,
      );
      if (!found) {
        setLoading(false);
        toast({ title: "Page not found", variant: "destructive" });
        return;
      }
      const detailRes = await fetch(
        `/api/cms/pages/${found.id}?locale=${locale}`,
        {
          headers,
        },
      );
      if (!detailRes.ok) {
        setLoading(false);
        toast({ title: "Unable to load page", variant: "destructive" });
        return;
      }
      const detail = (await detailRes.json()) as ApiPageResponse;
      const normalized: PageRecord = {
        id: detail.page.id,
        slug: detail.page.slug,
        title: detail.page.title,
        status: detail.page.status,
        seo: detail.page.seo ?? {},
        settings: sanitizeCmsPageSettings(detail.page.settings),
        content: normalizeBlocks(detail.page.content),
        updated_at: detail.page.updated_at,
      };
      setPage(normalized);
      setInitialPage(normalized);
      setLoading(false);
    };

    load();
  }, [locale, params.slug, toast]);

  const isDirty = useMemo(() => {
    if (!page || !initialPage) return false;
    const current = JSON.stringify({ ...page });
    const initial = JSON.stringify({ ...initialPage });
    return current !== initial;
  }, [page, initialPage]);

  const handleMetaChange = <K extends keyof PageRecord>(
    key: K,
    value: PageRecord[K],
  ) => {
    setPage((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleSeoChange = <K extends keyof PageSeo>(
    key: K,
    value: PageSeo[K],
  ) => {
    setPage((prev) =>
      prev ? { ...prev, seo: { ...(prev.seo ?? {}), [key]: value } } : prev,
    );
  };

  const handleHomeHeroImageChange = (value: string | null) => {
    setPage((prev) =>
      prev
        ? {
            ...prev,
            settings: {
              ...(prev.settings ?? {}),
              homeHero: {
                ...(value ? { imageUrl: value } : {}),
                useLegacyLayout:
                  resolveHomePageLayoutMode(
                    prev.settings,
                    prev.status,
                    prev.content.length,
                  ) === "legacy",
              },
            },
          }
        : prev,
    );
  };

  const handleHomeLayoutModeChange = (useLegacyLayout: boolean) => {
    setPage((prev) =>
      prev
        ? {
            ...prev,
            settings: {
              ...(prev.settings ?? {}),
              homeHero: {
                ...(prev.settings?.homeHero?.imageUrl
                  ? { imageUrl: prev.settings.homeHero.imageUrl }
                  : {}),
                useLegacyLayout,
              },
            },
          }
        : prev,
    );
  };

  const handleBlocksChange = (blocks: BlockInstance[]) => {
    setPage((prev) => (prev ? { ...prev, content: blocks } : prev));
  };

  const save = async (nextStatus?: PageRecord["status"]) => {
    if (!page) return false;
    setSaving(true);
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError) {
        throw sessionError;
      }
      const freshToken = session?.access_token ?? null;
      setAuthToken(freshToken);

      const targetStatus = nextStatus ?? page.status;
      const previousSlug = page.slug;
      const previousStatus = page.status;
      const payload = {
        ...page,
        status: targetStatus,
        seo: page.seo ?? {},
        settings: page.settings ?? {},
        content: page.content,
      };
      const res = await fetch(`/api/cms/pages/${page.id}?locale=${locale}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(freshToken ? { Authorization: `Bearer ${freshToken}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let errorMessage = "Failed to save page";
        try {
          const errorBody = await res.json();
          if (
            errorBody &&
            typeof errorBody.error === "string" &&
            errorBody.error.trim().length > 0
          ) {
            errorMessage = errorBody.error;
          }
        } catch {
          // ignore JSON parsing issues and use default message
        }
        throw new Error(errorMessage);
      }

      const data = (await res.json()) as ApiPageResponse;
      const normalized: PageRecord = {
        id: data.page.id,
        slug: data.page.slug,
        title: data.page.title,
        status: data.page.status,
        seo: data.page.seo ?? {},
        settings: sanitizeCmsPageSettings(data.page.settings),
        content: normalizeBlocks(data.page.content),
        updated_at: data.page.updated_at,
      };
      setPage(normalized);
      setInitialPage(normalized);

      const pathsToRevalidate = new Set<string>();
      if (targetStatus === "published") {
        pathsToRevalidate.add(toPublicPath(normalized.slug));
      }
      if (previousSlug !== normalized.slug) {
        pathsToRevalidate.add(toPublicPath(previousSlug));
        if (targetStatus === "published") {
          pathsToRevalidate.add(toPublicPath(normalized.slug));
        }
      }
      if (previousStatus === "published" && targetStatus !== "published") {
        pathsToRevalidate.add(toPublicPath(previousSlug));
      }
      if (pathsToRevalidate.size && freshToken) {
        await Promise.all(
          Array.from(pathsToRevalidate).map(async (path) => {
            try {
              const localizedPath = localizePublicPathname(path, locale);
              await fetch("/api/revalidate", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${freshToken}`,
                },
                body: JSON.stringify({ path: localizedPath }),
              });
            } catch (revalidateError) {
              console.warn("Failed to revalidate path", path, revalidateError);
            }
          }),
        );
      }

      toast({
        title:
          targetStatus === "published"
            ? isArabicLocale
              ? "Arabic page published"
              : "Page published"
            : targetStatus === "draft" && page.status === "published"
              ? isArabicLocale
                ? "Arabic page hidden from site"
                : "Page hidden from site"
              : "Changes saved",
        description:
          targetStatus === "draft" && page.status === "published"
            ? isArabicLocale
              ? "Visitors will no longer see the Arabic version until it is published again."
              : "Visitors will no longer see this page until it is published again."
            : isArabicLocale
              ? "Arabic content synced with the CMS."
              : "Content synced with the CMS.",
      });
      return true;
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Save failed",
        description: error?.message ?? "Please try again",
        variant: "destructive",
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePage = async () => {
    if (!page || deleting) return;
    setDeleting(true);
    const pageSnapshot = { ...page };
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError) {
        throw sessionError;
      }
      const freshToken = session?.access_token ?? null;
      const res = await fetch(
        `/api/cms/pages/${pageSnapshot.id}?locale=${locale}`,
        {
          method: "DELETE",
          headers: freshToken ? { Authorization: `Bearer ${freshToken}` } : {},
        },
      );
      if (!res.ok) {
        const errorBody = await res.json().catch(() => null);
        const message =
          typeof errorBody?.error === "string" && errorBody.error.trim().length
            ? errorBody.error
            : "Failed to delete page";
        throw new Error(message);
      }
      if (pageSnapshot.status === "published" && freshToken) {
        try {
          const localizedPath = localizePublicPathname(
            toPublicPath(pageSnapshot.slug),
            locale,
          );
          await fetch("/api/revalidate", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${freshToken}`,
            },
            body: JSON.stringify({ path: localizedPath }),
          });
        } catch (revalidateError) {
          console.warn("Failed to revalidate deleted page", revalidateError);
        }
      }
      toast({
        title: isArabicLocale ? "Arabic translation deleted" : "Page deleted",
        description: isArabicLocale
          ? `“${pageSnapshot.title}” Arabic content was removed from the CMS.`
          : `“${pageSnapshot.title}” removed from the CMS.`,
      });
      router.push(cmsIndexHref);
      router.refresh();
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Delete failed",
        description: error?.message ?? "Unable to delete this page.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const handlePreview = async () => {
    if (!page) return;
    if (!authToken) {
      toast({
        title: "Preview unavailable",
        description: "Sign in again to refresh your session.",
        variant: "destructive",
      });
      return;
    }
    const success = await save();
    if (success) {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const previewToken = session?.access_token ?? authToken;
      const previewSessionRes = await fetch("/api/cms/preview/session", {
        method: "POST",
        headers: previewToken
          ? { Authorization: `Bearer ${previewToken}` }
          : {},
      });

      if (!previewSessionRes.ok) {
        const payload = await previewSessionRes.json().catch(() => null);
        toast({
          title: "Preview unavailable",
          description:
            payload?.error ??
            "Unable to prepare the preview session. Please try again.",
          variant: "destructive",
        });
        return;
      }

      const previewHref = buildAdminLocaleHref(
        `/cms/preview/${page.slug}`,
        locale,
      );
      window.open(previewHref, "_blank", "noopener,noreferrer");
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading page…
        </div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-lg font-semibold text-destructive">Page not found</p>
        <Button variant="secondary" asChild>
          <Link href={cmsIndexHref}>Return to CMS</Link>
        </Button>
      </div>
    );
  }

  const statusMeta = statusCopy[page.status];
  const isHomePage = page.slug === "home";
  const homeHeroImageUrl = page.settings?.homeHero?.imageUrl ?? null;
  const useLegacyHomepageLayout =
    isHomePage &&
    resolveHomePageLayoutMode(
      page.settings,
      page.status,
      page.content.length,
    ) === "legacy";

  return (
    <div className="space-y-8 pb-12">
      <CmsLocaleSwitcher
        locale={locale}
        description={
          isArabicLocale
            ? "Arabic uses the same slug and route as English. Edit translated title, SEO, and blocks here."
            : "English owns the base slug, settings, and default public content."
        }
      />
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Button asChild variant="ghost" size="sm" className="-ml-3">
              <Link href={cmsIndexHref}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to pages
              </Link>
            </Button>
            <Separator orientation="vertical" className="hidden h-4 lg:block" />
            <Badge className={statusMeta.tone}>{statusMeta.label}</Badge>
            {page.updated_at ? (
              <span className="flex items-center gap-1 text-xs">
                <CalendarClock className="h-3 w-3" />
                Updated {new Date(page.updated_at).toLocaleString()}
              </span>
            ) : null}
          </div>
          <h1 className="text-3xl font-semibold text-foreground">
            {isArabicLocale
              ? `Editing Arabic translation for “${page.title}”`
              : `Editing “${page.title}”`}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isArabicLocale
              ? "Translate page metadata and block content for the Arabic public route."
              : "Configure SEO metadata, reorder sections, and fine-tune block content before publishing."}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handlePreview}
            disabled={saving || !authToken || deleting}
          >
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Eye className="mr-2 h-4 w-4" />
            )}
            Preview
          </Button>
          <Button
            variant="secondary"
            onClick={() => save("draft")}
            disabled={
              saving || (!isDirty && page.status !== "published") || deleting
            }
          >
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="mr-2 h-4 w-4" />
            )}
            {page.status === "published" ? "Unpublish" : "Save Draft"}
          </Button>
          <Button
            onClick={() => save("published")}
            disabled={
              saving || (!isDirty && page.status === "published") || deleting
            }
          >
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="mr-2 h-4 w-4" />
            )}
            Publish
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={deleting}>
                {deleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting…
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </>
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this page?</AlertDialogTitle>
                <AlertDialogDescription>
                  {isArabicLocale
                    ? `This removes the Arabic translation for “${page.title}”. The English page stays in place.`
                    : `This permanently removes “${page.title}” and all of its blocks. This action cannot be undone.`}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={deleting}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90 focus:ring-destructive"
                  onClick={handleDeletePage}
                  disabled={deleting}
                >
                  {isArabicLocale
                    ? "Delete Arabic translation"
                    : "Confirm delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Metadata</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  Title
                </label>
                <Input
                  value={page.title}
                  onChange={(event) =>
                    handleMetaChange("title", event.target.value)
                  }
                  placeholder={
                    isArabicLocale ? "Arabic page title" : "Page title"
                  }
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  Slug
                </label>
                <Input
                  value={page.slug}
                  onChange={(event) =>
                    handleMetaChange(
                      "slug",
                      event.target.value.replace(/\s+/g, "-"),
                    )
                  }
                  placeholder="about"
                  disabled={isArabicLocale}
                />
                {isArabicLocale ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Localized slugs are out of scope in v1. Arabic uses the same
                    slug as English.
                  </p>
                ) : null}
              </div>
            </div>

            <Separator />

            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-foreground">
                  SEO Title
                </label>
                <Input
                  value={page.seo?.title ?? ""}
                  onChange={(event) =>
                    handleSeoChange("title", event.target.value)
                  }
                  placeholder="About Care N Tour | World-class medical travel"
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-foreground">
                  SEO Description
                </label>
                <Textarea
                  value={page.seo?.description ?? ""}
                  onChange={(event) =>
                    handleSeoChange("description", event.target.value)
                  }
                  rows={3}
                  placeholder="Short, compelling summary shown in search results."
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-foreground">
                  Open Graph Image URL
                </label>
                <Input
                  value={page.seo?.ogImage ?? ""}
                  onChange={(event) =>
                    handleSeoChange("ogImage", event.target.value)
                  }
                  placeholder="https://..."
                />
              </div>
            </div>

            {isHomePage && !isArabicLocale ? (
              <>
                <Separator />

                <div className="space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-base font-medium text-foreground">
                      Homepage Layout
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Choose whether the live Home page should use the legacy
                      homepage or the CMS homepage.
                    </p>
                  </div>

                  <div className="flex items-start justify-between gap-4 rounded-lg border border-border/60 bg-muted/20 p-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">
                        Use legacy homepage
                      </p>
                      <p className="text-xs text-muted-foreground">
                        On: visitors see the old hardcoded homepage. Only the
                        hero image override below is used.
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Off: visitors see the homepage built from CMS blocks.
                      </p>
                    </div>
                    <Switch
                      checked={useLegacyHomepageLayout}
                      onCheckedChange={handleHomeLayoutModeChange}
                      aria-label="Toggle homepage layout mode"
                    />
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-base font-medium text-foreground">
                      Homepage Hero Background
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      This image is used only when the static homepage layout
                      toggle above is on.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Upload validation enforces the same file type, size, and
                      minimum dimensions listed below. Save and publish the Home
                      page to update the live site.
                    </p>
                  </div>

                  <ImageUploader
                    label="Hero image"
                    description={HOME_HERO_IMAGE_REQUIREMENTS_TEXT}
                    value={homeHeroImageUrl}
                    onChange={handleHomeHeroImageChange}
                    bucket="media"
                    folder="cms/home-hero"
                    accept={HOME_HERO_IMAGE_REQUIREMENTS.accept}
                    acceptedMimeTypes={[
                      ...HOME_HERO_IMAGE_REQUIREMENTS.acceptedMimeTypes,
                    ]}
                    maxSizeMb={HOME_HERO_IMAGE_REQUIREMENTS.maxSizeMb}
                    minWidth={HOME_HERO_IMAGE_REQUIREMENTS.minWidth}
                    minHeight={HOME_HERO_IMAGE_REQUIREMENTS.minHeight}
                    emptyStateDescription="JPG, PNG, or WebP. Max 5MB."
                  />
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>

        <PageBuilder
          blocks={page.content}
          onChange={handleBlocksChange}
          previewKey={`${page.id}-${page.content.length}`}
          previewLocale={locale}
          previewPageSlug={page.slug}
          previewAuthToken={authToken ?? undefined}
        />

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(cmsIndexHref)}
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button
            onClick={() => save()}
            disabled={saving || !isDirty || deleting}
          >
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="mr-2 h-4 w-4" />
            )}
            Save changes
          </Button>
        </div>
      </div>
    </div>
  );
}
