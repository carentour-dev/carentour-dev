import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon, Clock, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, type CalendarProps } from "@/components/ui/calendar";

const pad = (value: number) => value.toString().padStart(2, "0");

const parseDateTimeValue = (value?: string | null) => {
  if (!value) {
    return { date: undefined, hour: undefined, minute: undefined };
  }

  const [datePart, timePart] = value.split("T");
  if (!datePart) {
    return { date: undefined, hour: undefined, minute: undefined };
  }

  const [yearStr, monthStr, dayStr] = datePart.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);

  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
    return { date: undefined, hour: undefined, minute: undefined };
  }

  const baseDate = new Date(year, month - 1, day);

  if (!timePart) {
    return { date: baseDate, hour: undefined, minute: undefined };
  }

  const [hourStr, minuteStr] = timePart.split(":");
  const hour = Number(hourStr);
  const minute = Number(minuteStr);

  return {
    date: baseDate,
    hour: Number.isNaN(hour) ? undefined : hour,
    minute: Number.isNaN(minute) ? undefined : minute,
  };
};

const formatLocalDateTime = (date: Date, hour: number, minute: number) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}T${pad(hour)}:${pad(minute)}`;

const buildDisplayDate = (date?: Date, hour?: number, minute?: number) => {
  if (!date) return undefined;
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    hour ?? 0,
    minute ?? 0,
  );
};

const createHourLabel = (hour: number) => {
  const suffix = hour >= 12 ? "PM" : "AM";
  const normalized = hour % 12 === 0 ? 12 : hour % 12;
  return `${normalized} ${suffix}`;
};

export interface DateTimePickerProps {
  id?: string;
  value?: string | null;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  minuteStep?: number;
  allowClear?: boolean;
  calendarProps?: Omit<
    CalendarProps,
    "selected" | "onSelect" | "mode" | "required"
  >;
  defaultHour?: number;
  defaultMinute?: number;
  className?: string;
}

export const DateTimePicker = React.forwardRef<
  HTMLButtonElement,
  DateTimePickerProps
>(
  (
    {
      id,
      value,
      onChange,
      placeholder = "Select date & time",
      disabled,
      minuteStep = 15,
      allowClear = false,
      calendarProps,
      defaultHour = 9,
      defaultMinute = 0,
      className,
    },
    ref,
  ) => {
    const [open, setOpen] = React.useState(false);

    const parsed = React.useMemo(() => parseDateTimeValue(value), [value]);

    const minuteOptions = React.useMemo(() => {
      const options: number[] = [];
      const step = Math.max(1, Math.min(60, minuteStep));
      for (let i = 0; i < 60; i += step) {
        options.push(i);
      }
      if (!options.includes(59) && 60 % step !== 0) {
        options.push(59);
      }
      return Array.from(new Set(options)).sort((a, b) => a - b);
    }, [minuteStep]);

    const commitChange = React.useCallback(
      (nextDate?: Date, nextHour?: number, nextMinute?: number) => {
        if (!onChange) return;
        if (!nextDate || nextHour === undefined || nextMinute === undefined) {
          onChange("");
          return;
        }

        onChange(formatLocalDateTime(nextDate, nextHour, nextMinute));
      },
      [onChange],
    );

    const handleDateSelect = React.useCallback(
      (selectedDate?: Date) => {
        if (!selectedDate) {
          commitChange(undefined, undefined, undefined);
          return;
        }

        const hour = parsed.hour !== undefined ? parsed.hour : defaultHour;
        const minute =
          parsed.minute !== undefined ? parsed.minute : defaultMinute;

        commitChange(selectedDate, hour, minute);
      },
      [commitChange, parsed.hour, parsed.minute, defaultHour, defaultMinute],
    );

    const handleHourChange = React.useCallback(
      (hourValue: string) => {
        if (!parsed.date) return;
        const hour = Number(hourValue);
        if (Number.isNaN(hour)) return;
        const minute =
          parsed.minute !== undefined ? parsed.minute : defaultMinute;
        commitChange(parsed.date, hour, minute);
      },
      [commitChange, parsed.date, parsed.minute, defaultMinute],
    );

    const handleMinuteChange = React.useCallback(
      (minuteValue: string) => {
        if (!parsed.date) return;
        const minute = Number(minuteValue);
        if (Number.isNaN(minute)) return;
        const hour = parsed.hour !== undefined ? parsed.hour : defaultHour;
        commitChange(parsed.date, hour, minute);
      },
      [commitChange, parsed.date, parsed.hour, defaultHour],
    );

    const handleClear = React.useCallback(() => {
      commitChange(undefined, undefined, undefined);
    }, [commitChange]);

    const displayDate = buildDisplayDate(
      parsed.date,
      parsed.hour,
      parsed.minute,
    );

    const buttonLabel = displayDate
      ? format(displayDate, "PPpp")
      : parsed.date
        ? format(parsed.date, "PPP")
        : placeholder;

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            ref={ref}
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-full justify-start text-left font-normal",
              !value && "text-muted-foreground",
              className,
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {buttonLabel}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={parsed.date}
            onSelect={handleDateSelect}
            initialFocus
            {...calendarProps}
          />
          <div className="border-t border-border p-3">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Select time</span>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={parsed.hour !== undefined ? String(parsed.hour) : ""}
                onValueChange={handleHourChange}
                disabled={!parsed.date}
              >
                <SelectTrigger className="w-28">
                  <SelectValue placeholder="Hour" />
                </SelectTrigger>
                <SelectContent side="top">
                  {Array.from({ length: 24 }).map((_, hour) => (
                    <SelectItem key={hour} value={String(hour)}>
                      {createHourLabel(hour)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={parsed.minute !== undefined ? String(parsed.minute) : ""}
                onValueChange={handleMinuteChange}
                disabled={!parsed.date}
              >
                <SelectTrigger className="w-28">
                  <SelectValue placeholder="Minutes" />
                </SelectTrigger>
                <SelectContent side="top">
                  {minuteOptions.map((minute) => (
                    <SelectItem key={minute} value={String(minute)}>
                      {pad(minute)} min
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {allowClear && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="ml-auto"
                  onClick={handleClear}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Clear selection</span>
                </Button>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  },
);
DateTimePicker.displayName = "DateTimePicker";
