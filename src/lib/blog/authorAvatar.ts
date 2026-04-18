type AuthorAvatarSize = "compact" | "feature" | "grid";

const AUTHOR_INITIALS_STOP_WORDS = new Set([
  "the",
  "and",
  "of",
  "editorial",
  "team",
]);

export function getAuthorAvatarInitials(name: string | null | undefined) {
  const words = (name ?? "")
    .split(/[^A-Za-z]+/)
    .map((word) => word.trim())
    .filter(
      (word) =>
        word.length > 1 && !AUTHOR_INITIALS_STOP_WORDS.has(word.toLowerCase()),
    );

  const initials = words
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");

  return initials || "A";
}
export function getAuthorAvatarPresentation(size: AuthorAvatarSize) {
  switch (size) {
    case "feature":
      return {
        frameClassName:
          "relative h-40 w-40 overflow-hidden rounded-full bg-primary/5",
        imageClassName: "object-contain",
      };
    case "grid":
      return {
        frameClassName:
          "relative h-[72px] w-[72px] overflow-hidden rounded-2xl bg-primary/5",
        imageClassName: "object-contain",
      };
    case "compact":
    default:
      return {
        frameClassName:
          "relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-primary/5",
        imageClassName: "object-contain",
      };
  }
}
