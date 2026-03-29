"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { adminFetch } from "@/components/admin/hooks/useAdminFetch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ComboBox, type ComboOption } from "@/components/ui/combobox";

type DoctorSummary = {
  id: string;
  name: string;
  title?: string | null;
  specialization?: string | null;
  is_active?: boolean | null;
};

type DoctorMultiSelectorProps = {
  values: string[];
  onChange: (values: string[]) => void;
  maxSelections?: number;
};

type SelectedDoctor = {
  key: string;
  label: string;
  title?: string | null;
  specialization?: string | null;
  inactive: boolean;
  missing: boolean;
};

function resolveSelectedDoctor(
  value: string,
  doctors: DoctorSummary[],
): SelectedDoctor {
  const match = doctors.find((doctor) => doctor.id === value);

  if (!match) {
    return {
      key: value,
      label: value,
      title: null,
      specialization: null,
      inactive: false,
      missing: true,
    };
  }

  return {
    key: value,
    label: match.name,
    title: match.title,
    specialization: match.specialization,
    inactive: match.is_active === false,
    missing: false,
  };
}

export function DoctorMultiSelector({
  values,
  onChange,
  maxSelections,
}: DoctorMultiSelectorProps) {
  const { data: doctors = [], isLoading } = useQuery({
    queryKey: ["admin", "doctors", "selector"],
    queryFn: () => adminFetch<DoctorSummary[]>("/api/admin/doctors"),
    staleTime: 5 * 60 * 1000,
  });

  const selectedDoctors = useMemo(
    () => values.map((value) => resolveSelectedDoctor(value, doctors)),
    [doctors, values],
  );

  const reachedLimit =
    typeof maxSelections === "number" && values.length >= maxSelections;

  const availableOptions = useMemo<ComboOption[]>(() => {
    return doctors
      .filter((doctor) => !values.includes(doctor.id))
      .map((doctor) => ({
        value: doctor.id,
        label: doctor.name,
        description: doctor.title ?? doctor.specialization ?? undefined,
        badge: doctor.specialization ?? undefined,
        badgeVariant: doctor.is_active === false ? "destructive" : "outline",
        searchTerms: [doctor.title ?? "", doctor.specialization ?? ""],
      }));
  }, [doctors, values]);

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

  const handleAdd = (id: string) => {
    if (!id || values.includes(id)) return;
    if (reachedLimit) return;
    onChange([...values, id]);
  };

  return (
    <div className="space-y-4">
      <ComboBox
        value=""
        options={availableOptions}
        placeholder={
          reachedLimit
            ? `Maximum ${maxSelections} doctors selected`
            : isLoading
              ? "Loading doctors..."
              : "Search and add doctors"
        }
        searchPlaceholder="Search doctors..."
        emptyLabel={
          reachedLimit
            ? "Selection limit reached."
            : isLoading
              ? "Loading doctors..."
              : "No doctors found."
        }
        disabled={isLoading || reachedLimit || availableOptions.length === 0}
        onChange={handleAdd}
        className="justify-start"
        contentClassName="w-[420px] p-0"
      />

      {selectedDoctors.length > 0 ? (
        <div className="space-y-3">
          {selectedDoctors.map((doctor, index) => (
            <div
              key={`${doctor.key}-${index}`}
              className="flex items-start justify-between gap-3 rounded-xl border border-border/60 bg-background px-4 py-3"
            >
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">
                    {doctor.label}
                  </span>
                  <Badge variant="outline" className="text-[10px]">
                    {String(index + 1).padStart(2, "0")}
                  </Badge>
                  {doctor.specialization ? (
                    <Badge variant="secondary" className="text-[10px]">
                      {doctor.specialization}
                    </Badge>
                  ) : null}
                  {doctor.inactive ? (
                    <Badge variant="destructive" className="text-[10px]">
                      Inactive
                    </Badge>
                  ) : null}
                  {doctor.missing ? (
                    <Badge variant="destructive" className="text-[10px]">
                      Missing
                    </Badge>
                  ) : null}
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  {doctor.title ?? doctor.key}
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
                  disabled={index === selectedDoctors.length - 1}
                  onClick={() => moveItem(index, 1)}
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => removeItem(doctor.key)}
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
            Select doctors to override automatic doctor selection.
          </div>
        </div>
      )}
    </div>
  );
}
