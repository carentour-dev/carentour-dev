import { z } from "zod";

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

export function sanitizeCmsPageSettings(input: unknown): CmsPageSettings {
  const parsed = cmsPageSettingsSchema.safeParse(input ?? {});
  return parsed.success ? parsed.data : {};
}

export function resolveHomeHeroImageUrl(
  settings: CmsPageSettings | null | undefined,
): string | null {
  const imageUrl = settings?.homeHero?.imageUrl?.trim();
  return imageUrl ? imageUrl : null;
}

export function shouldUseLegacyHomepageLayout(
  settings: CmsPageSettings | null | undefined,
): boolean {
  return settings?.homeHero?.useLegacyLayout === true;
}
