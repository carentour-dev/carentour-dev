import * as React from "react"
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from "lucide-react"
import {
  DayPicker,
  DayButton as DefaultDayButton,
  type DayPickerProps,
} from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = DayPickerProps

const CalendarDayButton: typeof DefaultDayButton = ({
  className,
  modifiers,
  ...props
}) => {
  const isRangeMiddle =
    !!modifiers?.range_middle &&
    !modifiers?.range_start &&
    !modifiers?.range_end

  const isSelected = !!modifiers?.selected && !isRangeMiddle

  const isToday = !!modifiers?.today

  return (
    <DefaultDayButton
      {...props}
      modifiers={modifiers}
      className={cn(
        buttonVariants({ variant: "ghost" }),
        "h-9 w-9 p-0 font-normal focus-visible:ring-0 focus-visible:ring-offset-0",
        isSelected &&
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        isRangeMiddle &&
          "bg-accent text-accent-foreground hover:bg-accent focus:bg-accent",
        isToday &&
          !isSelected &&
          !isRangeMiddle &&
          "text-primary font-semibold",
        modifiers?.outside && "text-muted-foreground opacity-50",
        modifiers?.disabled && "text-muted-foreground opacity-50",
        (modifiers?.range_start ||
          modifiers?.range_middle ||
          modifiers?.range_end) &&
          "rounded-none",
        modifiers?.range_start && "rounded-l-md",
        modifiers?.range_end && "rounded-r-md",
        className
      )}
    />
  )
}

function Calendar({
  className,
  classNames,
  components,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        root: "space-y-4",
        months:
          "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        month_caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        nav: "space-x-1 flex items-center",
        button_previous: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        button_next: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        month_grid: "w-full border-collapse space-y-1",
        weekdays: "flex",
        weekday:
          "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        week: "flex w-full mt-2",
        day: "h-9 w-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
        hidden: "invisible",
        disabled: "text-muted-foreground opacity-50",
        outside:
          "text-muted-foreground opacity-50 data-[selected]:bg-accent/50 data-[selected]:text-muted-foreground data-[selected]:opacity-30",
        selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        today: "text-primary font-semibold",
        range_middle:
          "bg-accent text-accent-foreground data-[selected]:bg-accent data-[selected]:text-accent-foreground",
        range_start: "rounded-l-md",
        range_end: "rounded-r-md",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, disabled, className, size }) => {
          const Icon =
            orientation === "left"
              ? ChevronLeft
              : orientation === "right"
                ? ChevronRight
                : orientation === "up"
                  ? ChevronUp
                  : ChevronDown

          return (
            <Icon
              className={cn("h-4 w-4", disabled && "opacity-50", className)}
              size={size ?? 16}
            />
          )
        },
        DayButton: CalendarDayButton,
        ...components,
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
