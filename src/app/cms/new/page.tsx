"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { cmsTemplates, getTemplate } from "@/lib/cms/templates";
import { Sparkles } from "lucide-react";

export default function CmsNewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateParam = searchParams?.get("template") ?? null;
  const templateDefinition = useMemo(() => getTemplate(templateParam), [templateParam]);

  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (templateDefinition) {
      setSlug((prev) => (prev ? prev : templateDefinition.defaultSlug));
      setTitle((prev) => (prev ? prev : templateDefinition.defaultTitle));
    }
  }, [templateDefinition]);

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!slug || !title) {
      setError("Slug and title are required");
      return;
    }
    setCreating(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch("/api/cms/pages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          slug,
          title,
          status: "draft",
          content: templateDefinition?.blocks ?? [],
          seo: templateDefinition?.seo ?? {},
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({} as any));
        throw new Error(j?.error || `Failed to create: ${res.status}`);
      }
      router.push(`/cms/${slug}/edit`);
    } catch (err: any) {
      setError(err?.message || "Failed to create page");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      {templateDefinition ? (
        <Alert className="border-primary/40 bg-primary/10 dark:bg-primary/20">
          <Sparkles className="h-4 w-4 text-primary" />
          <AlertTitle className="flex items-center gap-2 text-sm">
            Template applied
            <Badge variant="secondary" className="uppercase tracking-wide">{templateDefinition.name}</Badge>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => router.push("/cms/new")}
            >
              Start from scratch
            </Button>
          </AlertTitle>
          <AlertDescription className="text-xs text-muted-foreground">
            Blocks and SEO will be pre-filled from this template. Adjust the slug and title or continue to customize in the editor.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert>
          <AlertTitle className="text-sm">Start from scratch or pick a template</AlertTitle>
          <AlertDescription className="text-xs text-muted-foreground">
            Use the templates below to jump-start your content structure.
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={onCreate} className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              New Page
              {templateDefinition ? <Badge variant="outline" className="text-xs">Using template</Badge> : null}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error ? <div className="text-sm text-destructive">{error}</div> : null}
            <div>
              <label className="block text-sm mb-1">Slug</label>
              <Input value={slug} onChange={(e) => setSlug(e.target.value.trim())} placeholder="operations" />
            </div>
            <div>
              <label className="block text-sm mb-1">Title</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Operations" />
            </div>
            <Button type="submit" disabled={creating}>
              {creating ? "Creating..." : "Create"}
            </Button>
          </CardContent>
        </Card>
      </form>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cmsTemplates.map((template) => {
          const isActive = templateDefinition?.slug === template.slug;
          return (
            <Card key={template.slug} className={isActive ? "border-primary" : "border-border/60"}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{template.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs text-muted-foreground">
                <p>{template.description}</p>
                <Button
                  type="button"
                  size="sm"
                  variant={isActive ? "default" : "secondary"}
                  onClick={() => {
                    router.push(`/cms/new?template=${encodeURIComponent(template.slug)}`);
                  }}
                >
                  {isActive ? "Selected" : "Use template"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
