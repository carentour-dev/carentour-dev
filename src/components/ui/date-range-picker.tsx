"use client";

import { type ComponentPropsWithoutRef } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type DateRangePickerProps = {
  value?: DateRange;
  onChange: (value: DateRange | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  numberOfMonths?: number;
  minDate?: Date;
  className?: string;
} & Omit<
  ComponentPropsWithoutRef<typeof Button>,
  "value" | "onChange" | "children"
>;

const formatRangeLabel = (
  value: DateRange | undefined,
  placeholder: string,
): string => {
  if (!value?.from) {
    return placeholder;
  }

  if (!value.to) {
    return format(value.from, "PPP");
  }

  return `${format(value.from, "PPP")} - ${format(value.to, "PPP")}`;
};

export function DateRangePicker({
  value,
  onChange,
  placeholder = "Pick a date range",
  disabled = false,
  numberOfMonths = 2,
  minDate,
  className,
  ...buttonProps
}: DateRangePickerProps) {
  const label = formatRangeLabel(value, placeholder);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          data-empty={!value?.from}
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal data-[empty=true]:text-muted-foreground",
            className,
          )}
          {...buttonProps}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          <span className="truncate">{label}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          defaultMonth={value?.from ?? minDate ?? new Date()}
          selected={value}
          onSelect={onChange}
          numberOfMonths={numberOfMonths}
          disabled={minDate ? (date) => date < minDate : undefined}
        />
      </PopoverContent>
    </Popover>
  );
}
