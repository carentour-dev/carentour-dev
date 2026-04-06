"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  BadgeCheck,
  BookText,
  FileClock,
  Loader2,
  Pencil,
  FolderTree,
  Plus,
  RefreshCcw,
  Search,
  Trash2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  getCategoryMeta,
  getDefaultCategories,
  sortFaqs,
  type FaqCategory,
  type FaqEntry,
} from "@/lib/faq/data";
import {
  adminFetch,
  useAdminInvalidate,
} from "@/components/admin/hooks/useAdminFetch";
import { cn } from "@/lib/utils";
import { CmsLocaleSwitcher } from "@/components/cms/CmsLocaleSwitcher";
import type { PublicLocale } from "@/i18n/routing";
import { resolveAdminLocale } from "@/lib/public/adminLocale";
import {
  WorkspaceDataTableShell,
  WorkspaceEmptyState,
  WorkspaceMetricCard,
  WorkspacePageHeader,
  WorkspacePanel,
} from "@/components/workspaces/WorkspacePrimitives";

const buildFaqQueryKey = (locale: PublicLocale) =>
  ["cms", "faqs", locale] as const;
const buildCategoryQueryKey = (locale: PublicLocale) =>
  ["cms", "faq-categories", locale] as const;

const faqFormSchema = z.object({
  category: z.string().min(1, "Category is required"),
  question: z.string().min(3, "Question is required"),
  answer: z.string().min(3, "Answer is required"),
  status: z.enum(["draft", "published"]).default("published"),
  position: z.coerce.number().int().min(0).optional(),
});

type FaqFormValues = z.infer<typeof faqFormSchema>;
const categoryFormSchema = z.object({
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers, or hyphens"),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  fragment: z.string().optional(),
  position: z.coerce.number().int().min(0).optional(),
  status: z.enum(["draft", "published"]).default("draft"),
});

type CategoryFormValues = z.infer<typeof categoryFormSchema>;
type FaqCategoryRecord = {
  slug: string;
  title: string;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
  fragment?: string | null;
  position?: number | null;
  status?: "draft" | "published";
};

function buildEmptyCategoryFormValues(
  categoryCount: number,
): CategoryFormValues {
  return {
    slug: "",
    title: "",
    description: "",
    icon: "",
    color: "",
    fragment: "",
    position: categoryCount + 1,
    status: "draft",
  };
}

function buildCategoryFormValues(
  category: FaqCategoryRecord,
): CategoryFormValues {
  return {
    slug: category.slug,
    title: category.title,
    description: category.description ?? "",
    icon: category.icon ?? "",
    color: category.color ?? "",
    fragment: category.fragment ?? "",
    position: category.position ?? 0,
    status: category.status ?? "draft",
  };
}

function normalizeCategory(raw: string): string {
  const slug = raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "general";
}

function useFaqs(locale: PublicLocale) {
  return useQuery({
    queryKey: buildFaqQueryKey(locale),
    queryFn: async () =>
      adminFetch<FaqEntry[]>(`/api/cms/faqs?locale=${locale}`),
  });
}

function useFaqCategories(locale: PublicLocale) {
  return useQuery({
    queryKey: buildCategoryQueryKey(locale),
    queryFn: async () =>
      adminFetch<FaqCategoryRecord[]>(
        `/api/cms/faq-categories?locale=${locale}`,
      ),
  });
}

function StatusBadge({ status }: { status: FaqEntry["status"] }) {
  const isPublished = status === "published";
  return (
    <Badge
      variant={isPublished ? "default" : "secondary"}
      className={cn(
        "text-xs",
        isPublished
          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-100"
          : "border border-amber-400/60 bg-amber-500/20 text-amber-900 dark:text-amber-50",
      )}
    >
      {isPublished ? "Published" : "Draft"}
    </Badge>
  );
}

function CategoryActionButtons({
  category,
  isArabicLocale,
  isDeleting,
  onEdit,
  onDelete,
}: {
  category: FaqCategoryRecord;
  isArabicLocale: boolean;
  isDeleting: boolean;
  onEdit: () => void;
  onDelete: (slug: string) => void;
}) {
  return (
    <div className="flex justify-end gap-2">
      <Button
        variant="ghost"
        size="icon"
        className="rounded-lg"
        onClick={onEdit}
      >
        <Pencil className="h-4 w-4" />
      </Button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-lg"
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isArabicLocale
                ? `Delete Arabic translation for “${category.title}”?`
                : `Delete category “${category.title}”?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isArabicLocale
                ? "This removes only the Arabic category translation. The English category and any assigned FAQs remain in place."
                : "This cannot be undone. Ensure no FAQs are assigned to this category."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onDelete(category.slug)}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function FaqActionButtons({
  faq,
  categories,
  locale,
  isDeleting,
  onSaved,
  onDelete,
  layout = "table",
}: {
  faq: FaqEntry;
  categories: FaqCategoryRecord[];
  locale: PublicLocale;
  isDeleting: boolean;
  onSaved: () => void;
  onDelete: (id: string) => void;
  layout?: "table" | "card";
}) {
  const isArabicLocale = locale === "ar";
  const isCardLayout = layout === "card";

  return (
    <div
      className={cn(
        "flex gap-2",
        isCardLayout ? "flex-wrap justify-start" : "justify-end",
      )}
    >
      <FaqFormDialog
        initialData={faq}
        onSaved={onSaved}
        trigger={
          isCardLayout ? (
            <Button variant="outline" size="sm" className="gap-2 rounded-xl">
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
          ) : (
            <Button variant="ghost" size="icon" className="rounded-lg">
              <Pencil className="h-4 w-4" />
            </Button>
          )
        }
        categories={categories}
        locale={locale}
      />
      <AlertDialog>
        <AlertDialogTrigger asChild>
          {isCardLayout ? (
            <Button
              variant="outline"
              size="sm"
              className="gap-2 rounded-xl text-destructive hover:text-destructive"
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="rounded-lg"
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isArabicLocale
                ? "Delete this Arabic FAQ translation?"
                : "Delete this FAQ?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isArabicLocale
                ? "This removes only the Arabic translation. The English FAQ stays available in the CMS."
                : "This action cannot be undone. The entry will be removed from the FAQ page."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onDelete(faq.id)}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function FaqFormDialog({
  trigger,
  initialData,
  onSaved,
  categories,
  locale,
}: {
  trigger: React.ReactNode;
  initialData?: FaqEntry | null;
  onSaved: () => void;
  categories: FaqCategoryRecord[];
  locale: PublicLocale;
}) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const isArabicLocale = locale === "ar";
  const form = useForm<FaqFormValues>({
    resolver: zodResolver(faqFormSchema),
    defaultValues: {
      category: initialData?.category ?? "general",
      question: initialData?.question ?? "",
      answer: initialData?.answer ?? "",
      status: (initialData?.status as FaqFormValues["status"]) ?? "published",
      position:
        typeof initialData?.position === "number"
          ? initialData.position
          : undefined,
    },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      category: initialData?.category ?? "general",
      question: initialData?.question ?? "",
      answer: initialData?.answer ?? "",
      status: (initialData?.status as FaqFormValues["status"]) ?? "published",
      position:
        typeof initialData?.position === "number"
          ? initialData.position
          : undefined,
    });
  }, [form, initialData, open]);

  const mutation = useMutation({
    mutationFn: async (values: FaqFormValues) => {
      const payload = {
        ...values,
        category: normalizeCategory(values.category),
      };
      if (initialData?.id) {
        return adminFetch<FaqEntry>(
          `/api/cms/faqs/${initialData.id}?locale=${locale}`,
          {
            method: "PUT",
            body: JSON.stringify(payload),
          },
        );
      }
      return adminFetch<FaqEntry>(`/api/cms/faqs?locale=${locale}`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      toast({
        title: "FAQ saved",
        description: "Your FAQ entry has been saved successfully.",
      });
      setOpen(false);
      onSaved();
    },
    onError: (error) => {
      toast({
        title: "Unable to save FAQ",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      });
    },
  });

  const hasUnsavedChanges = form.formState.isDirty;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl" unsaved={hasUnsavedChanges}>
        <DialogHeader>
          <DialogTitle>
            {initialData
              ? isArabicLocale
                ? "Edit Arabic FAQ translation"
                : "Edit FAQ entry"
              : "Add FAQ entry"}
          </DialogTitle>
          <DialogDescription>
            {isArabicLocale
              ? "Translate and publish the Arabic version of this FAQ entry."
              : "Manage frequently asked questions that power the public FAQ page."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
          >
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => {
                const options: Array<{
                  value: string;
                  meta: ReturnType<typeof getCategoryMeta>;
                }> = categories.map((category) => ({
                  value: category.slug,
                  meta: getCategoryMeta(category.slug, categories),
                }));

                if (
                  field.value &&
                  !options.some((option) => option.value === field.value)
                ) {
                  options.push({
                    value: field.value,
                    meta: getCategoryMeta(field.value, categories),
                  });
                }

                return (
                  <FormItem>
                    <FormLabel>Category (slug)</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) =>
                        field.onChange(normalizeCategory(value))
                      }
                      disabled={isArabicLocale}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {options.map((option) => (
                          <SelectItem
                            key={option.value}
                            value={option.value}
                            className="text-foreground"
                          >
                            <div className="flex flex-col">
                              <span className="font-medium text-foreground">
                                {option.meta.label}
                              </span>
                              <span className="text-xs text-foreground/80">
                                {option.value}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            <FormField
              control={form.control}
              name="question"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Question</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Add the question" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="answer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Answer</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={5}
                      placeholder="Provide a concise answer. Markdown is supported."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="published">Published</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Position</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step={1}
                        value={field.value ?? ""}
                        name={field.name}
                        onBlur={field.onBlur}
                        ref={field.ref}
                        disabled={isArabicLocale}
                        onChange={(event) =>
                          field.onChange(
                            Number.isNaN(event.target.valueAsNumber)
                              ? undefined
                              : event.target.valueAsNumber,
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="submit"
                disabled={mutation.isPending}
                className="w-full sm:w-auto"
              >
                {mutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {initialData ? "Save changes" : "Create FAQ"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function CmsFaqPage() {
  const searchParams = useSearchParams();
  const locale = resolveAdminLocale(
    new URLSearchParams(searchParams.toString()),
  );
  const isArabicLocale = locale === "ar";
  const { toast } = useToast();
  const invalidate = useAdminInvalidate();
  const faqQuery = useFaqs(locale);
  const categoryQuery = useFaqCategories(locale);
  const faqQueryKey = buildFaqQueryKey(locale);
  const categoryQueryKey = buildCategoryQueryKey(locale);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "published" | "draft"
  >("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [editingCategory, setEditingCategory] =
    useState<FaqCategoryRecord | null>(null);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) =>
      adminFetch<boolean>(`/api/cms/faqs/${id}?locale=${locale}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      toast({
        title: isArabicLocale ? "Arabic FAQ deleted" : "FAQ deleted",
        description: isArabicLocale
          ? "The Arabic translation has been removed."
          : "The FAQ entry has been removed.",
      });
      invalidate(faqQueryKey);
    },
    onError: (error) => {
      toast({
        title: "Unable to delete FAQ",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      });
    },
  });

  const categoryCreate = useMutation({
    mutationFn: async (values: CategoryFormValues) =>
      adminFetch<FaqCategoryRecord>(
        `/api/cms/faq-categories?locale=${locale}`,
        {
          method: "POST",
          body: JSON.stringify({
            ...values,
            slug: normalizeCategory(values.slug),
            icon: values.icon?.trim() || null,
            color: values.color?.trim() || null,
            fragment: values.fragment?.trim() || null,
          }),
        },
      ),
    onSuccess: () => {
      toast({
        title: "Category added",
        description: "A new FAQ category has been created.",
      });
      invalidate(categoryQueryKey);
    },
    onError: (error) => {
      toast({
        title: "Unable to add category",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      });
    },
  });

  const categoryUpdate = useMutation({
    mutationFn: async (values: CategoryFormValues & { originalSlug: string }) =>
      adminFetch<FaqCategoryRecord>(
        `/api/cms/faq-categories/${values.originalSlug}?locale=${locale}`,
        {
          method: "PUT",
          body: JSON.stringify({
            slug: normalizeCategory(values.slug),
            title: values.title,
            description: values.description ?? null,
            icon: values.icon?.trim() || null,
            color: values.color?.trim() || null,
            fragment: values.fragment?.trim() || null,
            position: values.position,
            status: values.status,
          }),
        },
      ),
    onSuccess: () => {
      toast({
        title: "Category updated",
        description: "Changes have been saved.",
      });
      setEditingCategory(null);
      invalidate(categoryQueryKey);
      invalidate(faqQueryKey);
    },
    onError: (error) => {
      toast({
        title: "Unable to update category",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      });
    },
  });

  const categoryDelete = useMutation({
    mutationFn: async (slug: string) =>
      adminFetch<boolean>(`/api/cms/faq-categories/${slug}?locale=${locale}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      toast({
        title: isArabicLocale ? "Arabic category deleted" : "Category deleted",
        description: isArabicLocale
          ? "The Arabic category translation has been removed."
          : "The category has been removed.",
      });
      invalidate(categoryQueryKey);
      invalidate(faqQueryKey);
    },
    onError: (error) => {
      toast({
        title: "Unable to delete category",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      });
    },
  });

  const categories: FaqCategoryRecord[] = useMemo(() => {
    if (categoryQuery.data && categoryQuery.data.length > 0) {
      return categoryQuery.data;
    }
    return getDefaultCategories();
  }, [categoryQuery.data]);

  const categoryForm = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: buildEmptyCategoryFormValues(categories.length),
  });

  const resetCategoryEditor = () => {
    categoryForm.reset(buildEmptyCategoryFormValues(categories.length));
    setEditingCategory(null);
  };

  useEffect(() => {
    categoryForm.reset(buildEmptyCategoryFormValues(categories.length));
    setEditingCategory(null);
  }, [categories.length, categoryForm]);

  const faqs = useMemo(() => faqQuery.data ?? [], [faqQuery.data]);

  const filteredFaqs = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    const matchesQuery = (faq: FaqEntry) => {
      if (!query) return true;
      return (
        faq.question.toLowerCase().includes(query) ||
        faq.answer.toLowerCase().includes(query)
      );
    };

    return sortFaqs(
      faqs.filter((faq) => {
        const matchesStatus =
          statusFilter === "all" ? true : faq.status === statusFilter;
        const matchesCategory =
          categoryFilter === "all"
            ? true
            : normalizeCategory(faq.category) ===
              normalizeCategory(categoryFilter);

        return matchesQuery(faq) && matchesStatus && matchesCategory;
      }),
    );
  }, [faqs, searchTerm, statusFilter, categoryFilter]);

  const stats = useMemo(() => {
    const total = faqs.length;
    const published = faqs.filter((faq) => faq.status === "published").length;
    const draft = faqs.filter((faq) => faq.status === "draft").length;
    return { total, published, draft };
  }, [faqs]);

  const handleEditCategory = (category: FaqCategoryRecord) => {
    setEditingCategory(category);
    categoryForm.reset(buildCategoryFormValues(category));
  };

  return (
    <div className="space-y-8">
      <WorkspacePageHeader
        breadcrumb="CMS"
        title="FAQ management"
        subtitle={
          isArabicLocale
            ? "Translate and publish Arabic FAQ entries and categories for the public Arabic FAQ route."
            : "Add, edit, and publish FAQs used on the public FAQ page. Content falls back to the legacy static list if no published entries exist."
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <FaqFormDialog
              onSaved={() => invalidate(faqQueryKey)}
              trigger={
                <Button className="gap-2 rounded-xl" disabled={isArabicLocale}>
                  <Plus className="h-4 w-4" />
                  Add FAQ
                </Button>
              }
              categories={categories}
              locale={locale}
            />
            <Button
              variant="outline"
              className="gap-2 rounded-xl"
              onClick={() => {
                void faqQuery.refetch();
                void categoryQuery.refetch();
              }}
              disabled={faqQuery.isFetching || categoryQuery.isFetching}
            >
              {faqQuery.isFetching || categoryQuery.isFetching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCcw className="h-4 w-4" />
              )}
              Refresh
            </Button>
          </div>
        }
      />

      <CmsLocaleSwitcher
        locale={locale}
        description={
          isArabicLocale
            ? "Arabic FAQ mode edits translation rows. New FAQs and category structure still start in English."
            : "English owns the base FAQ inventory and category structure."
        }
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <WorkspaceMetricCard
          label="FAQ entries"
          value={stats.total}
          trend={`${filteredFaqs.length} shown`}
          helperText="Entries available in the current locale."
          icon={BookText}
        />
        <WorkspaceMetricCard
          label="Published"
          value={stats.published}
          trend="Public-ready"
          helperText="Entries currently eligible for the public FAQ page."
          icon={BadgeCheck}
          emphasisTone="success"
        />
        <WorkspaceMetricCard
          label="Drafts"
          value={stats.draft}
          trend="Needs review"
          helperText="Entries still waiting for completion or approval."
          icon={FileClock}
          emphasisTone="warning"
        />
        <WorkspaceMetricCard
          label="Categories"
          value={categories.length}
          trend={
            editingCategory ? `Editing ${editingCategory.title}` : "Structure"
          }
          helperText="FAQ groupings available for assignment and translation."
          icon={FolderTree}
        />
      </div>

      <div className="grid gap-6 2xl:grid-cols-[minmax(400px,460px)_minmax(0,1fr)]">
        <WorkspacePanel
          title={
            isArabicLocale
              ? editingCategory
                ? "Edit Arabic category"
                : "Arabic category translation"
              : editingCategory
                ? "Edit category"
                : "Category editor"
          }
          description={
            isArabicLocale
              ? "Translate category titles, descriptions, and publish state for the Arabic FAQ experience."
              : "Create and maintain FAQ categories with cleaner spacing and a dedicated editing surface."
          }
          actions={
            editingCategory ? (
              <Button
                type="button"
                variant="ghost"
                className="rounded-xl"
                onClick={resetCategoryEditor}
              >
                Cancel edit
              </Button>
            ) : null
          }
          className="h-fit"
          contentClassName="space-y-6"
        >
          {isArabicLocale && !editingCategory ? (
            <div className="rounded-[1rem] border border-dashed border-border/70 bg-muted/30 p-4 text-sm leading-6 text-muted-foreground">
              Select a category from the library to translate its Arabic title,
              description, and publish state.
            </div>
          ) : null}

          <Form {...categoryForm}>
            <form
              className="space-y-6"
              onSubmit={categoryForm.handleSubmit((values) => {
                if (isArabicLocale && !editingCategory) {
                  toast({
                    title: "Select a category first",
                    description:
                      "Arabic category edits must start from an existing English category.",
                    variant: "destructive",
                  });
                  return;
                }
                const normalizedSlug = normalizeCategory(values.slug);
                const existing = categories.find(
                  (category) => category.slug === normalizedSlug,
                );
                const targetSlug = editingCategory?.slug ?? existing?.slug;
                if (targetSlug) {
                  categoryUpdate.mutate({
                    ...values,
                    slug: normalizedSlug,
                    originalSlug: targetSlug,
                  });
                } else {
                  categoryCreate.mutate({ ...values, slug: normalizedSlug });
                }
              })}
            >
              <div className="space-y-4">
                <FormField
                  control={categoryForm.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g. general, visa"
                          disabled={isArabicLocale}
                          onChange={(event) =>
                            field.onChange(
                              normalizeCategory(event.target.value),
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={categoryForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Display label" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={categoryForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (optional)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Short helper text for this category"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-[140px_minmax(0,1fr)]">
                <FormField
                  control={categoryForm.control}
                  name="position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Position</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          step={1}
                          value={field.value ?? ""}
                          disabled={isArabicLocale}
                          onChange={(event) =>
                            field.onChange(
                              Number.isNaN(event.target.valueAsNumber)
                                ? undefined
                                : event.target.valueAsNumber,
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={categoryForm.control}
                  name="icon"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Icon (Lucide name)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g. Globe, Shield, FileText"
                          disabled={isArabicLocale}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4 rounded-[1rem] border border-border/70 bg-muted/20 p-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    Optional presentation
                  </p>
                  <p className="text-xs leading-5 text-muted-foreground">
                    Configure the icon badge styling and public anchor without
                    crowding the core category fields.
                  </p>
                </div>
                <FormField
                  control={categoryForm.control}
                  name="fragment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fragment/anchor</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Overrides #anchor for this category"
                          disabled={isArabicLocale}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={categoryForm.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Color classes</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Tailwind classes for the icon badge"
                          disabled={isArabicLocale}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {isArabicLocale ? (
                <div className="max-w-[12rem]">
                  <FormField
                    control={categoryForm.control}
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
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="published">Published</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              ) : null}

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Button
                  type="submit"
                  disabled={
                    categoryCreate.isPending ||
                    categoryUpdate.isPending ||
                    (isArabicLocale && !editingCategory)
                  }
                  className="rounded-xl"
                >
                  {(categoryCreate.isPending || categoryUpdate.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isArabicLocale
                    ? editingCategory
                      ? "Save Arabic translation"
                      : "Choose a category to translate"
                    : editingCategory
                      ? "Save category"
                      : "Create category"}
                </Button>
              </div>
            </form>
          </Form>
        </WorkspacePanel>

        <WorkspacePanel
          title="Category library"
          description={
            isArabicLocale
              ? "Use the existing English category structure as the anchor for Arabic translations."
              : "Review available FAQ categories, then edit or remove them from one place."
          }
          actions={
            <div className="text-sm text-muted-foreground">
              {categoryQuery.isFetching
                ? "Loading categories..."
                : `${categories.length} categories`}
            </div>
          }
          contentClassName="space-y-0"
        >
          {categoryQuery.isError ? (
            <WorkspaceEmptyState
              title="Unable to load categories"
              description="Refresh the page or try again once the CMS API is available."
              icon={<FolderTree className="h-5 w-5" />}
            />
          ) : categories.length === 0 ? (
            <WorkspaceEmptyState
              title="No categories yet"
              description="Create a category to organize FAQs before assigning entries."
              icon={<FolderTree className="h-5 w-5" />}
            />
          ) : (
            <>
              <div className="space-y-3 2xl:hidden">
                {categories.map((category) => (
                  <div
                    key={category.slug}
                    className="rounded-[1rem] border border-border/70 bg-muted/20 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <div className="text-sm font-medium text-foreground">
                          {category.title}
                        </div>
                        <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                          {category.slug}
                        </div>
                        {category.description ? (
                          <div className="text-sm leading-6 text-muted-foreground">
                            {category.description}
                          </div>
                        ) : null}
                        {isArabicLocale ? (
                          <div className="pt-1">
                            <StatusBadge status={category.status ?? "draft"} />
                          </div>
                        ) : null}
                      </div>
                      <CategoryActionButtons
                        category={category}
                        isArabicLocale={isArabicLocale}
                        isDeleting={categoryDelete.isPending}
                        onEdit={() => handleEditCategory(category)}
                        onDelete={(slug) => categoryDelete.mutate(slug)}
                      />
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <div className="space-y-1">
                        <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                          Icon
                        </div>
                        <div className="text-sm text-foreground">
                          {category.icon || "—"}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                          Fragment
                        </div>
                        <div className="text-sm text-foreground">
                          {category.fragment || "—"}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                          Position
                        </div>
                        <div className="text-sm font-mono text-foreground">
                          {category.position ?? "—"}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden overflow-hidden rounded-[1rem] border border-border/70 2xl:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[16rem]">Title</TableHead>
                      <TableHead className="w-[10rem]">Slug</TableHead>
                      <TableHead className="w-[9rem]">Icon</TableHead>
                      <TableHead className="w-[10rem]">Fragment</TableHead>
                      <TableHead className="w-20 text-right">
                        Position
                      </TableHead>
                      <TableHead className="w-24 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((category) => (
                      <TableRow key={category.slug}>
                        <TableCell className="align-top font-medium">
                          <div className="space-y-1">
                            <div>{category.title}</div>
                            {category.description ? (
                              <div className="max-w-[24rem] text-xs leading-5 text-muted-foreground">
                                {category.description}
                              </div>
                            ) : null}
                            {isArabicLocale ? (
                              <div className="pt-1">
                                <StatusBadge
                                  status={category.status ?? "draft"}
                                />
                              </div>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {category.slug}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {category.icon || "—"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {category.fragment || "—"}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {category.position ?? "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <CategoryActionButtons
                            category={category}
                            isArabicLocale={isArabicLocale}
                            isDeleting={categoryDelete.isPending}
                            onEdit={() => handleEditCategory(category)}
                            onDelete={(slug) => categoryDelete.mutate(slug)}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </WorkspacePanel>
      </div>

      <WorkspaceDataTableShell
        title="FAQ entries"
        description="Search, filter, and update public-facing FAQ entries without leaving the CMS workspace."
        controls={
          <div className="flex w-full flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative min-w-0 flex-1 xl:max-w-[32rem]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search questions or answers..."
                className="pl-9"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center xl:ml-auto xl:flex-nowrap">
              <Select
                value={statusFilter}
                onValueChange={(value: "all" | "published" | "draft") =>
                  setStatusFilter(value)
                }
              >
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-52">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.slug} value={category.slug}>
                      {getCategoryMeta(category.slug, categories).label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        }
        isEmpty={
          !faqQuery.isLoading && !faqQuery.isError && filteredFaqs.length === 0
        }
        emptyState={
          <WorkspaceEmptyState
            title="No FAQs found"
            description="Adjust your filters or add a new FAQ entry to start populating this locale."
            icon={<BookText className="h-5 w-5" />}
            action={
              !isArabicLocale ? (
                <FaqFormDialog
                  onSaved={() => invalidate(faqQueryKey)}
                  trigger={
                    <Button className="rounded-xl">
                      <Plus className="mr-2 h-4 w-4" />
                      Add FAQ
                    </Button>
                  }
                  categories={categories}
                  locale={locale}
                />
              ) : undefined
            }
          />
        }
        footerActions={
          <span className="text-sm text-muted-foreground">
            Showing {filteredFaqs.length} of {faqs.length} FAQs
          </span>
        }
      >
        {faqQuery.isError ? (
          <WorkspaceEmptyState
            title="Unable to load FAQs"
            description="Refresh the page or try again once the CMS API is available."
            icon={<BookText className="h-5 w-5" />}
            action={
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => void faqQuery.refetch()}
              >
                Retry
              </Button>
            }
          />
        ) : (
          <>
            {faqQuery.isLoading ? (
              <div className="rounded-[1rem] border border-border/70 bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
                Loading FAQs...
              </div>
            ) : (
              <>
                <div className="space-y-3 2xl:hidden">
                  {filteredFaqs.map((faq) => {
                    const meta = getCategoryMeta(faq.category, categories);
                    return (
                      <div
                        key={faq.id}
                        className="rounded-[1rem] border border-border/70 bg-muted/20 p-4 sm:p-5"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 space-y-1">
                            <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                              Category
                            </div>
                            <div className="font-medium text-foreground">
                              {meta.label}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {faq.category}
                            </div>
                          </div>
                          <StatusBadge status={faq.status} />
                        </div>

                        <div className="mt-4 space-y-2">
                          <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                            Question
                          </div>
                          <div className="text-base font-medium leading-7 text-foreground">
                            {faq.question}
                          </div>
                        </div>

                        <div className="mt-4 space-y-2">
                          <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                            Answer
                          </div>
                          <p className="line-clamp-4 text-sm leading-6 text-muted-foreground">
                            {faq.answer}
                          </p>
                        </div>

                        <div className="mt-4 flex flex-col gap-4 rounded-[0.9rem] border border-border/60 bg-background/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="space-y-1">
                            <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                              Position
                            </div>
                            <div className="text-sm font-mono text-foreground">
                              {typeof faq.position === "number"
                                ? faq.position
                                : "—"}
                            </div>
                          </div>
                          <FaqActionButtons
                            faq={faq}
                            categories={categories}
                            locale={locale}
                            isDeleting={deleteMutation.isPending}
                            onSaved={() => invalidate(faqQueryKey)}
                            onDelete={(id) => deleteMutation.mutate(id)}
                            layout="card"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="hidden overflow-hidden rounded-[1rem] border border-border/70 2xl:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[190px]">Category</TableHead>
                        <TableHead className="min-w-[320px]">
                          Question
                        </TableHead>
                        <TableHead className="min-w-[360px]">Answer</TableHead>
                        <TableHead className="w-[110px] text-right">
                          Position
                        </TableHead>
                        <TableHead className="w-[110px] text-right">
                          Status
                        </TableHead>
                        <TableHead className="w-[120px] text-right">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredFaqs.map((faq) => {
                        const meta = getCategoryMeta(faq.category, categories);
                        return (
                          <TableRow key={faq.id}>
                            <TableCell className="align-middle">
                              <div className="flex flex-col gap-1">
                                <span className="font-medium">
                                  {meta.label}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {faq.category}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="align-top">
                              <div className="font-medium">{faq.question}</div>
                            </TableCell>
                            <TableCell className="max-w-md align-top">
                              <p className="line-clamp-3 text-sm text-muted-foreground">
                                {faq.answer}
                              </p>
                            </TableCell>
                            <TableCell className="text-right align-middle font-mono text-sm">
                              {typeof faq.position === "number"
                                ? faq.position
                                : "—"}
                            </TableCell>
                            <TableCell className="text-right align-middle">
                              <StatusBadge status={faq.status} />
                            </TableCell>
                            <TableCell className="text-right align-middle">
                              <FaqActionButtons
                                faq={faq}
                                categories={categories}
                                locale={locale}
                                isDeleting={deleteMutation.isPending}
                                onSaved={() => invalidate(faqQueryKey)}
                                onDelete={(id) => deleteMutation.mutate(id)}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </>
        )}
      </WorkspaceDataTableShell>
    </div>
  );
}
