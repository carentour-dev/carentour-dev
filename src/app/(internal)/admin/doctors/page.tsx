"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Badge } from "@/components/ui/badge";
import { ImageUploader } from "@/components/admin/ImageUploader";
import {
  adminFetch,
  useAdminInvalidate,
} from "@/components/admin/hooks/useAdminFetch";
import {
  WorkspacePageHeader,
  WorkspacePanel,
} from "@/components/workspaces/WorkspacePrimitives";
import { CmsLocaleSwitcher } from "@/components/cms/CmsLocaleSwitcher";
import { Loader2, Pencil, PlusCircle, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { PublicLocale } from "@/i18n/routing";
import { resolveAdminLocale } from "@/lib/public/adminLocale";

const urlSchema = z
  .string()
  .trim()
  .refine(
    (value) =>
      value.length === 0 ||
      value.startsWith("http://") ||
      value.startsWith("https://") ||
      value.startsWith("/"),
    {
      message: "Invalid URL",
    },
  );

const doctorSchema = z.object({
  name: z.string().min(2, "Name is required"),
  title: z.string().min(2, "Title is required"),
  specialization: z.string().min(2, "Specialization is required"),
  bio: z.string().optional(),
  experience_years: z.coerce.number().int().min(0),
  education: z.string().min(2, "Education is required"),
  languages_input: z.string().optional(),
  achievements_input: z.string().optional(),
  certifications_input: z.string().optional(),
  patient_rating: z.coerce.number().min(0).max(5).optional(),
  total_reviews: z.coerce.number().int().min(0).optional(),
  successful_procedures: z.coerce.number().int().min(0).optional(),
  research_publications: z.coerce.number().int().min(0).optional(),
  is_active: z.boolean().optional(),
  avatar_url: urlSchema.nullable().optional(),
});

const arabicDoctorSchema = z.object({
  status: z.enum(["draft", "published"]).default("draft"),
  name: z.string().optional(),
  title: z.string().optional(),
  specialization: z.string().optional(),
  bio: z.string().optional(),
  education: z.string().optional(),
  languages_input: z.string().optional(),
  achievements_input: z.string().optional(),
  certifications_input: z.string().optional(),
});

type DoctorFormValues = z.infer<typeof doctorSchema>;
type ArabicDoctorFormValues = z.infer<typeof arabicDoctorSchema>;

type DoctorPayload = {
  name: string;
  title: string;
  specialization: string;
  bio?: string;
  experience_years: number;
  education: string;
  languages?: string[];
  achievements?: string[];
  certifications?: string[];
  patient_rating?: number;
  total_reviews?: number;
  successful_procedures?: number;
  research_publications?: number;
  is_active?: boolean;
  avatar_url?: string | null;
};

type ArabicDoctorPayload = {
  status: "draft" | "published";
  name?: string;
  title?: string;
  specialization?: string;
  bio?: string;
  education?: string;
  languages?: string[];
  achievements?: string[];
  certifications?: string[];
};

type DoctorRecord = DoctorPayload & {
  id: string;
  languages?: string[] | null;
  achievements?: string[] | null;
  certifications?: string[] | null;
  is_active?: boolean | null;
  translation?: {
    exists: boolean;
    locale: "ar";
    status: "draft" | "published" | null;
    is_stale: boolean;
    source_updated_at: string | null;
    updated_at: string | null;
    name: string | null;
    title: string | null;
    specialization: string | null;
    bio: string | null;
    education: string | null;
    languages: string[];
    achievements: string[];
    certifications: string[];
  };
};

const buildDoctorsQueryKey = (locale: PublicLocale) =>
  ["admin", "doctors", locale] as const;

const createDefaultDoctorValues = (): DoctorFormValues => ({
  name: "",
  title: "",
  specialization: "",
  bio: "",
  experience_years: 0,
  education: "",
  languages_input: "",
  achievements_input: "",
  certifications_input: "",
  patient_rating: undefined,
  total_reviews: undefined,
  successful_procedures: undefined,
  research_publications: undefined,
  is_active: true,
  avatar_url: null,
});

const createDefaultArabicValues = (): ArabicDoctorFormValues => ({
  status: "draft",
  name: "",
  title: "",
  specialization: "",
  bio: "",
  education: "",
  languages_input: "",
  achievements_input: "",
  certifications_input: "",
});

const splitListInput = (value?: string | null) =>
  value
    ?.split(",")
    .map((entry) => entry.trim())
    .filter(Boolean) ?? [];

const formatTranslationSourceDate = (value: string | null | undefined) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const resolveTranslationBadge = (doctor: DoctorRecord) => {
  const translation = doctor.translation;
  if (!translation?.exists) {
    return {
      label: "No Arabic translation",
      className: "border-dashed text-muted-foreground",
    };
  }

  if (translation.is_stale) {
    return {
      label:
        translation.status === "published"
          ? "Published, stale"
          : "Draft, stale",
      className: "border-amber-500/60 text-amber-700",
    };
  }

  if (translation.status === "published") {
    return {
      label: "Published",
      className: "border-emerald-500/60 text-emerald-700",
    };
  }

  return {
    label: "Draft",
    className: "border-sky-500/60 text-sky-700",
  };
};

function EnglishSourceValue({
  label,
  value,
}: {
  label: string;
  value: string | string[] | null | undefined;
}) {
  const renderedValue = Array.isArray(value)
    ? value.filter(Boolean).join(", ")
    : value;

  return (
    <div className="rounded-md border border-dashed border-border/70 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
      <span className="font-medium text-foreground">{label}:</span>{" "}
      {renderedValue && renderedValue.length > 0
        ? renderedValue
        : "No English source content yet."}
    </div>
  );
}

function ArabicDoctorTranslationForm({
  form,
  doctor,
  onSubmit,
  onCancel,
  saving,
}: {
  form: UseFormReturn<ArabicDoctorFormValues>;
  doctor: DoctorRecord | null;
  onSubmit: (values: ArabicDoctorFormValues) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const translationBadge = doctor ? resolveTranslationBadge(doctor) : null;
  const staleDate = formatTranslationSourceDate(
    doctor?.translation?.source_updated_at,
  );

  const submitWithStatus = (status: "draft" | "published") => {
    form.setValue("status", status, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
    void form.handleSubmit(onSubmit)();
  };

  if (!doctor) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
          Arabic mode edits existing doctor translations only. Pick a doctor
          from the directory to add or update public Arabic content.
        </div>
        <div className="flex justify-end">
          <Button type="button" variant="ghost" onClick={onCancel}>
            Close
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-muted/10 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{doctor.name}</Badge>
            {translationBadge ? (
              <Badge variant="outline" className={translationBadge.className}>
                {translationBadge.label}
              </Badge>
            ) : null}
          </div>
          <p className="text-sm text-muted-foreground">
            English source remains the system record. Arabic mode edits the
            translated public copy only.
          </p>
        </div>

        {doctor.translation?.is_stale ? (
          <div className="rounded-lg border border-amber-400/70 bg-amber-500/10 p-4 text-sm text-amber-900">
            The English source changed{staleDate ? ` on ${staleDate}` : ""}.
            Review and republish the Arabic translation when ready.
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <EnglishSourceValue label="English name" value={doctor.name} />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Arabic name</FormLabel>
                  <Input dir="rtl" placeholder="د. ليلى خليل" {...field} />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-3">
            <EnglishSourceValue label="English title" value={doctor.title} />
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Arabic title</FormLabel>
                  <Input
                    dir="rtl"
                    placeholder="استشارية طب العيون"
                    {...field}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="space-y-3">
          <EnglishSourceValue
            label="English specialization"
            value={doctor.specialization}
          />
          <FormField
            control={form.control}
            name="specialization"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Arabic specialization</FormLabel>
                <Input
                  dir="rtl"
                  placeholder="جراحة الانكسار والمياه البيضاء"
                  {...field}
                />
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-3">
          <EnglishSourceValue
            label="English education"
            value={doctor.education}
          />
          <FormField
            control={form.control}
            name="education"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Arabic education</FormLabel>
                <Input dir="rtl" placeholder="زمالة جونز هوبكنز" {...field} />
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-3">
          <EnglishSourceValue label="English biography" value={doctor.bio} />
          <FormField
            control={form.control}
            name="bio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Arabic biography</FormLabel>
                <Textarea
                  dir="rtl"
                  rows={4}
                  placeholder="نبذة مختصرة تظهر في الصفحات العامة."
                  {...field}
                />
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-3">
          <EnglishSourceValue
            label="English languages"
            value={doctor.languages}
          />
          <FormField
            control={form.control}
            name="languages_input"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Arabic languages</FormLabel>
                <FormDescription>Comma separated list.</FormDescription>
                <Input dir="rtl" {...field} />
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <EnglishSourceValue
              label="English achievements"
              value={doctor.achievements}
            />
            <FormField
              control={form.control}
              name="achievements_input"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Arabic achievements</FormLabel>
                  <FormDescription>Comma separated list.</FormDescription>
                  <Input dir="rtl" {...field} />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-3">
            <EnglishSourceValue
              label="English certifications"
              value={doctor.certifications}
            />
            <FormField
              control={form.control}
              name="certifications_input"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Arabic certifications</FormLabel>
                  <FormDescription>Comma separated list.</FormDescription>
                  <Input dir="rtl" {...field} />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={saving}
            onClick={() => submitWithStatus("draft")}
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save draft
          </Button>
          <Button
            type="button"
            disabled={saving}
            onClick={() => submitWithStatus("published")}
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Publish Arabic
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default function AdminDoctorsPage() {
  const searchParams = useSearchParams();
  const locale = resolveAdminLocale(searchParams);
  const isArabicLocale = locale === "ar";
  const [search, setSearch] = useState("");
  const [specializationFilter, setSpecializationFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<DoctorRecord | null>(null);
  const invalidate = useAdminInvalidate();
  const { toast } = useToast();

  const form = useForm<DoctorFormValues>({
    resolver: zodResolver(doctorSchema),
    defaultValues: createDefaultDoctorValues(),
  });
  const arabicForm = useForm<ArabicDoctorFormValues>({
    resolver: zodResolver(arabicDoctorSchema),
    defaultValues: createDefaultArabicValues(),
  });

  const doctorsQuery = useQuery({
    queryKey: buildDoctorsQueryKey(locale),
    queryFn: () =>
      adminFetch<DoctorRecord[]>(`/api/admin/doctors?locale=${locale}`),
  });

  const createDoctor = useMutation({
    mutationFn: (payload: DoctorPayload) =>
      adminFetch<DoctorRecord>(`/api/admin/doctors?locale=${locale}`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: (_doctor, payload) => {
      invalidate(buildDoctorsQueryKey(locale));
      closeDialog();
      toast({
        title: "Doctor created",
        description: `${payload?.name ?? "Doctor"} is now visible in the directory`,
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to create doctor",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateDoctor = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: DoctorPayload | ArabicDoctorPayload;
    }) =>
      adminFetch<DoctorRecord>(`/api/admin/doctors/${id}?locale=${locale}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (doctor) => {
      invalidate(buildDoctorsQueryKey(locale));
      closeDialog();
      toast({
        title: isArabicLocale ? "Arabic translation updated" : "Doctor updated",
        description: isArabicLocale
          ? `${doctor.name} Arabic public copy has been saved.`
          : `${doctor.name} has been updated`,
      });
    },
    onError: (error) => {
      toast({
        title: isArabicLocale
          ? "Failed to update Arabic translation"
          : "Failed to update doctor",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteDoctor = useMutation({
    mutationFn: (id: string) =>
      adminFetch(`/api/admin/doctors/${id}?locale=${locale}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      invalidate(buildDoctorsQueryKey(locale));
      toast({
        title: isArabicLocale ? "Arabic translation removed" : "Doctor removed",
        description: isArabicLocale
          ? "The Arabic doctor translation has been deleted."
          : "The doctor profile has been deleted.",
      });
    },
    onError: (error) => {
      toast({
        title: isArabicLocale
          ? "Failed to delete Arabic translation"
          : "Failed to delete doctor",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const specializations = useMemo(() => {
    if (!doctorsQuery.data) return [] as string[];
    return Array.from(
      new Set(doctorsQuery.data.map((doctor) => doctor.specialization)),
    ).sort();
  }, [doctorsQuery.data]);

  const filteredDoctors = useMemo(() => {
    if (!doctorsQuery.data) return [] as DoctorRecord[];

    return doctorsQuery.data.filter((doctor) => {
      const translationSearch = isArabicLocale
        ? [
            doctor.translation?.name,
            doctor.translation?.title,
            doctor.translation?.specialization,
          ]
        : [];
      const matchesSearch = [
        doctor.name,
        doctor.title,
        doctor.specialization,
        ...translationSearch,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesSpecialization =
        specializationFilter === "all" ||
        doctor.specialization === specializationFilter;

      return matchesSearch && matchesSpecialization;
    });
  }, [doctorsQuery.data, isArabicLocale, search, specializationFilter]);

  const openCreateDialog = () => {
    if (isArabicLocale) {
      return;
    }

    setEditingDoctor(null);
    form.reset(createDefaultDoctorValues());
    setDialogOpen(true);
  };

  const openEditDialog = (doctor: DoctorRecord) => {
    setEditingDoctor(doctor);

    if (isArabicLocale) {
      arabicForm.reset({
        status: doctor.translation?.status ?? "draft",
        name: doctor.translation?.name ?? "",
        title: doctor.translation?.title ?? "",
        specialization: doctor.translation?.specialization ?? "",
        bio: doctor.translation?.bio ?? "",
        education: doctor.translation?.education ?? "",
        languages_input: (doctor.translation?.languages ?? []).join(", "),
        achievements_input: (doctor.translation?.achievements ?? []).join(", "),
        certifications_input: (doctor.translation?.certifications ?? []).join(
          ", ",
        ),
      });
    } else {
      form.reset({
        name: doctor.name,
        title: doctor.title,
        specialization: doctor.specialization,
        bio: doctor.bio ?? "",
        experience_years: doctor.experience_years,
        education: doctor.education ?? "",
        languages_input: (doctor.languages ?? []).join(", "),
        achievements_input: (doctor.achievements ?? []).join(", "),
        certifications_input: (doctor.certifications ?? []).join(", "),
        patient_rating: doctor.patient_rating,
        total_reviews: doctor.total_reviews,
        successful_procedures: doctor.successful_procedures ?? undefined,
        research_publications: doctor.research_publications ?? undefined,
        is_active: doctor.is_active ?? true,
        avatar_url: doctor.avatar_url ?? null,
      });
    }

    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingDoctor(null);
    form.reset(createDefaultDoctorValues());
    arabicForm.reset(createDefaultArabicValues());
  };

  const hasUnsavedChanges = isArabicLocale
    ? arabicForm.formState.isDirty
    : form.formState.isDirty;

  const attemptCloseDialog = () => {
    if (!hasUnsavedChanges || window.confirm("Discard unsaved changes?")) {
      closeDialog();
    }
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      closeDialog();
      return;
    }

    setDialogOpen(true);
  };

  const onSubmitEnglish = (values: DoctorFormValues) => {
    const payload: DoctorPayload = {
      name: values.name.trim(),
      title: values.title.trim(),
      specialization: values.specialization.trim(),
      bio: values.bio?.trim() || undefined,
      experience_years: values.experience_years,
      education: values.education.trim(),
      languages: splitListInput(values.languages_input),
      achievements: splitListInput(values.achievements_input),
      certifications: splitListInput(values.certifications_input),
      patient_rating: values.patient_rating,
      total_reviews: values.total_reviews,
      successful_procedures: values.successful_procedures,
      research_publications: values.research_publications,
      is_active: values.is_active ?? true,
      avatar_url: values.avatar_url?.trim()
        ? values.avatar_url.trim()
        : undefined,
    };

    if (editingDoctor) {
      updateDoctor.mutate({ id: editingDoctor.id, data: payload });
    } else {
      createDoctor.mutate(payload);
    }
  };

  const onSubmitArabic = (values: ArabicDoctorFormValues) => {
    if (!editingDoctor) {
      return;
    }

    const payload: ArabicDoctorPayload = {
      status: values.status,
      name: values.name?.trim() || undefined,
      title: values.title?.trim() || undefined,
      specialization: values.specialization?.trim() || undefined,
      bio: values.bio?.trim() || undefined,
      education: values.education?.trim() || undefined,
      languages: splitListInput(values.languages_input),
      achievements: splitListInput(values.achievements_input),
      certifications: splitListInput(values.certifications_input),
    };

    updateDoctor.mutate({ id: editingDoctor.id, data: payload });
  };

  const dialogTitle = isArabicLocale
    ? editingDoctor
      ? "Edit Arabic doctor translation"
      : "Arabic doctor translations"
    : editingDoctor
      ? "Edit Doctor"
      : "Add Doctor";
  const dialogDescription = isArabicLocale
    ? "Update the Arabic public copy for this doctor without changing the English system record."
    : "Provide credentials and profile details. You can refine the record later with additional data.";

  return (
    <div className="space-y-8">
      <WorkspacePageHeader
        breadcrumb="Admin"
        title="Doctors"
        subtitle="Manage medical experts, clinical experience, and public doctor translations."
        actions={
          !isArabicLocale ? (
            <Button size="sm" onClick={openCreateDialog}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Doctor
            </Button>
          ) : undefined
        }
      />

      <CmsLocaleSwitcher locale={locale} />

      <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="max-w-2xl" unsaved={hasUnsavedChanges}>
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>{dialogDescription}</DialogDescription>
          </DialogHeader>

          {isArabicLocale ? (
            <ArabicDoctorTranslationForm
              form={arabicForm}
              doctor={editingDoctor}
              onSubmit={onSubmitArabic}
              onCancel={attemptCloseDialog}
              saving={updateDoctor.isPending}
            />
          ) : (
            <Form {...form}>
              <form
                className="grid gap-4"
                onSubmit={form.handleSubmit(onSubmitEnglish)}
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <Input placeholder="Dr. Layla Khalil" {...field} />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <Input placeholder="Chief Ophthalmologist" {...field} />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="specialization"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Specialization</FormLabel>
                        <Input placeholder="Refractive Surgery" {...field} />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="experience_years"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Experience (years)</FormLabel>
                        <Input
                          type="number"
                          min={0}
                          {...field}
                          onChange={(event) =>
                            field.onChange(Number(event.target.value))
                          }
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="education"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Education</FormLabel>
                      <Input
                        placeholder="Johns Hopkins Fellowship"
                        {...field}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Biography</FormLabel>
                      <Textarea
                        rows={3}
                        placeholder="Short overview shown on doctor profiles."
                        {...field}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="languages_input"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Languages</FormLabel>
                      <FormDescription>
                        Comma separated list (e.g. English, Arabic).
                      </FormDescription>
                      <Input {...field} />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="achievements_input"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Achievements</FormLabel>
                        <FormDescription>
                          Comma separated (e.g. 1,500+ surgeries).
                        </FormDescription>
                        <Input {...field} />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="certifications_input"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Certifications</FormLabel>
                        <FormDescription>
                          Comma separated (e.g. Board Certified).
                        </FormDescription>
                        <Input {...field} />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="patient_rating"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Patient rating</FormLabel>
                        <Input
                          type="number"
                          min={0}
                          max={5}
                          step="0.1"
                          {...field}
                          onChange={(event) =>
                            field.onChange(Number(event.target.value))
                          }
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="total_reviews"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total reviews</FormLabel>
                        <Input
                          type="number"
                          min={0}
                          {...field}
                          onChange={(event) =>
                            field.onChange(Number(event.target.value))
                          }
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="successful_procedures"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total procedures</FormLabel>
                        <Input
                          type="number"
                          min={0}
                          {...field}
                          onChange={(event) =>
                            field.onChange(Number(event.target.value))
                          }
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="research_publications"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Research publications</FormLabel>
                        <Input
                          type="number"
                          min={0}
                          {...field}
                          onChange={(event) =>
                            field.onChange(Number(event.target.value))
                          }
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        value={(field.value ?? true) ? "active" : "inactive"}
                        onValueChange={(value) =>
                          field.onChange(value === "active")
                        }
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="avatar_url"
                  render={({ field }) => (
                    <FormItem>
                      <ImageUploader
                        label="Profile photo"
                        description="Upload a square image for best results."
                        value={field.value ?? ""}
                        onChange={(url) => field.onChange(url ?? null)}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={attemptCloseDialog}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createDoctor.isPending || updateDoctor.isPending}
                  >
                    {(createDoctor.isPending || updateDoctor.isPending) && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {editingDoctor ? "Save changes" : "Create doctor"}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>

      <WorkspacePanel
        title={isArabicLocale ? "Doctor translations" : "Doctor directory"}
        actions={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
            <Input
              placeholder={
                isArabicLocale
                  ? "Search doctors or translations..."
                  : "Search doctors..."
              }
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-11 rounded-xl bg-background/85 sm:w-[280px]"
            />
            <Select
              value={specializationFilter}
              onValueChange={setSpecializationFilter}
            >
              <SelectTrigger className="h-11 rounded-xl bg-background/85 sm:w-[180px]">
                <SelectValue placeholder="Filter specialization" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {specializations.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      >
        {doctorsQuery.isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name &amp; Title</TableHead>
                <TableHead>Specialization</TableHead>
                <TableHead>
                  {isArabicLocale ? "Arabic status" : "Experience"}
                </TableHead>
                <TableHead>{isArabicLocale ? "Source" : "Rating"}</TableHead>
                <TableHead className="w-32 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDoctors.map((doctor) => {
                const translationBadge = resolveTranslationBadge(doctor);
                const sourceDate = formatTranslationSourceDate(
                  doctor.translation?.source_updated_at,
                );

                return (
                  <TableRow key={doctor.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">
                          {doctor.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {doctor.title}
                        </span>
                        {isArabicLocale && doctor.translation?.name ? (
                          <span className="text-xs text-muted-foreground">
                            Arabic: {doctor.translation.name}
                          </span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{doctor.specialization}</Badge>
                    </TableCell>
                    <TableCell>
                      {isArabicLocale ? (
                        <Badge
                          variant="outline"
                          className={translationBadge.className}
                        >
                          {translationBadge.label}
                        </Badge>
                      ) : (
                        `${doctor.experience_years} yrs`
                      )}
                    </TableCell>
                    <TableCell>
                      {isArabicLocale
                        ? sourceDate || "Base record unchanged"
                        : typeof doctor.patient_rating === "number"
                          ? `${doctor.patient_rating.toFixed(1)}/5`
                          : "—"}
                    </TableCell>
                    <TableCell className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(doctor)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        disabled={deleteDoctor.isPending}
                        onClick={() => deleteDoctor.mutate(doctor.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}

              {filteredDoctors.length === 0 && !doctorsQuery.isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    {isArabicLocale
                      ? "No doctors found. Adjust filters or add English doctor records first."
                      : "No doctors found. Adjust filters or create a new record."}
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        )}
      </WorkspacePanel>
    </div>
  );
}
