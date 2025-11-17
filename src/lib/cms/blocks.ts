import { nanoid } from "nanoid";
import { z } from "zod";

const breakpointOrder = [
  "base",
  "mobile",
  "tablet",
  "desktop",
  "full",
] as const;
const spacingScale = [
  "none",
  "xs",
  "sm",
  "md",
  "lg",
  "xl",
  "2xl",
  "3xl",
] as const;
const maxWidthScale = ["content", "wide", "full"] as const;
const horizontalAlignments = ["start", "center", "end"] as const;
const fontScaleOptions = [
  "xs",
  "sm",
  "base",
  "lg",
  "xl",
  "2xl",
  "3xl",
  "4xl",
] as const;
const fontWeightOptions = [
  "light",
  "normal",
  "medium",
  "semibold",
  "bold",
] as const;
const letterSpacingOptions = ["tight", "normal", "wide"] as const;
const backgroundVariantOptions = [
  "none",
  "solid",
  "gradient",
  "image",
  "video",
] as const;
const animationOptions = [
  "none",
  "fade",
  "slide-up",
  "slide-down",
  "slide-left",
  "slide-right",
  "zoom-in",
] as const;
const animationTriggers = ["load", "scroll"] as const;
const deviceTargets = ["mobile", "tablet", "desktop"] as const;

type Breakpoint = (typeof breakpointOrder)[number];

const responsiveSchema = <TSchema extends z.ZodTypeAny>(schema: TSchema) =>
  z
    .object({
      base: schema.optional(),
      mobile: schema.optional(),
      tablet: schema.optional(),
      desktop: schema.optional(),
      full: schema.optional(),
    })
    .optional();

const gradientStopSchema = z.object({
  color: z.string().min(1),
  position: z.number().min(0).max(100).default(50),
});

const responsiveSpacingSchema = responsiveSchema(z.enum(spacingScale));
const responsiveAlignmentSchema = responsiveSchema(
  z.enum(horizontalAlignments),
);
const responsiveMaxWidthSchema = responsiveSchema(z.enum(maxWidthScale));
const responsiveColorSchema = responsiveSchema(z.string());
const responsiveNumberSchema = responsiveSchema(z.number());
const responsiveFontScaleSchema = responsiveSchema(z.enum(fontScaleOptions));
const responsiveFontWeightSchema = responsiveSchema(z.enum(fontWeightOptions));
const responsiveLetterSpacingSchema = responsiveSchema(
  z.enum(letterSpacingOptions),
);

const mediaSchema = z.object({
  src: z.string().min(1, "Media source is required"),
  alt: z.string().optional(),
  focalPoint: z
    .object({
      x: z.number().min(0).max(100).default(50),
      y: z.number().min(0).max(100).default(50),
    })
    .optional(),
  fit: z.enum(["cover", "contain"]).default("cover"),
});

const responsiveMediaSchema = responsiveSchema(mediaSchema);

const videoSchema = z.object({
  src: z.string().min(1, "Video source is required"),
  autoplay: z.boolean().default(true),
  loop: z.boolean().default(true),
  muted: z.boolean().default(true),
  poster: z.string().optional(),
});

const responsiveVideoSchema = responsiveSchema(videoSchema);

const blockStyleObjectSchema = z.object({
  presetId: z.string().optional(),
  layout: z
    .object({
      padding: z
        .object({
          top: responsiveSpacingSchema,
          bottom: responsiveSpacingSchema,
        })
        .optional(),
      maxWidth: responsiveMaxWidthSchema,
      horizontalAlign: responsiveAlignmentSchema,
    })
    .optional(),
  background: z
    .object({
      variant: z.enum(backgroundVariantOptions).default("none"),
      color: responsiveColorSchema,
      gradient: z
        .object({
          from: z.string().optional(),
          via: z.string().optional(),
          to: z.string().optional(),
          angle: z.number().min(0).max(360).optional(),
          stops: z.array(gradientStopSchema).min(2).optional(),
          css: z.string().optional(),
        })
        .optional(),
      image: responsiveMediaSchema,
      video: responsiveVideoSchema,
      overlayOpacity: responsiveNumberSchema,
    })
    .optional(),
  typography: z
    .object({
      textColor: responsiveColorSchema,
      headingAccentColor: z.string().optional(),
      scale: responsiveFontScaleSchema,
      weight: responsiveFontWeightSchema,
      letterSpacing: responsiveLetterSpacingSchema,
    })
    .optional(),
  effects: z
    .object({
      animation: z
        .object({
          type: z.enum(animationOptions).default("none"),
          trigger: z.enum(animationTriggers).default("load"),
          delayMs: z.number().min(0).max(5000).default(0).optional(),
          durationMs: z.number().min(100).max(10000).default(500).optional(),
          once: z.boolean().default(true).optional(),
        })
        .optional(),
      parallax: z
        .object({
          strength: z.number().min(-1).max(1).default(0.2),
          axis: z.enum(["y", "x"]).default("y"),
        })
        .optional(),
    })
    .optional(),
  visibility: z
    .object({
      hideOn: z.array(z.enum(deviceTargets)).optional(),
      showOnlyOn: z.array(z.enum(deviceTargets)).optional(),
    })
    .optional(),
});

const blockStyleSchema = blockStyleObjectSchema.optional();

const actionVariants = [
  "default",
  "secondary",
  "outline",
  "ghost",
  "link",
] as const;

const linkTargetSchema = z.enum(["_self", "_blank"]).default("_self");

const actionSchema = z.object({
  label: z.string().min(1, "Action label is required"),
  href: z.string().min(1, "Action URL is required"),
  variant: z.enum(actionVariants).default("default"),
  target: linkTargetSchema.optional(),
  icon: z.string().optional(),
});

const blockAdvancedObjectSchema = z.object({
  anchorId: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/i, "Anchor ID must be URL friendly")
    .optional(),
  presetLock: z.boolean().default(false).optional(),
  customClassName: z.string().optional(),
  cta: actionSchema.optional(),
});

const blockAdvancedSchema = blockAdvancedObjectSchema.optional();

const blockMetaShape = {
  blockId: z.string().min(6, "Block id is required").optional(),
  style: blockStyleSchema,
  advanced: blockAdvancedSchema,
} as const;

const heroBlockSchema = z
  .object({
    type: z.literal("hero"),
    eyebrow: z.string().optional(),
    heading: z.string().min(1, "Heading is required"),
    highlight: z.string().optional(),
    description: z.string().optional(),
    alignment: z.enum(["left", "center"]).default("center"),
    background: z
      .enum(["white", "muted", "gradient", "primary"])
      .default("white"),
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
  })
  .extend(blockMetaShape);

const statGridBlockSchema = z
  .object({
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
  })
  .extend(blockMetaShape);

const richTextBlockSchema = z
  .object({
    type: z.literal("richText"),
    markdown: z.string().min(1, "Markdown content is required"),
    align: z.enum(["start", "center"]).default("start"),
    width: z.enum(["prose", "narrow", "full"]).default("prose"),
  })
  .extend(blockMetaShape);

const imageFeatureBlockSchema = z
  .object({
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
    image: z
      .object({
        src: z.string().min(1, "Image source is required"),
        alt: z.string().optional(),
        aspectRatio: z.string().optional(),
        rounded: z.boolean().default(true),
      })
      .nullable()
      .transform((value) => value ?? undefined)
      .optional(),
    actions: z.array(actionSchema).max(2).optional(),
  })
  .extend(blockMetaShape);

const featureGridBlockSchema = z
  .object({
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
  })
  .extend(blockMetaShape);

const logoGridBlockSchema = z
  .object({
    type: z.literal("logoGrid"),
    eyebrow: z.string().optional(),
    heading: z.string().optional(),
    description: z.string().optional(),
    columns: z.number().min(2).max(6).default(5),
    logos: z
      .array(
        z.object({
          name: z.string().min(1, "Logo name is required"),
          src: z.string().min(1, "Logo source is required"),
          href: z.string().optional(),
        }),
      )
      .min(2, "Add at least two logos"),
  })
  .extend(blockMetaShape);

const callToActionBlockSchema = z
  .object({
    type: z.literal("callToAction"),
    eyebrow: z.string().optional(),
    heading: z.string().min(1, "Heading is required"),
    description: z.string().optional(),
    layout: z.enum(["centered", "split"]).default("centered"),
    background: z
      .enum(["muted", "accent", "dark", "image", "none"])
      .default("muted"),
    image: z
      .object({
        src: z.string().min(1),
        alt: z.string().optional(),
        overlay: z.boolean().default(true),
      })
      .optional(),
    actions: z.array(actionSchema).min(1).max(2),
  })
  .extend(blockMetaShape);

const faqBlockSchema = z
  .object({
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
  })
  .extend(blockMetaShape);

const quoteBlockSchema = z
  .object({
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
  })
  .extend(blockMetaShape);

const treatmentsBlockSchema = z
  .object({
    type: z.literal("treatments"),
    title: z.string().optional(),
    description: z.string().optional(),
    layout: z.enum(["grid", "carousel"]).default("grid"),
    limit: z.number().min(1).max(12).default(6),
    featuredOnly: z.boolean().default(false),
    categories: z.array(z.string()).optional(),
    manualTreatments: z.array(z.string()).optional(),
  })
  .extend(blockMetaShape);

const doctorsBlockSchema = z
  .object({
    type: z.literal("doctors"),
    title: z.string().optional(),
    description: z.string().optional(),
    layout: z.enum(["grid", "carousel"]).default("grid"),
    limit: z.number().min(1).max(12).default(6),
    featuredOnly: z.boolean().default(false),
    specialties: z.array(z.string()).optional(),
    manualDoctors: z.array(z.string()).optional(),
  })
  .extend(blockMetaShape);

const tabbedGuideCardSchema = z.object({
  title: z.string().min(1, "Card title is required"),
  description: z.string().optional(),
  icon: z.string().optional(),
  badge: z.string().optional(),
  bullets: z.array(z.string()).optional(),
  markdown: z.string().optional(),
  helper: z.string().optional(),
  actions: z.array(actionSchema).max(2).optional(),
});

const tabbedGuideDataGridColumnSchema = z.object({
  key: z
    .string()
    .min(1, "Column key is required")
    .regex(/^[a-z0-9_-]+$/i, "Use letters, numbers, dash, or underscore"),
  label: z.string().min(1, "Column label is required"),
});

const tabbedGuideDataGridRowSchema = z.object({
  title: z.string().min(1, "Row title is required"),
  badge: z.string().optional(),
  values: z.record(z.string()),
});

const tabbedGuideCalloutSchema = z.object({
  type: z.literal("callout"),
  tone: z.enum(["info", "warning", "muted"]).default("info"),
  title: z.string().min(1, "Callout title is required"),
  body: z.string().optional(),
  bullets: z.array(z.string()).optional(),
});

const tabbedGuideMediaSpotlightSchema = z.object({
  type: z.literal("mediaSpotlight"),
  badge: z.string().optional(),
  title: z.string().min(1, "Spotlight title is required"),
  body: z.string().optional(),
  bullets: z.array(z.string()).optional(),
  image: z.object({
    src: z.string().min(1, "Image source is required"),
    alt: z.string().optional(),
    aspectRatio: z.string().optional(),
  }),
});

const tabbedGuideInfoPanelSchema = z.object({
  type: z.literal("infoPanels"),
  title: z.string().optional(),
  panels: z
    .array(
      z.object({
        title: z.string().min(1, "Panel title is required"),
        description: z.string().optional(),
        items: z.array(z.string()).optional(),
        badge: z.string().optional(),
      }),
    )
    .min(1, "Add at least one info panel"),
});

const tabbedGuideCompactListRowSchema = z.object({
  title: z.string().min(1, "Item title is required"),
  description: z.string().optional(),
  pill: z.string().optional(),
});

const tabbedGuideCompactListSchema = z.object({
  type: z.literal("compactList"),
  title: z.string().optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
  rows: z
    .array(tabbedGuideCompactListRowSchema)
    .min(1, "Add at least one item"),
});

const tabbedGuideHotelFallbackSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  amenities: z.array(z.string()).optional(),
  medicalServices: z.array(z.string()).optional(),
  priceLabel: z.string().optional(),
  locationLabel: z.string().optional(),
  icon: z.string().optional(),
  starRating: z.number().min(0).max(5).optional(),
  heroImage: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().optional(),
  website: z.string().optional(),
  rating: z.number().min(0).max(5).optional(),
  reviewCount: z.number().min(0).optional(),
  addressDetails: z.string().optional(),
});

const tabbedGuideSectionLayoutSchema = z.object({
  displayWidth: z.enum(["full", "half"]).optional(),
});

const tabbedGuideSectionSchema = z
  .discriminatedUnion("type", [
    z.object({
      type: z.literal("cardGrid"),
      title: z.string().optional(),
      description: z.string().optional(),
      columns: z.number().min(1).max(3).default(2),
      cards: z.array(tabbedGuideCardSchema).min(1, "Add at least one card"),
    }),
    z.object({
      type: z.literal("dataGrid"),
      title: z.string().optional(),
      description: z.string().optional(),
      columns: z.array(tabbedGuideDataGridColumnSchema).min(2).max(5),
      rows: z.array(tabbedGuideDataGridRowSchema).min(1),
      layout: z.enum(["cards", "stacked"]).default("cards"),
      pillColumnKey: z.string().optional(),
    }),
    tabbedGuideCalloutSchema,
    tabbedGuideMediaSpotlightSchema,
    tabbedGuideInfoPanelSchema,
    tabbedGuideCompactListSchema,
    z.object({
      type: z.literal("hotelShowcase"),
      title: z.string().optional(),
      description: z.string().optional(),
      layout: z.enum(["grid", "carousel"]).default("grid"),
      limit: z.number().min(1).max(8).default(4),
      manualFallback: z.array(tabbedGuideHotelFallbackSchema).optional(),
    }),
    z.object({
      type: z.literal("cta"),
      eyebrow: z.string().optional(),
      title: z.string().min(1, "CTA title is required"),
      description: z.string().optional(),
      actions: z.array(actionSchema).min(1).max(2),
    }),
  ])
  .and(tabbedGuideSectionLayoutSchema);

const tabbedGuideTabSchema = z.object({
  id: z
    .string()
    .min(1, "Tab ID is required")
    .regex(/^[a-z0-9-]+$/i, "Tab ID must be URL friendly"),
  label: z.string().min(1, "Tab label is required"),
  icon: z.string().optional(),
  heading: z.string().optional(),
  description: z.string().optional(),
  sections: z
    .array(tabbedGuideSectionSchema)
    .min(1, "Add at least one section"),
});

const tabbedGuideBlockSchema = z
  .object({
    type: z.literal("tabbedGuide"),
    eyebrow: z.string().optional(),
    badge: z.string().optional(),
    heading: z.string().min(1, "Heading is required"),
    description: z.string().optional(),
    tabs: z.array(tabbedGuideTabSchema).min(1, "Add at least one tab"),
  })
  .extend(blockMetaShape);

const blockSchemas = [
  heroBlockSchema,
  statGridBlockSchema,
  richTextBlockSchema,
  imageFeatureBlockSchema,
  featureGridBlockSchema,
  logoGridBlockSchema,
  callToActionBlockSchema,
  faqBlockSchema,
  quoteBlockSchema,
  treatmentsBlockSchema,
  doctorsBlockSchema,
  tabbedGuideBlockSchema,
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
    description:
      "Large introductory section with optional media and primary actions.",
    category: "hero",
    schema: heroBlockSchema,
    defaultItem: {
      type: "hero",
      eyebrow: "Eyebrow",
      heading: "Craft a compelling hero headline",
      highlight: "Highlight key benefits",
      description:
        "Use this section to introduce the page and set context for visitors.",
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
      markdown:
        "## Headline\n\nUse markdown to format body content and tell your story.",
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
  logoGrid: {
    type: "logoGrid",
    label: "Logo Grid",
    description: "Display partner or certification logos in a responsive grid.",
    category: "content",
    schema: logoGridBlockSchema,
    defaultItem: {
      type: "logoGrid",
      columns: 5,
      logos: [
        { name: "Partner", src: "/logos/logo-1.svg" },
        { name: "Partner", src: "/logos/logo-2.svg" },
        { name: "Partner", src: "/logos/logo-3.svg" },
        { name: "Partner", src: "/logos/logo-4.svg" },
      ],
    },
  } satisfies BlockDefinition<typeof logoGridBlockSchema>,
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
      actions: [
        {
          label: "Book a consultation",
          href: "/consultation",
          variant: "default",
        },
      ],
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
          answer:
            "Provide a concise answer that reassures the visitor and explains next steps.",
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
      quote:
        "Care N Tour made my treatment journey seamless from start to finish.",
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
  tabbedGuide: {
    type: "tabbedGuide",
    label: "Tabbed Travel Guide",
    description:
      "Create multi-tab travel or operations guides with rich content sections.",
    category: "content",
    schema: tabbedGuideBlockSchema,
    defaultItem: {
      type: "tabbedGuide",
      eyebrow: "Travel Information",
      badge: "Medical Tourism",
      heading: "Everything you need before flying to Egypt",
      description:
        "Visas, accommodation, culture insights, and practical logistics organized into intuitive tabs.",
      tabs: [
        {
          id: "visa-entry",
          label: "Visa & Entry",
          icon: "FileText",
          heading: "Visa & Entry Requirements",
          description:
            "Simple options whether you prefer to apply in advance or on arrival.",
          sections: [
            {
              type: "cardGrid",
              columns: 2,
              cards: [
                {
                  title: "E-Visa (Recommended)",
                  description:
                    "Apply online before travel for a smoother arrival.",
                  icon: "Globe",
                  bullets: [
                    "Processing: 7 business days",
                    "Valid: 30 days single entry",
                    "Cost: $25 USD",
                  ],
                  actions: [
                    {
                      label: "Apply online",
                      href: "https://visa2egypt.gov.eg/",
                      variant: "outline",
                      target: "_blank",
                    },
                  ],
                },
                {
                  title: "Visa on Arrival",
                  description:
                    "Quick processing directly at Cairo International Airport.",
                  icon: "Plane",
                  bullets: [
                    "Processing: Instant at airport",
                    "Valid: 30 days single entry",
                    "Cost: $25 USD cash",
                  ],
                  actions: [
                    {
                      label: "Learn more",
                      href: "/contact",
                      variant: "outline",
                    },
                  ],
                },
              ],
            },
            {
              type: "dataGrid",
              title: "Visa Requirements by Country",
              columns: [
                { key: "requirement", label: "Requirement" },
                { key: "duration", label: "Duration" },
                { key: "process", label: "Process" },
                { key: "cost", label: "Cost" },
              ],
              rows: [
                {
                  title: "European Union",
                  values: {
                    requirement: "Tourist visa",
                    duration: "30 days",
                    process: "Visa on arrival / e-visa",
                    cost: "$25",
                  },
                },
                {
                  title: "United States",
                  values: {
                    requirement: "Tourist visa",
                    duration: "30 days",
                    process: "E-visa recommended",
                    cost: "$25",
                  },
                },
                {
                  title: "GCC Countries",
                  values: {
                    requirement: "Visa free",
                    duration: "90 days",
                    process: "Passport only",
                    cost: "Free",
                  },
                },
              ],
            },
            {
              type: "callout",
              tone: "warning",
              title: "Important notes",
              bullets: [
                "Passport must be valid for 6+ months.",
                "Medical visa extensions available for treatment plans.",
                "Travel insurance strongly recommended.",
              ],
            },
          ],
        },
        {
          id: "accommodation",
          label: "Accommodation",
          icon: "Hotel",
          heading: "Recovery-ready accommodation",
          description:
            "Hand-picked partner hotels and serviced apartments near leading hospitals.",
          sections: [
            {
              type: "mediaSpotlight",
              badge: "Concierge",
              title: "Accommodation booking service",
              body: "We handle reservations, airport transfers, and special requests so you can focus on recovery.",
              bullets: [
                "Pre-arrival confirmation",
                "Medical-friendly locations",
                "Airport transfers",
                "24/7 support",
              ],
              image: {
                src: "/accommodation-egypt.jpg",
                alt: "Premium accommodation",
              },
            },
            {
              type: "hotelShowcase",
              title: "Featured partner stays",
              description:
                "Automatically pulls partner hotels. Provide manual entries as fallback.",
              limit: 4,
              manualFallback: [
                {
                  title: "Luxury Medical Hotels",
                  description:
                    "5-star partners with on-site nursing and recovery suites.",
                  amenities: [
                    "Medical concierge",
                    "24/7 nursing",
                    "Specialized diet",
                  ],
                  priceLabel: "$150 - $300/night",
                  locationLabel: "New Cairo, Zamalek",
                  icon: "Hotel",
                },
                {
                  title: "Serviced Apartments",
                  description: "Fully furnished stays for extended recovery.",
                  amenities: ["Kitchen", "Laundry", "Living areas"],
                  priceLabel: "$50 - $120/night",
                  locationLabel: "Maadi, Zamalek",
                  icon: "Building",
                },
              ],
            },
          ],
        },
        {
          id: "about-egypt",
          label: "About Egypt",
          icon: "MapPin",
          heading: "What to expect in Egypt",
          description:
            "Climate snapshots, cultural nuances, and financial basics to make planning easy.",
          sections: [
            {
              type: "infoPanels",
              panels: [
                {
                  title: "Climate",
                  items: [
                    "Winter (Dec-Feb): 15-25°C, ideal for recovery",
                    "Summer (Jun-Aug): 25-35°C, dry heat with AC everywhere",
                  ],
                },
                {
                  title: "Culture & Language",
                  items: [
                    "English widely spoken in medical settings",
                    "Warm hospitality and family-friendly care",
                  ],
                },
                {
                  title: "Currency",
                  items: [
                    "Egyptian Pound (EGP)",
                    "1 USD ≈ 50 EGP",
                    "Cards + ATMs widely available",
                  ],
                },
              ],
            },
          ],
        },
        {
          id: "practical",
          label: "Practical Info",
          icon: "Plane",
          heading: "Transportation & logistics",
          description:
            "On-ground transportation, communication, and emergency contacts.",
          sections: [
            {
              type: "cardGrid",
              columns: 2,
              cards: [
                {
                  title: "Transportation",
                  icon: "Car",
                  bullets: [
                    "Airport transfer: $20-30",
                    "Taxi/Uber across Cairo: $5-15",
                    "Private driver daily service available",
                  ],
                },
                {
                  title: "Communication",
                  icon: "Wifi",
                  bullets: [
                    "Free WiFi in partner hotels and clinics",
                    "Tourist SIM cards at airport arrivals",
                    "Emergency numbers: Police 122, Ambulance 123",
                  ],
                },
              ],
            },
            {
              type: "cta",
              eyebrow: "Need assistance?",
              title: "Speak with our travel coordination team",
              description:
                "Visa paperwork, accommodation, and recovery support handled end-to-end.",
              actions: [
                { label: "Contact travel team", href: "/contact" },
                {
                  label: "Download travel guide",
                  href: "/travel-info",
                  variant: "outline",
                },
              ],
            },
          ],
        },
      ],
    },
  } satisfies BlockDefinition<typeof tabbedGuideBlockSchema>,
} as const;

type Registry = typeof blockRegistry;

export type BlockType = keyof Registry;

type SchemaFor<TType extends BlockType> =
  Registry[TType] extends BlockDefinition<infer Schema> ? Schema : never;

export const blockBreakpoints = breakpointOrder;
export type BreakpointKey = Breakpoint;
export type ResponsiveValue<T> = Partial<Record<BreakpointKey, T>>;
export type BlockStyle = z.infer<typeof blockStyleObjectSchema>;
export type BlockAdvancedSettings = z.infer<typeof blockAdvancedObjectSchema>;
export type BlockMedia = z.infer<typeof mediaSchema>;
export type BlockVideo = z.infer<typeof videoSchema>;
export const blockSpacingScale = spacingScale;
export const blockMaxWidthScale = maxWidthScale;
export const blockHorizontalAlignmentOptions = horizontalAlignments;
export const blockFontScaleOptions = fontScaleOptions;
export const blockFontWeightOptions = fontWeightOptions;
export const blockLetterSpacingOptions = letterSpacingOptions;
export const blockBackgroundVariants = backgroundVariantOptions;
export const blockAnimationTypes = animationOptions;
export const blockAnimationTriggerOptions = animationTriggers;
export const blockDeviceVisibilityTargets = deviceTargets;
export const blockActionVariants = actionVariants;

export type BlockValue<TType extends BlockType = BlockType> = z.infer<
  SchemaFor<TType>
>;
export type BlockInstance<TType extends BlockType = BlockType> =
  BlockValue<TType> & {
    blockId: string;
  };
export type BlockSchema<TType extends BlockType = BlockType> = SchemaFor<TType>;
export type TabbedGuideSection = z.infer<typeof tabbedGuideSectionSchema>;
export type TabbedGuideTab = z.infer<typeof tabbedGuideTabSchema>;
export type TabbedGuideHotelSection = Extract<
  TabbedGuideSection,
  { type: "hotelShowcase" }
>;

export const blockUnionSchema = z.discriminatedUnion("type", blockSchemas);

export const blockArraySchema = z.array(blockUnionSchema);

function ensureBlockIdentity<TType extends BlockType>(
  block: BlockValue<TType>,
): BlockInstance<TType> {
  if (block.blockId && block.blockId.length >= 6) {
    return block as BlockInstance<TType>;
  }
  return {
    ...block,
    blockId: nanoid(),
  } as BlockInstance<TType>;
}

function cloneBlock<TType extends BlockType>(
  block: BlockValue<TType>,
): BlockValue<TType> {
  return JSON.parse(JSON.stringify(block)) as BlockValue<TType>;
}

export function cloneBlockWithNewId<TType extends BlockType>(
  block: BlockValue<TType>,
): BlockInstance<TType> {
  const cloned = cloneBlock(block);
  return {
    ...cloned,
    blockId: nanoid(),
  } as BlockInstance<TType>;
}

export function normalizeBlocks(raw: unknown): BlockInstance[] {
  if (!raw) return [];
  try {
    const parsed = blockArraySchema.parse(raw) as BlockValue[];
    return parsed.map((block) => ensureBlockIdentity(block));
  } catch (error) {
    console.warn("Failed to parse CMS blocks", error);
    return [];
  }
}

export function createDefaultBlock<TType extends BlockType>(
  type: TType,
): BlockInstance<TType> {
  const def = blockRegistry[type];
  if (!def) {
    throw new Error(`Unknown block type: ${type}`);
  }
  const block = cloneBlock(def.defaultItem as BlockValue<TType>);
  return ensureBlockIdentity(block);
}

export const blockCategories = Array.from(
  new Set(Object.values(blockRegistry).map((def) => def.category)),
);

export function getBlocksByCategory(
  category: (typeof blockCategories)[number],
) {
  return Object.values(blockRegistry).filter(
    (def) => def.category === category,
  );
}

type UnknownRecord = Record<string, unknown>;

function sanitizeAvatar(raw: unknown) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return undefined;
  }
  const avatar = { ...(raw as UnknownRecord) };
  const srcValue = avatar.src;
  const src =
    typeof srcValue === "string"
      ? srcValue.trim()
      : typeof srcValue === "undefined" || srcValue === null
        ? ""
        : String(srcValue);

  if (!src) {
    return undefined;
  }

  const cleaned: UnknownRecord = { ...avatar, src };
  if (typeof cleaned.alt === "string") {
    const alt = cleaned.alt.trim();
    if (!alt) {
      delete cleaned.alt;
    } else {
      cleaned.alt = alt;
    }
  }
  return cleaned;
}

function sanitizeBlock(raw: unknown): unknown {
  if (Array.isArray(raw)) {
    return raw.map((item) => sanitizeBlock(item));
  }
  if (!raw || typeof raw !== "object") {
    return raw;
  }

  const block = { ...(raw as UnknownRecord) };

  if ("avatar" in block) {
    const cleanedAvatar = sanitizeAvatar(block.avatar);
    if (cleanedAvatar) {
      block.avatar = cleanedAvatar;
    } else {
      delete block.avatar;
    }
  }

  for (const key of Object.keys(block)) {
    if (key === "avatar") continue;
    const value = block[key];
    if (Array.isArray(value) || (value && typeof value === "object")) {
      block[key] = sanitizeBlock(value);
    }
  }

  return block;
}

export function sanitizeCmsBlocks(raw: unknown): unknown {
  if (!Array.isArray(raw)) return raw;
  return (raw as unknown[]).map((block) => sanitizeBlock(block));
}
