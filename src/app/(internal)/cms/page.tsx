"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowUpRight,
  BookOpenCheck,
  Edit3,
  Loader2,
  Map,
  Plus,
  RefreshCcw,
  Search,
  Wand2,
  Trash2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import type { BlockValue } from "@/lib/cms/blocks";
import {
  resolveHomePageLayoutMode,
  sanitizeCmsPageSettings,
  type CmsPageSettings,
  type HomePageLayoutMode,
} from "@/lib/cms/pageSettings";
import { cmsTemplates } from "@/lib/cms/templates";
import { TemplateBrowser } from "@/components/cms/TemplateBrowser";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CmsLocaleSwitcher } from "@/components/cms/CmsLocaleSwitcher";
import type { PublicLocale } from "@/i18n/routing";
import {
  buildAdminLocaleHref,
  resolveAdminLocale,
} from "@/lib/public/adminLocale";
import { localizePublicPathname } from "@/lib/public/routing";
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
import {
  WorkspaceDataTableShell,
  WorkspaceEmptyState,
  WorkspaceMetricCard,
  WorkspacePageHeader,
  WorkspacePanel,
  WorkspaceStatusBadge,
} from "@/components/workspaces/WorkspacePrimitives";

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
  settings?: CmsPageSettings | null;
  content?: BlockValue[];
};

type PagesResponse = {
  pages: PageSummary[];
};

type LibraryFocusFilter = "all" | "review" | "seo";

export default function CmsIndexPage() {
  const searchParams = useSearchParams();
  const locale = resolveAdminLocale(
    new URLSearchParams(searchParams.toString()),
  );
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [libraryFocusFilter, setLibraryFocusFilter] =
    useState<LibraryFocusFilter>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const libraryRef = useRef<HTMLDivElement | null>(null);
  const cmsNavigationHref = buildAdminLocaleHref("/cms/navigation", locale);
  const cmsFaqHref = buildAdminLocaleHref("/cms/faqs", locale);
  const cmsSeoHref = buildAdminLocaleHref("/cms/seo", locale);
  const cmsNewPageHref =
    locale === "ar" ? "/cms/new" : buildAdminLocaleHref("/cms/new", locale);

  const { data, error, isLoading, refetch, isFetching } =
    useQuery<PagesResponse>({
      queryKey: ["cms-pages", locale],
      queryFn: async () => {
        const {
          data: { session },
        } = await (
          await import("@/integrations/supabase/client")
        ).supabase.auth.getSession();
        const token = session?.access_token;
        const res = await fetch(`/api/cms/pages?locale=${locale}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error("Failed to load pages");
        return res.json();
      },
    });

  const pages = useMemo(() => data?.pages ?? [], [data?.pages]);

  const stats = useMemo(() => {
    const total = pages.length;
    const published = pages.filter(
      (page) => page.status === "published",
    ).length;
    const drafts = pages.filter((page) => page.status === "draft").length;
    const needsSeo = pages.filter(
      (page) => !(page.seo?.title && page.seo?.description),
    ).length;
    return { total, published, drafts, needsSeo };
  }, [pages]);

  const activeStatusFilter =
    libraryFocusFilter === "review"
      ? "draft"
      : libraryFocusFilter === "seo"
        ? "all"
        : statusFilter;

  const filteredPages = useMemo(() => {
    return pages
      .filter((page) =>
        activeStatusFilter === "all"
          ? true
          : page.status === activeStatusFilter,
      )
      .filter((page) => {
        if (libraryFocusFilter === "seo") {
          return !(page.seo?.title && page.seo?.description);
        }
        return true;
      })
      .filter((page) => {
        if (!searchTerm.trim()) return true;
        const query = searchTerm.toLowerCase();
        return (
          page.title.toLowerCase().includes(query) ||
          page.slug.toLowerCase().includes(query)
        );
      });
  }, [pages, activeStatusFilter, libraryFocusFilter, searchTerm]);

  const focusLibrary = (focus: Exclude<LibraryFocusFilter, "all">) => {
    setLibraryFocusFilter(focus);
    setSearchTerm("");
    requestAnimationFrame(() => {
      libraryRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  const clearLibraryFocus = () => {
    setLibraryFocusFilter("all");
  };

  const focusBadgeLabel =
    libraryFocusFilter === "review"
      ? "Showing draft pages that need review"
      : libraryFocusFilter === "seo"
        ? "Showing pages with missing metadata"
        : null;

  const recentActivity = useMemo(() => {
    return [...pages]
      .sort(
        (a, b) =>
          new Date(b.updated_at ?? 0).getTime() -
          new Date(a.updated_at ?? 0).getTime(),
      )
      .slice(0, 6);
  }, [pages]);

  return (
    <div className="space-y-8">
      <WorkspacePageHeader
        breadcrumb="CMS"
        title="CMS Overview"
        subtitle="Manage pages, blog content, navigation, FAQs, and SEO from one editorial workspace."
      />

      <CmsLocaleSwitcher
        locale={locale}
        description={
          locale === "ar"
            ? "Arabic mode updates the translation row for the same public URL. Create new public pages from the English base page first."
            : "English mode edits the base record used to create Arabic translations for the same public URL."
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <WorkspaceMetricCard
          label="Pages in library"
          value={stats.total}
          trend={`${filteredPages.length} shown`}
          helperText="Published and draft content across this locale."
          icon={Edit3}
        />
        <WorkspaceMetricCard
          label="Published"
          value={stats.published}
          trend="Live routes"
          helperText="Pages already visible on the public site."
          icon={ArrowUpRight}
          emphasisTone="success"
        />
        <WorkspaceMetricCard
          label="Drafts"
          value={stats.drafts}
          trend="Needs review"
          helperText="Content waiting for completion or approval."
          icon={Wand2}
          emphasisTone="warning"
          onClick={() => focusLibrary("review")}
          ariaLabel="Show draft pages that need review"
        />
        <WorkspaceMetricCard
          label="SEO follow-up"
          value={stats.needsSeo}
          trend={stats.needsSeo > 0 ? "Metadata missing" : "Coverage healthy"}
          helperText="Routes missing a title, description, or both."
          icon={BookOpenCheck}
          emphasisTone={stats.needsSeo > 0 ? "warning" : "success"}
          onClick={stats.needsSeo > 0 ? () => focusLibrary("seo") : undefined}
          ariaLabel={
            stats.needsSeo > 0 ? "Show pages with missing metadata" : undefined
          }
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.8fr)_minmax(320px,360px)] 2xl:grid-cols-[minmax(0,1.9fr)_minmax(340px,380px)]">
        <div ref={libraryRef} className="space-y-6">
          <WorkspaceDataTableShell
            title="Page Library"
            description="A calmer editorial inventory with direct paths into editing, review, and live routes."
            controls={
              <div className="flex w-full flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div className="relative min-w-0 flex-1 xl:max-w-[36rem]">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search by title or slug"
                    className="pl-9"
                  />
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center xl:ml-auto xl:flex-nowrap">
                  <Tabs
                    value={activeStatusFilter}
                    onValueChange={(value) => {
                      clearLibraryFocus();
                      setStatusFilter(value);
                    }}
                  >
                    <TabsList className="h-auto rounded-full bg-muted/40 p-1">
                      {statusFilters.map((filter) => (
                        <TabsTrigger
                          key={filter.value}
                          value={filter.value}
                          className="rounded-full px-4 py-1 text-sm"
                        >
                          {filter.label}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    onClick={() => refetch()}
                    disabled={isFetching}
                  >
                    {isFetching ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCcw className="mr-2 h-4 w-4" />
                    )}
                    Refresh
                  </Button>
                </div>
              </div>
            }
            footerActions={
              focusBadgeLabel ? (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <Badge variant="secondary" className="w-fit">
                    {focusBadgeLabel}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-fit"
                    onClick={clearLibraryFocus}
                  >
                    Clear focus
                  </Button>
                </div>
              ) : undefined
            }
            isEmpty={!isLoading && !error && filteredPages.length === 0}
            emptyState={
              <WorkspaceEmptyState
                title="No pages found"
                description="Adjust your filters or start a new page to bring fresh content online."
                icon={<Wand2 className="h-5 w-5" />}
                action={
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSearchTerm("")}
                    >
                      Clear search
                    </Button>
                    <Button asChild size="sm">
                      <Link href={cmsNewPageHref}>Create page</Link>
                    </Button>
                  </>
                }
              />
            }
          >
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <Skeleton key={index} className="h-28 rounded-[1.2rem]" />
                ))}
              </div>
            ) : error ? (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-destructive">
                Could not load pages. Please try again.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredPages.map((page) => (
                  <PageCard
                    key={page.id}
                    page={page}
                    locale={locale}
                    onDeleted={refetch}
                  />
                ))}
              </div>
            )}
          </WorkspaceDataTableShell>
        </div>

        <div className="space-y-6">
          <WorkspacePanel
            title="Publishing actions"
            description="Open the CMS tools already implemented in this workspace instead of routing through placeholder overview widgets."
            contentClassName="space-y-3"
          >
            <CmsActionRow
              title="Create page"
              description={
                locale === "ar"
                  ? "Create the English base page first, then continue translation work in Arabic mode."
                  : "Start a new page from a blank editor or template."
              }
              href={cmsNewPageHref}
              actionLabel={locale === "ar" ? "Create base page" : "New page"}
              icon={Plus}
              statusLabel="Editing"
              statusTone="default"
            />
            <CmsActionRow
              title="Navigation"
              description="Maintain header and footer route structure without leaving the CMS workspace."
              href={cmsNavigationHref}
              actionLabel="Manage"
              icon={Map}
              statusLabel="Live"
              statusTone="success"
            />
            <CmsActionRow
              title="FAQs"
              description="Update question-and-answer content used across the public site."
              href={cmsFaqHref}
              actionLabel="Manage"
              icon={Edit3}
              statusLabel="Live"
              statusTone="success"
            />
            <CmsActionRow
              title="SEO coverage"
              description="Review metadata coverage and open the dedicated SEO screen for deeper cleanup."
              href={cmsSeoHref}
              actionLabel="Open SEO"
              icon={BookOpenCheck}
              statusLabel={`${stats.needsSeo} pending`}
              statusTone={stats.needsSeo > 0 ? "warning" : "success"}
            />
          </WorkspacePanel>

          <WorkspacePanel
            title="Templates & accelerators"
            description="Start from curated structures instead of rebuilding every page from scratch."
          >
            <TemplateSidebarLauncher locale={locale} />
          </WorkspacePanel>

          <WorkspacePanel
            title="Recent activity"
            description="Latest pages updated in this locale."
            contentClassName="space-y-4"
          >
            {recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Edits will appear here once you start publishing.
              </p>
            ) : (
              recentActivity.map((page) => (
                <div key={page.id} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground">
                      {page.title}
                    </span>
                    <Badge
                      className={
                        statusStyles[page.status] ??
                        "bg-muted text-muted-foreground"
                      }
                    >
                      {page.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Updated{" "}
                    {page.updated_at
                      ? formatDistanceToNow(new Date(page.updated_at), {
                          addSuffix: true,
                        })
                      : "recently"}
                  </p>
                </div>
              ))
            )}
          </WorkspacePanel>
        </div>
      </div>
    </div>
  );
}

type CmsActionRowProps = {
  title: string;
  description: string;
  href: string;
  actionLabel: string;
  icon: LucideIcon;
  statusLabel: string;
  statusTone: "default" | "success" | "warning";
};

function CmsActionRow({
  title,
  description,
  href,
  actionLabel,
  icon: Icon,
  statusLabel,
  statusTone,
}: CmsActionRowProps) {
  return (
    <div className="flex flex-col gap-4 rounded-[1.15rem] border border-border/70 bg-background/55 p-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-border/70 bg-muted/40 text-foreground">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-foreground">{title}</p>
            <WorkspaceStatusBadge tone={statusTone}>
              {statusLabel}
            </WorkspaceStatusBadge>
          </div>
          <p className="text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
      <div className="flex justify-end">
        <Button asChild size="sm" variant="outline" className="rounded-lg">
          <Link href={href}>{actionLabel}</Link>
        </Button>
      </div>
    </div>
  );
}

type PageCardProps = {
  page: PageSummary;
  locale: PublicLocale;
  onDeleted?: () => Promise<unknown> | void;
};

function PageCard({ page, locale, onDeleted }: PageCardProps) {
  const { toast } = useToast();
  const [deleting, setDeleting] = useState(false);
  const editHref = buildAdminLocaleHref(`/cms/${page.slug}/edit`, locale);
  const viewHref = localizePublicPathname(
    page.slug === "home" ? "/" : `/${page.slug}`,
    locale,
  );
  const statusClass =
    statusStyles[page.status] ??
    "border border-border/50 bg-muted/30 text-muted-foreground";
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
  const isHomePage = page.slug === "home";
  const visibleBlockTypes = blockTypes.slice(0, 2);
  const remainingBlockTypes = Math.max(
    blockTypes.length - visibleBlockTypes.length,
    0,
  );
  const homePageLayoutMode = isHomePage
    ? resolveHomePageLayoutMode(
        sanitizeCmsPageSettings(page.settings),
        page.status,
        blockCount,
      )
    : null;

  const handleDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError) {
        throw sessionError;
      }
      const token = session?.access_token;
      const res = await fetch(`/api/cms/pages/${page.id}?locale=${locale}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        const errorBody = await res.json().catch(() => null);
        const message =
          typeof errorBody?.error === "string" && errorBody.error.trim().length
            ? errorBody.error
            : "Failed to delete page";
        throw new Error(message);
      }
      toast({
        title: "Page deleted",
        description: `“${page.title}” removed from the CMS.`,
      });
      await onDeleted?.();
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

  return (
    <Card className="border border-border/60 shadow-sm">
      <CardContent className="p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-lg leading-tight text-foreground">
                {page.title}
              </CardTitle>
              <Badge className={statusClass}>{page.status}</Badge>
              {homePageLayoutMode ? (
                <HomePageModeBadge mode={homePageLayoutMode} />
              ) : null}
            </div>

            <p className="truncate text-sm text-muted-foreground">
              /{page.slug}
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className="text-xs border-border/60 bg-muted/40 text-muted-foreground"
              >
                Updated{" "}
                {page.updated_at
                  ? formatDistanceToNow(new Date(page.updated_at), {
                      addSuffix: true,
                    })
                  : "recently"}
              </Badge>
              <Badge
                variant="outline"
                className="text-xs border-border/60 bg-muted/40 text-muted-foreground"
              >
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
              {visibleBlockTypes.map((type) => (
                <Badge
                  key={type}
                  variant="outline"
                  className="text-xs capitalize border-primary/40 bg-primary/10 text-primary-700 dark:text-primary-100"
                >
                  {type.replace(/([A-Z])/g, " $1").trim()}
                </Badge>
              ))}
              {remainingBlockTypes > 0 ? (
                <Badge
                  variant="outline"
                  className="text-xs border-border/60 bg-muted/40 text-muted-foreground"
                >
                  +{remainingBlockTypes} more
                </Badge>
              ) : null}
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2 xl:justify-end">
            <Button
              asChild
              size="sm"
              variant="secondary"
              className="rounded-lg"
            >
              <Link href={editHref}>
                <Edit3 className="mr-2 h-4 w-4" /> Edit
              </Link>
            </Button>
            {page.status === "published" && (
              <Button
                asChild
                size="sm"
                variant="outline"
                className="rounded-lg"
              >
                <Link href={viewHref} target="_blank" rel="noopener noreferrer">
                  <ArrowUpRight className="mr-2 h-4 w-4" /> View
                </Link>
              </Button>
            )}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="destructive"
                  className="rounded-lg"
                  disabled={deleting}
                >
                  {deleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                      Deleting…
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </>
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this page?</AlertDialogTitle>
                  <AlertDialogDescription>
                    {locale === "ar"
                      ? `This removes the Arabic translation for “${page.title}”. The English page remains available.`
                      : `This action permanently removes “${page.title}” and its content. You will not be able to restore it.`}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={deleting}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90 focus:ring-destructive"
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    {locale === "ar"
                      ? "Delete Arabic translation"
                      : "Confirm delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function HomePageModeBadge({ mode }: { mode: HomePageLayoutMode }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-xs border px-3",
        mode === "cms"
          ? "border-primary/40 bg-primary/10 text-primary-700 dark:text-primary-100"
          : "border-slate-400/40 bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-100",
      )}
    >
      {mode === "cms" ? "Home route: CMS" : "Home route: Legacy"}
    </Badge>
  );
}

const templates = cmsTemplates;

function TemplateSidebarLauncher({ locale }: { locale: PublicLocale }) {
  const featuredTemplates = templates.slice(0, 4);

  return (
    <div className="rounded-xl border border-border/60 bg-muted/10 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">
            Browse page starters
          </p>
          <p className="text-xs text-muted-foreground">
            Keep this sidebar compact. Open the full gallery only when you need
            to compare layouts.
          </p>
        </div>
        <Badge variant="secondary" className="shrink-0">
          {templates.length} ready
        </Badge>
      </div>

      <div className="mt-4 space-y-2">
        {featuredTemplates.map((template) => {
          const href =
            locale === "ar"
              ? `/cms/new?template=${encodeURIComponent(template.slug)}`
              : buildAdminLocaleHref(
                  `/cms/new?template=${encodeURIComponent(template.slug)}`,
                  locale,
                );

          return (
            <div
              key={template.slug}
              className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-background px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {template.name}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  /{template.defaultSlug} • {template.blocks.length} blocks
                </p>
              </div>
              <Button size="sm" variant="ghost" asChild>
                <Link href={href}>Use</Link>
              </Button>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {templates.length - featuredTemplates.length > 0
            ? `${templates.length - featuredTemplates.length} more in the gallery`
            : "All templates shown"}
        </p>
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm">Browse gallery</Button>
          </DialogTrigger>
          <DialogContent className="max-w-6xl">
            <DialogHeader>
              <DialogTitle>Template gallery</DialogTitle>
              <DialogDescription>
                Compare templates in a wider workspace, then jump straight into
                page creation.
              </DialogDescription>
            </DialogHeader>
            <TemplateBrowser locale={locale} />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
