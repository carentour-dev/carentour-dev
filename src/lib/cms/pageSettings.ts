import { z } from "zod";
import { normalizeBlocks, type BlockInstance } from "@/lib/cms/blocks";

export const HOME_HERO_IMAGE_REQUIREMENTS = {
  accept: "image/jpeg,image/png,image/webp",
  acceptedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  maxSizeMb: 5,
  minWidth: 2000,
  minHeight: 1200,
  recommendedWidth: 2400,
  recommendedHeight: 1400,
} as const;

export const HOME_HERO_IMAGE_REQUIREMENTS_TEXT =
  "Use JPG, PNG, or WebP. Max 5MB. Minimum 2000x1200px. Recommended 2400x1400px landscape.";

const homeHeroSettingsSchema = z.object({
  imageUrl: z.string().trim().min(1).optional(),
  useLegacyLayout: z.boolean().optional().default(false),
});

export const cmsPageSettingsSchema = z
  .object({
    homeHero: homeHeroSettingsSchema.optional(),
  })
  .default({});

export type CmsPageSettings = z.infer<typeof cmsPageSettingsSchema>;
export type HomePageLayoutMode = "legacy" | "cms";

function appendImageVersion(
  imageUrl: string,
  version: string | null | undefined,
): string {
  if (!version || !/^https?:\/\//.test(imageUrl)) {
    return imageUrl;
  }

  try {
    const url = new URL(imageUrl);
    url.searchParams.set("v", version);
    return url.toString();
  } catch {
    return imageUrl;
  }
}

export function sanitizeCmsPageSettings(input: unknown): CmsPageSettings {
  const parsed = cmsPageSettingsSchema.safeParse(input ?? {});
  return parsed.success ? parsed.data : {};
}

export function resolveHomeHeroImageUrl(
  settings: CmsPageSettings | null | undefined,
  content?: unknown,
  version?: string | null,
): string | null {
  const heroBlock = normalizeBlocks(content).find(
    (block): block is BlockInstance<"homeHero"> =>
      block.type === "homeHero" &&
      typeof block.backgroundImageUrl === "string" &&
      block.backgroundImageUrl.trim().length > 0,
  );
  const heroBlockImageUrl = heroBlock?.backgroundImageUrl;

  if (typeof heroBlockImageUrl === "string" && heroBlockImageUrl.trim()) {
    return appendImageVersion(heroBlockImageUrl.trim(), version);
  }

  const imageUrl = settings?.homeHero?.imageUrl?.trim();
  return imageUrl ? appendImageVersion(imageUrl, version) : null;
}

export function resolveHomepageBlocks(
  content: unknown,
  version?: string | null,
): BlockInstance[] {
  return normalizeBlocks(content).map((block) => {
    if (
      block.type !== "homeHero" ||
      typeof block.backgroundImageUrl !== "string" ||
      block.backgroundImageUrl.trim().length === 0
    ) {
      return block;
    }

    return {
      ...block,
      backgroundImageUrl: appendImageVersion(
        block.backgroundImageUrl.trim(),
        version,
      ),
    };
  });
}

export function resolveHomePageLayoutMode(
  settings: CmsPageSettings | null | undefined,
  status?: "draft" | "published" | null,
  contentLength?: number | null,
): HomePageLayoutMode {
  const explicitMode = settings?.homeHero?.useLegacyLayout;

  if (explicitMode === true) {
    return "legacy";
  }

  if (explicitMode === false) {
    return "cms";
  }

  if (status === "published" && (contentLength ?? 0) > 0) {
    return "cms";
  }

  return "legacy";
}

export function shouldUseLegacyHomepageLayout(
  settings: CmsPageSettings | null | undefined,
  status?: "draft" | "published" | null,
  contentLength?: number | null,
): boolean {
  return (
    resolveHomePageLayoutMode(settings, status, contentLength) === "legacy"
  );
}
