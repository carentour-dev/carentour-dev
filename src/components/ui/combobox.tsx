"use client";

import { useMemo, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
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

export type ComboOption = {
  value: string;
  label: string;
  description?: string;
};

export type ComboBoxProps = {
  value: string;
  options: ComboOption[];
  placeholder: string;
  searchPlaceholder?: string;
  emptyLabel?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  className?: string;
  contentClassName?: string;
};

const getOptionInitials = (label: string) => {
  const parts = label.split(" ").filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }
  return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase();
};

export const ComboBox = ({
  value,
  options,
  placeholder,
  searchPlaceholder = "Search...",
  emptyLabel = "No results found.",
  disabled = false,
  onChange,
  className,
  contentClassName = "w-[360px] p-0",
}: ComboBoxProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedOption = options.find((option) => option.value === value);
  const filteredOptions = useMemo(() => {
    if (!search) return options;
    const lower = search.toLowerCase();
    return options.filter((option) => {
      const fields = [option.label, option.description ?? "", option.value];
      return fields.some((field) => field.toLowerCase().includes(lower));
    });
  }, [options, search]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between overflow-hidden text-left",
            className,
          )}
        >
          <span
            className={cn(
              "flex-1 truncate",
              !selectedOption && "text-muted-foreground",
            )}
          >
            {selectedOption?.label ?? placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={contentClassName} align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={search}
            onValueChange={setSearch}
          />
          <div className="max-h-64 overflow-y-auto overscroll-contain">
            <CommandList className="max-h-none">
              {filteredOptions.length === 0 ? (
                <CommandEmpty>{emptyLabel}</CommandEmpty>
              ) : (
                <CommandGroup>
                  {filteredOptions.map((option) => (
                    <CommandItem
                      key={option.value}
                      value={option.value}
                      onSelect={() => {
                        onChange(option.value);
                        setSearch("");
                        setOpen(false);
                      }}
                      className={cn(
                        "items-start rounded-lg border border-transparent px-3 py-3 text-left transition-colors",
                        "data-[selected=true]:border-primary/50 data-[selected=true]:bg-primary/10 data-[selected=true]:text-foreground",
                        "hover:border-muted hover:bg-muted/30",
                      )}
                    >
                      <div className="flex w-full items-start gap-3">
                        <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold uppercase text-muted-foreground">
                          {getOptionInitials(option.label)}
                          <Check
                            className={cn(
                              "absolute -right-1 -bottom-1 h-4 w-4 rounded-full bg-primary p-0.5 text-primary-foreground transition-opacity",
                              option.value === value
                                ? "opacity-100"
                                : "opacity-0",
                            )}
                          />
                        </div>
                        <div className="min-w-0 flex-1 space-y-1">
                          <span className="text-base font-semibold text-foreground">
                            {option.label}
                          </span>
                          {option.description ? (
                            <p className="text-sm text-muted-foreground">
                              {option.description}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </div>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
