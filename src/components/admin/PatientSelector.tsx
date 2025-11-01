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

interface Patient {
  id: string;
  full_name: string;
  contact_email: string | null;
  nationality: string | null;
  home_city: string | null;
  has_testimonial: boolean | null;
}

interface PatientSelectorProps {
  value?: string | null;
  onValueChange: (value: string | null) => void;
  placeholder?: string;
  className?: string;
}

export function PatientSelector({
  value,
  onValueChange,
  placeholder = "Select patient...",
  className,
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
    queryKey: ["patients-search", debouncedSearch],
    queryFn: () =>
      debouncedSearch.length >= 2
        ? adminFetch<Patient[]>(
            `/api/admin/patients/search?q=${encodeURIComponent(debouncedSearch)}`,
          )
        : Promise.resolve([]),
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
                    {patients.map((patient) => (
                      <CommandItem
                        key={patient.id}
                        value={patient.id}
                        onSelect={handleSelect}
                        className="flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Check
                            className={cn(
                              "h-4 w-4 shrink-0",
                              value === patient.id
                                ? "opacity-100"
                                : "opacity-0",
                            )}
                          />
                          <div className="flex flex-col min-w-0">
                            <span className="font-medium truncate">
                              {patient.full_name}
                            </span>
                            <span className="text-xs text-foreground/70 truncate">
                              {[
                                patient.contact_email,
                                patient.nationality,
                                patient.home_city,
                              ]
                                .filter(Boolean)
                                .join(" • ")}
                            </span>
                          </div>
                        </div>
                        {patient.has_testimonial && (
                          <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                            Has testimonial
                          </span>
                        )}
                      </CommandItem>
                    ))}
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
