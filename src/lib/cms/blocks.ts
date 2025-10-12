import { z } from "zod";

const actionVariants = ["default", "secondary", "outline", "ghost", "link"] as const;

const linkTargetSchema = z
  .enum(["_self", "_blank"])
  .default("_self");

const actionSchema = z.object({
  label: z.string().min(1, "Action label is required"),
  href: z.string().min(1, "Action URL is required"),
  variant: z.enum(actionVariants).default("default"),
  target: linkTargetSchema.optional(),
  icon: z.string().optional(),
});

const heroBlockSchema = z.object({
  type: z.literal("hero"),
  eyebrow: z.string().optional(),
  heading: z.string().min(1, "Heading is required"),
  highlight: z.string().optional(),
  description: z.string().optional(),
  alignment: z.enum(["left", "center"]).default("center"),
  background: z.enum(["white", "muted", "gradient", "primary"]).default("white"),
  containerWidth: z.enum(["default", "wide", "narrow"]).default("default"),
  primaryAction: actionSchema.optional(),
  secondaryAction: actionSchema.optional(),
  media: z
    .object({
      type: z.enum(["image", "video"]).default("image"),
      src: z.string().min(1, "Media source is required"),
      alt: z.string().optional(),
      caption: z.string().optional(),
      aspectRatio: z.string().optional(),
    })
    .optional(),
});

const statGridBlockSchema = z.object({
  type: z.literal("statGrid"),
  eyebrow: z.string().optional(),
  heading: z.string().optional(),
  description: z.string().optional(),
  columns: z.number().min(1).max(4).default(4),
  emphasizeValue: z.boolean().default(true),
  items: z
    .array(
      z.object({
        label: z.string().min(1, "Label is required"),
        value: z.string().min(1, "Value is required"),
        helper: z.string().optional(),
        icon: z.string().optional(),
      }),
    )
    .min(1, "At least one stat is required"),
});

const richTextBlockSchema = z.object({
  type: z.literal("richText"),
  markdown: z.string().min(1, "Markdown content is required"),
  align: z.enum(["start", "center"]).default("start"),
  width: z.enum(["prose", "narrow", "full"]).default("prose"),
});

const imageFeatureBlockSchema = z.object({
  type: z.literal("imageFeature"),
  layout: z.enum(["imageLeft", "imageRight"]).default("imageRight"),
  eyebrow: z.string().optional(),
  heading: z.string().min(1, "Heading is required"),
  body: z.string().optional(),
  items: z
    .array(
      z.object({
        title: z.string().min(1, "Title is required"),
        description: z.string().optional(),
        icon: z.string().optional(),
      }),
    )
    .optional(),
  image: z.object({
    src: z.string().min(1, "Image source is required"),
    alt: z.string().optional(),
    aspectRatio: z.string().optional(),
    rounded: z.boolean().default(true),
  }),
  actions: z.array(actionSchema).max(2).optional(),
});

const featureGridBlockSchema = z.object({
  type: z.literal("featureGrid"),
  eyebrow: z.string().optional(),
  heading: z.string().optional(),
  description: z.string().optional(),
  columns: z.number().min(1).max(4).default(3),
  variant: z.enum(["cards", "plain"]).default("cards"),
  items: z
    .array(
      z.object({
        title: z.string().min(1, "Title is required"),
        description: z.string().optional(),
        icon: z.string().optional(),
        tag: z.string().optional(),
      }),
    )
    .min(1),
});

const callToActionBlockSchema = z.object({
  type: z.literal("callToAction"),
  eyebrow: z.string().optional(),
  heading: z.string().min(1, "Heading is required"),
  description: z.string().optional(),
  layout: z.enum(["centered", "split"]).default("centered"),
  background: z.enum(["muted", "accent", "dark", "image"]).default("muted"),
  image: z
    .object({
      src: z.string().min(1),
      alt: z.string().optional(),
      overlay: z.boolean().default(true),
    })
    .optional(),
  actions: z.array(actionSchema).min(1).max(2),
});

const faqBlockSchema = z.object({
  type: z.literal("faq"),
  eyebrow: z.string().optional(),
  heading: z.string().optional(),
  description: z.string().optional(),
  layout: z.enum(["twoColumn", "single"]).default("twoColumn"),
  items: z
    .array(
      z.object({
        question: z.string().min(1, "Question is required"),
        answer: z.string().min(1, "Answer is required"),
      }),
    )
    .min(1),
});

const quoteBlockSchema = z.object({
  type: z.literal("quote"),
  eyebrow: z.string().optional(),
  quote: z.string().min(1, "Quote is required"),
  attribution: z.string().optional(),
  role: z.string().optional(),
  avatar: z
    .object({
      src: z.string().min(1),
      alt: z.string().optional(),
    })
    .optional(),
  highlight: z.string().optional(),
});

const treatmentsBlockSchema = z.object({
  type: z.literal("treatments"),
  title: z.string().optional(),
  description: z.string().optional(),
  layout: z.enum(["grid", "carousel"]).default("grid"),
  limit: z.number().min(1).max(12).default(6),
  featuredOnly: z.boolean().default(false),
  categories: z.array(z.string()).optional(),
  manualTreatments: z.array(z.string()).optional(),
});

const doctorsBlockSchema = z.object({
  type: z.literal("doctors"),
  title: z.string().optional(),
  description: z.string().optional(),
  layout: z.enum(["grid", "carousel"]).default("grid"),
  limit: z.number().min(1).max(12).default(6),
  featuredOnly: z.boolean().default(false),
  specialties: z.array(z.string()).optional(),
  manualDoctors: z.array(z.string()).optional(),
});

const blockSchemas = [
  heroBlockSchema,
  statGridBlockSchema,
  richTextBlockSchema,
  imageFeatureBlockSchema,
  featureGridBlockSchema,
  callToActionBlockSchema,
  faqBlockSchema,
  quoteBlockSchema,
  treatmentsBlockSchema,
  doctorsBlockSchema,
] as const;

type BlockDefinition<TSchema extends z.ZodTypeAny> = {
  type: z.infer<TSchema>["type"];
  label: string;
  description?: string;
  category: "hero" | "content" | "layout" | "social" | "engagement";
  schema: TSchema;
  defaultItem: z.infer<TSchema>;
};

export const blockRegistry = {
  hero: {
    type: "hero",
    label: "Hero",
    description: "Large introductory section with optional media and primary actions.",
    category: "hero",
    schema: heroBlockSchema,
    defaultItem: {
      type: "hero",
      eyebrow: "Eyebrow",
      heading: "Craft a compelling hero headline",
      highlight: "Highlight key benefits",
      description: "Use this section to introduce the page and set context for visitors.",
      alignment: "center",
      background: "white",
      containerWidth: "default",
    },
  } satisfies BlockDefinition<typeof heroBlockSchema>,
  statGrid: {
    type: "statGrid",
    label: "Stats",
    description: "Display quick metrics or achievements in a responsive grid.",
    category: "content",
    schema: statGridBlockSchema,
    defaultItem: {
      type: "statGrid",
      columns: 4,
      emphasizeValue: true,
      items: [
        { label: "Metric", value: "100+" },
        { label: "Metric", value: "24/7" },
        { label: "Metric", value: "50+" },
        { label: "Metric", value: "98%" },
      ],
    },
  } satisfies BlockDefinition<typeof statGridBlockSchema>,
  richText: {
    type: "richText",
    label: "Rich Text",
    description: "Markdown-enabled content for longer copy blocks.",
    category: "content",
    schema: richTextBlockSchema,
    defaultItem: {
      type: "richText",
      markdown: "## Headline\n\nUse markdown to format body content and tell your story.",
      align: "start",
      width: "prose",
    },
  } satisfies BlockDefinition<typeof richTextBlockSchema>,
  imageFeature: {
    type: "imageFeature",
    label: "Image Feature",
    description: "Content paired with imagery and supporting bullets.",
    category: "layout",
    schema: imageFeatureBlockSchema,
    defaultItem: {
      type: "imageFeature",
      layout: "imageRight",
      heading: "Section headline",
      body: "Describe the value behind the imagery and support it with optional bullets.",
      image: {
        src: "/placeholder.svg",
        alt: "Placeholder image",
        rounded: true,
      },
    },
  } satisfies BlockDefinition<typeof imageFeatureBlockSchema>,
  featureGrid: {
    type: "featureGrid",
    label: "Feature Grid",
    description: "Showcase core differentiators or services in cards.",
    category: "content",
    schema: featureGridBlockSchema,
    defaultItem: {
      type: "featureGrid",
      columns: 3,
      variant: "cards",
      items: [
        { title: "Feature", description: "Tell visitors why this matters." },
        { title: "Feature", description: "Add supporting context and detail." },
        { title: "Feature", description: "Keep each item short and focused." },
      ],
    },
  } satisfies BlockDefinition<typeof featureGridBlockSchema>,
  callToAction: {
    type: "callToAction",
    label: "Call To Action",
    description: "High-impact CTA section to drive conversions.",
    category: "engagement",
    schema: callToActionBlockSchema,
    defaultItem: {
      type: "callToAction",
      layout: "centered",
      background: "muted",
      heading: "Ready to take the next step?",
      actions: [{
        label: "Book a consultation",
        href: "/consultation",
        variant: "default",
      }],
    },
  } satisfies BlockDefinition<typeof callToActionBlockSchema>,
  faq: {
    type: "faq",
    label: "FAQ",
    description: "Answer common questions in an accordion style.",
    category: "content",
    schema: faqBlockSchema,
    defaultItem: {
      type: "faq",
      layout: "twoColumn",
      items: [
        {
          question: "How does the process work?",
          answer: "Provide a concise answer that reassures the visitor and explains next steps.",
        },
        {
          question: "What services are included?",
          answer: "Highlight the breadth of support and value you deliver.",
        },
      ],
    },
  } satisfies BlockDefinition<typeof faqBlockSchema>,
  quote: {
    type: "quote",
    label: "Quote",
    description: "Spotlight a testimonial or leadership quote.",
    category: "social",
    schema: quoteBlockSchema,
    defaultItem: {
      type: "quote",
      quote: "Care N Tour made my treatment journey seamless from start to finish.",
      attribution: "Patient Name",
      role: "Procedure • Country",
    },
  } satisfies BlockDefinition<typeof quoteBlockSchema>,
  treatments: {
    type: "treatments",
    label: "Treatments",
    description: "Surface treatments dynamically from the catalog.",
    category: "content",
    schema: treatmentsBlockSchema,
    defaultItem: {
      type: "treatments",
      title: "Featured Treatments",
      description: "Highlight high-impact procedures with live data.",
      layout: "grid",
      limit: 6,
      featuredOnly: true,
    },
  } satisfies BlockDefinition<typeof treatmentsBlockSchema>,
  doctors: {
    type: "doctors",
    label: "Doctors",
    description: "Showcase specialists pulled from the directory.",
    category: "content",
    schema: doctorsBlockSchema,
    defaultItem: {
      type: "doctors",
      title: "Meet Our Doctors",
      description: "Introduce patients to experienced specialists.",
      layout: "grid",
      limit: 6,
      featuredOnly: true,
    },
  } satisfies BlockDefinition<typeof doctorsBlockSchema>,
} as const;

type Registry = typeof blockRegistry;

export type BlockType = keyof Registry;

type SchemaFor<TType extends BlockType> = Registry[TType] extends BlockDefinition<infer Schema> ? Schema : never;

export type BlockValue<TType extends BlockType = BlockType> = z.infer<SchemaFor<TType>>;

export type BlockSchema<TType extends BlockType = BlockType> = SchemaFor<TType>;

export const blockUnionSchema = z.discriminatedUnion("type", blockSchemas);

export const blockArraySchema = z.array(blockUnionSchema);

export function normalizeBlocks(raw: unknown): BlockValue[] {
  if (!raw) return [];
  try {
    return blockArraySchema.parse(raw) as BlockValue[];
  } catch (error) {
    console.warn("Failed to parse CMS blocks", error);
    return [];
  }
}

export function createDefaultBlock(type: BlockType): BlockValue {
  const def = blockRegistry[type];
  if (!def) {
    throw new Error(`Unknown block type: ${type}`);
  }
  return JSON.parse(JSON.stringify(def.defaultItem));
}

export const blockCategories = Array.from(
  new Set(Object.values(blockRegistry).map((def) => def.category)),
);

export function getBlocksByCategory(category: (typeof blockCategories)[number]) {
  return Object.values(blockRegistry).filter((def) => def.category === category);
}
