export type BlogPostPublicationState = "draft" | "published" | "scheduled";

type BlogPostPublicationInput = {
  status?: string | null;
  publishDate?: string | null;
  now?: Date | number | string;
};

function resolveTimestamp(value?: string | null) {
  if (!value) {
    return null;
  }

  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function resolveNowTimestamp(now?: Date | number | string) {
  if (now instanceof Date) {
    return now.getTime();
  }

  if (typeof now === "number") {
    return now;
  }

  if (typeof now === "string") {
    const parsed = Date.parse(now);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  return Date.now();
}

export function resolveBlogPostPublicationState(
  input: BlogPostPublicationInput,
): BlogPostPublicationState {
  const normalizedStatus = input.status?.trim();

  if (normalizedStatus === "draft") {
    return "draft";
  }

  if (normalizedStatus === "scheduled") {
    return "scheduled";
  }

  if (normalizedStatus !== "published") {
    return "draft";
  }

  const publishTimestamp = resolveTimestamp(input.publishDate);
  if (
    publishTimestamp !== null &&
    publishTimestamp > resolveNowTimestamp(input.now)
  ) {
    return "scheduled";
  }

  return "published";
}

export function isBlogPostPubliclyVisible(input: BlogPostPublicationInput) {
  return (
    input.status?.trim() === "published" &&
    resolveBlogPostPublicationState(input) === "published"
  );
}
