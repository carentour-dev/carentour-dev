export type InfrastructureEntry = {
  key: string;
  label: string;
  value: string;
};

const formatLabel = (key: string) => key.replace(/_/g, " ").trim();

export const formatInfrastructureValue = (value: unknown): string | null => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (typeof value === "number") {
    return Number.isNaN(value) ? null : `${value}`;
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (Array.isArray(value)) {
    const items = value
      .map((item) => {
        if (typeof item === "string") {
          return item.trim();
        }

        if (item === null || item === undefined) {
          return "";
        }

        return String(item);
      })
      .filter((item) => item.length > 0);

    return items.length > 0 ? items.join(", ") : null;
  }

  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    const formattedEntries = entries
      .map(([innerKey, innerValue]) => {
        const formatted = formatInfrastructureValue(innerValue);
        if (!formatted) {
          return null;
        }
        return `${formatLabel(innerKey)}: ${formatted}`;
      })
      .filter(Boolean) as string[];

    return formattedEntries.length > 0 ? formattedEntries.join(", ") : null;
  }

  return String(value);
};

export const formatInfrastructureEntries = (
  infrastructure: Record<string, unknown> | null,
): InfrastructureEntry[] => {
  if (!infrastructure) {
    return [];
  }

  return Object.entries(infrastructure).reduce<InfrastructureEntry[]>(
    (items, [key, value]) => {
      const formattedValue = formatInfrastructureValue(value);

      if (!formattedValue) {
        return items;
      }

      items.push({
        key,
        label: formatLabel(key),
        value: formattedValue,
      });

      return items;
    },
    [],
  );
};
