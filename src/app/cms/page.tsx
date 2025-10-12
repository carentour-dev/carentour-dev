"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowUpRight,
  BarChart3,
  BookOpenCheck,
  Edit3,
  Layers,
  Loader2,
  Plus,
  RefreshCcw,
  Search,
  Sparkles,
  Wand2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import type { BlockValue } from "@/lib/cms/blocks";
import { cmsTemplates } from "@/lib/cms/templates";
import { BlockPreviewRenderer } from "@/components/cms/PreviewRenderer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const statusFilters = [
  { value: "all", label: "All" },
  { value: "published", label: "Published" },
  { value: "draft", label: "Drafts" },
];

const statusStyles: Record<string, string> = {
  published:
    "border border-emerald-500/40 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-100",
  draft:
    "border border-amber-500/40 bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-100",
};

type PageSummary = {
  id: string;
  slug: string;
  title: string;
  status: "draft" | "published";
  updated_at?: string;
  seo?: { title?: string; description?: string } | null;
  content?: BlockValue[];
};

type PagesResponse = {
  pages: PageSummary[];
};

export default function CmsIndexPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const { data, error, isLoading, refetch, isFetching } = useQuery<PagesResponse>({
    queryKey: ["cms-pages"],
    queryFn: async () => {
      const { data: { session } } = await (await import("@/integrations/supabase/client")).supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch("/api/cms/pages", { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!res.ok) throw new Error("Failed to load pages");
      return res.json();
    },
  });

  const pages = useMemo(() => data?.pages ?? [], [data?.pages]);

  const stats = useMemo(() => {
    const total = pages.length;
    const published = pages.filter((page) => page.status === "published").length;
    const drafts = pages.filter((page) => page.status === "draft").length;
    const needsSeo = pages.filter((page) => !(page.seo?.title && page.seo?.description)).length;
    return { total, published, drafts, needsSeo };
  }, [pages]);

  const filteredPages = useMemo(() => {
    return pages
      .filter((page) => (statusFilter === "all" ? true : page.status === statusFilter))
      .filter((page) => {
        if (!searchTerm.trim()) return true;
        const query = searchTerm.toLowerCase();
        return page.title.toLowerCase().includes(query) || page.slug.toLowerCase().includes(query);
      });
  }, [pages, statusFilter, searchTerm]);

  const recentActivity = useMemo(() => {
    return [...pages]
      .sort((a, b) => new Date(b.updated_at ?? 0).getTime() - new Date(a.updated_at ?? 0).getTime())
      .slice(0, 6);
  }, [pages]);

  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Card className="relative overflow-hidden border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-background">
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div className="space-y-2">
                <Badge className="bg-primary text-primary-foreground">Content Studio</Badge>
                <CardTitle className="text-3xl font-semibold">Welcome back to Care N Tour CMS</CardTitle>
                <p className="text-muted-foreground text-sm md:text-base max-w-2xl">
                  Craft new experiences, keep pages fresh, and monitor what needs attention all from this command center.
                </p>
              </div>
              <Button asChild size="lg">
                <Link href="/cms/new">
                  <Plus className="mr-2 h-4 w-4" /> Start a New Page
                </Link>
              </Button>
            </CardHeader>
            <CardFooter className="pt-0">
              <div className="flex flex-wrap items-center gap-4 text-xs md:text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-primary" /> Drag-and-drop blocks, reusable templates, and instant previews.
                </span>
              </div>
            </CardFooter>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <InsightCard
              title="Total Pages"
              value={stats.total}
              icon={<Layers className="h-4 w-4" />}
              helper="Across every campaign"
            />
            <InsightCard
              title="Published"
              value={stats.published}
              tone="success"
              icon={<BarChart3 className="h-4 w-4" />}
              helper="Live on the site"
            />
            <InsightCard
              title="Drafts"
              value={stats.drafts}
              tone="warning"
              icon={<Edit3 className="h-4 w-4" />}
              helper="Waiting for review"
            />
            <InsightCard
              title="Needs SEO"
              value={stats.needsSeo}
              tone="info"
              icon={<BookOpenCheck className="h-4 w-4" />}
              helper="Missing title or description"
            />
          </div>

          <Card>
            <CardHeader className="space-y-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <CardTitle className="text-xl">Page Library</CardTitle>
                  <p className="text-sm text-muted-foreground">Search, filter, and jump directly into editing.</p>
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
                    {isFetching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}Refresh
                  </Button>
                  <Button asChild size="sm" variant="secondary">
                    <Link href="/cms/new">
                      <Plus className="mr-2 h-4 w-4" /> New Page
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="relative w-full max-w-md">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search by title or slug"
                    className="pl-9"
                  />
                </div>
                <Tabs value={statusFilter} onValueChange={setStatusFilter as (value: string) => void}>
                  <TabsList>
                    {statusFilters.map((filter) => (
                      <TabsTrigger key={filter.value} value={filter.value}>
                        {filter.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <Skeleton key={index} className="h-40 rounded-xl" />
                  ))}
                </div>
              ) : error ? (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-destructive">
                  Could not load pages. Please try again.
                </div>
              ) : filteredPages.length === 0 ? (
                <div className="rounded-lg border border-dashed border-muted p-10 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <Wand2 className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold">No pages found</h3>
                  <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                    Adjust your filters or start a new page to bring fresh content online.
                  </p>
                  <div className="mt-6 flex justify-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setSearchTerm("")}>Clear search</Button>
                    <Button asChild size="sm">
                      <Link href="/cms/new">Create page</Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {filteredPages.map((page) => (
                    <PageCard key={page.id} page={page} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="h-4 w-4 text-primary" /> Templates & accelerators
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {templates.map((template) => (
                <TemplateCard key={template.slug} template={template} />
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground">Edits will appear here once you start publishing.</p>
              ) : (
                recentActivity.map((page) => (
                  <div key={page.id} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-foreground">{page.title}</span>
                      <Badge className={statusStyles[page.status] ?? "bg-muted text-muted-foreground"}>{page.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Updated {page.updated_at ? formatDistanceToNow(new Date(page.updated_at), { addSuffix: true }) : "recently"}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tips to elevate your pages</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <Tip title="Compose with blocks" description="Mix hero, stat, FAQ, and CTA blocks to tell a complete story." />
              <Separator />
              <Tip title="Preview before publishing" description="Use the live preview to validate layout and links." />
              <Separator />
              <Tip title="Collaborate with notes" description="Record final copy decisions directly in the content JSON until inline comments arrive." />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

type InsightCardProps = {
  title: string;
  value: number;
  icon: React.ReactNode;
  helper: string;
  tone?: "success" | "warning" | "info";
};

function InsightCard({ title, value, icon, helper, tone }: InsightCardProps) {
  let toneClasses = "border-border/70 bg-card/90 dark:bg-card/50";
  if (tone === "success") {
    toneClasses = "border-emerald-500/40 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-900 dark:text-emerald-100";
  } else if (tone === "warning") {
    toneClasses = "border-amber-500/40 bg-amber-500/10 dark:bg-amber-500/20 text-amber-900 dark:text-amber-100";
  } else if (tone === "info") {
    toneClasses = "border-primary/50 bg-primary/10 dark:bg-primary/20 text-primary-900 dark:text-primary-100";
  }

  return (
    <Card className={`border ${toneClasses}`}> 
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="rounded-full bg-muted/40 dark:bg-muted/20 p-2 text-muted-foreground">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold text-foreground">{value}</div>
        <p className="text-xs text-muted-foreground">{helper}</p>
      </CardContent>
    </Card>
  );
}

type PageCardProps = {
  page: PageSummary;
};

function PageCard({ page }: PageCardProps) {
  const statusClass = statusStyles[page.status] ?? "border border-border/50 bg-muted/30 text-muted-foreground";
  const blockTypes = useMemo(() => {
    const types = new Set<string>();
    if (Array.isArray(page.content)) {
      page.content.forEach((block) => {
        if (block?.type) types.add(block.type);
      });
    }
    return Array.from(types).slice(0, 4);
  }, [page.content]);

  const blockCount = Array.isArray(page.content) ? page.content.length : 0;
  const seoReady = Boolean(page.seo?.title && page.seo?.description);

  return (
    <Card className="h-full border border-border/60">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg leading-tight text-foreground">{page.title}</CardTitle>
            <p className="text-xs text-muted-foreground">/{page.slug}</p>
          </div>
          <Badge className={statusClass}>{page.status}</Badge>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="text-xs border-border/60 bg-muted/40 text-muted-foreground">
            {blockCount} block{blockCount === 1 ? "" : "s"}
          </Badge>
          <Badge
            variant="outline"
            className={cn(
              "text-xs border px-3",
              seoReady
                ? "border-emerald-500/40 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-100"
                : "border-amber-500/40 bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-100",
            )}
          >
            {seoReady ? "SEO ready" : "SEO draft"}
          </Badge>
          {blockTypes.map((type) => (
            <Badge
              key={type}
              variant="outline"
              className="text-xs capitalize border-primary/40 bg-primary/10 text-primary-700 dark:text-primary-100"
            >
              {type.replace(/([A-Z])/g, " $1").trim()}
            </Badge>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <div className="flex items-center justify-between text-xs">
          <span>Last updated</span>
          <span className="text-foreground">
            {page.updated_at
              ? formatDistanceToNow(new Date(page.updated_at), { addSuffix: true })
              : "—"}
          </span>
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between gap-2">
        <Button asChild size="sm" variant="secondary">
          <Link href={`/cms/${page.slug}/edit`}>
            <Edit3 className="mr-2 h-4 w-4" /> Edit
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          {page.status === "published" && (
            <Button asChild size="sm" variant="outline">
              <Link href={`/${page.slug}`} target="_blank" rel="noopener noreferrer">
                <ArrowUpRight className="mr-2 h-4 w-4" /> View
              </Link>
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}

type TipProps = {
  title: string;
  description: string;
};

function Tip({ title, description }: TipProps) {
  return (
    <div>
      <p className="font-medium text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

const templates = cmsTemplates;

function TemplateCard({ template }: { template: (typeof cmsTemplates)[number] }) {
  const blockTypes = useMemo(
    () => Array.from(new Set(template.blocks.map((block) => block.type))).slice(0, 6),
    [template.blocks],
  );

  return (
    <div className="rounded-lg border border-border/60 p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">{template.name}</p>
          <p className="text-xs text-muted-foreground">{template.description}</p>
        </div>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                Preview
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>{template.name}</DialogTitle>
              </DialogHeader>
              <div className="max-h-[75vh] overflow-y-auto rounded-lg border border-border/60 bg-background p-4">
                <BlockPreviewRenderer blocks={template.blocks} />
              </div>
            </DialogContent>
          </Dialog>
          <Button size="sm" variant="secondary" asChild>
            <Link href={`/cms/new?template=${encodeURIComponent(template.slug)}`}>
              Use template
            </Link>
          </Button>
        </div>
      </div>
      <TemplatePreview blocks={template.blocks} />
      <div className="flex flex-wrap gap-2">
        {blockTypes.map((type) => (
          <Badge key={type} variant="outline" className="text-[11px] capitalize">
            {type.replace(/([a-z])([A-Z])/g, "$1 $2")}
          </Badge>
        ))}
      </div>
    </div>
  );
}

function TemplatePreview({ blocks }: { blocks: BlockValue[] }) {
  const sample = useMemo(() => blocks.slice(0, Math.min(2, blocks.length)), [blocks]);

  if (!sample.length) return null;

  return (
    <div className="relative h-32 overflow-hidden rounded-md border border-border/60 bg-muted/20">
      <div className="pointer-events-none absolute inset-0 origin-top-left scale-[0.55] transform">
        <div className="min-h-full min-w-full">
          <BlockPreviewRenderer blocks={sample} />
        </div>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background via-background/40 to-transparent" />
    </div>
  );
}
