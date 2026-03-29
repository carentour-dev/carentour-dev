"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { adminFetch } from "@/components/admin/hooks/useAdminFetch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ComboBox, type ComboOption } from "@/components/ui/combobox";

type TreatmentSummary = {
  id: string;
  name: string;
  slug: string;
  category?: string | null;
  is_featured?: boolean | null;
  is_active?: boolean | null;
  is_listed_public?: boolean | null;
};

type TreatmentMultiSelectorProps = {
  values: string[];
  onChange: (values: string[]) => void;
  maxSelections?: number;
};

type SelectedTreatment = {
  key: string;
  label: string;
  slug: string;
  category?: string | null;
  isFeatured: boolean;
  missing: boolean;
};

function resolveSelectedTreatment(
  value: string,
  treatments: TreatmentSummary[],
): SelectedTreatment {
  const match = treatments.find(
    (treatment) => treatment.slug === value || treatment.id === value,
  );

  if (!match) {
    return {
      key: value,
      label: value,
      slug: value,
      category: null,
      isFeatured: false,
      missing: true,
    };
  }

  return {
    key: value,
    label: match.name,
    slug: match.slug,
    category: match.category,
    isFeatured: match.is_featured === true,
    missing: false,
  };
}

export function TreatmentMultiSelector({
  values,
  onChange,
  maxSelections,
}: TreatmentMultiSelectorProps) {
  const { data: treatments = [], isLoading } = useQuery({
    queryKey: ["admin", "treatments", "selector"],
    queryFn: () => adminFetch<TreatmentSummary[]>("/api/admin/treatments"),
    staleTime: 5 * 60 * 1000,
  });

  const selectedTreatments = useMemo(
    () => values.map((value) => resolveSelectedTreatment(value, treatments)),
    [treatments, values],
  );

  const reachedLimit =
    typeof maxSelections === "number" && values.length >= maxSelections;

  const availableOptions = useMemo<ComboOption[]>(() => {
    return treatments
      .filter(
        (treatment) =>
          !values.includes(treatment.slug) && !values.includes(treatment.id),
      )
      .map((treatment) => ({
        value: treatment.slug,
        label: treatment.name,
        description: treatment.slug,
        badge: treatment.category ?? undefined,
        badgeVariant: treatment.is_featured ? "default" : "outline",
        searchTerms: [treatment.slug, treatment.category ?? ""],
      }));
  }, [treatments, values]);

  const moveItem = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= values.length) return;
    const next = [...values];
    const [item] = next.splice(index, 1);
    if (!item) return;
    next.splice(nextIndex, 0, item);
    onChange(next);
  };

  const removeItem = (value: string) => {
    onChange(values.filter((entry) => entry !== value));
  };

  const handleAdd = (slug: string) => {
    if (!slug || values.includes(slug)) return;
    if (reachedLimit) return;
    onChange([...values, slug]);
  };

  return (
    <div className="space-y-4">
      <ComboBox
        value=""
        options={availableOptions}
        placeholder={
          reachedLimit
            ? `Maximum ${maxSelections} treatments selected`
            : isLoading
              ? "Loading treatments..."
              : "Search and add treatments"
        }
        searchPlaceholder="Search treatments..."
        emptyLabel={
          reachedLimit
            ? "Selection limit reached."
            : isLoading
              ? "Loading treatments..."
              : "No treatments found."
        }
        disabled={isLoading || reachedLimit || availableOptions.length === 0}
        onChange={handleAdd}
        className="justify-start"
        contentClassName="w-[420px] p-0"
      />

      {selectedTreatments.length > 0 ? (
        <div className="space-y-3">
          {selectedTreatments.map((treatment, index) => (
            <div
              key={`${treatment.key}-${index}`}
              className="flex items-start justify-between gap-3 rounded-xl border border-border/60 bg-background px-4 py-3"
            >
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">
                    {treatment.label}
                  </span>
                  <Badge variant="outline" className="text-[10px]">
                    {String(index + 1).padStart(2, "0")}
                  </Badge>
                  {treatment.category ? (
                    <Badge variant="secondary" className="text-[10px]">
                      {treatment.category}
                    </Badge>
                  ) : null}
                  {treatment.isFeatured ? (
                    <Badge variant="default" className="text-[10px]">
                      Featured
                    </Badge>
                  ) : null}
                  {treatment.missing ? (
                    <Badge variant="destructive" className="text-[10px]">
                      Missing
                    </Badge>
                  ) : null}
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  {treatment.slug}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  disabled={index === 0}
                  onClick={() => moveItem(index, -1)}
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  disabled={index === selectedTreatments.length - 1}
                  onClick={() => moveItem(index, 1)}
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => removeItem(treatment.key)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-4 py-5 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Select treatments to override automatic homepage selection.
          </div>
        </div>
      )}
    </div>
  );
}
