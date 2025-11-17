"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type {
  WheelEvent as ReactWheelEvent,
  TouchEvent as ReactTouchEvent,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown, Loader2, User } from "lucide-react";
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
import type { PatientStatus } from "@/lib/patients/status";
import { Badge } from "@/components/ui/badge";

interface Patient {
  id: string;
  full_name: string;
  contact_email: string | null;
  nationality: string | null;
  home_city: string | null;
  has_testimonial: boolean | null;
  status: PatientStatus;
}

interface PatientSelectorProps {
  value?: string | null;
  onValueChange: (value: string | null) => void;
  placeholder?: string;
  className?: string;
  status?: PatientStatus;
}

const STATUS_LABELS: Record<PatientStatus, string> = {
  potential: "Potential",
  confirmed: "Confirmed",
};

const getInitials = (name: string) => {
  if (!name) return "?";
  const parts = name.split(" ").filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }
  return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase();
};

export function PatientSelector({
  value,
  onValueChange,
  placeholder = "Select patient...",
  className,
  status,
}: PatientSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const touchStartRef = useRef<number>(0);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const { data: patients = [], isLoading } = useQuery({
    queryKey: ["patients-search", debouncedSearch, status ?? "all"],
    queryFn: () => {
      if (debouncedSearch.length < 2) {
        return Promise.resolve([] as Patient[]);
      }

      const params = new URLSearchParams({ q: debouncedSearch });
      if (status) {
        params.set("status", status);
      }

      return adminFetch<Patient[]>(
        `/api/admin/patients/search?${params.toString()}`,
      );
    },
    enabled: debouncedSearch.length >= 2,
    staleTime: 30000,
  });

  // Get selected patient for display
  const { data: selectedPatient } = useQuery({
    queryKey: ["patient", value],
    queryFn: () =>
      value
        ? adminFetch<Patient>(`/api/admin/patients/${value}`)
        : Promise.resolve(null),
    enabled: !!value,
    staleTime: 60000,
  });

  const handleSelect = useCallback(
    (patientId: string) => {
      if (patientId === value) {
        onValueChange(null);
      } else {
        onValueChange(patientId);
      }
      setOpen(false);
      setSearch("");
    },
    [value, onValueChange],
  );

  const displayValue = selectedPatient
    ? `${selectedPatient.full_name}${selectedPatient.nationality ? ` (${selectedPatient.nationality})` : ""}`
    : placeholder;

  const handleWheel = useCallback((event: ReactWheelEvent<HTMLDivElement>) => {
    if (!scrollContainerRef.current) return;
    event.preventDefault();
    scrollContainerRef.current.scrollTop += event.deltaY;
  }, []);

  const handleTouchStart = useCallback(
    (event: ReactTouchEvent<HTMLDivElement>) => {
      touchStartRef.current = event.touches[0]?.clientY ?? 0;
    },
    [],
  );

  const handleTouchMove = useCallback(
    (event: ReactTouchEvent<HTMLDivElement>) => {
      if (!scrollContainerRef.current) return;
      const currentY = event.touches[0]?.clientY ?? 0;
      const delta = touchStartRef.current - currentY;
      if (Math.abs(delta) < 0.5) {
        return;
      }
      event.preventDefault();
      scrollContainerRef.current.scrollTop += delta;
      touchStartRef.current = currentY;
    },
    [],
  );

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
            <User className="h-4 w-4 shrink-0 opacity-50" />
            <span
              className={cn(
                "flex-1 truncate",
                !value && "text-muted-foreground",
              )}
            >
              {displayValue}
            </span>
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search by name or email..."
            value={search}
            onValueChange={setSearch}
          />
          <div
            ref={scrollContainerRef}
            className="max-h-64 overflow-y-auto overscroll-contain [@supports(-webkit-touch-callout:none)]:[-webkit-overflow-scrolling:touch]"
            onWheel={handleWheel}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
          >
            <CommandList className="max-h-none">
              {isLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <CommandEmpty>
                    {debouncedSearch.length < 2
                      ? "Type at least 2 characters to search..."
                      : "No patients found."}
                  </CommandEmpty>
                  <CommandGroup>
                    {patients.map((patient) => {
                      const detailLine = [
                        patient.contact_email,
                        patient.home_city,
                        patient.nationality,
                      ]
                        .filter(Boolean)
                        .join(" • ");

                      return (
                        <CommandItem
                          key={patient.id}
                          value={patient.id}
                          onSelect={handleSelect}
                          className={cn(
                            "items-start rounded-lg border border-transparent px-3 py-3 text-left transition-colors",
                            "data-[selected=true]:border-primary/50 data-[selected=true]:bg-primary/10 data-[selected=true]:text-foreground",
                            "hover:border-muted hover:bg-muted/30",
                          )}
                        >
                          <div className="flex w-full items-start gap-3">
                            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold uppercase text-muted-foreground">
                              {getInitials(patient.full_name)}
                              <Check
                                className={cn(
                                  "absolute -right-1 -bottom-1 h-4 w-4 rounded-full bg-primary p-0.5 text-primary-foreground transition-opacity",
                                  value === patient.id
                                    ? "opacity-100"
                                    : "opacity-0",
                                )}
                              />
                            </div>
                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-base font-semibold text-foreground">
                                  {patient.full_name}
                                </span>
                                <Badge
                                  variant="outline"
                                  className="text-[10px] font-semibold tracking-wide text-muted-foreground"
                                >
                                  {STATUS_LABELS[patient.status]}
                                </Badge>
                                {patient.has_testimonial && (
                                  <Badge
                                    variant="secondary"
                                    className="text-[10px] font-semibold text-foreground"
                                  >
                                    Testimonial
                                  </Badge>
                                )}
                              </div>
                              {detailLine && (
                                <p className="text-sm text-muted-foreground">
                                  {detailLine}
                                </p>
                              )}
                            </div>
                          </div>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </div>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
