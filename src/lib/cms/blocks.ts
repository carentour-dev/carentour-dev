import { nanoid } from "nanoid";
import { z } from "zod";
import { DEFAULT_HERO_OVERLAY } from "@/lib/heroOverlay";
import { buildCallToActionBaseStyle } from "@/lib/cms/callToActionStyle";

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
  "hero",
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

const heroOverlaySchema = z.object({
  fromColor: z.string().default(DEFAULT_HERO_OVERLAY.fromColor),
  fromOpacity: z
    .number()
    .min(0)
    .max(1)
    .default(DEFAULT_HERO_OVERLAY.fromOpacity),
  viaColor: z.string().default(DEFAULT_HERO_OVERLAY.viaColor),
  viaOpacity: z.number().min(0).max(1).default(DEFAULT_HERO_OVERLAY.viaOpacity),
  toColor: z.string().default(DEFAULT_HERO_OVERLAY.toColor),
  toOpacity: z.number().min(0).max(1).default(DEFAULT_HERO_OVERLAY.toOpacity),
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
      .enum([
        "white",
        "muted",
        "gradient",
        "primary",
        "layeredLinear",
        "layeredGlow",
      ])
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

const homeHeroBlockSchema = z
  .object({
    type: z.literal("homeHero"),
    eyebrow: z.string().min(1, "Eyebrow is required"),
    headingPrefix: z.string().min(1, "Heading prefix is required"),
    headingHighlight: z.string().min(1, "Heading highlight is required"),
    headingSuffix: z.string().min(1, "Heading suffix is required"),
    description: z.string().min(1, "Description is required"),
    backgroundImageUrl: z.string().optional(),
    overlay: heroOverlaySchema.default(DEFAULT_HERO_OVERLAY),
    highlights: z
      .array(
        z.object({
          kicker: z.string().min(1, "Kicker is required"),
          label: z.string().min(1, "Label is required"),
        }),
      )
      .max(4, "Use up to four highlights")
      .default([]),
    primaryAction: actionSchema,
    secondaryAction: actionSchema,
  })
  .extend(blockMetaShape);

const aboutHeroBlockSchema = z
  .object({
    type: z.literal("aboutHero"),
    eyebrow: z.string().optional(),
    heading: z.string().min(1, "Heading is required"),
    description: z.string().optional(),
    backgroundImageUrl: z.string().min(1, "Background image is required"),
    overlay: heroOverlaySchema.default(DEFAULT_HERO_OVERLAY),
    highlights: z
      .array(
        z.object({
          kicker: z.string().min(1, "Kicker is required"),
          label: z.string().min(1, "Label is required"),
        }),
      )
      .min(1, "Add at least one highlight")
      .max(4, "Use up to four highlights"),
    primaryAction: actionSchema.optional(),
    secondaryAction: actionSchema.optional(),
  })
  .extend(blockMetaShape);

const featuredTreatmentsHomeBlockSchema = z
  .object({
    type: z.literal("featuredTreatmentsHome"),
    eyebrow: z.string().optional(),
    title: z.string().optional(),
    description: z.string().optional(),
    cardAppearance: z.enum(["original", "theme"]).default("original"),
    limit: z.number().min(1).max(12).default(12),
    featuredOnly: z.boolean().default(true),
    manualTreatments: z.array(z.string()).optional(),
  })
  .extend(blockMetaShape)
  .extend({
    style: blockStyleObjectSchema.default({
      background: {
        variant: "solid",
        color: {
          base: "hsl(var(--background))",
        },
        overlayOpacity: {
          base: 0,
        },
      },
    }),
  });

const journeyStepItemSchema = z.object({
  title: z.string().min(1, "Step title is required"),
  description: z.string().min(1, "Step description is required"),
  icon: z.string().min(1, "Icon is required"),
});

const journeyStepsBlockSchema = z
  .object({
    type: z.literal("journeySteps"),
    title: z.string().min(1, "Title is required"),
    highlight: z.string().min(1, "Highlight is required"),
    description: z.string().min(1, "Description is required"),
    steps: z.array(journeyStepItemSchema).min(1, "Add at least one step"),
  })
  .extend(blockMetaShape);

const differentiatorItemSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  highlight: z.string().min(1, "Highlight is required"),
  icon: z.string().min(1, "Icon is required"),
});

const differentiatorsBlockSchema = z
  .object({
    type: z.literal("differentiators"),
    eyebrow: z.string().min(1, "Eyebrow is required"),
    title: z.string().min(1, "Title is required"),
    highlight: z.string().min(1, "Highlight is required"),
    description: z.string().min(1, "Description is required"),
    items: z
      .array(differentiatorItemSchema)
      .min(1, "Add at least one differentiator"),
  })
  .extend(blockMetaShape);

const homeCtaBlockSchema = z
  .object({
    type: z.literal("homeCta"),
    headingPrefix: z.string().min(1, "Heading prefix is required"),
    headingHighlight: z.string().min(1, "Heading highlight is required"),
    description: z.string().min(1, "Description is required"),
    primaryAction: actionSchema,
    secondaryAction: actionSchema,
  })
  .extend(blockMetaShape);

const storyNarrativeBlockSchema = z
  .object({
    type: z.literal("storyNarrative"),
    eyebrow: z.string().optional(),
    heading: z.string().min(1, "Heading is required"),
    lead: z.string().min(1, "Lead is required"),
    paragraphs: z.array(z.string().min(1)).min(1, "Add at least one paragraph"),
    strengthsTitle: z.string().min(1, "Strengths title is required"),
    strengths: z
      .array(
        z.object({
          title: z.string().min(1, "Title is required"),
          description: z.string().optional(),
        }),
      )
      .min(1, "Add at least one strength"),
    closing: z.string().optional(),
  })
  .extend(blockMetaShape);

const missionVisionValuesBlockSchema = z
  .object({
    type: z.literal("missionVisionValues"),
    eyebrow: z.string().optional(),
    heading: z.string().optional(),
    description: z.string().optional(),
    missionTitle: z.string().min(1, "Mission title is required"),
    missionBody: z.string().min(1, "Mission copy is required"),
    missionAccentPreset: z
      .enum(["neutral", "warm", "sage", "sky", "brand", "none"])
      .default("neutral"),
    visionTitle: z.string().min(1, "Vision title is required"),
    visionBody: z.string().min(1, "Vision copy is required"),
    visionAccentPreset: z
      .enum(["neutral", "warm", "sage", "sky", "brand", "none"])
      .default("warm"),
    valuesTitle: z.string().min(1, "Values title is required"),
    valuesDescription: z.string().optional(),
    values: z
      .array(
        z.object({
          title: z.string().min(1, "Value title is required"),
          description: z.string().min(1, "Value description is required"),
          icon: z.string().optional(),
        }),
      )
      .min(1, "Add at least one value")
      .max(6, "Use up to six values"),
  })
  .extend(blockMetaShape);

const trustSignalsBlockSchema = z
  .object({
    type: z.literal("trustSignals"),
    eyebrow: z.string().optional(),
    heading: z.string().min(1, "Heading is required"),
    description: z.string().optional(),
    items: z
      .array(
        z.object({
          eyebrow: z.string().optional(),
          title: z.string().min(1, "Title is required"),
          description: z.string().min(1, "Description is required"),
          icon: z.string().optional(),
        }),
      )
      .min(1, "Add at least one signal")
      .max(6, "Use up to six signals"),
  })
  .extend(blockMetaShape);

const leadershipGridBlockSchema = z
  .object({
    type: z.literal("leadershipGrid"),
    eyebrow: z.string().optional(),
    heading: z.string().optional(),
    description: z.string().optional(),
    people: z
      .array(
        z.object({
          name: z.string().min(1, "Name is required"),
          role: z.string().min(1, "Role is required"),
          bio: z.string().min(1, "Bio is required"),
          image: z.string().optional(),
          languages: z.array(z.string().min(1)).optional(),
          expertise: z.array(z.string().min(1)).optional(),
        }),
      )
      .min(1, "Add at least one person"),
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

const advisoryNoticeBlockSchema = z
  .object({
    type: z.literal("advisoryNotice"),
    eyebrow: z.string().optional(),
    heading: z.string().min(1, "Heading is required"),
    description: z.string().optional(),
    tone: z.enum(["neutral", "info", "warning"]).default("neutral"),
    lastReviewed: z.string().optional(),
    appliesTo: z.string().optional(),
    planningScope: z.string().optional(),
    disclaimer: z.string().optional(),
    items: z
      .array(z.string().min(1, "Bullet text is required"))
      .min(1, "Add at least one advisory bullet")
      .max(6, "Use up to six advisory bullets")
      .optional(),
    actions: z.array(actionSchema).min(1).max(2).optional(),
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

const dataGridBlockSchema = z
  .object({
    type: z.literal("dataGrid"),
    eyebrow: z.string().optional(),
    heading: z.string().optional(),
    description: z.string().optional(),
    columns: z
      .array(
        z.object({
          key: z
            .string()
            .min(1, "Column key is required")
            .regex(
              /^[a-z0-9_-]+$/i,
              "Use letters, numbers, dash, or underscore",
            ),
          label: z.string().min(1, "Column label is required"),
        }),
      )
      .min(2)
      .max(5),
    rows: z
      .array(
        z.object({
          title: z.string().min(1, "Row title is required"),
          badge: z.string().optional(),
          values: z.record(z.string()),
        }),
      )
      .min(1),
    layout: z.enum(["cards", "stacked"]).default("cards"),
    pillColumnKey: z.string().optional(),
  })
  .extend(blockMetaShape);

const infoPanelsBlockSchema = z
  .object({
    type: z.literal("infoPanels"),
    eyebrow: z.string().optional(),
    heading: z.string().optional(),
    description: z.string().optional(),
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
  })
  .extend(blockMetaShape);

const hotelShowcaseBlockSchema = z
  .object({
    type: z.literal("hotelShowcase"),
    eyebrow: z.string().optional(),
    heading: z.string().optional(),
    description: z.string().optional(),
    layout: z.enum(["grid", "carousel"]).default("grid"),
    items: z
      .array(
        z.object({
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
        }),
      )
      .min(1),
  })
  .extend(blockMetaShape);

const serviceCatalogBlockSchema = z
  .object({
    type: z.literal("serviceCatalog"),
    eyebrow: z.string().optional(),
    heading: z.string().optional(),
    description: z.string().optional(),
    items: z
      .array(
        z.object({
          title: z.string().min(1, "Title is required"),
          description: z.string().optional(),
          icon: z.string().optional(),
          availability: z.string().optional(),
          note: z.string().optional(),
          bullets: z
            .array(z.string().min(1, "Bullet text is required"))
            .min(1, "Add at least one service detail")
            .max(8, "Use up to eight service details")
            .optional(),
          languages: z.array(z.string().min(1)).optional(),
          action: actionSchema.optional(),
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

const startJourneyEmbedBlockSchema = z
  .object({
    type: z.literal("startJourneyEmbed"),
    eyebrow: z.string().optional(),
    heading: z.string().min(1, "Heading is required"),
    description: z.string().optional(),
    supportCardTitle: z.string().optional(),
    supportCardDescription: z.string().optional(),
    supportBullets: z
      .array(z.string().min(1, "Bullet text is required"))
      .min(1, "Add at least one support bullet")
      .max(6, "Use up to six support bullets"),
    responseTimeLabel: z.string().optional(),
    reassuranceLabel: z.string().optional(),
    successRedirectHref: z.string().optional(),
  })
  .extend(blockMetaShape);

const contactFormChannelSchema = z.object({
  icon: z.string().optional(),
  title: z.string().min(1, "Channel title is required"),
  content: z.string().min(1, "Channel content is required"),
  description: z.string().optional(),
  href: z.string().optional(),
  target: linkTargetSchema.optional(),
  schemaContactType: z.string().optional(),
});

const contactFormLabelsSchema = z.object({
  firstName: z.string().min(1, "First name label is required"),
  lastName: z.string().min(1, "Last name label is required"),
  email: z.string().min(1, "Email label is required"),
  phone: z.string().min(1, "Phone label is required"),
  country: z.string().min(1, "Country label is required"),
  treatment: z.string().min(1, "Treatment label is required"),
  message: z.string().min(1, "Message label is required"),
});

const contactFormPlaceholdersSchema = z.object({
  firstName: z.string().min(1, "First name placeholder is required"),
  lastName: z.string().min(1, "Last name placeholder is required"),
  email: z.string().min(1, "Email placeholder is required"),
  phone: z.string().min(1, "Phone placeholder is required"),
  country: z.string().min(1, "Country placeholder is required"),
  treatment: z.string().min(1, "Treatment placeholder is required"),
  message: z.string().min(1, "Message placeholder is required"),
});

const contactFormEmbedBlockSchema = z
  .object({
    type: z.literal("contactFormEmbed"),
    eyebrow: z.string().optional(),
    heading: z.string().min(1, "Heading is required"),
    description: z.string().optional(),
    channelsHeading: z.string().optional(),
    channelsDescription: z.string().optional(),
    channels: z
      .array(contactFormChannelSchema)
      .min(1, "Add at least one contact channel")
      .max(6, "Use up to six contact channels"),
    supportHeading: z.string().optional(),
    supportDescription: z.string().optional(),
    supportItems: z
      .array(z.string().min(1, "Support item text is required"))
      .max(6, "Use up to six support items")
      .optional(),
    formTitle: z.string().min(1, "Form title is required"),
    formDescription: z.string().optional(),
    labels: contactFormLabelsSchema,
    placeholders: contactFormPlaceholdersSchema,
    submitLabel: z.string().min(1, "Submit label is required"),
    submittingLabel: z.string().min(1, "Submitting label is required"),
    responseTimeLabel: z.string().optional(),
    reassuranceLabel: z.string().optional(),
    privacyNote: z.string().optional(),
    successTitle: z.string().optional(),
    successDescription: z.string().optional(),
    errorTitle: z.string().optional(),
    errorDescription: z.string().optional(),
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

const faqDirectoryBlockSchema = z
  .object({
    type: z.literal("faqDirectory"),
    eyebrow: z.string().optional(),
    heading: z.string().optional(),
    description: z.string().optional(),
    layout: z.enum(["sidebar", "stacked"]).default("sidebar"),
    navigationHeading: z.string().default("Browse by topic"),
    showSearch: z.boolean().default(true),
    showCategoryDescriptions: z.boolean().default(true),
    showSourceBadge: z.boolean().default(true),
    searchPlaceholder: z
      .string()
      .default(
        "Search questions about treatments, travel, pricing, safety, or recovery",
      ),
    emptyStateHeading: z.string().default("No questions match your search"),
    emptyStateDescription: z
      .string()
      .default(
        "Try a broader keyword or clear the search to browse every topic.",
      ),
    clearSearchLabel: z.string().default("Clear search"),
  })
  .extend(blockMetaShape);

const medicalFacilitiesDirectoryFilterLabelsSchema = z.object({
  search: z.string().default("Search"),
  country: z.string().default("Country"),
  city: z.string().default("City"),
  specialty: z.string().default("Specialty"),
  procedure: z.string().default("Procedure"),
});

const medicalFacilitiesDirectoryFilterPlaceholdersSchema = z.object({
  country: z.string().default("All countries"),
  city: z.string().default("All cities"),
  specialty: z.string().default("All specialties"),
  procedure: z.string().default("All procedures"),
});

const medicalFacilitiesDirectoryFilterSearchSchema = z.object({
  country: z.string().default("Search countries..."),
  city: z.string().default("Search cities..."),
  specialty: z.string().default("Search specialties..."),
  procedure: z.string().default("Search procedures..."),
});

const medicalFacilitiesDirectoryFilterEmptySchema = z.object({
  country: z.string().default("No countries found."),
  city: z.string().default("No cities found."),
  specialty: z.string().default("No specialties found."),
  procedure: z.string().default("No procedures found."),
});

const medicalFacilitiesDirectoryTrustCalloutSchema = z.object({
  eyebrow: z.string().default("Trusted providers"),
  title: z.string().default("Curated and vetted by Care N Tour"),
  description: z
    .string()
    .default(
      "We present live facility data inside a care model designed for international patients, multidisciplinary planning, and clear next steps.",
    ),
});

const medicalFacilitiesDirectoryStateCopySchema = z.object({
  resultsIntro: z
    .string()
    .default(
      "Explore live medical facilities across Egypt and refine the list using your preferred location, specialty, or procedure.",
    ),
  resultsCountLabel: z.string().default("facilities available"),
  loading: z.string().default("Loading medical facilities..."),
  updating: z.string().default("Updating results..."),
  emptyHeading: z.string().default("No medical facilities found"),
  emptyDescription: z
    .string()
    .default("Adjust your filters to see more options."),
  errorTitle: z.string().default("Unable to load medical facilities"),
  errorDescription: z.string().default("Please try again later."),
});

const medicalFacilitiesDirectoryCardLabelsSchema = z.object({
  specialties: z.string().default("Specialties"),
  procedures: z.string().default("Procedures"),
  facilities: z.string().default("Facilities provided"),
  amenities: z.string().default("Amenities"),
  contact: z.string().default("Contact"),
  primaryCta: z.string().default("Start your journey"),
  viewProfile: z.string().default("View profile"),
  reviewsSuffix: z.string().default("reviews"),
  fallbackMeta: z.string().default("Partner facility"),
  partnerBadge: z.string().default("Partner facility"),
});

const medicalFacilitiesDirectoryBlockSchema = z
  .object({
    type: z.literal("medicalFacilitiesDirectory"),
    eyebrow: z.string().optional(),
    heading: z.string().optional(),
    description: z.string().optional(),
    trustCallout: medicalFacilitiesDirectoryTrustCalloutSchema.default({
      eyebrow: "Trusted providers",
      title: "Curated and vetted by Care N Tour",
      description:
        "We present live facility data inside a care model designed for international patients, multidisciplinary planning, and clear next steps.",
    }),
    searchPlaceholder: z
      .string()
      .default("Search by facility, country, city, specialty, or procedure..."),
    filterLabels: medicalFacilitiesDirectoryFilterLabelsSchema.default({
      search: "Search",
      country: "Country",
      city: "City",
      specialty: "Specialty",
      procedure: "Procedure",
    }),
    filterPlaceholders:
      medicalFacilitiesDirectoryFilterPlaceholdersSchema.default({
        country: "All countries",
        city: "All cities",
        specialty: "All specialties",
        procedure: "All procedures",
      }),
    filterSearchPlaceholders:
      medicalFacilitiesDirectoryFilterSearchSchema.default({
        country: "Search countries...",
        city: "Search cities...",
        specialty: "Search specialties...",
        procedure: "Search procedures...",
      }),
    filterEmptyCopy: medicalFacilitiesDirectoryFilterEmptySchema.default({
      country: "No countries found.",
      city: "No cities found.",
      specialty: "No specialties found.",
      procedure: "No procedures found.",
    }),
    clearButtonLabel: z.string().default("Clear filters"),
    states: medicalFacilitiesDirectoryStateCopySchema.default({
      resultsIntro:
        "Explore live medical facilities across Egypt and refine the list using your preferred location, specialty, or procedure.",
      resultsCountLabel: "facilities available",
      loading: "Loading medical facilities...",
      updating: "Updating results...",
      emptyHeading: "No medical facilities found",
      emptyDescription: "Adjust your filters to see more options.",
      errorTitle: "Unable to load medical facilities",
      errorDescription: "Please try again later.",
    }),
    cardLabels: medicalFacilitiesDirectoryCardLabelsSchema.default({
      specialties: "Specialties",
      procedures: "Procedures",
      facilities: "Facilities provided",
      amenities: "Amenities",
      contact: "Contact",
      primaryCta: "Start your journey",
      viewProfile: "View profile",
      reviewsSuffix: "reviews",
      fallbackMeta: "Partner facility",
      partnerBadge: "Partner facility",
    }),
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

const medicalFacilityProfileSectionTitlesSchema = z.object({
  overview: z.string().default("About this facility"),
  specialties: z.string().default("Specialties"),
  procedures: z.string().default("Procedures"),
  facilities: z.string().default("Facilities provided"),
  amenities: z.string().default("Amenities"),
  infrastructure: z.string().default("Infrastructure & technology"),
  gallery: z.string().default("Gallery"),
  keyDetails: z.string().default("Key details"),
  contact: z.string().default("Contact & location"),
});

const medicalFacilityProfileSectionDescriptionsSchema = z.object({
  overview: z.string().optional(),
  specialties: z.string().optional(),
  procedures: z.string().optional(),
  facilities: z.string().optional(),
  amenities: z.string().optional(),
  infrastructure: z.string().optional(),
  gallery: z.string().optional(),
  keyDetails: z.string().optional(),
  contact: z.string().optional(),
});

const medicalFacilityProfileLabelsSchema = z.object({
  backLink: z.string().default("Back to Medical Facilities"),
  partnerBadge: z.string().default("Partner facility"),
  reviewsSuffix: z.string().default("reviews"),
  facilityType: z.string().default("Facility type"),
  location: z.string().default("Location"),
  partner: z.string().default("Partner"),
  rating: z.string().default("Rating"),
  reviews: z.string().default("Reviews"),
  phone: z.string().default("Phone"),
  email: z.string().default("Email"),
  website: z.string().default("Website"),
  whatsapp: z.string().default("WhatsApp"),
  address: z.string().default("Address"),
  coordinates: z.string().default("Coordinates"),
  unavailable: z.string().default("Not available"),
  yes: z.string().default("Yes"),
  no: z.string().default("No"),
});

const medicalFacilityProfileCtasSchema = z.object({
  secondary: z.string().default("Contact"),
  primary: z.string().default("Start your journey"),
});

const medicalFacilityProfileFallbacksSchema = z.object({
  loading: z.string().default("Loading medical facility..."),
  updating: z.string().default("Updating latest details..."),
  notFoundHeading: z.string().default("Medical facility not found"),
  notFoundDescription: z
    .string()
    .default(
      "The facility you are looking for may have been removed or is not available to view.",
    ),
  noOverview: z
    .string()
    .default(
      "Care N Tour can provide more context on this facility during your planning conversation.",
    ),
});

const medicalFacilityProfileBlockSchema = z
  .object({
    type: z.literal("medicalFacilityProfile"),
    eyebrow: z.string().optional(),
    trustStatement: z.string().optional(),
    sectionTitles: medicalFacilityProfileSectionTitlesSchema.default({
      overview: "About this facility",
      specialties: "Specialties",
      procedures: "Procedures",
      facilities: "Facilities provided",
      amenities: "Amenities",
      infrastructure: "Infrastructure & technology",
      gallery: "Gallery",
      keyDetails: "Key details",
      contact: "Contact & location",
    }),
    sectionDescriptions:
      medicalFacilityProfileSectionDescriptionsSchema.default({}),
    labels: medicalFacilityProfileLabelsSchema.default({
      backLink: "Back to Medical Facilities",
      partnerBadge: "Partner facility",
      reviewsSuffix: "reviews",
      facilityType: "Facility type",
      location: "Location",
      partner: "Partner",
      rating: "Rating",
      reviews: "Reviews",
      phone: "Phone",
      email: "Email",
      website: "Website",
      whatsapp: "WhatsApp",
      address: "Address",
      coordinates: "Coordinates",
      unavailable: "Not available",
      yes: "Yes",
      no: "No",
    }),
    ctas: medicalFacilityProfileCtasSchema.default({
      secondary: "Contact",
      primary: "Start your journey",
    }),
    fallbacks: medicalFacilityProfileFallbacksSchema.default({
      loading: "Loading medical facility...",
      updating: "Updating latest details...",
      notFoundHeading: "Medical facility not found",
      notFoundDescription:
        "The facility you are looking for may have been removed or is not available to view.",
      noOverview:
        "Care N Tour can provide more context on this facility during your planning conversation.",
    }),
  })
  .extend(blockMetaShape);

const treatmentSpecialtyOverrideSchema = z.object({
  treatmentSlug: z.string().min(1, "Treatment slug is required"),
  icon: z.string().optional(),
  summary: z.string().optional(),
  description: z.string().optional(),
});

const treatmentSpecialtiesBlockSchema = z
  .object({
    type: z.literal("treatmentSpecialties"),
    eyebrow: z.string().optional(),
    heading: z.string().optional(),
    description: z.string().optional(),
    showSearch: z.boolean().default(true),
    searchPlaceholder: z
      .string()
      .default("Search treatments by name or specialty..."),
    emptyStateHeading: z.string().default("No specialties match your search"),
    emptyStateDescription: z
      .string()
      .default(
        "Try another keyword or clear the search to browse all specialties.",
      ),
    priceLabel: z.string().default("Starting at"),
    primaryActionLabel: z.string().default("Learn More"),
    secondaryActionLabel: z.string().default("Start Your Journey"),
    limit: z.number().min(1).max(12).default(6),
    featuredOnly: z.boolean().default(false),
    categories: z.array(z.string()).optional(),
    manualTreatments: z.array(z.string()).optional(),
    overrides: z.array(treatmentSpecialtyOverrideSchema).optional(),
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
  homeHeroBlockSchema,
  aboutHeroBlockSchema,
  featuredTreatmentsHomeBlockSchema,
  journeyStepsBlockSchema,
  differentiatorsBlockSchema,
  homeCtaBlockSchema,
  storyNarrativeBlockSchema,
  missionVisionValuesBlockSchema,
  trustSignalsBlockSchema,
  leadershipGridBlockSchema,
  statGridBlockSchema,
  advisoryNoticeBlockSchema,
  richTextBlockSchema,
  imageFeatureBlockSchema,
  featureGridBlockSchema,
  dataGridBlockSchema,
  infoPanelsBlockSchema,
  hotelShowcaseBlockSchema,
  serviceCatalogBlockSchema,
  logoGridBlockSchema,
  callToActionBlockSchema,
  startJourneyEmbedBlockSchema,
  contactFormEmbedBlockSchema,
  faqBlockSchema,
  faqDirectoryBlockSchema,
  medicalFacilitiesDirectoryBlockSchema,
  quoteBlockSchema,
  medicalFacilityProfileBlockSchema,
  treatmentSpecialtiesBlockSchema,
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
  homeHero: {
    type: "homeHero",
    label: "Home Hero",
    description:
      "Exact homepage hero with overlay image, split headline, and dual actions.",
    category: "hero",
    schema: homeHeroBlockSchema,
    defaultItem: {
      type: "homeHero",
      eyebrow: "Experience a New Standard in Medical Travel",
      headingPrefix: "Premium",
      headingHighlight: "Medical Care",
      headingSuffix: "in Egypt",
      description:
        "Access trusted doctors and accredited hospitals with complete travel coordination and personal guidance at every step. We make your medical journey safe, clear, and comfortable from inquiry to recovery.\n\nVerified specialists. Transparent packages. Concierge-level support.",
      backgroundImageUrl:
        "https://cmnwwchipysvwvijqjcu.supabase.co/storage/v1/object/public/media/cms/home-hero/90bc8c9d-bab8-45e6-9975-c7308001f4dd/cnt_hero.png",
      overlay: DEFAULT_HERO_OVERLAY,
      highlights: [
        {
          kicker: "Providers",
          label: "JCI-accredited hospitals and board-certified specialists",
        },
        {
          kicker: "Support",
          label:
            "Transparent packages, multilingual coordination, and concierge-level guidance",
        },
        {
          kicker: "Access",
          label: "Fast-track treatment planning with end-to-end travel support",
        },
      ],
      primaryAction: {
        label: "Start Your Journey",
        href: "/start-journey",
        variant: "default",
      },
      secondaryAction: {
        label: "View Treatments",
        href: "/treatments",
        variant: "hero",
      },
    },
  } satisfies BlockDefinition<typeof homeHeroBlockSchema>,
  aboutHero: {
    type: "aboutHero",
    label: "About Hero",
    description:
      "Full-bleed corporate hero with a narrative headline, actions, and proof highlights.",
    category: "hero",
    schema: aboutHeroBlockSchema,
    defaultItem: {
      type: "aboutHero",
      eyebrow: "About Care N Tour",
      heading:
        "Medical travel guidance designed for patients who need clarity, trust, and personal support.",
      description:
        "Care N Tour connects international patients with trusted treatment providers in Egypt and coordinates the journey from first enquiry through recovery support.",
      backgroundImageUrl:
        "https://cmnwwchipysvwvijqjcu.supabase.co/storage/v1/object/public/media/cms/home-hero/90bc8c9d-bab8-45e6-9975-c7308001f4dd/cnt_hero.png",
      overlay: DEFAULT_HERO_OVERLAY,
      highlights: [
        { kicker: "Established", label: "Formally established in 2025" },
        { kicker: "Based In", label: "Egypt with international patient focus" },
        {
          kicker: "Model",
          label: "Verified partners, coordination, and concierge support",
        },
      ],
      primaryAction: {
        label: "Speak with our team",
        href: "/contact",
        variant: "default",
      },
      secondaryAction: {
        label: "Start your journey",
        href: "/start-journey",
        variant: "secondary",
      },
    },
  } satisfies BlockDefinition<typeof aboutHeroBlockSchema>,
  featuredTreatmentsHome: {
    type: "featuredTreatmentsHome",
    label: "Home Treatments",
    description:
      "Homepage featured treatment cards with the current marketing layout and live treatment data.",
    category: "content",
    schema: featuredTreatmentsHomeBlockSchema,
    defaultItem: {
      type: "featuredTreatmentsHome",
      eyebrow: "Treatments",
      title: "Featured Treatments",
      description:
        "Discover our most popular medical procedures, performed by internationally certified specialists",
      cardAppearance: "original",
      limit: 12,
      featuredOnly: true,
    },
  } satisfies BlockDefinition<typeof featuredTreatmentsHomeBlockSchema>,
  journeySteps: {
    type: "journeySteps",
    label: "Journey Steps",
    description:
      "Exact homepage treatment journey section with numbered cards and icons.",
    category: "content",
    schema: journeyStepsBlockSchema,
    defaultItem: {
      type: "journeySteps",
      title: "Your Journey to",
      highlight: "Better Health",
      description:
        "A seamless, step-by-step process designed to make your medical tourism experience stress-free",
      steps: [
        {
          icon: "MessageCircle",
          title: "Explore Your Options",
          description:
            "Review treatments through our platform, and speak directly with a care manager. You receive tailored recommendations based on your medical needs, goals, and preferences.",
        },
        {
          icon: "Calendar",
          title: "Receive a Personalized Treatment Plan",
          description:
            "Once your medical information is reviewed, we prepare a clear plan that outlines procedures, timelines, expected results, and associated costs. This gives you full clarity before making any decision.",
        },
        {
          icon: "Plane",
          title: "Prepare for Your Trip",
          description:
            "We assist with visa requirements, documentation, and travel planning. You also receive guidance on what to bring, how to prepare, and what to expect upon arrival.",
        },
        {
          icon: "Heart",
          title: "Arrive with Confidence",
          description:
            "Our team arranges airport pickup, transportation, and accommodation. We ensure you feel settled and comfortable before your consultations and treatment begin.",
        },
        {
          icon: "Home",
          title: "Undergo Treatment with Full Support",
          description:
            "Your chosen specialist and medical facility will guide you through the procedure and follow-up visits. Your care manager remains available to support communication and logistics.",
        },
        {
          icon: "CheckCircle",
          title: "Recover Safely and Comfortably",
          description:
            "We provide personalized aftercare instructions, follow-up appointments, and check-ins. Even after you return home, our team helps you stay connected with your doctor for ongoing support.",
        },
      ],
    },
  } satisfies BlockDefinition<typeof journeyStepsBlockSchema>,
  differentiators: {
    type: "differentiators",
    label: "Differentiators",
    description:
      "Exact homepage differentiators grid with icon cards and supporting badges.",
    category: "content",
    schema: differentiatorsBlockSchema,
    defaultItem: {
      type: "differentiators",
      eyebrow: "Why Choose Care N Tour",
      title: "What Makes Us",
      highlight: "Different",
      description:
        "Experience the perfect blend of world-class medical care, cost savings, and Egyptian hospitality with our comprehensive medical tourism services",
      items: [
        {
          icon: "Award",
          title: "JCI Accredited Hospitals",
          description:
            "All our partner hospitals are internationally accredited by Joint Commission International, ensuring world-class standards.",
          highlight: "100% Accredited",
        },
        {
          icon: "Shield",
          title: "Board-Certified Surgeons",
          description:
            "Our specialists are internationally trained with decades of experience and board certifications from leading medical institutions.",
          highlight: "200+ Specialists",
        },
        {
          icon: "DollarSign",
          title: "All-Inclusive Packages",
          description:
            "Transparent pricing with no hidden costs. Includes medical care, accommodation, transfers, and 24/7 support.",
          highlight: "Up to 70% Savings",
        },
        {
          icon: "Clock",
          title: "Fast-Track Treatment",
          description:
            "No waiting lists. Get your treatment scheduled within 2-3 weeks of confirmation with priority booking.",
          highlight: "2-3 Weeks",
        },
        {
          icon: "Globe",
          title: "Multilingual Support",
          description:
            "Dedicated coordinators speaking 15+ languages ensure seamless communication throughout your journey.",
          highlight: "15+ Languages",
        },
        {
          icon: "Plane",
          title: "Complete Travel Support",
          description:
            "From visa assistance to luxury accommodations and cultural tours - we handle every detail of your stay.",
          highlight: "End-to-End Care",
        },
      ],
    },
  } satisfies BlockDefinition<typeof differentiatorsBlockSchema>,
  homeCta: {
    type: "homeCta",
    label: "Home CTA",
    description:
      "Exact homepage closing CTA with highlighted title and two actions.",
    category: "engagement",
    schema: homeCtaBlockSchema,
    defaultItem: {
      type: "homeCta",
      headingPrefix: "Ready to Start Your",
      headingHighlight: "Health Journey?",
      description:
        "Our medical coordinators are available 24/7 to answer your questions and help you plan your treatment. Get personalized care and support every step of the way.",
      primaryAction: {
        label: "Get Free Consultation",
        href: "/consultation",
        variant: "default",
      },
      secondaryAction: {
        label: "Start Your Journey",
        href: "/start-journey",
        variant: "secondary",
      },
    },
  } satisfies BlockDefinition<typeof homeCtaBlockSchema>,
  storyNarrative: {
    type: "storyNarrative",
    label: "Story Narrative",
    description:
      "Editorial story layout for company origin, long-form context, and structured strengths.",
    category: "content",
    schema: storyNarrativeBlockSchema,
    defaultItem: {
      type: "storyNarrative",
      eyebrow: "Our Story",
      heading:
        "Built to make medical travel feel informed, coordinated, and human.",
      lead: "Care N Tour was created to remove the uncertainty patients often face when they need treatment outside their home country.",
      paragraphs: [
        "Care N Tour is a medical tourism company based in Egypt, built to help patients access premium healthcare with confidence, comfort, and ease.",
        "The company grew out of years of partnerships, practical experience, and work across healthcare, digital transformation, and service delivery.",
      ],
      strengthsTitle: "Our approach is built on three main strengths",
      strengths: [
        {
          title: "Carefully selected and verified medical partners",
        },
        {
          title: "Complete end-to-end coordination supported by technology",
        },
        {
          title: "A personalized, concierge-style experience",
        },
      ],
      closing:
        "Use the closing note to reinforce the company point of view and the experience patients can expect.",
    },
  } satisfies BlockDefinition<typeof storyNarrativeBlockSchema>,
  missionVisionValues: {
    type: "missionVisionValues",
    label: "Mission, Vision & Values",
    description:
      "Structured block for company mission, long-term vision, and core values.",
    category: "content",
    schema: missionVisionValuesBlockSchema,
    defaultItem: {
      type: "missionVisionValues",
      eyebrow: "What Guides Us",
      heading: "The principles behind every patient journey",
      description:
        "Use this section to explain what the company does today, where it is going, and what standards shape every decision.",
      missionTitle: "Mission",
      missionBody:
        "Explain how the company helps patients and what operational promise it makes.",
      missionAccentPreset: "neutral",
      visionTitle: "Vision",
      visionBody:
        "Explain the long-term ambition for the business and the market it serves.",
      visionAccentPreset: "warm",
      valuesTitle: "Our Core Values",
      valuesDescription:
        "Use short, specific value statements rather than generic brand slogans.",
      values: [
        {
          title: "Safety First",
          description:
            "Maintain clear standards for providers, process, and patient support.",
          icon: "Shield",
        },
        {
          title: "Patient-Centered Care",
          description:
            "Keep planning and communication focused on the patient’s needs.",
          icon: "Heart",
        },
        {
          title: "24/7 Support",
          description:
            "Show how support continues before, during, and after treatment.",
          icon: "Clock",
        },
      ],
    },
  } satisfies BlockDefinition<typeof missionVisionValuesBlockSchema>,
  trustSignals: {
    type: "trustSignals",
    label: "Trust Signals",
    description:
      "High-credibility grid for operating model, standards, and differentiators.",
    category: "content",
    schema: trustSignalsBlockSchema,
    defaultItem: {
      type: "trustSignals",
      eyebrow: "Why Patients Trust The Model",
      heading: "Built for global patients who need more than a referral",
      description:
        "Highlight the operating standards, care model, and support structure that make the service credible.",
      items: [
        {
          eyebrow: "01",
          title: "Verified medical providers",
          description:
            "Partner selection should be based on quality, reputation, and patient suitability.",
          icon: "Shield",
        },
        {
          eyebrow: "02",
          title: "Coordinated planning",
          description:
            "Show how medical review, scheduling, travel, and accommodation connect into one experience.",
          icon: "Route",
        },
        {
          eyebrow: "03",
          title: "Transparent guidance",
          description:
            "Reassure patients with clear information, realistic planning, and ongoing communication.",
          icon: "MessagesSquare",
        },
        {
          eyebrow: "04",
          title: "Support beyond treatment",
          description:
            "Explain how follow-up and continuity are handled after procedures and travel.",
          icon: "HeartHandshake",
        },
      ],
    },
  } satisfies BlockDefinition<typeof trustSignalsBlockSchema>,
  leadershipGrid: {
    type: "leadershipGrid",
    label: "Leadership Grid",
    description:
      "Editorial leadership or advisory profiles with bios, expertise, and languages.",
    category: "social",
    schema: leadershipGridBlockSchema,
    defaultItem: {
      type: "leadershipGrid",
      eyebrow: "Leadership",
      heading: "Meet the people shaping the patient experience",
      description:
        "Use approved leadership profiles only. Avoid placeholder bios or stock credentials.",
      people: [
        {
          name: "Executive Name",
          role: "Role Title",
          bio: "Provide a concise biography focused on expertise relevant to the company’s care model and governance.",
          expertise: ["Healthcare operations", "Patient experience"],
          languages: ["English", "Arabic"],
        },
      ],
    },
  } satisfies BlockDefinition<typeof leadershipGridBlockSchema>,
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
  advisoryNotice: {
    type: "advisoryNotice",
    label: "Advisory Notice",
    description:
      "High-trust notice for freshness, scope, and important guidance before detailed content.",
    category: "content",
    schema: advisoryNoticeBlockSchema,
    defaultItem: {
      type: "advisoryNotice",
      eyebrow: "Travel Advisory",
      heading: "Set expectations early with current, practical guidance.",
      description:
        "Use this block to show when the guidance was reviewed, who it applies to, and what patients should confirm directly with the Care N Tour team.",
      tone: "info",
      lastReviewed: "Reviewed March 2026",
      appliesTo: "International patients planning treatment travel to Egypt",
      planningScope:
        "General preparation guidance. Final travel and visa requirements depend on passport, itinerary, and treatment timeline.",
      disclaimer:
        "We provide planning guidance, but official travel requirements should still be confirmed before flights are booked.",
      items: [
        "Update this block whenever travel conditions, coordination standards, or patient preparation guidance changes.",
        "Keep the copy specific, current, and easy for search engines and AI systems to parse.",
      ],
    },
  } satisfies BlockDefinition<typeof advisoryNoticeBlockSchema>,
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
  dataGrid: {
    type: "dataGrid",
    label: "Data Grid",
    description:
      "Structured comparison or requirements matrix with card and stacked layouts.",
    category: "content",
    schema: dataGridBlockSchema,
    defaultItem: {
      type: "dataGrid",
      eyebrow: "Requirements",
      heading: "A structured way to present travel or planning details",
      description:
        "Use this block when visitors need to compare requirements, timelines, or costs across a set of rows.",
      layout: "cards",
      columns: [
        { key: "requirement", label: "Requirement" },
        { key: "duration", label: "Duration" },
        { key: "process", label: "Process" },
        { key: "cost", label: "Cost" },
      ],
      rows: [
        {
          title: "Example row",
          badge: "Recommended",
          values: {
            requirement: "Tourist visa",
            duration: "30 days",
            process: "Online application",
            cost: "$25 USD",
          },
        },
      ],
    },
  } satisfies BlockDefinition<typeof dataGridBlockSchema>,
  infoPanels: {
    type: "infoPanels",
    label: "Info Panels",
    description:
      "Editorial information cards for climate, culture, payments, or patient guidance.",
    category: "content",
    schema: infoPanelsBlockSchema,
    defaultItem: {
      type: "infoPanels",
      eyebrow: "Key Facts",
      heading: "Organize supporting guidance into clear panels",
      description:
        "Use this block to present contextual information that should be easy to scan and easy to update through the CMS.",
      panels: [
        {
          title: "Panel title",
          description: "Optional supporting description.",
          items: ["First detail", "Second detail"],
        },
      ],
    },
  } satisfies BlockDefinition<typeof infoPanelsBlockSchema>,
  hotelShowcase: {
    type: "hotelShowcase",
    label: "Hotel Showcase",
    description:
      "Curated accommodation cards for recovery stays, partner hotels, or serviced apartments.",
    category: "content",
    schema: hotelShowcaseBlockSchema,
    defaultItem: {
      type: "hotelShowcase",
      eyebrow: "Accommodation",
      heading: "Recovery-ready stays patients can review with confidence",
      description:
        "Use curated accommodation cards to showcase hotel types, recovery stays, or serviced apartments through fully editable CMS content.",
      layout: "grid",
      items: [
        {
          title: "Luxury medical hotel",
          description:
            "Five-star accommodation with concierge support and recovery-friendly amenities.",
          amenities: ["Medical concierge", "24/7 support", "Recovery suites"],
          priceLabel: "$150 - $300/night",
          locationLabel: "New Cairo",
          icon: "Hotel",
        },
      ],
    },
  } satisfies BlockDefinition<typeof hotelShowcaseBlockSchema>,
  serviceCatalog: {
    type: "serviceCatalog",
    label: "Service Catalog",
    description:
      "Editorial service matrix with details, languages, and optional deep links.",
    category: "content",
    schema: serviceCatalogBlockSchema,
    defaultItem: {
      type: "serviceCatalog",
      eyebrow: "International Patient Services",
      heading: "What Care N Tour coordinates beyond the treatment itself",
      description:
        "Use this section to define the operational services patients and families can expect before arrival, during treatment, and through recovery.",
      items: [
        {
          title: "Medical coordination",
          description:
            "Explain how consultations, records, specialist access, and scheduling are managed.",
          icon: "HeartHandshake",
          availability: "24/7 coordination window",
          bullets: [
            "Record collection and case preparation",
            "Provider shortlisting and appointment coordination",
            "Post-treatment follow-up planning",
          ],
          languages: ["English", "Arabic"],
        },
        {
          title: "Travel and recovery logistics",
          description:
            "Describe the accommodation, transfer, and on-ground planning patients can rely on.",
          icon: "Plane",
          availability: "Arrival-to-departure support",
          bullets: [
            "Airport transfer coordination",
            "Recovery-friendly accommodation planning",
            "Companion and family logistics",
          ],
          languages: ["English", "Arabic"],
        },
      ],
    },
  } satisfies BlockDefinition<typeof serviceCatalogBlockSchema>,
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
      style: buildCallToActionBaseStyle("muted"),
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
  startJourneyEmbed: {
    type: "startJourneyEmbed",
    label: "Start Journey Embed",
    description:
      "Embed the intake wizard with CMS-authored introduction and support copy.",
    category: "engagement",
    schema: startJourneyEmbedBlockSchema,
    defaultItem: {
      type: "startJourneyEmbed",
      eyebrow: "Start Your Journey",
      heading: "Share your case and we will coordinate the next steps.",
      description:
        "Complete the intake below to receive a tailored treatment and travel plan from the Care N Tour team.",
      supportCardTitle: "What happens after submitting?",
      supportCardDescription:
        "Our medical concierges coordinate surgeons, travel, and recovery in one itinerary.",
      supportBullets: [
        "Specialists review your medical history and eligibility",
        "Coordinators prepare treatment timelines and price ranges",
        "Travel team drafts flights, recovery hotels, and companion itineraries",
        "You receive a detailed plan with next steps in under 24 hours",
      ],
      responseTimeLabel: "Average response time: under 2 hours",
      reassuranceLabel: "No payment required to submit your intake",
    },
  } satisfies BlockDefinition<typeof startJourneyEmbedBlockSchema>,
  contactFormEmbed: {
    type: "contactFormEmbed",
    label: "Contact Form Embed",
    description:
      "Embed the live contact form with CMS-authored messaging, field copy, and contact channels.",
    category: "engagement",
    schema: contactFormEmbedBlockSchema,
    defaultItem: {
      type: "contactFormEmbed",
      eyebrow: "Contact Care N Tour",
      heading:
        "Speak with our international patient desk, care coordinators, and partner support teams.",
      description:
        "Use this section to guide patients, families, referral partners, and corporate stakeholders to the right Care N Tour team through one editable CMS block.",
      channelsHeading: "Contact Channels",
      channelsDescription:
        "Make every communication path explicit so visitors can choose the right team and search engines can interpret the page clearly.",
      channels: [
        {
          icon: "Phone",
          title: "International Patient Desk",
          content: "+20 122 9503333",
          description:
            "Care coordination, treatment planning, and urgent support.",
          href: "tel:+201229503333",
          schemaContactType: "customer support",
        },
        {
          icon: "Mail",
          title: "General Enquiries",
          content: "info@carentour.com",
          description:
            "General questions, pre-travel planning, and case coordination follow-up.",
          href: "mailto:info@carentour.com",
          schemaContactType: "customer support",
        },
        {
          icon: "Building2",
          title: "Head Office",
          content: "Agora Mall, New Cairo, Egypt",
          description:
            "Corporate office for scheduled meetings, partner visits, and coordination.",
        },
      ],
      supportHeading: "What Happens Next",
      supportDescription:
        "Clarify the response model so international visitors understand how Care N Tour handles inbound enquiries.",
      supportItems: [
        "We review each enquiry against treatment goals, travel timing, and coordination requirements.",
        "We route partner, patient, and institutional requests to the appropriate team without asking visitors to start over.",
        "We respond with the next practical step, whether that is planning guidance, a consultation path, or partner follow-up.",
      ],
      formTitle: "Send A Message",
      formDescription:
        "Share your enquiry and the Care N Tour team will respond with the right next step.",
      labels: {
        firstName: "First Name",
        lastName: "Last Name",
        email: "Email Address",
        phone: "Phone Number",
        country: "Country",
        treatment: "Treatment Or Enquiry Type",
        message: "Message",
      },
      placeholders: {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        phone: "+1 555 123 4567",
        country: "United States",
        treatment: "Cardiac surgery, referral partnership, corporate enquiry…",
        message:
          "Tell us about your enquiry, timeline, and the support you need…",
      },
      submitLabel: "Send Message",
      submittingLabel: "Sending…",
      responseTimeLabel: "Typical response window: within 2 hours",
      privacyNote:
        "By submitting this form, you allow Care N Tour to review your enquiry and contact you about the next step.",
      successTitle: "Message Sent",
      successDescription:
        "We have received your enquiry and our team will contact you shortly.",
      errorTitle: "Unable To Send Message",
      errorDescription:
        "Please try again or use one of the listed contact channels.",
    },
  } satisfies BlockDefinition<typeof contactFormEmbedBlockSchema>,
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
  faqDirectory: {
    type: "faqDirectory",
    label: "FAQ Directory",
    description:
      "Render the public FAQ dataset with searchable categories and editorial framing.",
    category: "content",
    schema: faqDirectoryBlockSchema,
    defaultItem: {
      type: "faqDirectory",
      eyebrow: "FAQ Directory",
      heading: "Find answers across the full patient journey",
      description:
        "We answer the questions international patients ask most often before treatment, travel, arrival, recovery, and follow-up.",
      layout: "sidebar",
      navigationHeading: "Browse by topic",
      showSearch: true,
      showCategoryDescriptions: true,
      showSourceBadge: true,
      searchPlaceholder:
        "Search questions about treatments, travel, pricing, safety, or recovery",
      emptyStateHeading: "No questions match your search",
      emptyStateDescription:
        "Try a broader keyword or clear the search to browse every topic.",
      clearSearchLabel: "Clear search",
    },
  } satisfies BlockDefinition<typeof faqDirectoryBlockSchema>,
  medicalFacilitiesDirectory: {
    type: "medicalFacilitiesDirectory",
    label: "Medical Facilities Directory",
    description:
      "Live medical facilities listing with CMS-managed framing, labels, and state copy.",
    category: "content",
    schema: medicalFacilitiesDirectoryBlockSchema,
    defaultItem: {
      type: "medicalFacilitiesDirectory",
      eyebrow: "Medical Facilities",
      heading:
        "Search accredited hospitals and medical facilities across Egypt",
      description:
        "Compare live facility profiles while keeping the surrounding guidance, trust framing, and patient-facing copy fully editable in the CMS.",
      trustCallout: {
        eyebrow: "Trusted providers",
        title: "Curated and vetted by Care N Tour",
        description:
          "We present live facility data inside a care model designed for international patients, multidisciplinary planning, and clear next steps.",
      },
      searchPlaceholder:
        "Search by facility, country, city, specialty, or procedure...",
      filterLabels: {
        search: "Search",
        country: "Country",
        city: "City",
        specialty: "Specialty",
        procedure: "Procedure",
      },
      filterPlaceholders: {
        country: "All countries",
        city: "All cities",
        specialty: "All specialties",
        procedure: "All procedures",
      },
      filterSearchPlaceholders: {
        country: "Search countries...",
        city: "Search cities...",
        specialty: "Search specialties...",
        procedure: "Search procedures...",
      },
      filterEmptyCopy: {
        country: "No countries found.",
        city: "No cities found.",
        specialty: "No specialties found.",
        procedure: "No procedures found.",
      },
      clearButtonLabel: "Clear filters",
      states: {
        resultsIntro:
          "Explore live medical facilities across Egypt and refine the list using your preferred location, specialty, or procedure.",
        resultsCountLabel: "facilities available",
        loading: "Loading medical facilities...",
        updating: "Updating results...",
        emptyHeading: "No medical facilities found",
        emptyDescription: "Adjust your filters to see more options.",
        errorTitle: "Unable to load medical facilities",
        errorDescription: "Please try again later.",
      },
      cardLabels: {
        specialties: "Specialties",
        procedures: "Procedures",
        facilities: "Facilities provided",
        amenities: "Amenities",
        contact: "Contact",
        primaryCta: "Start your journey",
        viewProfile: "View profile",
        reviewsSuffix: "reviews",
        fallbackMeta: "Partner facility",
        partnerBadge: "Partner facility",
      },
    },
  } satisfies BlockDefinition<typeof medicalFacilitiesDirectoryBlockSchema>,
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
  medicalFacilityProfile: {
    type: "medicalFacilityProfile",
    label: "Medical Facility Profile",
    description:
      "Live facility detail shell with CMS-managed section headings, labels, and CTA copy.",
    category: "content",
    schema: medicalFacilityProfileBlockSchema,
    defaultItem: {
      type: "medicalFacilityProfile",
      eyebrow: "Care N Tour Medical Facility Profile",
      trustStatement:
        "Care N Tour coordinates specialist review, international patient planning, and multilingual support around the live provider record shown below.",
      sectionTitles: {
        overview: "About this facility",
        specialties: "Specialties",
        procedures: "Procedures",
        facilities: "Facilities provided",
        amenities: "Amenities",
        infrastructure: "Infrastructure & technology",
        gallery: "Gallery",
        keyDetails: "Key details",
        contact: "Contact & location",
      },
      sectionDescriptions: {
        overview:
          "Review the provider profile, operational strengths, and planning context before speaking with the Care N Tour team.",
        procedures:
          "Procedures shown below reflect the live provider record currently available through Care N Tour.",
        contact:
          "Use the live contact and location details below as a starting point, and speak with Care N Tour for coordinated next steps.",
      },
      labels: {
        backLink: "Back to Medical Facilities",
        partnerBadge: "Partner facility",
        reviewsSuffix: "reviews",
        facilityType: "Facility type",
        location: "Location",
        partner: "Partner",
        rating: "Rating",
        reviews: "Reviews",
        phone: "Phone",
        email: "Email",
        website: "Website",
        whatsapp: "WhatsApp",
        address: "Address",
        coordinates: "Coordinates",
        unavailable: "Not available",
        yes: "Yes",
        no: "No",
      },
      ctas: {
        secondary: "Contact",
        primary: "Start your journey",
      },
      fallbacks: {
        loading: "Loading medical facility...",
        updating: "Updating latest details...",
        notFoundHeading: "Medical facility not found",
        notFoundDescription:
          "The facility you are looking for may have been removed or is not available to view.",
        noOverview:
          "Care N Tour can provide more context on this facility during your planning conversation.",
      },
    },
  } satisfies BlockDefinition<typeof medicalFacilityProfileBlockSchema>,
  treatmentSpecialties: {
    type: "treatmentSpecialties",
    label: "Treatment Specialties",
    description:
      "Editorial treatments catalog that preserves the current specialties card design with CMS controls.",
    category: "content",
    schema: treatmentSpecialtiesBlockSchema,
    defaultItem: {
      type: "treatmentSpecialties",
      heading: "Our Medical Specialties",
      description:
        "World-class medical care across multiple specialties with significant cost savings.",
      showSearch: true,
      searchPlaceholder: "Search treatments by name or specialty...",
      emptyStateHeading: "No specialties match your search",
      emptyStateDescription:
        "Try another keyword or clear the search to browse all specialties.",
      priceLabel: "Starting at",
      primaryActionLabel: "Learn More",
      secondaryActionLabel: "Start Your Journey",
      limit: 4,
      featuredOnly: false,
    },
  } satisfies BlockDefinition<typeof treatmentSpecialtiesBlockSchema>,
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

function sanitizeImageAsset(raw: unknown) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return undefined;
  }

  const image = { ...(raw as UnknownRecord) };
  const srcValue = image.src;
  const src =
    typeof srcValue === "string"
      ? srcValue.trim()
      : typeof srcValue === "undefined" || srcValue === null
        ? ""
        : String(srcValue);

  if (!src) {
    return undefined;
  }

  const cleaned: UnknownRecord = { ...image, src };
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

  if (block.type === "callToAction" && "image" in block) {
    const cleanedImage = sanitizeImageAsset(block.image);
    if (cleanedImage) {
      block.image = cleanedImage;
    } else {
      delete block.image;
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
