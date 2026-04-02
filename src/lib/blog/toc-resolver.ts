import type { TocItem } from "@/lib/blog/toc-generator";

export type HeadingTarget = {
  id: string;
  text: string;
};

function normalizeHeadingText(value: string) {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

export function resolveTocItems(
  items: TocItem[],
  headings: HeadingTarget[],
): TocItem[] {
  if (!items.length || !headings.length) {
    return items;
  }

  const matchedHeadingIndexes = new Set<number>();

  return items.map((item) => {
    const directMatchIndex = headings.findIndex(
      (heading, index) =>
        !matchedHeadingIndexes.has(index) && heading.id === item.id,
    );

    if (directMatchIndex !== -1) {
      matchedHeadingIndexes.add(directMatchIndex);
      return item;
    }

    const normalizedItemText = normalizeHeadingText(item.text);
    const textMatchIndex = headings.findIndex(
      (heading, index) =>
        !matchedHeadingIndexes.has(index) &&
        normalizeHeadingText(heading.text) === normalizedItemText,
    );

    if (textMatchIndex === -1) {
      return item;
    }

    matchedHeadingIndexes.add(textMatchIndex);
    return {
      ...item,
      id: headings[textMatchIndex].id,
    };
  });
}
