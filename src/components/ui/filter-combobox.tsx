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

export type FilterComboBoxOption = {
  value: string;
  label: string;
  description?: string;
  searchTerms?: string[];
};

type FilterComboBoxProps = {
  value: string;
  options: FilterComboBoxOption[];
  placeholder: string;
  searchPlaceholder?: string;
  emptyLabel?: string;
  disabled?: boolean;
  className?: string;
  popoverWidth?: "trigger" | "adaptive" | "wide";
  onChange: (value: string) => void;
};

export const FilterComboBox = ({
  value,
  options,
  placeholder,
  searchPlaceholder = "Search...",
  emptyLabel = "No results found.",
  disabled = false,
  className,
  popoverWidth = "trigger",
  onChange,
}: FilterComboBoxProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedOption = options.find((option) => option.value === value);
  const filteredOptions = useMemo(() => {
    if (!search) return options;

    const normalizedSearch = search.toLowerCase();

    return options.filter((option) => {
      const fields = [
        option.label,
        option.description ?? "",
        option.value,
        ...(option.searchTerms ?? []),
      ];

      return fields.some((field) =>
        field.toLowerCase().includes(normalizedSearch),
      );
    });
  }, [options, search]);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setSearch("");
    }
  };

  const popoverWidthClassName = cn(
    popoverWidth === "trigger" &&
      "w-[var(--radix-popover-trigger-width)] min-w-[16rem]",
    popoverWidth === "adaptive" &&
      "w-auto min-w-[max(16rem,var(--radix-popover-trigger-width))] max-w-[min(32rem,calc(100vw-2rem))]",
    popoverWidth === "wide" &&
      "w-[min(40rem,calc(100vw-2rem))] min-w-[max(16rem,var(--radix-popover-trigger-width))]",
  );

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "h-12 w-full justify-between overflow-hidden text-left font-normal",
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
      <PopoverContent
        align="start"
        className={cn(popoverWidthClassName, "p-0")}
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={search}
            onValueChange={setSearch}
          />
          <CommandList className="max-h-72">
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
                    className="gap-2 px-3 py-2.5"
                  >
                    <Check
                      className={cn(
                        "mt-0.5 h-4 w-4 shrink-0 self-start",
                        option.value === value ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="line-clamp-2 whitespace-normal break-words text-sm leading-5">
                        {option.label}
                      </div>
                      {option.description ? (
                        <div className="line-clamp-2 whitespace-normal break-words text-xs leading-4 text-muted-foreground">
                          {option.description}
                        </div>
                      ) : null}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
