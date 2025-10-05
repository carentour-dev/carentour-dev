"use client";

import { useMemo, useState } from "react";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
            <span className={cn("flex-1 truncate", !value && "text-muted-foreground")}>
              {selectedDoctor ? `${selectedDoctor.name} • ${selectedDoctor.specialization}` : placeholder}
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
          <CommandList>
            {isLoading ? (
              <div className="py-6 text-center text-sm text-muted-foreground">Loading doctors…</div>
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
                        <span className="font-medium text-foreground">{doctor.name}</span>
                        <span className="text-xs text-muted-foreground">{doctor.specialization}</span>
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
        </Command>
      </PopoverContent>
    </Popover>
  );
}
