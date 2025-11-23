"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Loader2,
  Pencil,
  Plus,
  RefreshCcw,
  Search,
  Trash2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

const FAQ_QUERY_KEY = ["cms", "faqs"] as const;
const CATEGORY_QUERY_KEY = ["cms", "faq-categories"] as const;

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
};

function normalizeCategory(raw: string): string {
  const slug = raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "general";
}

function useFaqs() {
  return useQuery({
    queryKey: FAQ_QUERY_KEY,
    queryFn: async () => adminFetch<FaqEntry[]>("/api/cms/faqs"),
  });
}

function useFaqCategories() {
  return useQuery({
    queryKey: CATEGORY_QUERY_KEY,
    queryFn: async () =>
      adminFetch<FaqCategoryRecord[]>("/api/cms/faq-categories"),
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

function FaqFormDialog({
  trigger,
  initialData,
  onSaved,
  categories,
}: {
  trigger: React.ReactNode;
  initialData?: FaqEntry | null;
  onSaved: () => void;
  categories: FaqCategoryRecord[];
}) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
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
        return adminFetch<FaqEntry>(`/api/cms/faqs/${initialData.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      }
      return adminFetch<FaqEntry>("/api/cms/faqs", {
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Edit FAQ entry" : "Add FAQ entry"}
          </DialogTitle>
          <DialogDescription>
            Manage frequently asked questions that power the public FAQ page.
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
  const { toast } = useToast();
  const invalidate = useAdminInvalidate();
  const faqQuery = useFaqs();
  const categoryQuery = useFaqCategories();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "published" | "draft"
  >("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [editingCategory, setEditingCategory] =
    useState<FaqCategoryRecord | null>(null);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) =>
      adminFetch<boolean>(`/api/cms/faqs/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast({
        title: "FAQ deleted",
        description: "The FAQ entry has been removed.",
      });
      invalidate(FAQ_QUERY_KEY);
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
      adminFetch<FaqCategoryRecord>("/api/cms/faq-categories", {
        method: "POST",
        body: JSON.stringify({
          ...values,
          slug: normalizeCategory(values.slug),
          icon: values.icon?.trim() || null,
          color: values.color?.trim() || null,
          fragment: values.fragment?.trim() || null,
        }),
      }),
    onSuccess: () => {
      toast({
        title: "Category added",
        description: "A new FAQ category has been created.",
      });
      invalidate(CATEGORY_QUERY_KEY);
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
        `/api/cms/faq-categories/${values.originalSlug}`,
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
          }),
        },
      ),
    onSuccess: () => {
      toast({
        title: "Category updated",
        description: "Changes have been saved.",
      });
      setEditingCategory(null);
      invalidate(CATEGORY_QUERY_KEY);
      invalidate(FAQ_QUERY_KEY);
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
      adminFetch<boolean>(`/api/cms/faq-categories/${slug}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      toast({
        title: "Category deleted",
        description: "The category has been removed.",
      });
      invalidate(CATEGORY_QUERY_KEY);
      invalidate(FAQ_QUERY_KEY);
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
    defaultValues: {
      slug: "",
      title: "",
      description: "",
      icon: "",
      color: "",
      fragment: "",
      position: categories.length + 1,
    },
  });

  useEffect(() => {
    categoryForm.reset({
      slug: "",
      title: "",
      description: "",
      icon: "",
      color: "",
      fragment: "",
      position: categories.length + 1,
    });
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-2 border-none bg-transparent pb-0">
          <CardTitle className="text-2xl">FAQ management</CardTitle>
          <CardDescription>
            Add, edit, and publish FAQs used on the public FAQ page. Content
            falls back to the legacy static list if no published entries exist.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex flex-wrap items-center gap-3">
          <FaqFormDialog
            onSaved={() => invalidate(FAQ_QUERY_KEY)}
            trigger={
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Add FAQ
              </Button>
            }
            categories={categories}
          />
          <Button
            size="sm"
            variant="outline"
            className="gap-2"
            onClick={() => faqQuery.refetch()}
            disabled={faqQuery.isFetching}
          >
            {faqQuery.isFetching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCcw className="h-4 w-4" />
            )}
            Refresh
          </Button>
          <div className="text-sm text-muted-foreground">
            {stats.total} total · {stats.published} published · {stats.draft}{" "}
            draft
          </div>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader className="space-y-2 border-none bg-transparent pb-0">
          <CardTitle className="text-xl">Categories</CardTitle>
          <CardDescription>
            Manage FAQ categories available for assignment. Categories in use
            cannot be deleted.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="space-y-4">
            <Form {...categoryForm}>
              <form
                className="grid gap-4 md:grid-cols-2"
                onSubmit={categoryForm.handleSubmit((values) => {
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
                <FormField
                  control={categoryForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
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
                      <FormLabel>Color classes (optional)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Tailwind classes for the icon badge"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={categoryForm.control}
                  name="fragment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fragment/anchor (optional)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Overrides #anchor for this category"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="md:col-span-2">
                  <Button
                    type="submit"
                    disabled={
                      categoryCreate.isPending || categoryUpdate.isPending
                    }
                    className="w-full md:w-auto"
                  >
                    {(categoryCreate.isPending || categoryUpdate.isPending) && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {editingCategory ? "Save category" : "Add/Update category"}
                  </Button>
                  {editingCategory ? (
                    <Button
                      type="button"
                      variant="ghost"
                      className="mt-2 w-full md:mt-0 md:ml-2 md:w-auto"
                      onClick={() => {
                        categoryForm.reset({
                          slug: "",
                          title: "",
                          description: "",
                          icon: "",
                          color: "",
                          fragment: "",
                          position: categories.length + 1,
                        });
                        setEditingCategory(null);
                      }}
                    >
                      Cancel edit
                    </Button>
                  ) : null}
                </div>
              </form>
            </Form>
          </div>

          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">
              {categoryQuery.isFetching
                ? "Loading categories..."
                : `${categories.length} categories`}
            </div>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Icon</TableHead>
                    <TableHead>Fragment</TableHead>
                    <TableHead className="w-20 text-right">Position</TableHead>
                    <TableHead className="w-20 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category) => (
                    <TableRow key={category.slug}>
                      <TableCell className="font-medium">
                        {category.title}
                        {category.description ? (
                          <div className="text-xs text-muted-foreground">
                            {category.description}
                          </div>
                        ) : null}
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
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingCategory(category);
                              categoryForm.reset({
                                slug: category.slug,
                                title: category.title,
                                description: category.description ?? "",
                                icon: category.icon ?? "",
                                color: category.color ?? "",
                                fragment: category.fragment ?? "",
                                position: category.position ?? 0,
                              });
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                disabled={categoryDelete.isPending}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete category “{category.title}”?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This cannot be undone. Ensure no FAQs are
                                  assigned to this category.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    categoryDelete.mutate(category.slug)
                                  }
                                  disabled={categoryDelete.isPending}
                                >
                                  {categoryDelete.isPending ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  ) : null}
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-4 border-none bg-transparent pb-0">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <CardTitle className="text-xl">Entries</CardTitle>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search questions or answers..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(value: "all" | "published" | "draft") =>
                  setStatusFilter(value)
                }
              >
                <SelectTrigger className="w-full sm:w-36">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-48">
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
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">Category</TableHead>
                <TableHead>Question</TableHead>
                <TableHead className="hidden md:table-cell">Answer</TableHead>
                <TableHead className="w-[110px] text-right">Position</TableHead>
                <TableHead className="w-[110px] text-right">Status</TableHead>
                <TableHead className="w-[120px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {faqQuery.isLoading && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    Loading FAQs...
                  </TableCell>
                </TableRow>
              )}
              {!faqQuery.isLoading && filteredFaqs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    No FAQs found. Try adjusting your filters.
                  </TableCell>
                </TableRow>
              )}
              {filteredFaqs.map((faq) => {
                const meta = getCategoryMeta(faq.category);
                return (
                  <TableRow key={faq.id}>
                    <TableCell className="align-middle">
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">{meta.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {faq.category}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="font-medium">{faq.question}</div>
                    </TableCell>
                    <TableCell className="hidden max-w-md align-top md:table-cell">
                      <p className="line-clamp-3 text-sm text-muted-foreground">
                        {faq.answer}
                      </p>
                    </TableCell>
                    <TableCell className="text-right align-middle font-mono text-sm">
                      {typeof faq.position === "number" ? faq.position : "—"}
                    </TableCell>
                    <TableCell className="text-right align-middle">
                      <StatusBadge status={faq.status} />
                    </TableCell>
                    <TableCell className="text-right align-middle">
                      <div className="flex justify-end gap-2">
                        <FaqFormDialog
                          initialData={faq}
                          onSaved={() => invalidate(FAQ_QUERY_KEY)}
                          trigger={
                            <Button variant="ghost" size="icon">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          }
                          categories={categories}
                        />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete this FAQ?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. The entry will be
                                removed from the FAQ page.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteMutation.mutate(faq.id)}
                                disabled={deleteMutation.isPending}
                              >
                                {deleteMutation.isPending ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : null}
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="text-sm text-muted-foreground">
          Showing {filteredFaqs.length} of {faqs.length} FAQs
        </CardFooter>
      </Card>
    </div>
  );
}
