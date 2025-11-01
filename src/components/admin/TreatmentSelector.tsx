"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown, Stethoscope } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { adminFetch } from "@/components/admin/hooks/useAdminFetch";

interface Treatment {
  id: string;
  name: string;
  slug: string;
  category?: string | null;
}

interface TreatmentSelectorProps {
  value?: string | null;
  onValueChange: (value: string | null) => void;
  placeholder?: string;
  className?: string;
  allowClear?: boolean;
}

export function TreatmentSelector({
  value,
  onValueChange,
  placeholder = "Select treatment...",
  className,
  allowClear = false,
}: TreatmentSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { data: treatments = [], isLoading } = useQuery({
    queryKey: ["admin", "treatments", "selector"],
    queryFn: () => adminFetch<Treatment[]>("/api/admin/treatments"),
    staleTime: 5 * 60 * 1000,
  });

  const filteredTreatments = useMemo(() => {
    if (!search) return treatments;
    const lower = search.toLowerCase();
    return treatments.filter((treatment) =>
      [treatment.name, treatment.slug, treatment.category]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(lower)),
    );
  }, [treatments, search]);

  const selectedTreatment =
    treatments.find((treatment) => treatment.id === value) ?? null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between overflow-hidden", className)}
        >
          <span className="flex min-w-0 items-center gap-2 text-left">
            <Stethoscope className="h-4 w-4 shrink-0 opacity-50" />
            <span
              className={cn(
                "flex-1 truncate",
                !value && "text-muted-foreground",
              )}
            >
              {selectedTreatment
                ? `${selectedTreatment.name} (${selectedTreatment.slug})`
                : placeholder}
            </span>
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Search treatments..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {isLoading ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Loading treatments…
              </div>
            ) : (
              <>
                <CommandEmpty>No treatments found.</CommandEmpty>
                <CommandGroup>
                  {filteredTreatments.map((treatment) => (
                    <CommandItem
                      key={treatment.id}
                      value={treatment.id}
                      onSelect={() => {
                        if (allowClear && treatment.id === value) {
                          onValueChange(null);
                        } else {
                          onValueChange(treatment.id);
                        }
                        setOpen(false);
                      }}
                    >
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">
                          {treatment.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {treatment.slug}
                        </span>
                      </div>
                      <Check
                        className={cn(
                          "ml-auto h-4 w-4",
                          treatment.id === value ? "opacity-100" : "opacity-0",
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
