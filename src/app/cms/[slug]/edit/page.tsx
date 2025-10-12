"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CalendarClock, CheckCircle2, Eye, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { PageBuilder } from "@/components/cms/editor/PageBuilder";
import { normalizeBlocks, type BlockValue } from "@/lib/cms/blocks";
import { supabase } from "@/integrations/supabase/client";

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
  content: BlockValue[];
  updated_at?: string;
};

type ApiPageResponse = {
  page: {
    id: string;
    slug: string;
    title: string;
    status: "draft" | "published";
    seo: PageSeo | null;
    content: unknown;
    updated_at?: string;
  };
};

const statusCopy: Record<PageRecord["status"], { label: string; tone: string }> = {
  draft: { label: "Draft", tone: "bg-muted text-muted-foreground" },
  published: { label: "Published", tone: "bg-emerald-100 text-emerald-700" },
};

export default function CmsEditPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const [page, setPage] = useState<PageRecord | null>(null);
  const [initialPage, setInitialPage] = useState<PageRecord | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token ?? null;
      setAuthToken(token);

      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const listRes = await fetch("/api/cms/pages", { headers });
      if (!listRes.ok) {
        setLoading(false);
        toast({ title: "Unable to load pages", variant: "destructive" });
        return;
      }
      const json = await listRes.json();
      const found = (json.pages as Array<{ slug: string; id: string }>).find((p) => p.slug === params.slug);
      if (!found) {
        setLoading(false);
        toast({ title: "Page not found", variant: "destructive" });
        return;
      }
      const detailRes = await fetch(`/api/cms/pages/${found.id}`, { headers });
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
        content: normalizeBlocks(detail.page.content) as BlockValue[],
        updated_at: detail.page.updated_at,
      };
      setPage(normalized);
      setInitialPage(normalized);
      setLoading(false);
    };

    load();
  }, [params.slug, toast]);

  const isDirty = useMemo(() => {
    if (!page || !initialPage) return false;
    const current = JSON.stringify({ ...page });
    const initial = JSON.stringify({ ...initialPage });
    return current !== initial;
  }, [page, initialPage]);

  const handleMetaChange = <K extends keyof PageRecord>(key: K, value: PageRecord[K]) => {
    setPage((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleSeoChange = <K extends keyof PageSeo>(key: K, value: PageSeo[K]) => {
    setPage((prev) => (prev ? { ...prev, seo: { ...(prev.seo ?? {}), [key]: value } } : prev));
  };

  const handleBlocksChange = (blocks: BlockValue[]) => {
    setPage((prev) => (prev ? { ...prev, content: blocks } : prev));
  };

  const save = async (nextStatus?: PageRecord["status"]) => {
    if (!page) return false;
    setSaving(true);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        throw sessionError;
      }
      const freshToken = session?.access_token ?? null;
      setAuthToken(freshToken);

      const targetStatus = nextStatus ?? page.status;
      const payload = {
        ...page,
        status: targetStatus,
        seo: page.seo ?? {},
        content: page.content,
      };
      const res = await fetch(`/api/cms/pages/${page.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(freshToken ? { Authorization: `Bearer ${freshToken}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Failed to save page");
      }

      const data = (await res.json()) as ApiPageResponse;
      const normalized: PageRecord = {
        id: data.page.id,
        slug: data.page.slug,
        title: data.page.title,
        status: data.page.status,
        seo: data.page.seo ?? {},
        content: normalizeBlocks(data.page.content) as BlockValue[],
        updated_at: data.page.updated_at,
      };
      setPage(normalized);
      setInitialPage(normalized);
      toast({
        title:
          targetStatus === "published"
            ? "Page published"
            : targetStatus === "draft" && page.status === "published"
              ? "Page hidden from site"
              : "Changes saved",
        description:
          targetStatus === "draft" && page.status === "published"
            ? "Visitors will no longer see this page until it is published again."
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

  const handlePreview = async () => {
    if (!page) return;
    if (!authToken) {
      toast({ title: "Preview unavailable", description: "Sign in again to refresh your session.", variant: "destructive" });
      return;
    }
    const success = await save();
    if (success) {
      const url = `/cms/preview/${page.slug}?token=${encodeURIComponent(authToken)}`;
      window.open(url, "_blank", "noopener,noreferrer");
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
          <Link href="/cms">Return to CMS</Link>
        </Button>
      </div>
    );
  }

  const statusMeta = statusCopy[page.status];

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Button asChild variant="ghost" size="sm" className="-ml-3">
              <Link href="/cms">
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
          <h1 className="text-3xl font-semibold text-foreground">Editing “{page.title}”</h1>
          <p className="text-sm text-muted-foreground">
            Configure SEO metadata, reorder sections, and fine-tune block content before publishing.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handlePreview}
            disabled={saving || !authToken}
          >
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Eye className="mr-2 h-4 w-4" />}
            Preview
          </Button>
          <Button
            variant="secondary"
            onClick={() => save("draft")}
            disabled={saving || (!isDirty && page.status !== "published")}
          >
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
            {page.status === "published" ? "Unpublish" : "Save Draft"}
          </Button>
          <Button
            onClick={() => save("published")}
            disabled={saving || (!isDirty && page.status === "published")}
          >
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
            Publish
          </Button>
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
                <label className="mb-2 block text-sm font-medium text-foreground">Title</label>
                <Input
                  value={page.title}
                  onChange={(event) => handleMetaChange("title", event.target.value)}
                  placeholder="Page title"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Slug</label>
                <Input
                  value={page.slug}
                  onChange={(event) => handleMetaChange("slug", event.target.value.replace(/\s+/g, "-"))}
                  placeholder="about"
                />
              </div>
            </div>

            <Separator />

            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-foreground">SEO Title</label>
                <Input
                  value={page.seo?.title ?? ""}
                  onChange={(event) => handleSeoChange("title", event.target.value)}
                  placeholder="About Care N Tour | World-class medical travel"
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-foreground">SEO Description</label>
                <Textarea
                  value={page.seo?.description ?? ""}
                  onChange={(event) => handleSeoChange("description", event.target.value)}
                  rows={3}
                  placeholder="Short, compelling summary shown in search results."
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-foreground">Open Graph Image URL</label>
                <Input
                  value={page.seo?.ogImage ?? ""}
                  onChange={(event) => handleSeoChange("ogImage", event.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <PageBuilder
          blocks={page.content}
          onChange={handleBlocksChange}
          previewKey={`${page.id}-${page.content.length}`}
        />

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => router.push("/cms")}>Cancel</Button>
          <Button onClick={() => save()} disabled={saving || !isDirty}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
            Save changes
          </Button>
        </div>
      </div>
    </div>
  );
}
