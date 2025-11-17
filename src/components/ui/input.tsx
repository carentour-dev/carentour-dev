import * as React from "react";

import { cn } from "@/lib/utils";

const normalizeInputValue = (
  value: React.InputHTMLAttributes<HTMLInputElement>["value"],
) => {
  if (value === undefined || value === null) {
    return "";
  }
  return value;
};

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  (props, ref) => {
    const { className, type = "text", value, defaultValue, ...rest } = props;
    const hasValueProp = Object.prototype.hasOwnProperty.call(props, "value");

    const commonProps: React.InputHTMLAttributes<HTMLInputElement> = {
      type,
      className: cn(
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className,
      ),
      ...rest,
    };

    if (hasValueProp) {
      commonProps.value = normalizeInputValue(value);
    } else if (defaultValue !== undefined) {
      commonProps.defaultValue = normalizeInputValue(defaultValue);
    }

    return <input {...commonProps} ref={ref} />;
  },
);
Input.displayName = "Input";

export { Input };
