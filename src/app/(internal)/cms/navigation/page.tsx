"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  ExternalLink,
  Loader2,
  Plus,
  Trash2,
  EyeOff,
  Eye,
  Pencil,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  Save,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { badgeVariants } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  adminFetch,
  useAdminInvalidate,
} from "@/components/admin/hooks/useAdminFetch";
import { useToast } from "@/hooks/use-toast";
import { type NavigationLink } from "@/lib/navigation";
import {
  resolveHomePageLayoutMode,
  sanitizeCmsPageSettings,
  type CmsPageSettings,
  type HomePageLayoutMode,
} from "@/lib/cms/pageSettings";
import { supabase } from "@/integrations/supabase/client";
import { CmsLocaleSwitcher } from "@/components/cms/CmsLocaleSwitcher";
import type { PublicLocale } from "@/i18n/routing";
import {
  buildAdminLocaleHref,
  resolveAdminLocale,
} from "@/lib/public/adminLocale";

const buildQueryKey = (locale: PublicLocale) =>
  ["cms", "navigation-links", locale] as const;
const CMS_PAGES_QUERY_KEY = ["cms", "pages"] as const;

const kindOptions: Array<{ value: NavigationLink["kind"]; label: string }> = [
  { value: "system", label: "System" },
  { value: "cms", label: "CMS" },
  { value: "manual", label: "Manual" },
];

const CREATE_DEFAULT_KIND: NavigationLink["kind"] = "manual";

const linkSchema = z.object({
  label: z.string().min(1, "Label is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers, or hyphens"),
  href: z
    .string()
    .min(1, "Href is required")
    .regex(/^\/|^https?:\/\//, "Href should start with '/' or 'http(s)://'"),
  status: z.enum(["published", "hidden", "draft"]).default("published"),
  position: z.coerce.number().int().min(0).default(0),
  kind: z.enum(["system", "cms", "manual"]).default("manual"),
  cmsPageId: z.string().uuid().nullable().optional(),
});

type LinkFormValues = z.infer<typeof linkSchema>;
type CmsPageSummary = {
  id: string;
  slug: string;
  title: string;
  status: "draft" | "published";
  settings?: CmsPageSettings | null;
  content?: unknown[];
};

const PROTECTED_KINDS = new Set<NavigationLink["kind"]>(["system"]);

function isAutoManaged(link: NavigationLink): boolean {
  return Boolean(link.cmsPageId) || link.kind === "cms";
}

const SUBMIT_ERROR_MESSAGE = "Unable to save navigation link";
const DELETE_ERROR_MESSAGE = "Unable to delete navigation link";

function useNavigationLinks(locale: PublicLocale) {
  return useQuery({
    queryKey: buildQueryKey(locale),
    queryFn: async () =>
      adminFetch<NavigationLink[]>(`/api/navigation/links?locale=${locale}`),
  });
}

function useCmsPages() {
  return useQuery<{ pages: CmsPageSummary[] }>({
    queryKey: CMS_PAGES_QUERY_KEY,
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      const response = await fetch("/api/cms/pages", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) {
        throw new Error("Failed to load CMS pages");
      }

      return response.json();
    },
  });
}

function normalizeLinksOrder(links: NavigationLink[]): NavigationLink[] {
  return links
    .slice()
    .sort((a, b) => {
      const aPosition = a.position ?? 0;
      const bPosition = b.position ?? 0;
      if (aPosition !== bPosition) {
        return aPosition - bPosition;
      }
      return a.label.localeCompare(b.label);
    })
    .map((link, index) => ({ ...link, position: index + 1 }));
}

function applySequentialPositions(links: NavigationLink[]): NavigationLink[] {
  return links.map((link, index) => ({ ...link, position: index + 1 }));
}

function swapPositions(
  list: NavigationLink[],
  sourceIndex: number,
  targetIndex: number,
): NavigationLink[] {
  if (
    sourceIndex < 0 ||
    targetIndex < 0 ||
    sourceIndex >= list.length ||
    targetIndex >= list.length
  ) {
    return list;
  }
  const next = [...list];
  [next[sourceIndex], next[targetIndex]] = [
    next[targetIndex],
    next[sourceIndex],
  ];
  return applySequentialPositions(next);
}

function moveLinkToIndex(
  list: NavigationLink[],
  linkId: string,
  targetIndex: number,
): NavigationLink[] {
  if (!list.length) {
    return list;
  }

  const clampedIndex = Math.max(0, Math.min(list.length - 1, targetIndex));
  const next = [...list];
  const currentIndex = next.findIndex((link) => link.id === linkId);

  if (currentIndex === -1) {
    return list;
  }

  const [item] = next.splice(currentIndex, 1);
  next.splice(clampedIndex, 0, item);

  return applySequentialPositions(next);
}

function linksAreEqual(a: NavigationLink[], b: NavigationLink[]): boolean {
  if (a.length !== b.length) {
    return false;
  }

  for (let index = 0; index < a.length; index += 1) {
    const current = a[index];
    const comparison = b[index];

    if (!comparison || current.id !== comparison.id) {
      return false;
    }

    if (
      current.position !== comparison.position ||
      current.status !== comparison.status ||
      current.label !== comparison.label ||
      current.href !== comparison.href ||
      current.slug !== comparison.slug ||
      current.kind !== comparison.kind ||
      current.cmsPageId !== comparison.cmsPageId
    ) {
      return false;
    }
  }

  return true;
}

export default function CmsNavigationPage() {
  const searchParams = useSearchParams();
  const locale = resolveAdminLocale(
    new URLSearchParams(searchParams.toString()),
  );
  const isArabicLocale = locale === "ar";
  const { toast } = useToast();
  const invalidate = useAdminInvalidate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<NavigationLink | null>(null);
  const [hasReorderChanges, setHasReorderChanges] = useState(false);
  const queryKey = buildQueryKey(locale);

  const navigationQuery = useNavigationLinks(locale);
  const cmsPagesQuery = useCmsPages();
  const rawLinks = navigationQuery.data;
  const [orderedLinks, setOrderedLinks] = useState<NavigationLink[]>(() =>
    normalizeLinksOrder(rawLinks ?? []),
  );

  useEffect(() => {
    if (!rawLinks) {
      return;
    }

    const nextNormalized = normalizeLinksOrder(rawLinks);

    setOrderedLinks((previous) => {
      // When a manual reorder is in progress, we keep the local state as the source of truth.
      if (hasReorderChanges) {
        return previous;
      }

      if (linksAreEqual(previous, nextNormalized)) {
        return previous;
      }

      return nextNormalized;
    });
  }, [rawLinks, hasReorderChanges]);

  const storedLinks = rawLinks ?? [];
  const links = orderedLinks;
  const homePage = cmsPagesQuery.data?.pages.find(
    (page) => page.slug === "home",
  );
  const homeLayoutMode = homePage
    ? resolveHomePageLayoutMode(
        sanitizeCmsPageSettings(homePage.settings),
        homePage.status,
        Array.isArray(homePage.content) ? homePage.content.length : 0,
      )
    : null;
  const isFirstLink = (index: number) => index === 0;
  const isLastLink = (index: number) => index === links.length - 1;

  const form = useForm<LinkFormValues>({
    resolver: zodResolver(linkSchema),
    defaultValues: {
      label: "",
      slug: "",
      href: "",
      status: "published",
      position: links.length + 1,
      kind: CREATE_DEFAULT_KIND,
      cmsPageId: null,
    },
  });

  const hasUnsavedChanges = form.formState.isDirty;

  const attemptCloseDialog = () => {
    if (!hasUnsavedChanges || window.confirm("Discard unsaved changes?")) {
      setDialogOpen(false);
    }
  };

  useEffect(() => {
    if (!dialogOpen) {
      form.reset({
        label: "",
        slug: "",
        href: "",
        status: "published",
        position: links.length + 1,
        kind: CREATE_DEFAULT_KIND,
        cmsPageId: null,
      });
      setEditing(null);
    }
  }, [dialogOpen, form, links.length]);

  const createLink = useMutation({
    mutationFn: (payload: LinkFormValues) =>
      adminFetch<NavigationLink>(`/api/navigation/links?locale=${locale}`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      toast({ title: "Navigation link created" });
      invalidate(queryKey);
      setDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: SUBMIT_ERROR_MESSAGE,
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateLink = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<LinkFormValues> }) =>
      adminFetch<NavigationLink>(
        `/api/navigation/links/${id}?locale=${locale}`,
        {
          method: "PATCH",
          body: JSON.stringify(data),
        },
      ),
    onSuccess: () => {
      toast({ title: "Navigation link updated" });
      invalidate(queryKey);
      setDialogOpen(false);
      setHasReorderChanges(false);
    },
    onError: (error) => {
      toast({
        title: SUBMIT_ERROR_MESSAGE,
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const removeLink = useMutation({
    mutationFn: (id: string) =>
      adminFetch(`/api/navigation/links/${id}?locale=${locale}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      toast({
        title: isArabicLocale
          ? "Arabic navigation translation deleted"
          : "Navigation link deleted",
      });
      invalidate(queryKey);
    },
    onError: (error) => {
      toast({
        title: DELETE_ERROR_MESSAGE,
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const mutationPending =
    navigationQuery.isFetching ||
    createLink.isPending ||
    updateLink.isPending ||
    removeLink.isPending;

  const saveReorder = useMutation({
    mutationFn: async () => {
      if (!links.length || !hasReorderChanges || isArabicLocale) {
        return;
      }

      const updates = links.map((link, index) =>
        adminFetch<NavigationLink>(
          `/api/navigation/links/${link.id}?locale=${locale}`,
          {
            method: "PATCH",
            body: JSON.stringify({ position: index + 1 }),
          },
        ),
      );
      await Promise.all(updates);
    },
    onSuccess: () => {
      toast({ title: "Navigation order saved" });
      setHasReorderChanges(false);
      invalidate(queryKey);
    },
    onError: (error: any) => {
      toast({
        title: SUBMIT_ERROR_MESSAGE,
        description: error.message ?? "Unable to save navigation order",
        variant: "destructive",
      });
    },
  });

  const handleUpdatePositionDirect = (
    linkId: string,
    targetPosition: number,
  ) => {
    setOrderedLinks((previous) =>
      moveLinkToIndex(previous, linkId, targetPosition - 1),
    );
    setHasReorderChanges(true);
  };

  const handleMove = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    setOrderedLinks((prev) => swapPositions(prev, index, targetIndex));
    setHasReorderChanges(true);
  };

  const handleResetOrder = () => {
    setOrderedLinks(normalizeLinksOrder(storedLinks));
    setHasReorderChanges(false);
  };

  const handleOpenCreate = () => {
    setEditing(null);
    form.reset({
      label: "",
      slug: "",
      href: "",
      status: "published",
      position: links.length + 1,
      kind: CREATE_DEFAULT_KIND,
      cmsPageId: null,
    });
    setDialogOpen(true);
  };

  const handleOpenEdit = (link: NavigationLink) => {
    setEditing(link);
    form.reset({
      label: link.label,
      slug: link.slug,
      href: link.href,
      status: link.status,
      position: link.position,
      kind: link.kind,
      cmsPageId: link.cmsPageId ?? null,
    });
    setDialogOpen(true);
  };

  const handleSubmit = (values: LinkFormValues) => {
    if (editing) {
      updateLink.mutate({
        id: editing.id,
        data: isArabicLocale
          ? { label: values.label, status: values.status }
          : isAutoManaged(editing)
            ? { status: values.status, position: values.position }
            : values,
      });
    } else {
      createLink.mutate(values);
    }
  };

  return (
    <div className="space-y-6">
      <CmsLocaleSwitcher
        locale={locale}
        description={
          isArabicLocale
            ? "Arabic navigation manages translated labels and publish state. New links and ordering still come from English."
            : "English manages the base navigation structure, order, and destinations."
        }
      />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Navigation links
          </h1>
          <p className="text-sm text-muted-foreground">
            {isArabicLocale
              ? "Translate and publish Arabic navigation labels for the public header and footer."
              : "Publish, hide, and reorder links that appear in the site header and footer."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={handleResetOrder}
            disabled={
              isArabicLocale || !hasReorderChanges || saveReorder.isPending
            }
          >
            Reset
          </Button>
          <Button
            onClick={handleOpenCreate}
            className="whitespace-nowrap"
            disabled={isArabicLocale}
          >
            <Plus className="mr-2 h-4 w-4" /> Add link
          </Button>
        </div>
      </div>

      <Card className="border border-border/60">
        <CardHeader className="gap-3">
          <CardTitle className="text-base">Home route status</CardTitle>
          <p className="text-sm text-muted-foreground">
            Navigation always points Home to <code>/</code>. This shows which
            homepage that route currently renders.
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {cmsPagesQuery.isLoading ? (
            <div className="flex items-center text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Checking homepage mode…
            </div>
          ) : homePage && homeLayoutMode ? (
            <>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-foreground">
                    Current renderer
                  </span>
                  <HomeLayoutModeBadge mode={homeLayoutMode} />
                  <span className="text-xs text-muted-foreground">
                    Home page is {homePage.status}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {homeLayoutMode === "cms"
                    ? "Visitors opening the Home link see the CMS block-based homepage."
                    : "Visitors opening the Home link see the legacy hardcoded homepage."}
                </p>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href={buildAdminLocaleHref("/cms/home/edit", locale)}>
                  Open Home page settings
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Home page settings are unavailable right now.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Current navigation</CardTitle>
          <Button
            onClick={() => saveReorder.mutate()}
            disabled={
              isArabicLocale || !hasReorderChanges || saveReorder.isPending
            }
          >
            {saveReorder.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save order
          </Button>
        </CardHeader>
        <CardContent>
          {navigationQuery.isLoading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading
              navigation…
            </div>
          ) : links.length === 0 ? (
            <div className="rounded-md border border-dashed border-muted p-12 text-center text-sm text-muted-foreground">
              No navigation links found. Add a link to populate the header menu.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Position</TableHead>
                  <TableHead>Label</TableHead>
                  <TableHead>Href</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Kind</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {links.map((link, index) => (
                  <TableRow
                    key={link.id}
                    className={cn(link.kind === "system" && "bg-muted/30")}
                  >
                    <TableCell className="align-middle text-sm text-muted-foreground">
                      <div className="flex items-center gap-3">
                        <div className="inline-flex min-w-[56px] items-center justify-center gap-2 rounded-md border border-dashed border-muted px-2 py-1 text-xs font-medium">
                          <ArrowUpDown className="h-3.5 w-3.5" />
                          {link.position}
                        </div>
                        <div className="flex flex-col gap-1">
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => handleMove(index, "up")}
                            disabled={
                              isArabicLocale ||
                              isFirstLink(index) ||
                              saveReorder.isPending
                            }
                          >
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => handleMove(index, "down")}
                            disabled={
                              isArabicLocale ||
                              isLastLink(index) ||
                              saveReorder.isPending
                            }
                          >
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{link.label}</span>
                        {isAutoManaged(link) ? (
                          <span className="text-xs text-muted-foreground">
                            Linked CMS page
                          </span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>{link.href}</TableCell>
                    <TableCell>{link.slug}</TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          badgeVariants({
                            variant:
                              link.status === "published"
                                ? "default"
                                : "secondary",
                          }),
                          "capitalize",
                        )}
                      >
                        {link.status}
                      </span>
                    </TableCell>
                    <TableCell className="capitalize">{link.kind}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleOpenEdit(link)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant={
                            link.status === "published"
                              ? "outline"
                              : "secondary"
                          }
                          size="icon"
                          onClick={() =>
                            updateLink.mutate({
                              id: link.id,
                              data: {
                                status:
                                  link.status === "published"
                                    ? isArabicLocale
                                      ? "draft"
                                      : "hidden"
                                    : "published",
                              },
                            })
                          }
                          disabled={updateLink.isPending}
                        >
                          {link.status === "published" ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        {!isArabicLocale &&
                        (isAutoManaged(link) ||
                          PROTECTED_KINDS.has(link.kind)) ? null : (
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => removeLink.mutate(link.id)}
                            disabled={
                              removeLink.isPending || saveReorder.isPending
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent unsaved={hasUnsavedChanges}>
          <DialogHeader>
            <DialogTitle>
              {editing
                ? isArabicLocale
                  ? "Edit Arabic navigation label"
                  : "Edit navigation link"
                : "Add navigation link"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? isArabicLocale
                  ? "Update the Arabic label and publish state for this existing navigation item."
                  : "Update titles, destinations, or publishing state."
                : "Create a new navigation link to surface a page in the header."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-4"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="label"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Label</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Plan Your Trip"
                          {...field}
                          disabled={
                            editing
                              ? !isArabicLocale && isAutoManaged(editing)
                              : false
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="plan"
                          {...field}
                          disabled={
                            isArabicLocale ||
                            (editing ? isAutoManaged(editing) : false)
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        Used for quick linking and CMS associations.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="href"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Href</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="/plan"
                          {...field}
                          disabled={
                            isArabicLocale ||
                            (editing ? isAutoManaged(editing) : false)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Order</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          {...field}
                          disabled={isArabicLocale}
                          onChange={(event) => {
                            const nextValue = Number(event.target.value);
                            field.onChange(nextValue);
                            const activeLinkId = editing?.id ?? null;
                            if (activeLinkId && Number.isFinite(nextValue)) {
                              handleUpdatePositionDirect(
                                activeLinkId,
                                nextValue,
                              );
                            }
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        Lower values appear first in the navigation.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="kind"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kind</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={
                          isArabicLocale ||
                          (editing ? isAutoManaged(editing) : false)
                        }
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {kindOptions
                            .filter((option) =>
                              editing ? true : option.value !== "cms",
                            )
                            .map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        System links are seeded by the site and generally cannot
                        be deleted.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="published">Published</SelectItem>
                          {isArabicLocale ? (
                            <SelectItem value="draft">Draft</SelectItem>
                          ) : (
                            <SelectItem value="hidden">Hidden</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={attemptCloseDialog}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={mutationPending || saveReorder.isPending}
                >
                  {mutationPending || saveReorder.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Save
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function HomeLayoutModeBadge({ mode }: { mode: HomePageLayoutMode }) {
  return (
    <span
      className={cn(
        badgeVariants({ variant: "outline" }),
        mode === "cms"
          ? "border-primary/40 bg-primary/10 text-primary-700 dark:text-primary-100"
          : "border-slate-400/40 bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-100",
      )}
    >
      {mode === "cms" ? "CMS homepage" : "Legacy homepage"}
    </span>
  );
}
