"use client";

import { useMemo, useRef, useState, useCallback } from "react";
import type {
  WheelEvent as ReactWheelEvent,
  TouchEvent as ReactTouchEvent,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown, User2 } from "lucide-react";
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

interface Doctor {
  id: string;
  name: string;
  title: string;
  specialization: string;
}

interface DoctorSelectorProps {
  value?: string | null;
  onValueChange: (value: string | null) => void;
  placeholder?: string;
  className?: string;
  allowClear?: boolean;
}

export function DoctorSelector({
  value,
  onValueChange,
  placeholder = "Select doctor...",
  className,
  allowClear = false,
}: DoctorSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const touchStartRef = useRef<number>(0);

  const { data: doctors = [], isLoading } = useQuery({
    queryKey: ["admin", "doctors", "selector"],
    queryFn: () => adminFetch<Doctor[]>("/api/admin/doctors"),
    staleTime: 5 * 60 * 1000,
  });

  const filteredDoctors = useMemo(() => {
    if (!search) return doctors;
    const lower = search.toLowerCase();
    return doctors.filter((doctor) =>
      [doctor.name, doctor.title, doctor.specialization]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(lower)),
    );
  }, [doctors, search]);

  const selectedDoctor = doctors.find((doctor) => doctor.id === value) ?? null;

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
            <User2 className="h-4 w-4 shrink-0 opacity-50" />
            <span
              className={cn(
                "flex-1 truncate",
                !value && "text-muted-foreground",
              )}
            >
              {selectedDoctor
                ? `${selectedDoctor.name} • ${selectedDoctor.specialization}`
                : placeholder}
            </span>
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Search doctors..."
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
                <div className="py-6 text-center text-sm text-muted-foreground">
                  Loading doctors…
                </div>
              ) : (
                <>
                  <CommandEmpty>No doctors found.</CommandEmpty>
                  <CommandGroup>
                    {filteredDoctors.map((doctor) => (
                      <CommandItem
                        key={doctor.id}
                        value={doctor.id}
                        onSelect={() => {
                          if (allowClear && doctor.id === value) {
                            onValueChange(null);
                          } else {
                            onValueChange(doctor.id);
                          }
                          setOpen(false);
                        }}
                      >
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">
                            {doctor.name}
                          </span>
                          <span className="text-xs text-foreground/70">
                            {doctor.specialization}
                          </span>
                        </div>
                        <Check
                          className={cn(
                            "ml-auto h-4 w-4",
                            doctor.id === value ? "opacity-100" : "opacity-0",
                          )}
                        />
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
