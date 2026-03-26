import { z } from "zod";
import { SUPPORTED_SEO_LOCALES } from "@/lib/seo/constants";

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

const jsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(jsonValueSchema),
    z.record(jsonValueSchema),
  ]),
);

const jsonLdNodeSchema = z.record(jsonValueSchema).superRefine((value, ctx) => {
  const rawType = value["@type"];
  const rawContext = value["@context"];

  const hasType = typeof rawType === "string" && rawType.trim().length > 0;
  const hasContext =
    typeof rawContext === "string" && rawContext.trim().length > 0;

  if (!hasType && !hasContext) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'JSON-LD override must include "@type" or "@context"',
    });
  }
});

export const seoSchemaOverrideSchema = z
  .union([jsonLdNodeSchema, z.array(jsonLdNodeSchema)])
  .optional()
  .nullable();

const toNullIfBlank = (value: unknown) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const nullableText = (max: number) =>
  z.preprocess(toNullIfBlank, z.string().max(max).nullable().optional());

const pathOnly = z
  .string()
  .trim()
  .min(1)
  .refine(
    (value) => /^\/(?!\/)/.test(value),
    "Must be a site-relative path starting with /",
  );

const isValidAbsoluteHttpUrl = (value: string) => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

const urlOrPath = z
  .string()
  .trim()
  .min(1)
  .refine(
    (value) => /^\/(?!\/)/.test(value) || isValidAbsoluteHttpUrl(value),
    "Must be an absolute URL or a site-relative path",
  );

export const seoOverrideUpsertSchema = z.object({
  routeKey: pathOnly,
  locale: z.enum(SUPPORTED_SEO_LOCALES).default("en"),
  updatedAt: z
    .string()
    .trim()
    .refine((value) => !Number.isNaN(Date.parse(value)), "Invalid updatedAt")
    .optional()
    .nullable(),
  title: nullableText(160),
  description: nullableText(320),
  canonicalUrl: urlOrPath.optional().nullable(),
  robotsIndex: z.boolean().optional(),
  robotsFollow: z.boolean().optional(),
  ogTitle: nullableText(160),
  ogDescription: nullableText(320),
  ogImageUrl: urlOrPath.optional().nullable(),
  twitterTitle: nullableText(160),
  twitterDescription: nullableText(320),
  twitterImageUrl: urlOrPath.optional().nullable(),
  keywords: z.array(z.string().trim().min(1).max(80)).optional().nullable(),
  schemaOverride: seoSchemaOverrideSchema,
  aiSummary: nullableText(600),
  llmsInclude: z.boolean().optional(),
  llmsPriority: z.coerce.number().int().min(-100).max(100).optional(),
});

export const routeRedirectCreateSchema = z
  .object({
    fromPath: pathOnly,
    toPath: pathOnly,
    code: z
      .union([z.literal(301), z.literal(302), z.literal(307), z.literal(308)])
      .default(301),
    isActive: z.boolean().default(true),
    source: z.preprocess(
      toNullIfBlank,
      z.string().max(120).optional().nullable(),
    ),
    sourceMetadata: z.record(jsonValueSchema).optional().nullable(),
  })
  .refine((value) => value.fromPath !== value.toPath, {
    message: "fromPath and toPath cannot be identical",
    path: ["toPath"],
  });

export const routeRedirectUpdateSchema = z
  .object({
    id: z.string().uuid(),
    fromPath: pathOnly.optional(),
    toPath: pathOnly.optional(),
    code: z
      .union([z.literal(301), z.literal(302), z.literal(307), z.literal(308)])
      .optional(),
    isActive: z.boolean().optional(),
    source: z.preprocess(
      toNullIfBlank,
      z.string().max(120).optional().nullable(),
    ),
    sourceMetadata: z.record(jsonValueSchema).optional().nullable(),
  })
  .superRefine((value, ctx) => {
    const hasUpdateField =
      value.fromPath !== undefined ||
      value.toPath !== undefined ||
      value.code !== undefined ||
      value.isActive !== undefined ||
      value.source !== undefined ||
      value.sourceMetadata !== undefined;

    if (!hasUpdateField) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["id"],
        message: "At least one redirect field must be updated",
      });
    }

    if (value.fromPath && value.toPath && value.fromPath === value.toPath) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["toPath"],
        message: "fromPath and toPath cannot be identical",
      });
    }
  });
