export const normalizeLeadEmail = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  return normalized.length > 0 ? normalized : null;
};

export const normalizeLeadPhone = (value: unknown): string | null => {
  if (typeof value !== "string" && typeof value !== "number") {
    return null;
  }

  const raw = String(value).trim();
  if (!raw) {
    return null;
  }

  const leadingPlus = raw.startsWith("+") ? "+" : "";
  const digits = raw.replace(/[^\d]/g, "");

  if (digits.length < 7) {
    return null;
  }

  return `${leadingPlus}${digits}`;
};

export const splitLeadName = (value: unknown) => {
  const fullName = typeof value === "string" ? value.trim() : "";
  if (!fullName) {
    return { fullName: null, firstName: null, lastName: null };
  }

  const parts = fullName.split(/\s+/);
  const firstName = parts[0] ?? fullName;
  const lastName = parts.length > 1 ? parts.slice(1).join(" ") : null;

  return { fullName, firstName, lastName };
};

export const isTruthyFeatureFlag = (value: string | undefined) => {
  if (!value) {
    return false;
  }

  return ["1", "true", "yes", "on", "enabled"].includes(
    value.trim().toLowerCase(),
  );
};

export const canContactViaChannel = (args: {
  optedIn: boolean | null | undefined;
  channel: string | null | undefined;
}) => {
  if (!args.channel) {
    return false;
  }

  return args.optedIn === true;
};
