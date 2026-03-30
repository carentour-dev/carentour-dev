import { useEffect, useRef, useState } from "react";
import { useFieldArray, useForm, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";

import {
  blockAnimationTriggerOptions,
  blockAnimationTypes,
  blockBackgroundVariants,
  blockBreakpoints,
  blockDeviceVisibilityTargets,
  blockFontScaleOptions,
  blockFontWeightOptions,
  blockActionVariants,
  blockHorizontalAlignmentOptions,
  blockLetterSpacingOptions,
  blockMaxWidthScale,
  blockRegistry,
  blockSpacingScale,
  type BlockInstance,
  type BlockSchema,
  type BlockType,
  type BlockValue,
  type BreakpointKey,
  type TabbedGuideSection,
  type TabbedGuideTab,
} from "@/lib/cms/blocks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { DoctorMultiSelector } from "@/components/admin/DoctorMultiSelector";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { TreatmentMultiSelector } from "@/components/admin/TreatmentMultiSelector";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { BlockStyle } from "@/lib/cms/blocks";

type BreakpointOption = {
  value: BreakpointKey;
  label: string;
};

const breakpointLabels: Record<BreakpointKey, string> = {
  base: "Base",
  mobile: "Mobile",
  tablet: "Tablet",
  desktop: "Desktop",
  full: "Full",
};

const breakpointOptions: BreakpointOption[] = blockBreakpoints.map((bp) => ({
  value: bp,
  label: breakpointLabels[bp],
}));

const spacingOptions = blockSpacingScale.map((value) => ({
  value,
  label: (() => {
    switch (value) {
      case "none":
        return "None (0rem)";
      case "xs":
        return "XS (1rem)";
      case "sm":
        return "Small (2rem)";
      case "md":
        return "Medium (3rem)";
      case "lg":
        return "Large (4rem)";
      case "xl":
        return "XL (5rem)";
      case "2xl":
        return "2XL (6rem)";
      case "3xl":
        return "3XL (8rem)";
      default:
        return value;
    }
  })(),
}));

const maxWidthOptions = blockMaxWidthScale.map((value) => ({
  value,
  label:
    value === "content"
      ? "Content (60rem)"
      : value === "wide"
        ? "Wide (72rem)"
        : "Full width",
}));

const horizontalAlignmentOptions = blockHorizontalAlignmentOptions.map(
  (value) => ({
    value,
    label: value === "start" ? "Start" : value === "center" ? "Center" : "End",
  }),
);

const typographyScaleOptions = blockFontScaleOptions.map((value) => ({
  value,
  label: value.toUpperCase(),
}));

const typographyWeightOptions = blockFontWeightOptions.map((value) => ({
  value,
  label:
    value === "light"
      ? "Light"
      : value === "normal"
        ? "Normal"
        : value === "medium"
          ? "Medium"
          : value === "semibold"
            ? "Semi Bold"
            : "Bold",
}));

const typographyLetterSpacingOptions = blockLetterSpacingOptions.map(
  (value) => ({
    value,
    label: value === "tight" ? "Tight" : value === "normal" ? "Normal" : "Wide",
  }),
);

const animationTypeOptions = blockAnimationTypes.map((value) => ({
  value,
  label:
    value === "none"
      ? "None"
      : value
          .split("-")
          .map((part) => part[0].toUpperCase() + part.slice(1))
          .join(" "),
}));

const animationTriggerOptions = blockAnimationTriggerOptions.map((value) => ({
  value,
  label: value === "load" ? "On Load" : "On Scroll",
}));

const deviceVisibilityOptions = blockDeviceVisibilityTargets.map((value) => ({
  value,
  label: value[0].toUpperCase() + value.slice(1),
}));

type StylePreset = {
  id: string;
  label: string;
  description?: string;
  style: Partial<BlockStyle>;
};

const stylePresets: StylePreset[] = [
  {
    id: "hero-clinical",
    label: "Hero • Refined Clinical",
    description:
      "Calm neutral surface with strong blue emphasis and generous hero spacing.",
    style: {
      presetId: "hero-clinical",
      layout: {
        padding: {
          top: { base: "xl" },
          bottom: { base: "xl" },
        },
      },
      background: {
        variant: "solid",
        color: {
          base: "hsl(var(--surface-subtle))",
        },
        overlayOpacity: {
          base: 0,
        },
      },
      typography: {
        textColor: {
          base: "hsl(var(--foreground))",
        },
        headingAccentColor: "hsl(var(--primary))",
        scale: {
          base: "xl",
        },
        weight: {
          base: "semibold",
        },
      },
    },
  },
  {
    id: "hero-dark",
    label: "Legacy • Hero Dark Gradient",
    description:
      "Legacy dramatic gradient preset retained for backward-compatible authored content.",
    style: {
      presetId: "hero-dark",
      layout: {
        padding: {
          top: { base: "xl" },
          bottom: { base: "xl" },
        },
      },
      background: {
        variant: "gradient",
        gradient: {
          css: "linear-gradient(135deg, #0f172a 0%, #1e293b 45%, #334155 100%)",
        },
        overlayOpacity: {
          base: 0.3,
        },
      },
      typography: {
        textColor: {
          base: "#f8fafc",
        },
        headingAccentColor: "#38bdf8",
        scale: {
          base: "xl",
        },
        weight: {
          base: "semibold",
        },
      },
    },
  },
  {
    id: "panel-muted",
    label: "Panel • Refined Clinical",
    description: "Soft neutral panel with balanced spacing and calm contrast.",
    style: {
      presetId: "panel-muted",
      layout: {
        padding: {
          top: { base: "lg" },
          bottom: { base: "lg" },
        },
        maxWidth: {
          base: "content",
        },
        horizontalAlign: {
          base: "center",
        },
      },
      background: {
        variant: "solid",
        color: {
          base: "hsl(var(--surface-subtle))",
        },
        overlayOpacity: {
          base: 0,
        },
      },
      typography: {
        textColor: {
          base: "var(--foreground)",
        },
        scale: {
          base: "base",
        },
      },
    },
  },
  {
    id: "spotlight",
    label: "Spotlight • Image Overlay",
    description:
      "Background image with high contrast overlay and center alignment.",
    style: {
      presetId: "spotlight",
      background: {
        variant: "image",
        overlayOpacity: {
          base: 0.45,
        },
      },
      layout: {
        padding: {
          top: { base: "lg" },
          bottom: { base: "lg" },
        },
        horizontalAlign: {
          base: "center",
        },
      },
      typography: {
        textColor: {
          base: "#ffffff",
        },
        headingAccentColor: "#facc15",
      },
    },
  },
];

const INHERIT_OPTION_VALUE = "__inherit__";
const NO_PRESET_VALUE = "__no_preset__";

function BreakpointToggle({
  value,
  onChange,
}: {
  value: BreakpointKey;
  onChange: (next: BreakpointKey) => void;
}) {
  return (
    <ToggleGroup
      type="single"
      size="sm"
      value={value}
      onValueChange={(next) => {
        if (!next) return;
        onChange(next as BreakpointKey);
      }}
    >
      {breakpointOptions.map((option) => (
        <ToggleGroupItem
          key={option.value}
          value={option.value}
          className="text-xs"
        >
          {option.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

function ResetButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onClick}
      className="text-xs text-muted-foreground hover:text-foreground"
    >
      Reset
    </Button>
  );
}

type AnyForm = UseFormReturn<BlockValue>;

function ResponsiveSelectControl({
  form,
  path,
  label,
  helper,
  options,
  placeholder,
}: {
  form: AnyForm;
  path: string;
  label: string;
  helper?: string;
  placeholder?: string;
  options: { value: string; label: string }[];
}) {
  const [breakpoint, setBreakpoint] = useState<BreakpointKey>("base");
  const watchPath = `${path}.${breakpoint}` as const;
  const currentValue = form.watch(watchPath as any) as string | undefined;
  const selectValue = currentValue ?? INHERIT_OPTION_VALUE;

  const handleChange = (value: string | undefined) => {
    form.setValue(watchPath as any, value, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const handleReset = () => {
    form.setValue(watchPath as any, undefined, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <FormLabel className="text-xs font-semibold uppercase text-muted-foreground">
          {label}
        </FormLabel>
        <BreakpointToggle value={breakpoint} onChange={setBreakpoint} />
      </div>
      <div className="flex items-center gap-2">
        <Select
          value={selectValue}
          onValueChange={(value) => {
            if (value === INHERIT_OPTION_VALUE) {
              handleChange(undefined);
              return;
            }
            handleChange(value);
          }}
        >
          <FormControl>
            <SelectTrigger>
              <SelectValue placeholder={placeholder ?? "Default"} />
            </SelectTrigger>
          </FormControl>
          <SelectContent>
            <SelectItem value={INHERIT_OPTION_VALUE}>Use default</SelectItem>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <ResetButton onClick={handleReset} />
      </div>
      {helper ? (
        <p className="text-xs text-muted-foreground">{helper}</p>
      ) : null}
    </div>
  );
}

function ResponsiveColorControl({
  form,
  path,
  label,
  helper,
}: {
  form: AnyForm;
  path: string;
  label: string;
  helper?: string;
}) {
  const [breakpoint, setBreakpoint] = useState<BreakpointKey>("base");
  const watchPath = `${path}.${breakpoint}` as const;
  const currentValue = form.watch(watchPath as any) as string | undefined;
  const isHex =
    typeof currentValue === "string" &&
    /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(currentValue);
  const colorInputValue = isHex ? currentValue : "#000000";

  const handleTextChange = (value: string) => {
    const trimmed = value.trim();
    form.setValue(watchPath as any, trimmed ? trimmed : undefined, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const handleColorChange = (value: string) => {
    if (!value) return;
    form.setValue(watchPath as any, value, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const handleReset = () => {
    form.setValue(watchPath as any, undefined, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <FormLabel className="text-xs font-semibold uppercase text-muted-foreground">
          {label}
        </FormLabel>
        <BreakpointToggle value={breakpoint} onChange={setBreakpoint} />
      </div>
      <div className="flex items-center gap-2">
        <Input
          value={currentValue ?? ""}
          onChange={(event) => handleTextChange(event.target.value)}
          placeholder="e.g. #111827 or var(--foreground)"
        />
        <Input
          type="color"
          value={colorInputValue}
          onChange={(event) => handleColorChange(event.target.value)}
          className="h-10 w-12 min-w-[3rem] px-1"
          aria-label={`${label} color picker`}
        />
        <ResetButton onClick={handleReset} />
      </div>
      {helper ? (
        <p className="text-xs text-muted-foreground">{helper}</p>
      ) : null}
    </div>
  );
}

function ResponsiveNumberControl({
  form,
  path,
  label,
  helper,
  min = 0,
  max = 1,
  step = 0.05,
}: {
  form: AnyForm;
  path: string;
  label: string;
  helper?: string;
  min?: number;
  max?: number;
  step?: number;
}) {
  const [breakpoint, setBreakpoint] = useState<BreakpointKey>("base");
  const watchPath = `${path}.${breakpoint}` as const;
  const currentValue = form.watch(watchPath as any) as number | undefined;
  const sliderValue = Number.isFinite(currentValue)
    ? Math.round((currentValue ?? 0) * 100)
    : 0;

  const handleChange = (next: number | undefined) => {
    if (next === undefined) {
      form.setValue(watchPath as any, undefined, {
        shouldDirty: true,
        shouldValidate: true,
      });
      return;
    }
    const clamped = Math.min(Math.max(next, min), max);
    form.setValue(watchPath as any, clamped, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const handleSliderChange = (values: number[]) => {
    const percent = values[0] ?? 0;
    const normalized = parseFloat((percent / 100).toFixed(2));
    handleChange(normalized);
  };

  const handleReset = () => {
    form.setValue(watchPath as any, undefined, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <FormLabel className="text-xs font-semibold uppercase text-muted-foreground">
          {label}
        </FormLabel>
        <BreakpointToggle value={breakpoint} onChange={setBreakpoint} />
      </div>
      <div className="flex items-center gap-3">
        <Slider
          value={[sliderValue]}
          onValueChange={handleSliderChange}
          max={Math.round(max * 100)}
          min={Math.round(min * 100)}
          step={Math.round(step * 100)}
        />
        <span className="w-12 text-right text-xs font-medium text-muted-foreground">
          {(currentValue ?? 0).toFixed(2)}
        </span>
        <ResetButton onClick={handleReset} />
      </div>
      {helper ? (
        <p className="text-xs text-muted-foreground">{helper}</p>
      ) : null}
    </div>
  );
}

function ResponsiveMediaControl({
  form,
  path,
  label,
}: {
  form: AnyForm;
  path: string;
  label: string;
}) {
  const [breakpoint, setBreakpoint] = useState<BreakpointKey>("base");
  const watchPath = `${path}.${breakpoint}` as const;
  const media = form.watch(watchPath as any) as
    | {
        src?: string;
        fit?: "cover" | "contain";
        focalPoint?: { x?: number; y?: number };
      }
    | undefined;

  const ensureMedia = () => {
    if (media) return;
    form.setValue(
      watchPath as any,
      {
        src: "",
        fit: "cover",
        focalPoint: { x: 50, y: 50 },
      },
      { shouldDirty: true, shouldValidate: true },
    );
  };

  const updateMedia = (partial: Record<string, unknown>) => {
    const next = { ...(media ?? {}), ...partial };
    form.setValue(watchPath as any, next, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const clearMedia = () => {
    form.setValue(watchPath as any, undefined, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const focalPoint = media?.focalPoint ?? { x: 50, y: 50 };

  return (
    <div className="space-y-3 rounded-lg border border-border/50 p-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-muted-foreground">
            {label}
          </p>
          <p className="text-xs text-muted-foreground">
            Provide breakpoint-specific background imagery. Empty breakpoints
            inherit Base.
          </p>
        </div>
        <BreakpointToggle value={breakpoint} onChange={setBreakpoint} />
      </div>

      {media ? (
        <div className="space-y-3">
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase text-muted-foreground">
              Image Source
            </Label>
            <ImageUploader
              label="Upload image"
              value={media?.src ?? null}
              onChange={(url) => updateMedia({ src: url ?? "" })}
              bucket="media"
              folder="cms/backgrounds"
            />
            <Input
              value={media?.src ?? ""}
              onChange={(event) => updateMedia({ src: event.target.value })}
              placeholder="https://..."
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase text-muted-foreground">
                Fit
              </Label>
              <Select
                value={media?.fit ?? "cover"}
                onValueChange={(value) =>
                  updateMedia({ fit: value as "cover" | "contain" })
                }
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="cover">Cover</SelectItem>
                  <SelectItem value="contain">Contain</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase text-muted-foreground">
                Focal X
              </Label>
              <Slider
                value={[focalPoint.x ?? 50]}
                onValueChange={(value) =>
                  updateMedia({ focalPoint: { ...focalPoint, x: value[0] } })
                }
                min={0}
                max={100}
              />
              <p className="text-xs text-muted-foreground">
                Center point on the horizontal axis.
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase text-muted-foreground">
                Focal Y
              </Label>
              <Slider
                value={[focalPoint.y ?? 50]}
                onValueChange={(value) =>
                  updateMedia({ focalPoint: { ...focalPoint, y: value[0] } })
                }
                min={0}
                max={100}
              />
              <p className="text-xs text-muted-foreground">
                Center point on the vertical axis.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearMedia}
            >
              Remove breakpoint image
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={ensureMedia}
            >
              Duplicate Base settings
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between rounded-md border border-dashed border-border/60 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          <span>No breakpoint override. Inherits Base image.</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={ensureMedia}
          >
            Add override
          </Button>
        </div>
      )}
    </div>
  );
}

function ResponsiveVideoControl({
  form,
  path,
}: {
  form: AnyForm;
  path: string;
}) {
  const [breakpoint, setBreakpoint] = useState<BreakpointKey>("base");
  const watchPath = `${path}.${breakpoint}` as const;
  const video = form.watch(watchPath as any) as
    | {
        src?: string;
        poster?: string;
        autoplay?: boolean;
        loop?: boolean;
        muted?: boolean;
      }
    | undefined;

  const ensureVideo = () => {
    if (video) return;
    form.setValue(
      watchPath as any,
      {
        src: "",
        autoplay: true,
        loop: true,
        muted: true,
      },
      { shouldDirty: true, shouldValidate: true },
    );
  };

  const updateVideo = (partial: Record<string, unknown>) => {
    const next = { ...(video ?? {}), ...partial };
    form.setValue(watchPath as any, next, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const clearVideo = () => {
    form.setValue(watchPath as any, undefined, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  return (
    <div className="space-y-3 rounded-lg border border-border/50 p-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-muted-foreground">
            Background Video
          </p>
          <p className="text-xs text-muted-foreground">
            Provide a muted looping video for the section background.
          </p>
        </div>
        <BreakpointToggle value={breakpoint} onChange={setBreakpoint} />
      </div>
      {video ? (
        <div className="space-y-3">
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase text-muted-foreground">
              Video Source
            </Label>
            <Input
              value={video.src ?? ""}
              onChange={(event) => updateVideo({ src: event.target.value })}
              placeholder="https://cdn.example.com/video.mp4"
            />
            <p className="text-xs text-muted-foreground">
              MP4 or WebM source. Ensure it is optimized for web playback.
            </p>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase text-muted-foreground">
              Poster Image
            </Label>
            <Input
              value={video.poster ?? ""}
              onChange={(event) => updateVideo({ poster: event.target.value })}
              placeholder="Optional fallback image url"
            />
          </div>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Switch
                checked={video.autoplay ?? true}
                onCheckedChange={(checked) =>
                  updateVideo({ autoplay: checked })
                }
              />
              <span className="text-xs text-muted-foreground">Autoplay</span>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={video.loop ?? true}
                onCheckedChange={(checked) => updateVideo({ loop: checked })}
              />
              <span className="text-xs text-muted-foreground">Loop</span>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={video.muted ?? true}
                onCheckedChange={(checked) => updateVideo({ muted: checked })}
              />
              <span className="text-xs text-muted-foreground">Muted</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearVideo}
            >
              Remove breakpoint video
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={ensureVideo}
            >
              Duplicate Base settings
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between rounded-md border border-dashed border-border/60 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          <span>No breakpoint override. Inherits Base video.</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={ensureVideo}
          >
            Add override
          </Button>
        </div>
      )}
    </div>
  );
}

function SectionTitle({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      {description ? (
        <p className="text-xs text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}

function StylePresetSection({
  form,
  showTitle = true,
}: {
  form: AnyForm;
  showTitle?: boolean;
}) {
  const presetId = form.watch("style.presetId") as string | undefined;
  const activePreset = stylePresets.find((preset) => preset.id === presetId);

  const applyPreset = (next: string | undefined) => {
    if (!next) {
      form.setValue("style.presetId", undefined, {
        shouldDirty: true,
        shouldValidate: true,
      });
      return;
    }
    const preset = stylePresets.find((item) => item.id === next);
    if (!preset) return;
    const previous = form.getValues("style") as BlockStyle | undefined;
    const style: Partial<BlockStyle> = {
      ...(previous ?? {}),
      ...preset.style,
      presetId: preset.id,
    };
    form.setValue("style", style as BlockStyle, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  return (
    <div className="space-y-3 rounded-lg border border-border/70 bg-muted/10 p-4">
      {showTitle ? (
        <SectionTitle
          title="Style Presets"
          description="Apply opinionated styling bundles to jumpstart the design. Overrides remain editable."
        />
      ) : (
        <p className="text-xs text-muted-foreground">
          Apply opinionated styling bundles to jumpstart the design. Overrides
          remain editable.
        </p>
      )}
      <Select
        value={presetId ?? NO_PRESET_VALUE}
        onValueChange={(value) => {
          if (value === NO_PRESET_VALUE) {
            applyPreset(undefined);
            return;
          }
          applyPreset(value);
        }}
      >
        <FormControl>
          <SelectTrigger>
            <SelectValue placeholder="Select a preset" />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          <SelectItem value={NO_PRESET_VALUE}>No preset</SelectItem>
          {stylePresets.map((preset) => (
            <SelectItem key={preset.id} value={preset.id}>
              {preset.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {activePreset?.description ? (
        <p className="text-xs text-muted-foreground">
          {activePreset.description}
        </p>
      ) : null}
      <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
        <span>Presets replace current style values.</span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            form.setValue("style", {} as BlockStyle, {
              shouldDirty: true,
              shouldValidate: true,
            });
          }}
        >
          Clear style
        </Button>
      </div>
    </div>
  );
}

function StyleLayoutSection({
  form,
  showTitle = true,
}: {
  form: AnyForm;
  showTitle?: boolean;
}) {
  return (
    <div className="space-y-4 rounded-lg border border-border/60 p-4">
      {showTitle ? (
        <SectionTitle
          title="Layout & Spacing"
          description="Control padding, width, and horizontal alignment across breakpoints."
        />
      ) : (
        <p className="text-xs text-muted-foreground">
          Control padding, width, and horizontal alignment across breakpoints.
        </p>
      )}
      <ResponsiveSelectControl
        form={form}
        label="Padding Top"
        path="style.layout.padding.top"
        options={spacingOptions}
      />
      <ResponsiveSelectControl
        form={form}
        label="Padding Bottom"
        path="style.layout.padding.bottom"
        options={spacingOptions}
      />
      <ResponsiveSelectControl
        form={form}
        label="Max Width"
        path="style.layout.maxWidth"
        options={maxWidthOptions}
        helper="Overrides the default max width of the inner container."
      />
      <ResponsiveSelectControl
        form={form}
        label="Horizontal Alignment"
        path="style.layout.horizontalAlign"
        options={horizontalAlignmentOptions}
        helper="Controls how the inner container aligns within the section."
      />
    </div>
  );
}

function StyleBackgroundSection({
  form,
  showTitle = true,
}: {
  form: AnyForm;
  showTitle?: boolean;
}) {
  const variant = form.watch("style.background.variant") as string | undefined;

  useEffect(() => {
    if (variant === "image") {
      const base = form.getValues("style.background.image.base");
      if (!base) {
        form.setValue(
          "style.background.image.base",
          {
            src: "",
            fit: "cover",
            focalPoint: { x: 50, y: 50 },
          },
          { shouldDirty: true, shouldValidate: true },
        );
      }
    } else if (variant === "video") {
      const base = form.getValues("style.background.video.base");
      if (!base) {
        form.setValue(
          "style.background.video.base",
          {
            src: "",
            autoplay: true,
            loop: true,
            muted: true,
          },
          { shouldDirty: true, shouldValidate: true },
        );
      }
    }
  }, [variant, form]);

  return (
    <div className="space-y-4 rounded-lg border border-border/60 p-4">
      {showTitle ? (
        <SectionTitle
          title="Background"
          description="Choose between solid colors, gradients, imagery, or video backgrounds with responsive overrides."
        />
      ) : (
        <p className="text-xs text-muted-foreground">
          Choose between solid colors, gradients, imagery, or video backgrounds
          with responsive overrides.
        </p>
      )}
      <FormField
        control={form.control}
        name="style.background.variant"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Variant</FormLabel>
            <Select
              value={field.value ?? "none"}
              onValueChange={field.onChange}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select layout" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {blockBackgroundVariants.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value === "none"
                      ? "None"
                      : value === "solid"
                        ? "Solid color"
                        : value === "gradient"
                          ? "Gradient"
                          : value === "image"
                            ? "Image"
                            : "Video"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormItem>
        )}
      />

      {variant === "solid" ? (
        <ResponsiveColorControl
          form={form}
          label="Solid Color"
          path="style.background.color"
          helper="Accepts hex values or CSS variables (e.g., var(--background))."
        />
      ) : null}

      {variant === "gradient" ? (
        <div className="space-y-3 rounded-md border border-border/60 p-3">
          <p className="text-xs font-semibold uppercase text-muted-foreground">
            Gradient Stops
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            <FormField
              control={form.control}
              name="style.background.gradient.from"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>From</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="#0f172a"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="style.background.gradient.to"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>To</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="#334155"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="style.background.gradient.via"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Via (optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="#1e293b"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="style.background.gradient.angle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Angle</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      max={360}
                      placeholder="135"
                      value={field.value ?? ""}
                      onChange={(event) =>
                        field.onChange(
                          event.target.value
                            ? Number(event.target.value)
                            : undefined,
                        )
                      }
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="style.background.gradient.css"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Custom CSS</FormLabel>
                <FormControl>
                  <Textarea
                    rows={2}
                    placeholder="linear-gradient(135deg, ...)"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormDescription>
                  Provide a custom gradient declaration to override stop inputs.
                </FormDescription>
              </FormItem>
            )}
          />
        </div>
      ) : null}

      {variant === "image" ? (
        <ResponsiveMediaControl
          form={form}
          path="style.background.image"
          label="Responsive imagery"
        />
      ) : null}
      {variant === "video" ? (
        <ResponsiveVideoControl form={form} path="style.background.video" />
      ) : null}

      {variant !== "none" ? (
        <ResponsiveNumberControl
          form={form}
          label="Overlay opacity"
          path="style.background.overlayOpacity"
          helper="Applies a dark overlay above the background to improve text contrast."
          min={0}
          max={0.9}
          step={0.05}
        />
      ) : null}
    </div>
  );
}

function StyleTypographySection({
  form,
  showTitle = true,
}: {
  form: AnyForm;
  showTitle?: boolean;
}) {
  return (
    <div className="space-y-4 rounded-lg border border-border/60 p-4">
      {showTitle ? (
        <SectionTitle
          title="Typography"
          description="Adjust text color, scale, weight, and heading accents."
        />
      ) : (
        <p className="text-xs text-muted-foreground">
          Adjust text color, scale, weight, and heading accents.
        </p>
      )}
      <ResponsiveColorControl
        form={form}
        label="Text color"
        path="style.typography.textColor"
        helper="Applies to paragraph text, list items, emphasis, and quotes."
      />
      <FormField
        control={form.control}
        name="style.typography.headingAccentColor"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Heading accent color</FormLabel>
            <FormControl>
              <Input
                placeholder="#38bdf8"
                {...field}
                value={field.value ?? ""}
              />
            </FormControl>
            <FormDescription>
              Applies to H1–H3 elements within this block.
            </FormDescription>
          </FormItem>
        )}
      />
      <ResponsiveSelectControl
        form={form}
        label="Type scale"
        path="style.typography.scale"
        options={typographyScaleOptions}
        helper="Scales heading and body sizes proportionally."
      />
      <ResponsiveSelectControl
        form={form}
        label="Font weight"
        path="style.typography.weight"
        options={typographyWeightOptions}
      />
      <ResponsiveSelectControl
        form={form}
        label="Letter spacing"
        path="style.typography.letterSpacing"
        options={typographyLetterSpacingOptions}
      />
    </div>
  );
}

function StyleEffectsSection({
  form,
  showTitle = true,
}: {
  form: AnyForm;
  showTitle?: boolean;
}) {
  const animationType = form.watch("style.effects.animation.type") as
    | string
    | undefined;

  return (
    <div className="space-y-4 rounded-lg border border-border/60 p-4">
      {showTitle ? (
        <SectionTitle
          title="Effects & Motion"
          description="Configure entrance animations and timing."
        />
      ) : (
        <p className="text-xs text-muted-foreground">
          Configure entrance animations and timing.
        </p>
      )}
      <div className="grid gap-3 md:grid-cols-2">
        <FormField
          control={form.control}
          name="style.effects.animation.type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Animation</FormLabel>
              <Select
                value={field.value ?? "none"}
                onValueChange={field.onChange}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {animationTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Animations play once on load or when scrolled into view.
              </FormDescription>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="style.effects.animation.trigger"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Trigger</FormLabel>
              <Select
                value={field.value ?? "load"}
                onValueChange={field.onChange}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {animationTriggerOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
      </div>
      {animationType && animationType !== "none" ? (
        <div className="grid gap-3 md:grid-cols-2">
          <FormField
            control={form.control}
            name="style.effects.animation.delayMs"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Delay (ms)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    max={5000}
                    placeholder="0"
                    value={field.value ?? ""}
                    onChange={(event) =>
                      field.onChange(
                        event.target.value
                          ? Number(event.target.value)
                          : undefined,
                      )
                    }
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="style.effects.animation.durationMs"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duration (ms)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={100}
                    max={10000}
                    placeholder="500"
                    value={field.value ?? ""}
                    onChange={(event) =>
                      field.onChange(
                        event.target.value
                          ? Number(event.target.value)
                          : undefined,
                      )
                    }
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="style.effects.animation.once"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2">
                <FormControl>
                  <Switch
                    checked={field.value ?? true}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div>
                  <FormLabel>Play once</FormLabel>
                  <FormDescription>
                    Disable to allow animation each time the block enters the
                    viewport.
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
        </div>
      ) : null}
    </div>
  );
}

function StyleVisibilitySection({
  form,
  showTitle = true,
}: {
  form: AnyForm;
  showTitle?: boolean;
}) {
  const hideOn = form.watch("style.visibility.hideOn") as
    | ("mobile" | "tablet" | "desktop")[]
    | undefined;
  const showOnlyOn = form.watch("style.visibility.showOnlyOn") as
    | ("mobile" | "tablet" | "desktop")[]
    | undefined;

  const toggleArrayValue = (
    path: string,
    value: "mobile" | "tablet" | "desktop",
    list: ("mobile" | "tablet" | "desktop")[] | undefined,
  ) => {
    const current = list ?? [];
    if (current.includes(value)) {
      form.setValue(
        path as any,
        current.filter((item) => item !== value),
        { shouldDirty: true, shouldValidate: true },
      );
    } else {
      form.setValue(path as any, [...current, value], {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  };

  const handleHideToggle = (value: "mobile" | "tablet" | "desktop") => {
    toggleArrayValue("style.visibility.hideOn", value, hideOn);
  };

  const handleShowOnlyToggle = (value: "mobile" | "tablet" | "desktop") => {
    const updated = showOnlyOn ?? [];
    let next: ("mobile" | "tablet" | "desktop")[];
    if (updated.includes(value)) {
      next = updated.filter((item) => item !== value);
    } else {
      next = [...updated, value];
    }
    form.setValue("style.visibility.showOnlyOn", next, {
      shouldDirty: true,
      shouldValidate: true,
    });
    if (next.length) {
      form.setValue("style.visibility.hideOn", [], {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  };

  return (
    <div className="space-y-4 rounded-lg border border-border/60 p-4">
      {showTitle ? (
        <SectionTitle
          title="Visibility"
          description="Hide or exclusively show this block on specific breakpoints."
        />
      ) : (
        <p className="text-xs text-muted-foreground">
          Hide or exclusively show this block on specific breakpoints.
        </p>
      )}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase text-muted-foreground">
          Hide on
        </p>
        <div className="flex flex-wrap gap-3">
          {deviceVisibilityOptions.map((option) => (
            <label
              key={option.value}
              className="flex items-center gap-2 text-sm text-muted-foreground"
            >
              <Checkbox
                checked={hideOn?.includes(option.value) ?? false}
                onCheckedChange={() => handleHideToggle(option.value)}
              />
              {option.label}
            </label>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase text-muted-foreground">
          Show only on
        </p>
        <div className="flex flex-wrap gap-3">
          {deviceVisibilityOptions.map((option) => (
            <label
              key={option.value}
              className="flex items-center gap-2 text-sm text-muted-foreground"
            >
              <Checkbox
                checked={showOnlyOn?.includes(option.value) ?? false}
                onCheckedChange={() => handleShowOnlyToggle(option.value)}
              />
              {option.label}
            </label>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          When set, the block will render exclusively on the selected
          breakpoints.
        </p>
      </div>
    </div>
  );
}

function AdvancedSettingsSection({
  form,
  showTitle = true,
}: {
  form: AnyForm;
  showTitle?: boolean;
}) {
  const cta = form.watch("advanced.cta") as
    | BlockValue["advanced"]["cta"]
    | undefined;

  const toggleCta = (next: boolean) => {
    if (next) {
      form.setValue(
        "advanced.cta",
        {
          label: "Get started",
          href: "#",
          variant: "default",
        },
        { shouldDirty: true, shouldValidate: true },
      );
      return;
    }
    form.setValue("advanced.cta", undefined, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  return (
    <div className="space-y-4 rounded-lg border border-border/60 p-4">
      {showTitle ? (
        <SectionTitle
          title="Advanced"
          description="Anchor links, custom class names, CTA, and preset protection."
        />
      ) : (
        <p className="text-xs text-muted-foreground">
          Anchor links, custom class names, CTA, and preset protection.
        </p>
      )}
      <div className="grid gap-3 md:grid-cols-2">
        <FormField
          control={form.control}
          name="advanced.anchorId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Anchor ID</FormLabel>
              <FormControl>
                <Input
                  placeholder="about-us"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormDescription>
                Used for on-page navigation (must be URL friendly).
              </FormDescription>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="advanced.customClassName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Custom class</FormLabel>
              <FormControl>
                <Input
                  placeholder="optional-utility"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
      <FormField
        control={form.control}
        name="advanced.presetLock"
        render={({ field }) => (
          <FormItem className="flex items-center justify-between rounded-md border border-dashed border-border/60 bg-muted/30 px-3 py-2">
            <div>
              <FormLabel>Lock preset</FormLabel>
              <FormDescription>
                Prevents accidental overrides when a preset is applied.
              </FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={field.value ?? false}
                onCheckedChange={field.onChange}
              />
            </FormControl>
          </FormItem>
        )}
      />
      <div className="space-y-3 rounded-md border border-border/50 p-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Inline CTA
            </p>
            <p className="text-xs text-muted-foreground">
              Adds a button below the block content.
            </p>
          </div>
          <Switch checked={Boolean(cta)} onCheckedChange={toggleCta} />
        </div>
        {cta ? (
          <div className="grid gap-3 md:grid-cols-2">
            <FormField
              control={form.control}
              name="advanced.cta.label"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Label</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Button label"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="advanced.cta.href"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="/contact"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="advanced.cta.variant"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Variant</FormLabel>
                  <Select
                    value={field.value ?? "default"}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {blockActionVariants.map((variant) => (
                        <SelectItem key={variant} value={variant}>
                          {variant}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="advanced.cta.target"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target</FormLabel>
                  <Select
                    value={field.value ?? "_self"}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="_self">Same tab</SelectItem>
                      <SelectItem value="_blank">New tab</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

const tabbedGuideSectionOptions: {
  value: TabbedGuideSection["type"];
  label: string;
}[] = [
  { value: "cardGrid", label: "Card Grid" },
  { value: "dataGrid", label: "Data Grid" },
  { value: "callout", label: "Callout" },
  { value: "mediaSpotlight", label: "Media Spotlight" },
  { value: "infoPanels", label: "Info Panels" },
  { value: "compactList", label: "Compact List" },
  { value: "hotelShowcase", label: "Hotel Showcase" },
  { value: "cta", label: "Call To Action" },
];

function makeTabId() {
  return `tab-${Math.random().toString(36).slice(2, 8)}`;
}

function createTabbedGuideSection(
  type: TabbedGuideSection["type"],
): TabbedGuideSection {
  switch (type) {
    case "cardGrid":
      return {
        type: "cardGrid",
        columns: 2,
        cards: [
          {
            title: "Card title",
            description: "Short supporting description",
            bullets: ["Key detail one", "Key detail two"],
          },
        ],
      };
    case "dataGrid":
      return {
        type: "dataGrid",
        title: "Data grid title",
        columns: [
          { key: "detail", label: "Detail" },
          { key: "value", label: "Value" },
        ],
        rows: [
          {
            title: "Row title",
            values: { detail: "Requirement", value: "30 days" },
          },
        ],
        layout: "cards",
      };
    case "callout":
      return {
        type: "callout",
        tone: "info",
        title: "Important information",
        bullets: ["Add helpful reminders here."],
      };
    case "mediaSpotlight":
      return {
        type: "mediaSpotlight",
        badge: "Spotlight",
        title: "Media spotlight title",
        body: "Describe the service or highlight the concierge benefit.",
        bullets: ["First highlight", "Second highlight"],
        image: {
          src: "/accommodation-egypt.jpg",
          alt: "Spotlight image",
        },
      };
    case "infoPanels":
      return {
        type: "infoPanels",
        panels: [
          {
            title: "Panel title",
            items: ["Bullet point one", "Bullet point two"],
          },
        ],
      };
    case "compactList":
      return {
        type: "compactList",
        title: "List title",
        rows: [
          {
            title: "List item title",
            description: "Supporting description goes here.",
            pill: "15-25°C",
          },
        ],
      };
    case "hotelShowcase":
      return {
        type: "hotelShowcase",
        title: "Featured hotels",
        description: "Automatically pulls partner hotels, fallback below.",
        layout: "grid",
        limit: 4,
        manualFallback: [
          {
            title: "Fallback stay",
            description: "Recovery-friendly accommodation.",
            amenities: ["Amenity one", "Amenity two"],
            priceLabel: "$150/night",
            locationLabel: "New Cairo",
            icon: "Hotel",
          },
        ],
      };
    case "cta":
      return {
        type: "cta",
        eyebrow: "Need help?",
        title: "Coordinate your journey",
        description: "Our travel specialists can handle every detail.",
        actions: [
          { label: "Contact us", href: "/contact" },
          { label: "Download guide", href: "/travel-info", variant: "outline" },
        ],
      };
    default:
      return {
        type: "callout",
        title: "Update this section",
        tone: "info",
      };
  }
}

function createTabbedGuideTab(): TabbedGuideTab {
  return {
    id: makeTabId(),
    label: "New Tab",
    heading: "Tab heading",
    description: "Tab description",
    sections: [createTabbedGuideSection("cardGrid")],
  };
}

function TabbedGuideBlockFields({
  form,
}: {
  form: UseFormReturn<BlockValue<"tabbedGuide">>;
}) {
  const tabs = useFieldArray({
    control: form.control,
    name: "tabs",
  });

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name="eyebrow"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Eyebrow</FormLabel>
              <FormControl>
                <Input placeholder="Optional label" {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="badge"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Badge</FormLabel>
              <FormControl>
                <Input placeholder="Badge text" {...field} />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
      <FormField
        control={form.control}
        name="heading"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Heading</FormLabel>
            <FormControl>
              <Input placeholder="Block heading" {...field} />
            </FormControl>
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea
                rows={3}
                placeholder="Optional supporting copy"
                {...field}
              />
            </FormControl>
          </FormItem>
        )}
      />

      <div className="space-y-4">
        {tabs.fields.map((field, index) => (
          <TabbedGuideTabEditor
            key={field.id}
            form={form}
            tabIndex={index}
            tabCount={tabs.fields.length}
            onRemove={() => tabs.remove(index)}
            onMove={(direction) => {
              const target = index + direction;
              if (target >= 0 && target < tabs.fields.length) {
                tabs.move(index, target);
              }
            }}
          />
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={() => tabs.append(createTabbedGuideTab())}
        >
          Add tab
        </Button>
      </div>
    </div>
  );
}

function TabbedGuideTabEditor({
  form,
  tabIndex,
  tabCount,
  onRemove,
  onMove,
}: {
  form: UseFormReturn<BlockValue<"tabbedGuide">>;
  tabIndex: number;
  tabCount: number;
  onRemove: () => void;
  onMove: (direction: -1 | 1) => void;
}) {
  const sections = useFieldArray({
    control: form.control,
    name: `tabs.${tabIndex}.sections` as const,
  });
  const [nextSectionType, setNextSectionType] =
    useState<TabbedGuideSection["type"]>("cardGrid");
  const tabLabel = form.watch(`tabs.${tabIndex}.label`);

  return (
    <div className="space-y-4 rounded-lg border border-border/60 p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h4 className="text-lg font-semibold text-foreground">
            {tabLabel || `Tab ${tabIndex + 1}`}
          </h4>
          <p className="text-xs text-muted-foreground">
            Configure tab metadata and sections.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onMove(-1)}
            disabled={tabIndex === 0}
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onMove(1)}
            disabled={tabIndex === tabCount - 1}
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="icon"
            onClick={onRemove}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name={`tabs.${tabIndex}.id`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tab ID</FormLabel>
              <FormControl>
                <Input
                  placeholder="visa-entry"
                  {...field}
                  onChange={(event) => {
                    field.onChange(event.target.value);
                  }}
                />
              </FormControl>
              <FormDescription>
                Used for anchors and internal linking.
              </FormDescription>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`tabs.${tabIndex}.label`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tab label</FormLabel>
              <FormControl>
                <Input placeholder="Visa & Entry" {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`tabs.${tabIndex}.icon`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Icon (Lucide name)</FormLabel>
              <FormControl>
                <Input placeholder="FileText" {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <div />
      </div>

      <FormField
        control={form.control}
        name={`tabs.${tabIndex}.heading`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Tab heading</FormLabel>
            <FormControl>
              <Input placeholder="Tab heading" {...field} />
            </FormControl>
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name={`tabs.${tabIndex}.description`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Tab description</FormLabel>
            <FormControl>
              <Textarea
                rows={3}
                placeholder="Optional description"
                {...field}
              />
            </FormControl>
          </FormItem>
        )}
      />

      <div className="space-y-4">
        {sections.fields.map((section, sectionIndex) => (
          <TabbedGuideSectionEditor
            key={section.id}
            form={form}
            tabIndex={tabIndex}
            sectionIndex={sectionIndex}
            sectionsCount={sections.fields.length}
            onRemove={() => sections.remove(sectionIndex)}
            onMove={(direction) => {
              const target = sectionIndex + direction;
              if (target >= 0 && target < sections.fields.length) {
                sections.move(sectionIndex, target);
              }
            }}
          />
        ))}
        <div className="flex flex-wrap items-center gap-3">
          <Select
            value={nextSectionType}
            onValueChange={(value) =>
              setNextSectionType(value as TabbedGuideSection["type"])
            }
          >
            <FormControl>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Section type" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {tabbedGuideSectionOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              sections.append(createTabbedGuideSection(nextSectionType))
            }
          >
            Add section
          </Button>
        </div>
      </div>
    </div>
  );
}

function TabbedGuideSectionEditor({
  form,
  tabIndex,
  sectionIndex,
  sectionsCount,
  onRemove,
  onMove,
}: {
  form: UseFormReturn<BlockValue<"tabbedGuide">>;
  tabIndex: number;
  sectionIndex: number;
  sectionsCount: number;
  onRemove: () => void;
  onMove: (direction: -1 | 1) => void;
}) {
  const path = `tabs.${tabIndex}.sections.${sectionIndex}` as const;
  const sectionType = form.watch(`${path}.type`) as TabbedGuideSection["type"];

  const handleTypeChange = (nextType: string) => {
    const replacement = createTabbedGuideSection(
      nextType as TabbedGuideSection["type"],
    );
    form.setValue(path as any, replacement, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  return (
    <div className="space-y-4 rounded-lg border border-dashed border-border/60 p-4">
      <div className="flex items-center justify-between gap-4">
        <Select
          value={sectionType}
          onValueChange={(value) => handleTypeChange(value)}
        >
          <FormControl>
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
          </FormControl>
          <SelectContent>
            {tabbedGuideSectionOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onMove(-1)}
            disabled={sectionIndex === 0}
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onMove(1)}
            disabled={sectionIndex === sectionsCount - 1}
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="icon"
            onClick={onRemove}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <FormField
        control={form.control}
        name={`${path}.displayWidth`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Section width</FormLabel>
            <Select
              value={field.value ?? "full"}
              onValueChange={(value) => field.onChange(value)}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="full">Full width</SelectItem>
                <SelectItem value="half">
                  Half width (side-by-side on desktop)
                </SelectItem>
              </SelectContent>
            </Select>
            <FormDescription>
              Choose “Half width” to place this section in a two-column layout
              beside other half-width sections.
            </FormDescription>
          </FormItem>
        )}
      />

      <TabbedGuideSectionFields
        form={form}
        sectionPath={path}
        sectionType={sectionType}
      />
    </div>
  );
}

function TabbedGuideSectionFields({
  form,
  sectionPath,
  sectionType,
}: {
  form: UseFormReturn<BlockValue<"tabbedGuide">>;
  sectionPath: `tabs.${number}.sections.${number}`;
  sectionType: TabbedGuideSection["type"];
}) {
  switch (sectionType) {
    case "cardGrid":
      return <CardGridSectionFields form={form} sectionPath={sectionPath} />;
    case "dataGrid":
      return <DataGridSectionFields form={form} sectionPath={sectionPath} />;
    case "compactList":
      return <CompactListSectionFields form={form} sectionPath={sectionPath} />;
    case "callout":
      return (
        <div className="space-y-3">
          <FormField
            control={form.control}
            name={`${sectionPath}.title`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input placeholder="Callout title" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={`${sectionPath}.body`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    rows={3}
                    placeholder="Optional details"
                    {...field}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={`${sectionPath}.tone`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tone</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="muted">Muted</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={`${sectionPath}.bullets`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bullets</FormLabel>
                <FormControl>
                  <Textarea
                    rows={3}
                    placeholder="One item per line"
                    value={(field.value ?? []).join("\n")}
                    onChange={(event) =>
                      field.onChange(
                        event.target.value
                          .split("\n")
                          .map((line) => line.trim()),
                      )
                    }
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
      );
    case "mediaSpotlight":
      return (
        <div className="space-y-4">
          <FormField
            control={form.control}
            name={`${sectionPath}.badge`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Badge</FormLabel>
                <FormControl>
                  <Input placeholder="Optional badge" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={`${sectionPath}.title`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input placeholder="Spotlight title" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={`${sectionPath}.body`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    rows={3}
                    placeholder="Spotlight description"
                    {...field}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={`${sectionPath}.bullets`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bullets</FormLabel>
                <FormControl>
                  <Textarea
                    rows={3}
                    placeholder="One bullet per line"
                    value={(field.value ?? []).join("\n")}
                    onChange={(event) =>
                      field.onChange(
                        event.target.value
                          .split("\n")
                          .map((line) => line.trim()),
                      )
                    }
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name={`${sectionPath}.image.src`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image URL</FormLabel>
                  <FormControl>
                    <Input placeholder="/media.jpg" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`${sectionPath}.image.alt`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image alt text</FormLabel>
                  <FormControl>
                    <Input placeholder="Descriptive alt text" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>
      );
    case "infoPanels":
      return <InfoPanelsSectionFields form={form} sectionPath={sectionPath} />;
    case "hotelShowcase":
      return <HotelSectionFields form={form} sectionPath={sectionPath} />;
    case "cta":
      return <CtaSectionFields form={form} sectionPath={sectionPath} />;
    default:
      return null;
  }
}

function CardGridSectionFields({
  form,
  sectionPath,
}: {
  form: UseFormReturn<BlockValue<"tabbedGuide">>;
  sectionPath: `tabs.${number}.sections.${number}`;
}) {
  const cards = useFieldArray({
    control: form.control,
    name: `${sectionPath}.cards` as const,
  });
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name={`${sectionPath}.title`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Card grid title" {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`${sectionPath}.columns`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Columns</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  max={3}
                  value={typeof field.value === "number" ? field.value : 2}
                  onChange={(event) =>
                    field.onChange(Number(event.target.value) || 1)
                  }
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
      <FormField
        control={form.control}
        name={`${sectionPath}.description`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea
                rows={3}
                placeholder="Optional description"
                {...field}
              />
            </FormControl>
          </FormItem>
        )}
      />
      <div className="space-y-3">
        {cards.fields.map((card, index) => (
          <div
            key={card.id}
            className="space-y-3 rounded-md border border-border/50 p-3"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Card {index + 1}</p>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => cards.remove(index)}
                disabled={cards.fields.length === 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <FormField
              control={form.control}
              name={`${sectionPath}.cards.${index}.title`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Card title" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`${sectionPath}.cards.${index}.description`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={2}
                      placeholder="Card description"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`${sectionPath}.cards.${index}.markdown`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Markdown body</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={4}
                      placeholder="Supports headings, emphasis, and lists via Markdown"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional rich text area. When provided, it renders before
                    the bullet list so you can mix headings, paragraphs, or
                    custom lists.
                  </FormDescription>
                </FormItem>
              )}
            />
            <div className="grid gap-3 md:grid-cols-2">
              <FormField
                control={form.control}
                name={`${sectionPath}.cards.${index}.icon`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Icon</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Globe" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`${sectionPath}.cards.${index}.badge`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Badge</FormLabel>
                    <FormControl>
                      <Input placeholder="Optional badge" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name={`${sectionPath}.cards.${index}.bullets`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bullets</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="One bullet per line"
                      value={(field.value ?? []).join("\n")}
                      onChange={(event) =>
                        field.onChange(
                          event.target.value
                            .split("\n")
                            .map((line) => line.trim()),
                        )
                      }
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            cards.append({
              title: "Card title",
              description: "Description",
              bullets: [],
            })
          }
        >
          Add card
        </Button>
      </div>
    </div>
  );
}

function DataGridSectionFields({
  form,
  sectionPath,
}: {
  form: UseFormReturn<BlockValue<"tabbedGuide">>;
  sectionPath: `tabs.${number}.sections.${number}`;
}) {
  const columns = useFieldArray({
    control: form.control,
    name: `${sectionPath}.columns` as const,
  });
  const rows = useFieldArray({
    control: form.control,
    name: `${sectionPath}.rows` as const,
  });
  const watchedColumns = form.watch(`${sectionPath}.columns`);
  const safeColumns = Array.isArray(watchedColumns) ? watchedColumns : [];
  const layoutValue = form.watch(`${sectionPath}.layout`) ?? "cards";
  const pillOptions = safeColumns.filter(
    (column): column is { key: string; label?: string } =>
      typeof column?.key === "string" && column.key.trim().length > 0,
  );
  const NONE_PILL_VALUE = "__none__";

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name={`${sectionPath}.title`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Title</FormLabel>
            <FormControl>
              <Input placeholder="Section title" {...field} />
            </FormControl>
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name={`${sectionPath}.description`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea
                rows={3}
                placeholder="Optional description"
                {...field}
              />
            </FormControl>
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name={`${sectionPath}.layout`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Layout</FormLabel>
            <Select
              value={field.value ?? "cards"}
              onValueChange={field.onChange}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select layout" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="cards">Card grid</SelectItem>
                <SelectItem value="stacked">Stacked list</SelectItem>
              </SelectContent>
            </Select>
            <FormDescription>
              Choose how rows are displayed. “Stacked list” renders a single
              card with timeline-style rows.
            </FormDescription>
          </FormItem>
        )}
      />
      {layoutValue === "stacked" ? (
        <FormField
          control={form.control}
          name={`${sectionPath}.pillColumnKey`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pill column (optional)</FormLabel>
              <Select
                value={field.value ?? NONE_PILL_VALUE}
                onValueChange={(value) =>
                  field.onChange(value === NONE_PILL_VALUE ? undefined : value)
                }
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="No pill" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={NONE_PILL_VALUE}>None</SelectItem>
                  {pillOptions.map((column, index) => (
                    <SelectItem
                      key={`${sectionPath}-pill-${column?.key ?? index}`}
                      value={column.key}
                    >
                      {column.label ?? column.key ?? `Column ${index + 1}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                The selected column’s value appears as a badge next to each row
                title—perfect for temperatures or price tags.
              </FormDescription>
            </FormItem>
          )}
        />
      ) : null}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-muted-foreground">Columns</p>
        {columns.fields.map((column, index) => {
          const fieldKey =
            (column as { id?: string | number | null })?.id ??
            `${sectionPath}-column-${index}`;
          return (
            <div
              key={fieldKey}
              className="grid gap-3 md:grid-cols-[1fr_1fr_auto]"
            >
              <FormField
                control={form.control}
                name={`${sectionPath}.columns.${index}.label`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Label</FormLabel>
                    <FormControl>
                      <Input placeholder="Duration" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`${sectionPath}.columns.${index}.key`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Key</FormLabel>
                    <FormControl>
                      <Input placeholder="duration" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => columns.remove(index)}
                disabled={columns.fields.length <= 2}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          );
        })}
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            columns.append({
              label: "Column label",
              key: `column-${columns.fields.length + 1}`,
            } as any)
          }
        >
          Add column
        </Button>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-semibold text-muted-foreground">Rows</p>
        {rows.fields.map((row, rowIndex) => (
          <div
            key={row.id}
            className="space-y-3 rounded-md border border-border/50 p-3"
          >
            <div className="flex items-center justify-between">
              <FormField
                control={form.control}
                name={`${sectionPath}.rows.${rowIndex}.title`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Row title</FormLabel>
                    <FormControl>
                      <Input placeholder="Row title" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => rows.remove(rowIndex)}
                className="ml-3"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <FormField
              control={form.control}
              name={`${sectionPath}.rows.${rowIndex}.badge`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Badge</FormLabel>
                  <FormControl>
                    <Input placeholder="Optional badge" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="grid gap-3 md:grid-cols-2">
              {safeColumns.map((column, columnIndex) => (
                <FormField
                  key={`${column?.key ?? columnIndex}`}
                  control={form.control}
                  name={`${sectionPath}.rows.${rowIndex}.values.${
                    column?.key ?? `column-${columnIndex}`
                  }`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {column?.label ?? `Column ${columnIndex + 1}`}
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Value" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              ))}
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            rows.append({
              title: "Row title",
              values: {},
            })
          }
        >
          Add row
        </Button>
      </div>
    </div>
  );
}

function InfoPanelsSectionFields({
  form,
  sectionPath,
}: {
  form: UseFormReturn<BlockValue<"tabbedGuide">>;
  sectionPath: `tabs.${number}.sections.${number}`;
}) {
  const panels = useFieldArray({
    control: form.control,
    name: `${sectionPath}.panels` as const,
  });
  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name={`${sectionPath}.title`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Heading</FormLabel>
            <FormControl>
              <Input placeholder="Optional headline" {...field} />
            </FormControl>
          </FormItem>
        )}
      />
      <div className="space-y-3">
        {panels.fields.map((panel, index) => (
          <div
            key={panel.id}
            className="space-y-3 rounded-md border border-border/60 p-3"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Panel {index + 1}</p>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => panels.remove(index)}
                disabled={panels.fields.length === 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <FormField
              control={form.control}
              name={`${sectionPath}.panels.${index}.title`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Panel title" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`${sectionPath}.panels.${index}.description`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={2}
                      placeholder="Optional description"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`${sectionPath}.panels.${index}.items`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Items</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="One bullet per line"
                      value={(field.value ?? []).join("\n")}
                      onChange={(event) =>
                        field.onChange(
                          event.target.value
                            .split("\n")
                            .map((line) => line.trim()),
                        )
                      }
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            panels.append({
              title: "Panel title",
              items: [],
            })
          }
        >
          Add panel
        </Button>
      </div>
    </div>
  );
}

function HotelSectionFields({
  form,
  sectionPath,
}: {
  form: UseFormReturn<BlockValue<"tabbedGuide">>;
  sectionPath: `tabs.${number}.sections.${number}`;
}) {
  const fallbackEntries = useFieldArray({
    control: form.control,
    name: `${sectionPath}.manualFallback` as const,
  });
  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name={`${sectionPath}.title`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Title</FormLabel>
            <FormControl>
              <Input placeholder="Hotel section title" {...field} />
            </FormControl>
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name={`${sectionPath}.description`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea
                rows={3}
                placeholder="Optional description"
                {...field}
              />
            </FormControl>
          </FormItem>
        )}
      />
      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name={`${sectionPath}.layout`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Layout</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="grid">Grid</SelectItem>
                  <SelectItem value="carousel">Carousel</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`${sectionPath}.limit`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dynamic limit</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  max={8}
                  value={field.value ?? 4}
                  onChange={(event) =>
                    field.onChange(Number(event.target.value) || 1)
                  }
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
      <div className="space-y-3">
        <p className="text-sm font-semibold text-muted-foreground">
          Manual fallback (used if no partner hotels available)
        </p>
        {fallbackEntries.fields.map((entry, index) => (
          <div
            key={entry.id}
            className="space-y-3 rounded-md border border-border/50 p-3"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Fallback {index + 1}</p>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => fallbackEntries.remove(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <FormField
              control={form.control}
              name={`${sectionPath}.manualFallback.${index}.title`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Stay name" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`${sectionPath}.manualFallback.${index}.description`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={2}
                      placeholder="Short description"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`${sectionPath}.manualFallback.${index}.heroImage`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hero image</FormLabel>
                  <FormControl>
                    <Input placeholder="/images/hotel.jpg" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`${sectionPath}.manualFallback.${index}.addressDetails`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address details</FormLabel>
                  <FormControl>
                    <Input placeholder="123 Nile St, Cairo" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="grid gap-3 md:grid-cols-2">
              <FormField
                control={form.control}
                name={`${sectionPath}.manualFallback.${index}.contactPhone`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact phone</FormLabel>
                    <FormControl>
                      <Input placeholder="+20 2 1234 5678" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`${sectionPath}.manualFallback.${index}.contactEmail`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact email</FormLabel>
                    <FormControl>
                      <Input placeholder="stay@hotel.com" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name={`${sectionPath}.manualFallback.${index}.website`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website</FormLabel>
                  <FormControl>
                    <Input placeholder="https://partner-hotel.com" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`${sectionPath}.manualFallback.${index}.amenities`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amenities</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="One amenity per line"
                      value={(field.value ?? []).join("\n")}
                      onChange={(event) =>
                        field.onChange(
                          event.target.value
                            .split("\n")
                            .map((line) => line.trim()),
                        )
                      }
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="grid gap-3 md:grid-cols-2">
              <FormField
                control={form.control}
                name={`${sectionPath}.manualFallback.${index}.priceLabel`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price label</FormLabel>
                    <FormControl>
                      <Input placeholder="$150 - $300/night" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`${sectionPath}.manualFallback.${index}.locationLabel`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location label</FormLabel>
                    <FormControl>
                      <Input placeholder="New Cairo" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <FormField
                control={form.control}
                name={`${sectionPath}.manualFallback.${index}.icon`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Icon</FormLabel>
                    <FormControl>
                      <Input placeholder="Hotel" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`${sectionPath}.manualFallback.${index}.starRating`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Star rating</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={5}
                        value={field.value ?? ""}
                        onChange={(event) =>
                          field.onChange(
                            event.target.value
                              ? Number(event.target.value)
                              : undefined,
                          )
                        }
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`${sectionPath}.manualFallback.${index}.rating`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Guest rating</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        min={0}
                        max={5}
                        value={field.value ?? ""}
                        onChange={(event) =>
                          field.onChange(
                            event.target.value
                              ? Number(event.target.value)
                              : undefined,
                          )
                        }
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`${sectionPath}.manualFallback.${index}.reviewCount`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Review count</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step="1"
                        value={field.value ?? ""}
                        onChange={(event) =>
                          field.onChange(
                            event.target.value
                              ? Number(event.target.value)
                              : undefined,
                          )
                        }
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            fallbackEntries.append({
              title: "Fallback stay",
              amenities: [],
            })
          }
        >
          Add fallback
        </Button>
      </div>
    </div>
  );
}

function CtaSectionFields({
  form,
  sectionPath,
}: {
  form: UseFormReturn<BlockValue<"tabbedGuide">>;
  sectionPath: `tabs.${number}.sections.${number}`;
}) {
  const actions = useFieldArray({
    control: form.control,
    name: `${sectionPath}.actions` as const,
  });
  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name={`${sectionPath}.eyebrow`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Eyebrow</FormLabel>
            <FormControl>
              <Input placeholder="Optional label" {...field} />
            </FormControl>
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name={`${sectionPath}.title`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Title</FormLabel>
            <FormControl>
              <Input placeholder="CTA title" {...field} />
            </FormControl>
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name={`${sectionPath}.description`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea
                rows={3}
                placeholder="Optional description"
                {...field}
              />
            </FormControl>
          </FormItem>
        )}
      />
      <div className="space-y-3">
        {actions.fields.map((action, index) => (
          <div
            key={action.id}
            className="grid gap-3 rounded-md border border-border/50 p-3 md:grid-cols-2"
          >
            <FormField
              control={form.control}
              name={`${sectionPath}.actions.${index}.label`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Label</FormLabel>
                  <FormControl>
                    <Input placeholder="Button label" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`${sectionPath}.actions.${index}.href`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL</FormLabel>
                  <FormControl>
                    <Input placeholder="/contact" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`${sectionPath}.actions.${index}.variant`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Variant</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {blockActionVariants.map((variant) => (
                        <SelectItem key={variant} value={variant}>
                          {variant}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <div className="flex items-end justify-end">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => actions.remove(index)}
                disabled={actions.fields.length === 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        {actions.fields.length < 2 ? (
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              actions.append({
                label: "Button label",
                href: "/contact",
                variant: "outline",
              })
            }
          >
            Add action
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function normalizeForCompare(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(normalizeForCompare);
  }
  if (value && typeof value === "object") {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        // Only filter out id fields that are React Hook Form tracking IDs, not actual data IDs
        if (key === "id") {
          const idValue = (value as Record<string, unknown>)[key];
          if (
            typeof idValue === "string" &&
            idValue.match(/^[a-z0-9]{8}(-[a-z0-9]{4}){3}-[a-z0-9]{12}$/i)
          ) {
            return acc; // This is likely a React Hook Form generated ID, skip it
          }
        }
        const val = (value as Record<string, unknown>)[key];
        if (val === undefined) return acc;
        acc[key] = normalizeForCompare(val);
        return acc;
      }, {});
  }
  return value;
}

function serializeBlockValue(value: BlockValue): string {
  return JSON.stringify(normalizeForCompare(value));
}

function deepClone<T>(value: T): T {
  if (value === null || typeof value !== "object") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => deepClone(item)) as unknown as T;
  }

  return Object.entries(value as Record<string, unknown>).reduce<
    Record<string, unknown>
  >((acc, [key, val]) => {
    acc[key] = deepClone(val as unknown);
    return acc;
  }, {}) as T;
}

function useSyncedForm<T extends BlockType>(
  block: BlockInstance<T>,
  onChange: (next: BlockInstance<T>) => void,
) {
  const definition = blockRegistry[block.type];
  const schema = definition.schema as BlockSchema<T>;
  const isResettingRef = useRef(false);
  const lastSyncedSnapshotRef = useRef(serializeBlockValue(block));

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: block as BlockValue<T>,
    mode: "onChange",
  });

  useEffect(() => {
    const nextSnapshot = serializeBlockValue(block);
    if (nextSnapshot === lastSyncedSnapshotRef.current) {
      return;
    }

    const parsedCurrent = schema.safeParse({
      ...form.getValues(),
      type: block.type,
      blockId: block.blockId,
    });
    if (parsedCurrent.success) {
      const currentSnapshot = serializeBlockValue(
        parsedCurrent.data as BlockValue<T>,
      );
      if (currentSnapshot === nextSnapshot) {
        lastSyncedSnapshotRef.current = nextSnapshot;
        return;
      }
    }

    isResettingRef.current = true;
    form.reset(block as BlockValue<T>, {
      keepDirty: false,
      keepTouched: false,
    });
    lastSyncedSnapshotRef.current = nextSnapshot;
    const timeout = setTimeout(() => {
      isResettingRef.current = false;
    }, 0);
    return () => {
      clearTimeout(timeout);
      isResettingRef.current = false;
    };
  }, [block, form, schema]);

  useEffect(() => {
    const subscription = form.watch(() => {
      if (isResettingRef.current) return;
      const values = form.getValues();
      const candidate = {
        ...values,
        type: block.type,
        blockId: block.blockId,
      };
      const parsed = schema.safeParse(candidate);
      const source = parsed.success
        ? parsed.data
        : (candidate as BlockValue<T>);
      const blockId =
        (source as BlockValue<T> & { blockId?: string }).blockId ??
        block.blockId;
      const nextWithId = deepClone({
        ...source,
        blockId,
      }) as BlockInstance<T>;
      const snapshot = serializeBlockValue(nextWithId);
      if (snapshot === lastSyncedSnapshotRef.current) {
        return;
      }
      lastSyncedSnapshotRef.current = snapshot;
      onChange(nextWithId);
    });
    return () => subscription.unsubscribe();
  }, [form, schema, onChange, block.type, block.blockId]);

  return form;
}

function HeroBlockFields({
  form,
}: {
  form: UseFormReturn<BlockValue<"hero">>;
}) {
  const primaryAction = form.watch("primaryAction");
  const secondaryAction = form.watch("secondaryAction");
  const media = form.watch("media");
  const mediaType = form.watch("media.type") ?? "image";

  const ensureAction = (key: "primaryAction" | "secondaryAction") => {
    const current = form.getValues(key);
    if (current) return;
    form.setValue(
      key,
      {
        label: key === "primaryAction" ? "Book consultation" : "Learn more",
        href: "/consultation",
        variant: key === "primaryAction" ? "default" : "secondary",
      },
      { shouldDirty: true },
    );
  };

  const removeAction = (key: "primaryAction" | "secondaryAction") => {
    form.setValue(key, undefined, { shouldDirty: true });
  };

  const ensureMedia = () => {
    const current = form.getValues("media");
    if (current) return;
    form.setValue(
      "media",
      {
        type: "image",
        src: "/placeholder.svg",
        alt: "Placeholder",
      },
      { shouldDirty: true },
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        <FormField
          control={form.control}
          name="eyebrow"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Eyebrow</FormLabel>
              <FormControl>
                <Input
                  placeholder="Optional label above headline"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormDescription>
                Short label that appears above the main heading.
              </FormDescription>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="heading"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Heading</FormLabel>
              <FormControl>
                <Input
                  placeholder="Impactful headline"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="highlight"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Highlighted Line</FormLabel>
              <FormControl>
                <Input
                  placeholder="Optional highlighted line"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormDescription>
                Shown as a gradient line beneath the heading.
              </FormDescription>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Supporting Copy</FormLabel>
              <FormControl>
                <Textarea
                  rows={4}
                  placeholder="Expand on the headline with supporting context"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name="alignment"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Alignment</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select alignment" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="background"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Background</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select background" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="white">Plain</SelectItem>
                  <SelectItem value="muted">Muted</SelectItem>
                  <SelectItem value="gradient">
                    Clinical Surface (Legacy Value)
                  </SelectItem>
                  <SelectItem value="primary">Primary</SelectItem>
                  <SelectItem value="layeredLinear">
                    Layered Gradient
                  </SelectItem>
                  <SelectItem value="layeredGlow">Radial Glow</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="containerWidth"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Content Width</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select width" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="wide">Wide</SelectItem>
                  <SelectItem value="narrow">Narrow</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold">Primary Action</Label>
          <Switch
            checked={Boolean(primaryAction)}
            onCheckedChange={(checked) =>
              checked
                ? ensureAction("primaryAction")
                : removeAction("primaryAction")
            }
          />
        </div>
        {primaryAction ? (
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="primaryAction.label"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Label</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Button text"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="primaryAction.href"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Link</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="/consultation"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="primaryAction.variant"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Style</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="default">Default</SelectItem>
                      <SelectItem value="secondary">Secondary</SelectItem>
                      <SelectItem value="outline">Outline</SelectItem>
                      <SelectItem value="ghost">Ghost</SelectItem>
                      <SelectItem value="link">Link</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="primaryAction.target"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target</FormLabel>
                  <Select
                    value={field.value ?? "_self"}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="_self">Same tab</SelectItem>
                      <SelectItem value="_blank">New tab</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
          </div>
        ) : null}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold">Secondary Action</Label>
          <Switch
            checked={Boolean(secondaryAction)}
            onCheckedChange={(checked) =>
              checked
                ? ensureAction("secondaryAction")
                : removeAction("secondaryAction")
            }
          />
        </div>
        {secondaryAction ? (
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="secondaryAction.label"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Label</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Button text"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="secondaryAction.href"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Link</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="/contact"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="secondaryAction.variant"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Style</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="default">Default</SelectItem>
                      <SelectItem value="secondary">Secondary</SelectItem>
                      <SelectItem value="outline">Outline</SelectItem>
                      <SelectItem value="ghost">Ghost</SelectItem>
                      <SelectItem value="link">Link</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="secondaryAction.target"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target</FormLabel>
                  <Select
                    value={field.value ?? "_self"}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="_self">Same tab</SelectItem>
                      <SelectItem value="_blank">New tab</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
          </div>
        ) : null}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold">Media</Label>
          <Switch
            checked={Boolean(media)}
            onCheckedChange={(checked) =>
              checked ? ensureMedia() : form.setValue("media", undefined)
            }
          />
        </div>
        {media ? (
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="media.type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select
                    value={field.value ?? "image"}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="image">Image</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="media.src"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Source</FormLabel>
                  {mediaType === "image" ? (
                    <ImageUploader
                      label="Upload image"
                      value={field.value ?? null}
                      onChange={(url) =>
                        form.setValue("media.src", url ?? "", {
                          shouldDirty: true,
                        })
                      }
                      bucket="media"
                      folder="cms"
                    />
                  ) : null}
                  <FormDescription>Or provide a URL below.</FormDescription>
                  <FormControl>
                    <Input
                      placeholder="/hero.jpg"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="media.alt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alt Text</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Describe the media"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="media.caption"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Caption</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Optional caption"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function InlineActionFields({
  form,
  path,
  title,
}: {
  form: AnyForm;
  path: "primaryAction" | "secondaryAction";
  title: string;
}) {
  return (
    <div className="space-y-4">
      <Label className="text-sm font-semibold">{title}</Label>
      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name={`${path}.label` as const}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Label</FormLabel>
              <FormControl>
                <Input
                  placeholder="Button text"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`${path}.href` as const}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Link</FormLabel>
              <FormControl>
                <Input
                  placeholder="/start-journey"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`${path}.variant` as const}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Style</FormLabel>
              <Select
                value={field.value ?? "default"}
                onValueChange={field.onChange}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {blockActionVariants.map((variant) => (
                    <SelectItem key={variant} value={variant}>
                      {variant}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`${path}.target` as const}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Target</FormLabel>
              <Select
                value={field.value ?? "_self"}
                onValueChange={field.onChange}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="_self">Same tab</SelectItem>
                  <SelectItem value="_blank">New tab</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}

function HomeHeroBlockFields({
  form,
}: {
  form: UseFormReturn<BlockValue<"homeHero">>;
}) {
  const highlights = useFieldArray({
    control: form.control,
    name: "highlights",
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        <FormField
          control={form.control}
          name="eyebrow"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Eyebrow</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ""} />
              </FormControl>
            </FormItem>
          )}
        />
        <div className="grid gap-4 md:grid-cols-3">
          <FormField
            control={form.control}
            name="headingPrefix"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Heading prefix</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="headingHighlight"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Highlighted line</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="headingSuffix"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Heading suffix</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  rows={5}
                  placeholder="Supports line breaks for the two-paragraph hero copy."
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="backgroundImageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Background image</FormLabel>
              <ImageUploader
                label="Hero background"
                value={field.value ?? null}
                onChange={(url) =>
                  form.setValue("backgroundImageUrl", url ?? "", {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
                bucket="media"
                folder="cms/homepage"
              />
              <FormDescription>
                Upload or paste the hero background image.
              </FormDescription>
              <FormControl>
                <Input {...field} value={field.value ?? ""} />
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      <HeroOverlayFields form={form as AnyForm} />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold">Highlights</Label>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              highlights.append({
                kicker: "New label",
                label: "Add a short proof point",
              })
            }
            disabled={highlights.fields.length >= 4}
          >
            <Plus className="mr-2 h-4 w-4" /> Add highlight
          </Button>
        </div>
        <div className="space-y-4">
          {highlights.fields.map((fieldItem, index) => (
            <div
              key={fieldItem.id}
              className="rounded-lg border border-border/60 p-4 space-y-4"
            >
              <div className="flex items-center justify-between">
                <Badge variant="secondary">Highlight #{index + 1}</Badge>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() =>
                      index > 0 && highlights.move(index, index - 1)
                    }
                    disabled={index === 0}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() =>
                      index < highlights.fields.length - 1 &&
                      highlights.move(index, index + 1)
                    }
                    disabled={index === highlights.fields.length - 1}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => highlights.remove(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name={`highlights.${index}.kicker` as const}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kicker</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ""} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`highlights.${index}.label` as const}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Label</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ""} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <InlineActionFields
        form={form as AnyForm}
        path="primaryAction"
        title="Primary Action"
      />
      <InlineActionFields
        form={form as AnyForm}
        path="secondaryAction"
        title="Secondary Action"
      />
    </div>
  );
}

function HeroOverlayColorField({
  form,
  name,
  label,
  fallback,
}: {
  form: AnyForm;
  name: string;
  label: string;
  fallback: string;
}) {
  const currentValue =
    (form.watch(name as any) as string | undefined) ?? fallback;
  const colorInputValue = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(currentValue)
    ? currentValue
    : fallback;

  return (
    <FormField
      control={form.control}
      name={name as any}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <div className="flex items-center gap-2">
            <FormControl>
              <Input
                {...field}
                value={field.value ?? fallback}
                placeholder={fallback}
              />
            </FormControl>
            <Input
              type="color"
              value={colorInputValue}
              onChange={(event) =>
                field.onChange(event.target.value || fallback)
              }
              className="h-10 w-12 min-w-[3rem] px-1"
              aria-label={`${label} color picker`}
            />
          </div>
        </FormItem>
      )}
    />
  );
}

function HeroOverlayOpacityField({
  form,
  name,
  label,
  fallback,
}: {
  form: AnyForm;
  name: string;
  label: string;
  fallback: number;
}) {
  return (
    <FormField
      control={form.control}
      name={name as any}
      render={({ field }) => {
        const value = Number.isFinite(field.value) ? field.value : fallback;
        return (
          <FormItem>
            <FormLabel>{label}</FormLabel>
            <div className="flex items-center gap-3">
              <Slider
                value={[Math.round(value * 100)]}
                onValueChange={(values) =>
                  field.onChange(
                    parseFloat(((values[0] ?? 0) / 100).toFixed(2)),
                  )
                }
                min={0}
                max={100}
                step={1}
              />
              <span className="w-12 text-right text-xs font-medium text-muted-foreground">
                {value.toFixed(2)}
              </span>
            </div>
          </FormItem>
        );
      }}
    />
  );
}

function HeroOverlayFields({ form }: { form: AnyForm }) {
  return (
    <div className="space-y-4 rounded-lg border border-border/60 p-4">
      <div>
        <Label className="text-sm font-semibold">Hero Overlay</Label>
        <p className="mt-1 text-xs text-muted-foreground">
          Use the same gradient structure across Home and About hero sections
          and tune the color stops when needed.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <HeroOverlayColorField
          form={form}
          name="overlay.fromColor"
          label="Start color"
          fallback="#000000"
        />
        <HeroOverlayOpacityField
          form={form}
          name="overlay.fromOpacity"
          label="Start opacity"
          fallback={0.7}
        />
        <HeroOverlayColorField
          form={form}
          name="overlay.viaColor"
          label="Middle color"
          fallback="#000000"
        />
        <HeroOverlayOpacityField
          form={form}
          name="overlay.viaOpacity"
          label="Middle opacity"
          fallback={0.45}
        />
        <HeroOverlayColorField
          form={form}
          name="overlay.toColor"
          label="End color"
          fallback="#000000"
        />
        <HeroOverlayOpacityField
          form={form}
          name="overlay.toOpacity"
          label="End opacity"
          fallback={0}
        />
      </div>
    </div>
  );
}

function FeaturedTreatmentsHomeBlockFields({
  form,
}: {
  form: UseFormReturn<BlockValue<"featuredTreatmentsHome">>;
}) {
  const selectedLimit = Number(form.watch("limit") ?? 4);

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        <FormField
          control={form.control}
          name="eyebrow"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Eyebrow</FormLabel>
              <FormControl>
                <Input
                  placeholder="Treatments"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input
                  placeholder="Featured Treatments"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  rows={3}
                  placeholder="Supporting section copy"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name="cardAppearance"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Card appearance</FormLabel>
              <Select
                value={field.value ?? "original"}
                onValueChange={field.onChange}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select appearance" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="original">Original Home</SelectItem>
                  <SelectItem value="theme">Theme aware</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="limit"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Card count</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  max={8}
                  value={field.value ?? 4}
                  onChange={(event) =>
                    field.onChange(Number(event.target.value) || 1)
                  }
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="featuredOnly"
          render={({ field }) => (
            <FormItem className="flex flex-col justify-end">
              <FormLabel>Featured only</FormLabel>
              <div className="flex items-center gap-2">
                <FormControl>
                  <Switch
                    checked={field.value ?? true}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormDescription>
                  Limit automatic selection to featured treatments.
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
      </div>
      <FormField
        control={form.control}
        name="manualTreatments"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Manual treatment selection</FormLabel>
            <FormControl>
              <TreatmentMultiSelector
                values={field.value ?? []}
                onChange={field.onChange}
                maxSelections={selectedLimit}
              />
            </FormControl>
            <FormDescription>
              Search and choose treatments directly. Selected order controls the
              card order, and live treatment data fills the cards.
            </FormDescription>
          </FormItem>
        )}
      />
    </div>
  );
}

function JourneyStepsBlockFields({
  form,
}: {
  form: UseFormReturn<BlockValue<"journeySteps">>;
}) {
  const steps = useFieldArray({
    control: form.control,
    name: "steps",
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="highlight"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Highlighted word</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea rows={3} {...field} value={field.value ?? ""} />
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      <div className="space-y-4">
        {steps.fields.map((step, index) => (
          <div
            key={step.id}
            className="space-y-4 rounded-lg border border-dashed border-border/60 p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-foreground">
                Step {index + 1}
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => index > 0 && steps.move(index, index - 1)}
                  disabled={index === 0}
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    index < steps.fields.length - 1 &&
                    steps.move(index, index + 1)
                  }
                  disabled={index === steps.fields.length - 1}
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={() => steps.remove(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name={`steps.${index}.title`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`steps.${index}.icon`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lucide icon</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="MessageCircle"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name={`steps.${index}.description`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} value={field.value ?? ""} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            steps.append({
              icon: "MessageCircle",
              title: "New step",
              description: "Describe this step.",
            })
          }
        >
          <Plus className="mr-2 h-4 w-4" />
          Add step
        </Button>
      </div>
    </div>
  );
}

function DifferentiatorsBlockFields({
  form,
}: {
  form: UseFormReturn<BlockValue<"differentiators">>;
}) {
  const items = useFieldArray({
    control: form.control,
    name: "items",
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        <FormField
          control={form.control}
          name="eyebrow"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Eyebrow</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ""} />
              </FormControl>
            </FormItem>
          )}
        />
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="highlight"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Highlighted word</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea rows={3} {...field} value={field.value ?? ""} />
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      <div className="space-y-4">
        {items.fields.map((item, index) => (
          <div
            key={item.id}
            className="space-y-4 rounded-lg border border-dashed border-border/60 p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-foreground">
                Card {index + 1}
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => index > 0 && items.move(index, index - 1)}
                  disabled={index === 0}
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    index < items.fields.length - 1 &&
                    items.move(index, index + 1)
                  }
                  disabled={index === items.fields.length - 1}
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={() => items.remove(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name={`items.${index}.title`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`items.${index}.highlight`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Badge</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`items.${index}.icon`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lucide icon</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Award"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name={`items.${index}.description`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} value={field.value ?? ""} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            items.append({
              icon: "Award",
              title: "New differentiator",
              description: "Describe the differentiator.",
              highlight: "Proof point",
            })
          }
        >
          <Plus className="mr-2 h-4 w-4" />
          Add card
        </Button>
      </div>
    </div>
  );
}

function HomeCtaBlockFields({
  form,
}: {
  form: UseFormReturn<BlockValue<"homeCta">>;
}) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="headingPrefix"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Heading prefix</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="headingHighlight"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Highlighted words</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea rows={3} {...field} value={field.value ?? ""} />
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      <InlineActionFields
        form={form as AnyForm}
        path="primaryAction"
        title="Primary Action"
      />
      <InlineActionFields
        form={form as AnyForm}
        path="secondaryAction"
        title="Secondary Action"
      />
    </div>
  );
}

function AboutHeroBlockFields({
  form,
}: {
  form: UseFormReturn<BlockValue<"aboutHero">>;
}) {
  const highlights = useFieldArray({
    control: form.control,
    name: "highlights",
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        <FormField
          control={form.control}
          name="eyebrow"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Eyebrow</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ""} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="heading"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Heading</FormLabel>
              <FormControl>
                <Textarea rows={3} {...field} value={field.value ?? ""} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea rows={4} {...field} value={field.value ?? ""} />
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="backgroundImageUrl"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Background image</FormLabel>
            <ImageUploader
              label="Upload hero image"
              value={field.value ?? null}
              onChange={(url) => field.onChange(url ?? "")}
              bucket="media"
              folder="cms"
            />
            <FormControl>
              <Input {...field} value={field.value ?? ""} />
            </FormControl>
          </FormItem>
        )}
      />

      <HeroOverlayFields form={form as AnyForm} />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold">Highlights</Label>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              highlights.append({
                kicker: "New label",
                label: "Add a short proof point",
              })
            }
            disabled={highlights.fields.length >= 4}
          >
            <Plus className="mr-2 h-4 w-4" /> Add highlight
          </Button>
        </div>
        <div className="space-y-4">
          {highlights.fields.map((fieldItem, index) => (
            <div
              key={fieldItem.id}
              className="rounded-lg border border-border/60 p-4 space-y-4"
            >
              <div className="flex items-center justify-between">
                <Badge variant="secondary">Highlight #{index + 1}</Badge>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() =>
                      index > 0 && highlights.move(index, index - 1)
                    }
                    disabled={index === 0}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() =>
                      index < highlights.fields.length - 1 &&
                      highlights.move(index, index + 1)
                    }
                    disabled={index === highlights.fields.length - 1}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => highlights.remove(index)}
                    disabled={highlights.fields.length <= 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name={`highlights.${index}.kicker` as const}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kicker</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ""} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`highlights.${index}.label` as const}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Label</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ""} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <InlineActionFields
        form={form as AnyForm}
        path="primaryAction"
        title="Primary Action"
      />
      <InlineActionFields
        form={form as AnyForm}
        path="secondaryAction"
        title="Secondary Action"
      />
    </div>
  );
}

function StoryNarrativeBlockFields({
  form,
}: {
  form: UseFormReturn<BlockValue<"storyNarrative">>;
}) {
  const strengths = useFieldArray({
    control: form.control,
    name: "strengths",
  });
  const paragraphs = form.watch("paragraphs") ?? [];

  const setParagraphs = (next: string[]) => {
    form.setValue("paragraphs", next, { shouldDirty: true });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        <FormField
          control={form.control}
          name="eyebrow"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Eyebrow</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ""} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="heading"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Heading</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ""} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="lead"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Lead</FormLabel>
              <FormControl>
                <Textarea rows={3} {...field} value={field.value ?? ""} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="closing"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Closing note</FormLabel>
              <FormControl>
                <Textarea rows={3} {...field} value={field.value ?? ""} />
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold">Narrative paragraphs</Label>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setParagraphs([...paragraphs, "New paragraph"])}
          >
            <Plus className="mr-2 h-4 w-4" /> Add paragraph
          </Button>
        </div>
        <div className="space-y-4">
          {paragraphs.map((_, index) => (
            <div
              key={`paragraph-${index}`}
              className="rounded-lg border border-border/60 p-4 space-y-4"
            >
              <div className="flex items-center justify-between">
                <Badge variant="secondary">Paragraph #{index + 1}</Badge>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      if (index === 0) return;
                      const next = [...paragraphs];
                      [next[index - 1], next[index]] = [
                        next[index],
                        next[index - 1],
                      ];
                      setParagraphs(next);
                    }}
                    disabled={index === 0}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      if (index === paragraphs.length - 1) return;
                      const next = [...paragraphs];
                      [next[index], next[index + 1]] = [
                        next[index + 1],
                        next[index],
                      ];
                      setParagraphs(next);
                    }}
                    disabled={index === paragraphs.length - 1}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() =>
                      setParagraphs(
                        paragraphs.filter((__, item) => item !== index),
                      )
                    }
                    disabled={paragraphs.length <= 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <FormField
                control={form.control}
                name={`paragraphs.${index}` as const}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Paragraph</FormLabel>
                    <FormControl>
                      <Textarea rows={5} {...field} value={field.value ?? ""} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          ))}
        </div>
      </div>

      <FormField
        control={form.control}
        name="strengthsTitle"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Strengths title</FormLabel>
            <FormControl>
              <Input {...field} value={field.value ?? ""} />
            </FormControl>
          </FormItem>
        )}
      />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold">Strengths</Label>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              strengths.append({
                title: "New strength",
                description: "Explain why this matters.",
              })
            }
          >
            <Plus className="mr-2 h-4 w-4" /> Add strength
          </Button>
        </div>
        <div className="space-y-4">
          {strengths.fields.map((fieldItem, index) => (
            <div
              key={fieldItem.id}
              className="rounded-lg border border-border/60 p-4 space-y-4"
            >
              <div className="flex items-center justify-between">
                <Badge variant="secondary">Strength #{index + 1}</Badge>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() =>
                      index > 0 && strengths.move(index, index - 1)
                    }
                    disabled={index === 0}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() =>
                      index < strengths.fields.length - 1 &&
                      strengths.move(index, index + 1)
                    }
                    disabled={index === strengths.fields.length - 1}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => strengths.remove(index)}
                    disabled={strengths.fields.length <= 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <FormField
                control={form.control}
                name={`strengths.${index}.title` as const}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`strengths.${index}.description` as const}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} value={field.value ?? ""} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MissionVisionValuesBlockFields({
  form,
}: {
  form: UseFormReturn<BlockValue<"missionVisionValues">>;
}) {
  const values = useFieldArray({
    control: form.control,
    name: "values",
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        <FormField
          control={form.control}
          name="eyebrow"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Eyebrow</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ""} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="heading"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Heading</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ""} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea rows={3} {...field} value={field.value ?? ""} />
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name="missionTitle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mission title</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ""} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="missionAccentPreset"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mission card accent</FormLabel>
              <Select
                value={field.value ?? "neutral"}
                onValueChange={field.onChange}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="neutral">Neutral</SelectItem>
                  <SelectItem value="warm">Warm</SelectItem>
                  <SelectItem value="sage">Sage</SelectItem>
                  <SelectItem value="sky">Sky</SelectItem>
                  <SelectItem value="brand">Brand</SelectItem>
                  <SelectItem value="none">None</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="visionTitle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Vision title</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ""} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="visionAccentPreset"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Vision card accent</FormLabel>
              <Select
                value={field.value ?? "warm"}
                onValueChange={field.onChange}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="neutral">Neutral</SelectItem>
                  <SelectItem value="warm">Warm</SelectItem>
                  <SelectItem value="sage">Sage</SelectItem>
                  <SelectItem value="sky">Sky</SelectItem>
                  <SelectItem value="brand">Brand</SelectItem>
                  <SelectItem value="none">None</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="missionBody"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mission body</FormLabel>
              <FormControl>
                <Textarea rows={5} {...field} value={field.value ?? ""} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="visionBody"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Vision body</FormLabel>
              <FormControl>
                <Textarea rows={5} {...field} value={field.value ?? ""} />
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      <div className="grid gap-4">
        <FormField
          control={form.control}
          name="valuesTitle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Values title</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ""} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="valuesDescription"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Values description</FormLabel>
              <FormControl>
                <Textarea rows={3} {...field} value={field.value ?? ""} />
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold">Values</Label>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              values.append({
                title: "New value",
                description: "Explain how this shows up in the experience.",
                icon: "Shield",
              })
            }
            disabled={values.fields.length >= 6}
          >
            <Plus className="mr-2 h-4 w-4" /> Add value
          </Button>
        </div>
        <div className="space-y-4">
          {values.fields.map((fieldItem, index) => (
            <div
              key={fieldItem.id}
              className="rounded-lg border border-border/60 p-4 space-y-4"
            >
              <div className="flex items-center justify-between">
                <Badge variant="secondary">Value #{index + 1}</Badge>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => index > 0 && values.move(index, index - 1)}
                    disabled={index === 0}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() =>
                      index < values.fields.length - 1 &&
                      values.move(index, index + 1)
                    }
                    disabled={index === values.fields.length - 1}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => values.remove(index)}
                    disabled={values.fields.length <= 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name={`values.${index}.title` as const}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ""} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`values.${index}.icon` as const}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Icon</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ""} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name={`values.${index}.description` as const}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} value={field.value ?? ""} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TrustSignalsBlockFields({
  form,
}: {
  form: UseFormReturn<BlockValue<"trustSignals">>;
}) {
  const items = useFieldArray({
    control: form.control,
    name: "items",
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        <FormField
          control={form.control}
          name="eyebrow"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Eyebrow</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ""} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="heading"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Heading</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ""} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea rows={3} {...field} value={field.value ?? ""} />
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold">Signals</Label>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              items.append({
                eyebrow: "05",
                title: "New signal",
                description: "Explain the operational trust signal.",
                icon: "Shield",
              })
            }
            disabled={items.fields.length >= 6}
          >
            <Plus className="mr-2 h-4 w-4" /> Add signal
          </Button>
        </div>
        <div className="space-y-4">
          {items.fields.map((fieldItem, index) => (
            <div
              key={fieldItem.id}
              className="rounded-lg border border-border/60 p-4 space-y-4"
            >
              <div className="flex items-center justify-between">
                <Badge variant="secondary">Signal #{index + 1}</Badge>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => index > 0 && items.move(index, index - 1)}
                    disabled={index === 0}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() =>
                      index < items.fields.length - 1 &&
                      items.move(index, index + 1)
                    }
                    disabled={index === items.fields.length - 1}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => items.remove(index)}
                    disabled={items.fields.length <= 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name={`items.${index}.eyebrow` as const}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Eyebrow</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ""} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`items.${index}.icon` as const}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Icon</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ""} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name={`items.${index}.title` as const}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`items.${index}.description` as const}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} value={field.value ?? ""} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LeadershipGridBlockFields({
  form,
}: {
  form: UseFormReturn<BlockValue<"leadershipGrid">>;
}) {
  const people = useFieldArray({
    control: form.control,
    name: "people",
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        <FormField
          control={form.control}
          name="eyebrow"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Eyebrow</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ""} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="heading"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Heading</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ""} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea rows={3} {...field} value={field.value ?? ""} />
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold">People</Label>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              people.append({
                name: "Executive Name",
                role: "Role Title",
                bio: "Approved leadership biography.",
                expertise: ["Operations"],
                languages: ["English"],
              })
            }
          >
            <Plus className="mr-2 h-4 w-4" /> Add person
          </Button>
        </div>
        <div className="space-y-4">
          {people.fields.map((fieldItem, index) => (
            <div
              key={fieldItem.id}
              className="rounded-lg border border-border/60 p-4 space-y-4"
            >
              <div className="flex items-center justify-between">
                <Badge variant="secondary">Person #{index + 1}</Badge>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => index > 0 && people.move(index, index - 1)}
                    disabled={index === 0}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() =>
                      index < people.fields.length - 1 &&
                      people.move(index, index + 1)
                    }
                    disabled={index === people.fields.length - 1}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => people.remove(index)}
                    disabled={people.fields.length <= 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name={`people.${index}.name` as const}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ""} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`people.${index}.role` as const}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ""} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`people.${index}.image` as const}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image</FormLabel>
                      <ImageUploader
                        label="Upload portrait"
                        value={field.value ?? null}
                        onChange={(url) => field.onChange(url ?? "")}
                        bucket="media"
                        folder="cms"
                      />
                      <FormControl>
                        <Input {...field} value={field.value ?? ""} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`people.${index}.languages` as const}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Languages</FormLabel>
                      <FormControl>
                        <Input
                          value={(field.value ?? []).join(", ")}
                          onChange={(event) =>
                            field.onChange(
                              event.target.value
                                .split(",")
                                .map((item) => item.trim())
                                .filter(Boolean),
                            )
                          }
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name={`people.${index}.bio` as const}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Textarea rows={4} {...field} value={field.value ?? ""} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`people.${index}.expertise` as const}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expertise</FormLabel>
                    <FormControl>
                      <Input
                        value={(field.value ?? []).join(", ")}
                        onChange={(event) =>
                          field.onChange(
                            event.target.value
                              .split(",")
                              .map((item) => item.trim())
                              .filter(Boolean),
                          )
                        }
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatGridBlockFields({
  form,
}: {
  form: UseFormReturn<BlockValue<"statGrid">>;
}) {
  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: "items",
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        <FormField
          control={form.control}
          name="eyebrow"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Eyebrow</FormLabel>
              <FormControl>
                <Input
                  placeholder="Optional label"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="heading"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Heading</FormLabel>
              <FormControl>
                <Input
                  placeholder="Section title"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  rows={3}
                  placeholder="Optional supporting copy"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name="columns"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Columns</FormLabel>
              <Select
                value={String(field.value)}
                onValueChange={(value) => field.onChange(Number(value))}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="4">4</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="emphasizeValue"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Emphasize values</FormLabel>
              <div className="flex items-center space-x-2">
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormDescription>
                  Bold the numeric value for extra prominence.
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold">Stats</Label>
          <Button
            variant="outline"
            size="sm"
            onClick={() => append({ label: "New stat", value: "100" })}
            type="button"
          >
            <Plus className="mr-2 h-4 w-4" /> Add stat
          </Button>
        </div>

        <div className="space-y-4">
          {fields.map((fieldItem, index) => (
            <div
              key={fieldItem.id}
              className="rounded-lg border border-border/60 p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <Badge variant="secondary">Stat #{index + 1}</Badge>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => index > 0 && move(index, index - 1)}
                    disabled={index === 0}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() =>
                      index < fields.length - 1 && move(index, index + 1)
                    }
                    disabled={index === fields.length - 1}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => remove(index)}
                    disabled={fields.length <= 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name={`items.${index}.value` as const}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Value</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="5000+"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`items.${index}.label` as const}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Label</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Successful procedures"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2 mt-4">
                <FormField
                  control={form.control}
                  name={`items.${index}.helper` as const}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Helper text</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Optional supporting text"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`items.${index}.icon` as const}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Icon name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Heart"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormDescription>
                        Lucide icon component name (e.g., Heart, Award).
                      </FormDescription>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AdvisoryNoticeBlockFields({
  form,
}: {
  form: UseFormReturn<BlockValue<"advisoryNotice">>;
}) {
  const actionsArray = useFieldArray({
    control: form.control,
    name: "actions",
  });
  const listToArray = (value: string) =>
    value
      .split(/\n+/)
      .map((entry) => entry.trim())
      .filter(Boolean);

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        <FormField
          control={form.control}
          name="eyebrow"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Eyebrow</FormLabel>
              <FormControl>
                <Input
                  placeholder="Before You Book"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="heading"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Heading</FormLabel>
              <FormControl>
                <Input
                  placeholder="Set the advisory headline"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  rows={3}
                  placeholder="Explain how the advisory should be used."
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name="tone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tone</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="neutral">Neutral</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="lastReviewed"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Last reviewed</FormLabel>
              <FormControl>
                <Input
                  placeholder="Reviewed March 2026"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name="appliesTo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Applies to</FormLabel>
              <FormControl>
                <Input
                  placeholder="International patients planning treatment travel"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="planningScope"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Planning scope</FormLabel>
              <FormControl>
                <Input
                  placeholder="General guidance only"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="disclaimer"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Important note</FormLabel>
            <FormControl>
              <Textarea
                rows={3}
                placeholder="Call out anything patients should confirm before booking."
                {...field}
                value={field.value ?? ""}
              />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="items"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Advisory bullets</FormLabel>
            <FormControl>
              <Textarea
                rows={5}
                placeholder={
                  "Share nationality and travel window early.\nConfirm entry route before booking flights."
                }
                value={(field.value ?? []).join("\n")}
                onChange={(event) =>
                  field.onChange(listToArray(event.target.value))
                }
              />
            </FormControl>
            <FormDescription>One advisory per line.</FormDescription>
          </FormItem>
        )}
      />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold">Optional actions</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              actionsArray.append({
                label: "Contact our team",
                href: "/contact",
                variant: "outline",
              })
            }
            disabled={actionsArray.fields.length >= 2}
          >
            <Plus className="mr-2 h-4 w-4" /> Add action
          </Button>
        </div>

        {actionsArray.fields.length ? (
          <div className="space-y-4">
            {actionsArray.fields.map((fieldItem, index) => (
              <div
                key={fieldItem.id}
                className="rounded-lg border border-border/60 p-4 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">Action #{index + 1}</Badge>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => actionsArray.remove(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name={`actions.${index}.label` as const}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Label</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value ?? ""} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`actions.${index}.href` as const}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Link</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value ?? ""} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name={`actions.${index}.variant` as const}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Variant</FormLabel>
                        <Select
                          value={field.value ?? "outline"}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="default">Default</SelectItem>
                            <SelectItem value="secondary">Secondary</SelectItem>
                            <SelectItem value="outline">Outline</SelectItem>
                            <SelectItem value="ghost">Ghost</SelectItem>
                            <SelectItem value="link">Link</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`actions.${index}.target` as const}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target</FormLabel>
                        <Select
                          value={field.value ?? "_self"}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="_self">Same tab</SelectItem>
                            <SelectItem value="_blank">New tab</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function CompactListSectionFields({
  form,
  sectionPath,
}: {
  form: UseFormReturn<BlockValue<"tabbedGuide">>;
  sectionPath: `tabs.${number}.sections.${number}`;
}) {
  const rows = useFieldArray({
    control: form.control,
    name: `${sectionPath}.rows` as const,
  });
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name={`${sectionPath}.title`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Section title" {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`${sectionPath}.icon`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Icon (optional)</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Sun" {...field} />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
      <FormField
        control={form.control}
        name={`${sectionPath}.description`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea
                rows={3}
                placeholder="Optional supporting copy"
                {...field}
              />
            </FormControl>
          </FormItem>
        )}
      />
      <div className="space-y-3">
        <p className="text-sm font-semibold text-muted-foreground">Items</p>
        {rows.fields.map((row, index) => (
          <div
            key={row.id}
            className="space-y-3 rounded-md border border-border/50 p-3"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Item {index + 1}</p>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => rows.remove(index)}
                disabled={rows.fields.length === 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <FormField
              control={form.control}
              name={`${sectionPath}.rows.${index}.title`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Item title" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`${sectionPath}.rows.${index}.description`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={2}
                      placeholder="Supporting details"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`${sectionPath}.rows.${index}.pill`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pill label (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. 15-25°C" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            rows.append({
              title: "List item",
            })
          }
        >
          Add item
        </Button>
      </div>
    </div>
  );
}

function RichTextBlockFields({
  form,
}: {
  form: UseFormReturn<BlockValue<"richText">>;
}) {
  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="markdown"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Content</FormLabel>
            <FormControl>
              <Textarea
                rows={12}
                placeholder="Markdown body content"
                {...field}
                value={field.value ?? ""}
              />
            </FormControl>
            <FormDescription>
              Supports Markdown with tables, lists, and emphasis.
            </FormDescription>
          </FormItem>
        )}
      />
      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name="align"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Alignment</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="start">Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="width"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Width</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="prose">Prose</SelectItem>
                  <SelectItem value="narrow">Narrow</SelectItem>
                  <SelectItem value="full">Full Width</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}

function ImageFeatureBlockFields({
  form,
}: {
  form: UseFormReturn<BlockValue<"imageFeature">>;
}) {
  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: "items",
  });
  const actionsArray = useFieldArray({
    control: form.control,
    name: "actions",
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        <FormField
          control={form.control}
          name="eyebrow"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Eyebrow</FormLabel>
              <FormControl>
                <Input
                  placeholder="Optional label"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="heading"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Heading</FormLabel>
              <FormControl>
                <Input
                  placeholder="Section title"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="body"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Body</FormLabel>
              <FormControl>
                <Textarea
                  rows={4}
                  placeholder="Supporting narrative"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="layout"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Layout</FormLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select layout" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="imageLeft">Image left</SelectItem>
                <SelectItem value="imageRight">Image right</SelectItem>
              </SelectContent>
            </Select>
          </FormItem>
        )}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name="image.src"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Image source</FormLabel>
              <ImageUploader
                label="Upload image"
                value={field.value ?? null}
                onChange={(url) =>
                  form.setValue("image.src", url ?? "", { shouldDirty: true })
                }
                bucket="media"
                folder="cms"
              />
              <FormDescription>Or provide a URL below.</FormDescription>
              <FormControl>
                <Input
                  placeholder="/feature.jpg"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="image.alt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Image alt text</FormLabel>
              <FormControl>
                <Input
                  placeholder="Describe the image"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold">Supporting bullets</Label>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              append({ title: "Key benefit", description: "Explain the value" })
            }
          >
            <Plus className="mr-2 h-4 w-4" /> Add item
          </Button>
        </div>
        <div className="space-y-4">
          {fields.map((fieldItem, index) => (
            <div
              key={fieldItem.id}
              className="rounded-lg border border-border/60 p-4 space-y-4"
            >
              <div className="flex items-center justify-between">
                <Badge variant="secondary">Item #{index + 1}</Badge>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => index > 0 && move(index, index - 1)}
                    disabled={index === 0}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() =>
                      index < fields.length - 1 && move(index, index + 1)
                    }
                    disabled={index === fields.length - 1}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <FormField
                control={form.control}
                name={`items.${index}.title` as const}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Headline"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`items.${index}.description` as const}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={2}
                        placeholder="Detail"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`items.${index}.icon` as const}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Icon</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Optional icon (e.g., Shield)"
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormDescription>
                      Lucide icon component name.
                    </FormDescription>
                  </FormItem>
                )}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold">Actions</Label>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              actionsArray.append({
                label: "Learn more",
                href: "/about",
                variant: "secondary",
              })
            }
            disabled={actionsArray.fields.length >= 2}
          >
            <Plus className="mr-2 h-4 w-4" /> Add action
          </Button>
        </div>
        <div className="space-y-4">
          {actionsArray.fields.map((fieldItem, index) => (
            <div
              key={fieldItem.id}
              className="rounded-lg border border-border/60 p-4 space-y-4"
            >
              <div className="flex items-center justify-between">
                <Badge variant="secondary">Action #{index + 1}</Badge>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  disabled={actionsArray.fields.length <= 1}
                  onClick={() => {
                    if (actionsArray.fields.length <= 1) return;
                    actionsArray.remove(index);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name={`actions.${index}.label` as const}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Label</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ""} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`actions.${index}.href` as const}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Link</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ""} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name={`actions.${index}.variant` as const}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Variant</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="default">Default</SelectItem>
                          <SelectItem value="secondary">Secondary</SelectItem>
                          <SelectItem value="outline">Outline</SelectItem>
                          <SelectItem value="ghost">Ghost</SelectItem>
                          <SelectItem value="link">Link</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`actions.${index}.target` as const}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target</FormLabel>
                      <Select
                        value={field.value ?? "_self"}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="_self">Same tab</SelectItem>
                          <SelectItem value="_blank">New tab</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FeatureGridBlockFields({
  form,
}: {
  form: UseFormReturn<BlockValue<"featureGrid">>;
}) {
  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: "items",
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        <FormField
          control={form.control}
          name="eyebrow"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Eyebrow</FormLabel>
              <FormControl>
                <Input
                  placeholder="Optional label"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="heading"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Heading</FormLabel>
              <FormControl>
                <Input
                  placeholder="Section title"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  rows={3}
                  placeholder="Optional supporting copy"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name="columns"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Columns</FormLabel>
              <Select
                value={String(field.value)}
                onValueChange={(value) => field.onChange(Number(value))}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="4">4</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="variant"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Style</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="cards">Cards</SelectItem>
                  <SelectItem value="plain">Plain</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold">Features</Label>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              append({
                title: "Feature",
                description: "Explain why this matters",
              })
            }
          >
            <Plus className="mr-2 h-4 w-4" /> Add feature
          </Button>
        </div>
        <div className="space-y-4">
          {fields.map((fieldItem, index) => (
            <div
              key={fieldItem.id}
              className="rounded-lg border border-border/60 p-4 space-y-4"
            >
              <div className="flex items-center justify-between">
                <Badge variant="secondary">Feature #{index + 1}</Badge>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => index > 0 && move(index, index - 1)}
                    disabled={index === 0}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() =>
                      index < fields.length - 1 && move(index, index + 1)
                    }
                    disabled={index === fields.length - 1}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    disabled={fields.length <= 1}
                    onClick={() => {
                      if (fields.length <= 1) return;
                      remove(index);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <FormField
                control={form.control}
                name={`items.${index}.title` as const}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Feature"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`items.${index}.description` as const}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={2}
                        placeholder="Supporting copy"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name={`items.${index}.icon` as const}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Icon</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Optional icon"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormDescription>
                        Lucide icon component name.
                      </FormDescription>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`items.${index}.tag` as const}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tag</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Optional badge"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DataGridBlockFields({
  form,
}: {
  form: UseFormReturn<BlockValue<"dataGrid">>;
}) {
  const columns = useFieldArray({
    control: form.control,
    name: "columns",
  });
  const rows = useFieldArray({
    control: form.control,
    name: "rows",
  });
  const watchedColumns = form.watch("columns");
  const safeColumns = Array.isArray(watchedColumns) ? watchedColumns : [];
  const layoutValue = form.watch("layout") ?? "cards";
  const pillOptions = safeColumns.filter(
    (column): column is { key: string; label?: string } =>
      typeof column?.key === "string" && column.key.trim().length > 0,
  );
  const NONE_PILL_VALUE = "__none__";

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        <FormField
          control={form.control}
          name="eyebrow"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Eyebrow</FormLabel>
              <FormControl>
                <Input
                  placeholder="Requirements"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="heading"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Heading</FormLabel>
              <FormControl>
                <Input
                  placeholder="Section heading"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  rows={3}
                  placeholder="Optional supporting description"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="layout"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Layout</FormLabel>
            <Select
              value={field.value ?? "cards"}
              onValueChange={field.onChange}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select layout" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="cards">Card grid</SelectItem>
                <SelectItem value="stacked">Stacked list</SelectItem>
              </SelectContent>
            </Select>
          </FormItem>
        )}
      />

      {layoutValue === "stacked" ? (
        <FormField
          control={form.control}
          name="pillColumnKey"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pill column</FormLabel>
              <Select
                value={field.value ?? NONE_PILL_VALUE}
                onValueChange={(value) =>
                  field.onChange(value === NONE_PILL_VALUE ? undefined : value)
                }
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="No pill" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={NONE_PILL_VALUE}>None</SelectItem>
                  {pillOptions.map((column, index) => (
                    <SelectItem
                      key={`pill-option-${column.key ?? index}`}
                      value={column.key}
                    >
                      {column.label ?? column.key}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Display one column value as a badge beside each row title in
                stacked layout.
              </FormDescription>
            </FormItem>
          )}
        />
      ) : null}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold">Columns</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              columns.append({
                label: "Column label",
                key: `column-${columns.fields.length + 1}`,
              })
            }
          >
            <Plus className="mr-2 h-4 w-4" /> Add column
          </Button>
        </div>
        {columns.fields.map((column, index) => (
          <div
            key={column.id}
            className="grid gap-3 rounded-lg border border-border/60 p-4 md:grid-cols-[1fr_1fr_auto]"
          >
            <FormField
              control={form.control}
              name={`columns.${index}.label`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Label</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Requirement"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`columns.${index}.key`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Key</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="requirement"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => columns.remove(index)}
              disabled={columns.fields.length <= 2}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold">Rows</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              rows.append({
                title: "Row title",
                badge: "",
                values: {},
              })
            }
          >
            <Plus className="mr-2 h-4 w-4" /> Add row
          </Button>
        </div>
        {rows.fields.map((row, rowIndex) => (
          <div
            key={row.id}
            className="space-y-4 rounded-lg border border-border/60 p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <Badge variant="secondary">Row {rowIndex + 1}</Badge>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => rows.remove(rowIndex)}
                disabled={rows.fields.length <= 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name={`rows.${rowIndex}.title`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Row title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="United States"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`rows.${rowIndex}.badge`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Badge</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Optional badge"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {safeColumns.map((column, columnIndex) => (
                <FormField
                  key={`${column.key ?? columnIndex}-${rowIndex}`}
                  control={form.control}
                  name={`rows.${rowIndex}.values.${
                    column.key ?? `column-${columnIndex}`
                  }`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {column.label ?? `Column ${columnIndex + 1}`}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Value"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function InfoPanelsBlockFields({
  form,
}: {
  form: UseFormReturn<BlockValue<"infoPanels">>;
}) {
  const panels = useFieldArray({
    control: form.control,
    name: "panels",
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        <FormField
          control={form.control}
          name="eyebrow"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Eyebrow</FormLabel>
              <FormControl>
                <Input
                  placeholder="Key Facts"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="heading"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Heading</FormLabel>
              <FormControl>
                <Input
                  placeholder="Section heading"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  rows={3}
                  placeholder="Optional supporting description"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold">Panels</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              panels.append({
                title: "Panel title",
                description: "",
                badge: "",
                items: [],
              })
            }
          >
            <Plus className="mr-2 h-4 w-4" /> Add panel
          </Button>
        </div>
        {panels.fields.map((panel, index) => (
          <div
            key={panel.id}
            className="space-y-4 rounded-lg border border-border/60 p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <Badge variant="secondary">Panel {index + 1}</Badge>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => panels.remove(index)}
                disabled={panels.fields.length <= 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name={`panels.${index}.title`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Climate"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`panels.${index}.badge`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Badge</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Optional badge"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name={`panels.${index}.description`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={2}
                      placeholder="Optional supporting description"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`panels.${index}.items`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Items</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={4}
                      placeholder="One item per line"
                      value={(field.value ?? []).join("\n")}
                      onChange={(event) =>
                        field.onChange(
                          event.target.value
                            .split("\n")
                            .map((line) => line.trim())
                            .filter(Boolean),
                        )
                      }
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function HotelShowcaseBlockFields({
  form,
}: {
  form: UseFormReturn<BlockValue<"hotelShowcase">>;
}) {
  const items = useFieldArray({
    control: form.control,
    name: "items",
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        <FormField
          control={form.control}
          name="eyebrow"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Eyebrow</FormLabel>
              <FormControl>
                <Input
                  placeholder="Accommodation"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="heading"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Heading</FormLabel>
              <FormControl>
                <Input
                  placeholder="Section heading"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  rows={3}
                  placeholder="Optional supporting description"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="layout"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Layout</FormLabel>
            <Select
              value={field.value ?? "grid"}
              onValueChange={field.onChange}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="grid">Grid</SelectItem>
                <SelectItem value="carousel">Carousel</SelectItem>
              </SelectContent>
            </Select>
          </FormItem>
        )}
      />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold">Stays</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              items.append({
                title: "Stay name",
                description: "",
                heroImage: "",
                addressDetails: "",
                contactPhone: "",
                contactEmail: "",
                website: "",
                amenities: [],
                medicalServices: [],
                priceLabel: "",
                locationLabel: "",
                icon: "Hotel",
              })
            }
          >
            <Plus className="mr-2 h-4 w-4" /> Add stay
          </Button>
        </div>
        {items.fields.map((item, index) => (
          <div
            key={item.id}
            className="space-y-4 rounded-lg border border-border/60 p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <Badge variant="secondary">Stay {index + 1}</Badge>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => items.remove(index)}
                disabled={items.fields.length <= 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <FormField
              control={form.control}
              name={`items.${index}.title`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Luxury medical hotel"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`items.${index}.description`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="Short description"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name={`items.${index}.heroImage`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hero image</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="/images/stay.jpg"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`items.${index}.icon`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Icon</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Hotel"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name={`items.${index}.priceLabel`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price label</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="$150 - $300/night"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`items.${index}.locationLabel`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location label</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="New Cairo"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name={`items.${index}.addressDetails`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address details</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="District or exact address"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name={`items.${index}.contactPhone`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact phone</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="+20 2 1234 5678"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`items.${index}.contactEmail`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="stay@example.com"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name={`items.${index}.website`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://example.com"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <FormField
                control={form.control}
                name={`items.${index}.starRating`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Star rating</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={5}
                        value={field.value ?? ""}
                        onChange={(event) =>
                          field.onChange(
                            event.target.value
                              ? Number(event.target.value)
                              : undefined,
                          )
                        }
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`items.${index}.rating`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Guest rating</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={5}
                        step="0.1"
                        value={field.value ?? ""}
                        onChange={(event) =>
                          field.onChange(
                            event.target.value
                              ? Number(event.target.value)
                              : undefined,
                          )
                        }
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`items.${index}.reviewCount`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Review count</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step="1"
                        value={field.value ?? ""}
                        onChange={(event) =>
                          field.onChange(
                            event.target.value
                              ? Number(event.target.value)
                              : undefined,
                          )
                        }
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name={`items.${index}.amenities`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amenities</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={4}
                      placeholder="One amenity per line"
                      value={(field.value ?? []).join("\n")}
                      onChange={(event) =>
                        field.onChange(
                          event.target.value
                            .split("\n")
                            .map((line) => line.trim())
                            .filter(Boolean),
                        )
                      }
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`items.${index}.medicalServices`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Medical services</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="One service per line"
                      value={(field.value ?? []).join("\n")}
                      onChange={(event) =>
                        field.onChange(
                          event.target.value
                            .split("\n")
                            .map((line) => line.trim())
                            .filter(Boolean),
                        )
                      }
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function ServiceCatalogBlockFields({
  form,
}: {
  form: UseFormReturn<BlockValue<"serviceCatalog">>;
}) {
  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: "items",
  });
  const listToArray = (value: string) =>
    value
      .split(/[\n,]+/)
      .map((entry) => entry.trim())
      .filter(Boolean);

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        <FormField
          control={form.control}
          name="eyebrow"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Eyebrow</FormLabel>
              <FormControl>
                <Input
                  placeholder="International Patient Services"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="heading"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Heading</FormLabel>
              <FormControl>
                <Input
                  placeholder="How Care N Tour supports the patient journey"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  rows={3}
                  placeholder="Explain the operating model behind the services."
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold">Services</Label>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              append({
                title: "New service",
                description: "",
                icon: "",
                availability: "",
                note: "",
                bullets: ["Service detail"],
                languages: ["English"],
              })
            }
          >
            <Plus className="mr-2 h-4 w-4" /> Add service
          </Button>
        </div>

        <div className="space-y-4">
          {fields.map((fieldItem, index) => (
            <div
              key={fieldItem.id}
              className="space-y-4 rounded-lg border border-border/60 p-4"
            >
              <div className="flex items-center justify-between">
                <Badge variant="secondary">Service #{index + 1}</Badge>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => index > 0 && move(index, index - 1)}
                    disabled={index === 0}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() =>
                      index < fields.length - 1 && move(index, index + 1)
                    }
                    disabled={index === fields.length - 1}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    disabled={fields.length <= 1}
                    onClick={() => {
                      if (fields.length <= 1) return;
                      remove(index);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name={`items.${index}.title` as const}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Medical coordination"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`items.${index}.icon` as const}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lucide icon</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="HeartHandshake"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name={`items.${index}.description` as const}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder="What this service covers and why it matters."
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name={`items.${index}.availability` as const}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Availability label</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="24/7 coordination window"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`items.${index}.note` as const}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Footer note</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Optional note or qualifier"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name={`items.${index}.bullets` as const}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service details</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={5}
                          placeholder={
                            "Case review\nProvider matching\nFollow-up planning"
                          }
                          value={(field.value ?? []).join("\n")}
                          onChange={(event) =>
                            field.onChange(listToArray(event.target.value))
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        One detail per line. These become the main service list.
                      </FormDescription>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`items.${index}.languages` as const}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Languages</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={5}
                          placeholder={"English\nArabic\nFrench"}
                          value={(field.value ?? []).join("\n")}
                          onChange={(event) =>
                            field.onChange(listToArray(event.target.value))
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        One language per line or comma-separated.
                      </FormDescription>
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4 rounded-lg border border-border/60 bg-muted/20 p-4">
                <div>
                  <h4 className="text-sm font-medium text-foreground">
                    Optional action
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Add a contextual deep link for this specific service.
                  </p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name={`items.${index}.action.label` as const}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Action label</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Explore planning support"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(event) => {
                              const next = event.target.value;
                              field.onChange(
                                next.trim().length > 0 ? next : undefined,
                              );
                            }}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`items.${index}.action.href` as const}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Action URL</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="/plan"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(event) => {
                              const next = event.target.value;
                              field.onChange(
                                next.trim().length > 0 ? next : undefined,
                              );
                            }}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name={`items.${index}.action.variant` as const}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Action style</FormLabel>
                        <Select
                          value={field.value ?? "outline"}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {blockActionVariants.map((variant) => (
                              <SelectItem key={variant} value={variant}>
                                {variant}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`items.${index}.action.target` as const}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Link target</FormLabel>
                        <Select
                          value={field.value ?? "_self"}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="_self">Same tab</SelectItem>
                            <SelectItem value="_blank">New tab</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LogoGridBlockFields({
  form,
}: {
  form: UseFormReturn<BlockValue<"logoGrid">>;
}) {
  const logos = useFieldArray({ control: form.control, name: "logos" });

  const addLogo = () => {
    logos.append({ name: "Partner", src: "/logos/logo.svg", href: "" });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name="eyebrow"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Eyebrow</FormLabel>
              <FormControl>
                <Input
                  placeholder="Trusted by"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="heading"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Heading</FormLabel>
              <FormControl>
                <Input
                  placeholder="Partners and Accreditations"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea
                rows={3}
                placeholder="Short explanation or social proof."
                {...field}
                value={field.value ?? ""}
              />
            </FormControl>
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="columns"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Columns</FormLabel>
            <Select
              value={String(field.value)}
              onValueChange={(value) => field.onChange(Number(value))}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {[2, 3, 4, 5, 6].map((count) => (
                  <SelectItem key={count} value={String(count)}>
                    {count}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormDescription>
              Determines how many logos display per row.
            </FormDescription>
          </FormItem>
        )}
      />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold">Logos</Label>
          <Button type="button" size="sm" variant="outline" onClick={addLogo}>
            <Plus className="mr-2 h-4 w-4" /> Add logo
          </Button>
        </div>

        <div className="space-y-4">
          {logos.fields.map((logo, index) => (
            <div
              key={logo.id}
              className="space-y-3 rounded-lg border border-border/60 p-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Logo {index + 1}</span>
                {logos.fields.length > 2 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => logos.remove(index)}
                    aria-label={`Remove logo ${index + 1}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                ) : null}
              </div>
              <FormField
                control={form.control}
                name={`logos.${index}.name` as const}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Partner"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`logos.${index}.src` as const}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Logo image</FormLabel>
                    <ImageUploader
                      label="Upload logo"
                      value={field.value ?? null}
                      onChange={(url) =>
                        form.setValue(`logos.${index}.src`, url ?? "", {
                          shouldDirty: true,
                        })
                      }
                      bucket="media"
                      folder="logos"
                    />
                    <FormControl>
                      <Input
                        placeholder="/logos/partner.svg"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`logos.${index}.href` as const}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Link (optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://partner.com"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CallToActionBlockFields({
  form,
}: {
  form: UseFormReturn<BlockValue<"callToAction">>;
}) {
  const actionsArray = useFieldArray({
    control: form.control,
    name: "actions",
  });
  const imageEnabled = form.watch("background") === "image";

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        <FormField
          control={form.control}
          name="eyebrow"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Eyebrow</FormLabel>
              <FormControl>
                <Input
                  placeholder="Optional label"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="heading"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Heading</FormLabel>
              <FormControl>
                <Input
                  placeholder="CTA headline"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  rows={3}
                  placeholder="Support the ask with persuasive copy"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name="layout"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Layout</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="centered">Centered</SelectItem>
                  <SelectItem value="split">Split</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="background"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Background</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="muted">Muted</SelectItem>
                  <SelectItem value="accent">Accent</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="image">Background image</SelectItem>
                  <SelectItem value="none">None</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
      </div>

      {imageEnabled ? (
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="image.src"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Background image</FormLabel>
                <ImageUploader
                  label="Upload background"
                  value={field.value ?? null}
                  onChange={(url) =>
                    form.setValue("image.src", url ?? "", { shouldDirty: true })
                  }
                  bucket="media"
                  folder="cms"
                />
                <FormDescription>Or provide a URL below.</FormDescription>
                <FormControl>
                  <Input
                    placeholder="/cta-bg.jpg"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="image.overlay"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Overlay</FormLabel>
                <div className="flex items-center space-x-2">
                  <FormControl>
                    <Switch
                      checked={field.value ?? true}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormDescription>
                    Add a dark overlay for legibility.
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
        </div>
      ) : null}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold">Actions</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              actionsArray.append({
                label: "Book consultation",
                href: "/consultation",
                variant: "default",
              })
            }
            disabled={actionsArray.fields.length >= 2}
          >
            <Plus className="mr-2 h-4 w-4" /> Add action
          </Button>
        </div>
        <div className="space-y-4">
          {actionsArray.fields.map((fieldItem, index) => (
            <div
              key={fieldItem.id}
              className="rounded-lg border border-border/60 p-4 space-y-4"
            >
              <div className="flex items-center justify-between">
                <Badge variant="secondary">Action #{index + 1}</Badge>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  disabled={actionsArray.fields.length <= 1}
                  onClick={() => {
                    if (actionsArray.fields.length <= 1) return;
                    actionsArray.remove(index);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name={`actions.${index}.label` as const}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Label</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ""} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`actions.${index}.href` as const}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Link</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ""} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name={`actions.${index}.variant` as const}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Variant</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="default">Default</SelectItem>
                          <SelectItem value="secondary">Secondary</SelectItem>
                          <SelectItem value="outline">Outline</SelectItem>
                          <SelectItem value="ghost">Ghost</SelectItem>
                          <SelectItem value="link">Link</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`actions.${index}.target` as const}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target</FormLabel>
                      <Select
                        value={field.value ?? "_self"}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="_self">Same tab</SelectItem>
                          <SelectItem value="_blank">New tab</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StartJourneyEmbedBlockFields({
  form,
}: {
  form: UseFormReturn<BlockValue<"startJourneyEmbed">>;
}) {
  const supportBullets = form.watch("supportBullets") ?? [];

  const updateSupportBullets = (next: string[]) => {
    form.setValue("supportBullets", next, {
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        <FormField
          control={form.control}
          name="eyebrow"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Eyebrow</FormLabel>
              <FormControl>
                <Input
                  placeholder="Start Your Journey"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="heading"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Heading</FormLabel>
              <FormControl>
                <Input
                  placeholder="Share your case and we will coordinate the next steps."
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  rows={3}
                  placeholder="Supporting introduction shown above the intake."
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name="supportCardTitle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Support card title</FormLabel>
              <FormControl>
                <Input
                  placeholder="What happens after submitting?"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="supportCardDescription"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Support card description</FormLabel>
              <FormControl>
                <Textarea
                  rows={3}
                  placeholder="Explain what the team will coordinate next."
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name="responseTimeLabel"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Response time label</FormLabel>
              <FormControl>
                <Input
                  placeholder="Average response time: under 2 hours"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="reassuranceLabel"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reassurance label</FormLabel>
              <FormControl>
                <Input
                  placeholder="No payment required to submit your intake"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="successRedirectHref"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Success redirect</FormLabel>
            <FormControl>
              <Input
                placeholder="Leave empty to stay on the current page"
                {...field}
                value={field.value ?? ""}
              />
            </FormControl>
            <FormDescription>
              Optional path to navigate to after a successful submission.
            </FormDescription>
          </FormItem>
        )}
      />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold">Support bullets</Label>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              updateSupportBullets([
                ...supportBullets,
                "Add another support point",
              ])
            }
            disabled={supportBullets.length >= 6}
          >
            <Plus className="mr-2 h-4 w-4" /> Add bullet
          </Button>
        </div>
        <div className="space-y-3">
          {supportBullets.map((bullet, index) => (
            <div
              key={`${index}-${bullet}`}
              className="rounded-lg border border-border/60 p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <Badge variant="secondary">Bullet #{index + 1}</Badge>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      if (index === 0) return;
                      const next = [...supportBullets];
                      [next[index - 1], next[index]] = [
                        next[index],
                        next[index - 1],
                      ];
                      updateSupportBullets(next);
                    }}
                    disabled={index === 0}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      if (index >= supportBullets.length - 1) return;
                      const next = [...supportBullets];
                      [next[index], next[index + 1]] = [
                        next[index + 1],
                        next[index],
                      ];
                      updateSupportBullets(next);
                    }}
                    disabled={index === supportBullets.length - 1}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    disabled={supportBullets.length <= 1}
                    onClick={() => {
                      if (supportBullets.length <= 1) return;
                      updateSupportBullets(
                        supportBullets.filter(
                          (_, bulletIndex) => bulletIndex !== index,
                        ),
                      );
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <FormField
                control={form.control}
                name={`supportBullets.${index}` as const}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bullet text</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Describe what happens after submission"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ContactFormEmbedBlockFields({
  form,
}: {
  form: UseFormReturn<BlockValue<"contactFormEmbed">>;
}) {
  const channels = useFieldArray({
    control: form.control,
    name: "channels",
  });
  const supportItems = form.watch("supportItems") ?? [];

  const updateSupportItems = (next: string[]) => {
    form.setValue("supportItems", next, {
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        <FormField
          control={form.control}
          name="eyebrow"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Eyebrow</FormLabel>
              <FormControl>
                <Input
                  placeholder="Contact Care N Tour"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="heading"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Heading</FormLabel>
              <FormControl>
                <Input
                  placeholder="Speak with our international patient desk, care coordinators, and partner support teams."
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  rows={3}
                  placeholder="Explain who should use this form and how Care N Tour responds."
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name="channelsHeading"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Channels heading</FormLabel>
              <FormControl>
                <Input
                  placeholder="Contact Channels"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="channelsDescription"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Channels description</FormLabel>
              <FormControl>
                <Textarea
                  rows={3}
                  placeholder="Explain how visitors should choose the right communication path."
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold">Contact channels</Label>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              channels.append({
                icon: "Phone",
                title: "Contact channel",
                content: "Add channel detail",
                description: "Explain when to use this channel.",
                href: "",
                schemaContactType: "customer support",
              })
            }
            disabled={channels.fields.length >= 6}
          >
            <Plus className="mr-2 h-4 w-4" /> Add channel
          </Button>
        </div>
        <div className="space-y-4">
          {channels.fields.map((fieldItem, index) => (
            <div
              key={fieldItem.id}
              className="space-y-4 rounded-lg border border-border/60 p-4"
            >
              <div className="flex items-center justify-between">
                <Badge variant="secondary">Channel #{index + 1}</Badge>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  disabled={channels.fields.length <= 1}
                  onClick={() => {
                    if (channels.fields.length <= 1) return;
                    channels.remove(index);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name={`channels.${index}.title` as const}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ""} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`channels.${index}.icon` as const}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Icon</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Phone"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name={`channels.${index}.content` as const}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Displayed content</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ""} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`channels.${index}.href` as const}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Link (optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="tel:+201229503333"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name={`channels.${index}.description` as const}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={3}
                          placeholder="Explain when or why this channel should be used."
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`channels.${index}.schemaContactType` as const}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Schema contact type</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="customer support"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormDescription>
                        Used for structured data such as customer support or
                        emergency.
                      </FormDescription>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name="supportHeading"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Support heading</FormLabel>
              <FormControl>
                <Input
                  placeholder="What Happens Next"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="supportDescription"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Support description</FormLabel>
              <FormControl>
                <Textarea
                  rows={3}
                  placeholder="Explain the review and response process."
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold">Support items</Label>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              updateSupportItems([...supportItems, "Add another support item"])
            }
            disabled={supportItems.length >= 6}
          >
            <Plus className="mr-2 h-4 w-4" /> Add item
          </Button>
        </div>
        <div className="space-y-3">
          {supportItems.map((item, index) => (
            <div
              key={`${index}-${item}`}
              className="space-y-3 rounded-lg border border-border/60 p-4"
            >
              <div className="flex items-center justify-between">
                <Badge variant="secondary">Item #{index + 1}</Badge>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      if (index === 0) return;
                      const next = [...supportItems];
                      [next[index - 1], next[index]] = [
                        next[index],
                        next[index - 1],
                      ];
                      updateSupportItems(next);
                    }}
                    disabled={index === 0}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      if (index >= supportItems.length - 1) return;
                      const next = [...supportItems];
                      [next[index], next[index + 1]] = [
                        next[index + 1],
                        next[index],
                      ];
                      updateSupportItems(next);
                    }}
                    disabled={index === supportItems.length - 1}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() =>
                      updateSupportItems(
                        supportItems.filter(
                          (_, itemIndex) => itemIndex !== index,
                        ),
                      )
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <FormField
                control={form.control}
                name={`supportItems.${index}` as const}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item text</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Explain the next step after submission"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name="formTitle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Form title</FormLabel>
              <FormControl>
                <Input
                  placeholder="Send A Message"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="formDescription"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Form description</FormLabel>
              <FormControl>
                <Textarea
                  rows={3}
                  placeholder="Explain what visitors should share in the form."
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      <div className="space-y-4">
        <Label className="text-sm font-semibold">Field labels</Label>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="labels.firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First name label</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="labels.lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last name label</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="labels.email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email label</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="labels.phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone label</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="labels.country"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Country label</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="labels.treatment"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Treatment label</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="labels.message"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Message label</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
      </div>

      <div className="space-y-4">
        <Label className="text-sm font-semibold">Field placeholders</Label>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="placeholders.firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First name placeholder</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="placeholders.lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last name placeholder</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="placeholders.email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email placeholder</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="placeholders.phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone placeholder</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="placeholders.country"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Country placeholder</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="placeholders.treatment"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Treatment placeholder</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="placeholders.message"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Message placeholder</FormLabel>
                <FormControl>
                  <Textarea rows={3} {...field} value={field.value ?? ""} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name="submitLabel"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Submit label</FormLabel>
              <FormControl>
                <Input
                  placeholder="Send Message"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="submittingLabel"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Submitting label</FormLabel>
              <FormControl>
                <Input
                  placeholder="Sending…"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name="responseTimeLabel"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Response time label</FormLabel>
              <FormControl>
                <Input
                  placeholder="Typical response window: within 2 hours"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="privacyNote"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Privacy note</FormLabel>
            <FormControl>
              <Textarea
                rows={3}
                placeholder="Add a short privacy or consent note shown below the form."
                {...field}
                value={field.value ?? ""}
              />
            </FormControl>
          </FormItem>
        )}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name="successTitle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Success title</FormLabel>
              <FormControl>
                <Input
                  placeholder="Message Sent"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="errorTitle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Error title</FormLabel>
              <FormControl>
                <Input
                  placeholder="Unable To Send Message"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name="successDescription"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Success description</FormLabel>
              <FormControl>
                <Textarea
                  rows={3}
                  placeholder="Explain what happens after a successful submission."
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="errorDescription"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Error description</FormLabel>
              <FormControl>
                <Textarea
                  rows={3}
                  placeholder="Explain the fallback if submission fails."
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}

function FaqBlockFields({ form }: { form: UseFormReturn<BlockValue<"faq">> }) {
  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: "items",
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        <FormField
          control={form.control}
          name="eyebrow"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Eyebrow</FormLabel>
              <FormControl>
                <Input
                  placeholder="Optional label"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="heading"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Heading</FormLabel>
              <FormControl>
                <Input
                  placeholder="FAQ title"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  rows={3}
                  placeholder="Optional introduction"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="layout"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Layout</FormLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="twoColumn">Two column</SelectItem>
                <SelectItem value="single">Single column</SelectItem>
              </SelectContent>
            </Select>
          </FormItem>
        )}
      />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold">Questions</Label>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              append({
                question: "What is included?",
                answer: "Provide a clear answer.",
              })
            }
          >
            <Plus className="mr-2 h-4 w-4" /> Add question
          </Button>
        </div>
        <div className="space-y-4">
          {fields.map((fieldItem, index) => (
            <div
              key={fieldItem.id}
              className="rounded-lg border border-border/60 p-4 space-y-4"
            >
              <div className="flex items-center justify-between">
                <Badge variant="secondary">FAQ #{index + 1}</Badge>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => index > 0 && move(index, index - 1)}
                    disabled={index === 0}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() =>
                      index < fields.length - 1 && move(index, index + 1)
                    }
                    disabled={index === fields.length - 1}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    disabled={fields.length <= 1}
                    onClick={() => {
                      if (fields.length <= 1) return;
                      remove(index);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <FormField
                control={form.control}
                name={`items.${index}.question` as const}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Question</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Question"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`items.${index}.answer` as const}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Answer</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder="Provide a reassuring answer"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FaqDirectoryBlockFields({
  form,
}: {
  form: UseFormReturn<BlockValue<"faqDirectory">>;
}) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        <FormField
          control={form.control}
          name="eyebrow"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Eyebrow</FormLabel>
              <FormControl>
                <Input
                  placeholder="Optional label"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="heading"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Heading</FormLabel>
              <FormControl>
                <Input
                  placeholder="FAQ directory heading"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  rows={3}
                  placeholder="Describe how Care N Tour answers questions for international patients"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name="layout"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Layout</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="sidebar">Sidebar navigation</SelectItem>
                  <SelectItem value="stacked">Stacked navigation</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="navigationHeading"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Navigation heading</FormLabel>
              <FormControl>
                <Input
                  placeholder="Browse by topic"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <FormField
          control={form.control}
          name="showSearch"
          render={({ field }) => (
            <FormItem className="flex flex-col justify-end">
              <FormLabel>Show search</FormLabel>
              <div className="flex items-center gap-2">
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormDescription>Enable keyword search.</FormDescription>
              </div>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="showCategoryDescriptions"
          render={({ field }) => (
            <FormItem className="flex flex-col justify-end">
              <FormLabel>Show topic descriptions</FormLabel>
              <div className="flex items-center gap-2">
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormDescription>Display topic summaries.</FormDescription>
              </div>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="showSourceBadge"
          render={({ field }) => (
            <FormItem className="flex flex-col justify-end">
              <FormLabel>Show source badge</FormLabel>
              <div className="flex items-center gap-2">
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormDescription>Show fallback status.</FormDescription>
              </div>
            </FormItem>
          )}
        />
      </div>

      <div className="grid gap-4">
        <FormField
          control={form.control}
          name="searchPlaceholder"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Search placeholder</FormLabel>
              <FormControl>
                <Input
                  placeholder="Search by treatment, travel, pricing, or recovery"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="emptyStateHeading"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Empty state heading</FormLabel>
              <FormControl>
                <Input
                  placeholder="No questions match your search"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="emptyStateDescription"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Empty state description</FormLabel>
              <FormControl>
                <Textarea
                  rows={3}
                  placeholder="Guide the visitor to broaden or clear the search"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="clearSearchLabel"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Clear search button label</FormLabel>
              <FormControl>
                <Input
                  placeholder="Clear search"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}

function QuoteBlockFields({
  form,
}: {
  form: UseFormReturn<BlockValue<"quote">>;
}) {
  const avatarSrc = form.watch("avatar.src") ?? "";
  const hasAvatar = avatarSrc.trim().length > 0;

  const clearAvatar = () => {
    form.setValue("avatar.alt", undefined, {
      shouldDirty: true,
      shouldValidate: true,
    });
    form.setValue("avatar.src", undefined, {
      shouldDirty: true,
      shouldValidate: true,
    });
    form.setValue("avatar", undefined, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="eyebrow"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Eyebrow</FormLabel>
            <FormControl>
              <Input
                placeholder="Optional label"
                {...field}
                value={field.value ?? ""}
              />
            </FormControl>
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="quote"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Quote</FormLabel>
            <FormControl>
              <Textarea
                rows={4}
                placeholder="Insert the quote text"
                {...field}
                value={field.value ?? ""}
              />
            </FormControl>
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="highlight"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Highlight</FormLabel>
            <FormControl>
              <Input
                placeholder="Optional highlighted sentence"
                {...field}
                value={field.value ?? ""}
              />
            </FormControl>
          </FormItem>
        )}
      />
      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name="attribution"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="Patient name"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <FormControl>
                <Input
                  placeholder="Procedure • Country"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name="avatar.src"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel>Avatar image</FormLabel>
                {hasAvatar ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-auto px-2 py-1 text-xs text-muted-foreground hover:text-destructive"
                    onClick={clearAvatar}
                  >
                    <Trash2 className="mr-1 h-3 w-3" /> Remove
                  </Button>
                ) : null}
              </div>
              <FormControl>
                <Input
                  name={field.name}
                  onBlur={field.onBlur}
                  ref={field.ref}
                  placeholder="/avatar.jpg"
                  value={field.value ?? ""}
                  onChange={(event) => {
                    const next = event.target.value;
                    if (next.trim().length === 0) {
                      clearAvatar();
                      field.onChange(undefined);
                      return;
                    }
                    field.onChange(next);
                  }}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="avatar.alt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Alt text</FormLabel>
              <FormControl>
                <Input
                  placeholder="Describe the person"
                  name={field.name}
                  onBlur={field.onBlur}
                  ref={field.ref}
                  value={field.value ?? ""}
                  onChange={(event) => {
                    const next = event.target.value;
                    if (next.trim().length === 0 && !hasAvatar) {
                      field.onChange(undefined);
                      return;
                    }
                    field.onChange(next);
                  }}
                  disabled={!hasAvatar}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}

function TreatmentsBlockFields({
  form,
}: {
  form: UseFormReturn<BlockValue<"treatments">>;
}) {
  const categoriesToString = (values: string[] | undefined) =>
    (values ?? []).join(", ");
  const listToArray = (value: string) =>
    value
      .split(/[\n,]+/)
      .map((entry) => entry.trim())
      .filter(Boolean);
  const selectedLimit = Number(form.watch("limit") ?? 6);

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input
                  placeholder="For example: Featured Treatments"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  rows={3}
                  placeholder="Optional supporting copy"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <FormField
          control={form.control}
          name="layout"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Layout</FormLabel>
              <Select
                value={field.value}
                onValueChange={field.onChange}
                onOpenChange={(open) => {
                  if (open && !field.value) {
                    field.onChange("grid");
                  }
                }}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select layout" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="grid">Grid</SelectItem>
                  <SelectItem value="carousel">Carousel</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="limit"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Max items</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  max={12}
                  value={field.value ?? 6}
                  onChange={(event) =>
                    field.onChange(Number(event.target.value) || 1)
                  }
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="featuredOnly"
          render={({ field }) => (
            <FormItem className="flex flex-col justify-end">
              <FormLabel>Featured only</FormLabel>
              <div className="flex items-center gap-2">
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormDescription>Limit to featured treatments.</FormDescription>
              </div>
            </FormItem>
          )}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name="categories"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categories</FormLabel>
              <FormControl>
                <Input
                  placeholder="cosmetic dentistry, cardiology"
                  value={categoriesToString(field.value)}
                  onChange={(event) =>
                    field.onChange(listToArray(event.target.value))
                  }
                />
              </FormControl>
              <FormDescription>
                Optional comma-separated category slugs to filter.
              </FormDescription>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="manualTreatments"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Manual treatment selection</FormLabel>
              <FormControl>
                <TreatmentMultiSelector
                  values={field.value ?? []}
                  onChange={field.onChange}
                  maxSelections={selectedLimit}
                />
              </FormControl>
              <FormDescription>
                Search and choose treatments directly. When provided, this
                overrides automatic selection.
              </FormDescription>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}

function TreatmentSpecialtiesBlockFields({
  form,
}: {
  form: UseFormReturn<BlockValue<"treatmentSpecialties">>;
}) {
  const listToArray = (value: string) =>
    value
      .split(/[\n,]+/)
      .map((entry) => entry.trim())
      .filter(Boolean);
  const categoriesToString = (value?: string[]) => (value ?? []).join(", ");
  const selectedLimit = Number(form.watch("limit") ?? 6);
  const overrides = useFieldArray({
    control: form.control,
    name: "overrides",
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="eyebrow"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Eyebrow</FormLabel>
                <FormControl>
                  <Input placeholder="Our Medical Specialties" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="heading"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Heading</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Explore our most requested treatments"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  rows={3}
                  placeholder="Supporting section copy"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name="limit"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Card count</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  max={12}
                  value={field.value ?? 6}
                  onChange={(event) =>
                    field.onChange(Number(event.target.value) || 1)
                  }
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="featuredOnly"
          render={({ field }) => (
            <FormItem className="flex flex-col justify-end">
              <FormLabel>Featured only</FormLabel>
              <div className="flex items-center gap-2">
                <FormControl>
                  <Switch
                    checked={field.value ?? false}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormDescription>
                  Limit automatic selection to featured treatments.
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name="showSearch"
          render={({ field }) => (
            <FormItem className="flex flex-col justify-end">
              <FormLabel>Show search</FormLabel>
              <div className="flex items-center gap-2">
                <FormControl>
                  <Switch
                    checked={field.value ?? true}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormDescription>
                  Adds the live search input above the cards.
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name="searchPlaceholder"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Search placeholder</FormLabel>
              <FormControl>
                <Input
                  placeholder="Search treatments by name or specialty..."
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="priceLabel"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Price label</FormLabel>
              <FormControl>
                <Input placeholder="Starting at" {...field} />
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name="primaryActionLabel"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Primary card action</FormLabel>
              <FormControl>
                <Input placeholder="Learn More" {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="secondaryActionLabel"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Secondary card action</FormLabel>
              <FormControl>
                <Input placeholder="Start Your Journey" {...field} />
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name="emptyStateHeading"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Empty state heading</FormLabel>
              <FormControl>
                <Input
                  placeholder="No specialties match your search"
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="emptyStateDescription"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Empty state description</FormLabel>
              <FormControl>
                <Textarea
                  rows={3}
                  placeholder="Try another keyword or clear the search."
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name="categories"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categories</FormLabel>
              <FormControl>
                <Input
                  placeholder="cardiac-surgery, dental-care"
                  value={categoriesToString(field.value)}
                  onChange={(event) =>
                    field.onChange(listToArray(event.target.value))
                  }
                />
              </FormControl>
              <FormDescription>
                Optional comma-separated category slugs to filter.
              </FormDescription>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="manualTreatments"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Manual treatment selection</FormLabel>
              <FormControl>
                <TreatmentMultiSelector
                  values={field.value ?? []}
                  onChange={field.onChange}
                  maxSelections={selectedLimit}
                />
              </FormControl>
              <FormDescription>
                Search and choose treatments directly. Selected order controls
                card order.
              </FormDescription>
            </FormItem>
          )}
        />
      </div>

      <div className="space-y-4 rounded-lg border border-border/60 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-foreground">
              Card overrides
            </h4>
            <p className="text-sm text-muted-foreground">
              Override icon, summary, or body copy for specific treatment slugs
              without hardcoding the cards in JSX.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              overrides.append({
                treatmentSlug: "",
                icon: "",
                summary: "",
                description: "",
              })
            }
          >
            <Plus className="mr-2 h-4 w-4" />
            Add override
          </Button>
        </div>

        {overrides.fields.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No overrides added. Cards will render directly from the treatments
            catalog.
          </p>
        ) : (
          <div className="space-y-4">
            {overrides.fields.map((field, index) => (
              <div
                key={field.id}
                className="space-y-4 rounded-lg border border-border/60 bg-muted/20 p-4"
              >
                <div className="flex items-center justify-between">
                  <Badge variant="outline">Override {index + 1}</Badge>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => overrides.remove(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name={`overrides.${index}.treatmentSlug`}
                    render={({ field: itemField }) => (
                      <FormItem>
                        <FormLabel>Treatment slug</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="advanced-dental-care"
                            {...itemField}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`overrides.${index}.icon`}
                    render={({ field: itemField }) => (
                      <FormItem>
                        <FormLabel>Lucide icon</FormLabel>
                        <FormControl>
                          <Input placeholder="Smile" {...itemField} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name={`overrides.${index}.summary`}
                  render={({ field: itemField }) => (
                    <FormItem>
                      <FormLabel>Summary override</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={2}
                          {...itemField}
                          value={itemField.value ?? ""}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`overrides.${index}.description`}
                  render={({ field: itemField }) => (
                    <FormItem>
                      <FormLabel>Description override</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={4}
                          {...itemField}
                          value={itemField.value ?? ""}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DoctorsBlockFields({
  form,
}: {
  form: UseFormReturn<BlockValue<"doctors">>;
}) {
  const listToArray = (value: string) =>
    value
      .split(/[\n,]+/)
      .map((entry) => entry.trim())
      .filter(Boolean);
  const selectedLimit = Number(form.watch("limit") ?? 6);

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input
                  placeholder="Meet our doctors"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  rows={3}
                  placeholder="Optional supporting copy"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <FormField
          control={form.control}
          name="layout"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Layout</FormLabel>
              <Select
                value={field.value}
                onValueChange={field.onChange}
                onOpenChange={(open) => {
                  if (open && !field.value) {
                    field.onChange("grid");
                  }
                }}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select layout" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="grid">Grid</SelectItem>
                  <SelectItem value="carousel">Carousel</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="limit"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Max doctors</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  max={12}
                  value={field.value ?? 6}
                  onChange={(event) =>
                    field.onChange(Number(event.target.value) || 1)
                  }
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="featuredOnly"
          render={({ field }) => (
            <FormItem className="flex flex-col justify-end">
              <FormLabel>Featured only</FormLabel>
              <div className="flex items-center gap-2">
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormDescription>
                  Highlight only featured doctors.
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name="specialties"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Specialties</FormLabel>
              <FormControl>
                <Input
                  placeholder="cardiology, oncology"
                  value={(field.value ?? []).join(", ")}
                  onChange={(event) =>
                    field.onChange(listToArray(event.target.value))
                  }
                />
              </FormControl>
              <FormDescription>
                Optional comma-separated specialties to filter.
              </FormDescription>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="manualDoctors"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Manual doctor selection</FormLabel>
              <FormControl>
                <DoctorMultiSelector
                  values={field.value ?? []}
                  onChange={field.onChange}
                  maxSelections={selectedLimit}
                />
              </FormControl>
              <FormDescription>
                Search and choose doctors directly. When provided, this
                overrides automatic selection.
              </FormDescription>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}

const blockEditors: Record<
  BlockType,
  (form: UseFormReturn<any>) => React.ReactElement
> = {
  hero: (form) => <HeroBlockFields form={form} />,
  homeHero: (form) => <HomeHeroBlockFields form={form} />,
  aboutHero: (form) => <AboutHeroBlockFields form={form} />,
  featuredTreatmentsHome: (form) => (
    <FeaturedTreatmentsHomeBlockFields form={form} />
  ),
  journeySteps: (form) => <JourneyStepsBlockFields form={form} />,
  differentiators: (form) => <DifferentiatorsBlockFields form={form} />,
  homeCta: (form) => <HomeCtaBlockFields form={form} />,
  storyNarrative: (form) => <StoryNarrativeBlockFields form={form} />,
  missionVisionValues: (form) => <MissionVisionValuesBlockFields form={form} />,
  trustSignals: (form) => <TrustSignalsBlockFields form={form} />,
  leadershipGrid: (form) => <LeadershipGridBlockFields form={form} />,
  statGrid: (form) => <StatGridBlockFields form={form} />,
  advisoryNotice: (form) => <AdvisoryNoticeBlockFields form={form} />,
  richText: (form) => <RichTextBlockFields form={form} />,
  imageFeature: (form) => <ImageFeatureBlockFields form={form} />,
  featureGrid: (form) => <FeatureGridBlockFields form={form} />,
  dataGrid: (form) => <DataGridBlockFields form={form} />,
  infoPanels: (form) => <InfoPanelsBlockFields form={form} />,
  hotelShowcase: (form) => <HotelShowcaseBlockFields form={form} />,
  serviceCatalog: (form) => <ServiceCatalogBlockFields form={form} />,
  logoGrid: (form) => <LogoGridBlockFields form={form} />,
  callToAction: (form) => <CallToActionBlockFields form={form} />,
  startJourneyEmbed: (form) => <StartJourneyEmbedBlockFields form={form} />,
  contactFormEmbed: (form) => <ContactFormEmbedBlockFields form={form} />,
  faq: (form) => <FaqBlockFields form={form} />,
  faqDirectory: (form) => <FaqDirectoryBlockFields form={form} />,
  quote: (form) => <QuoteBlockFields form={form} />,
  treatmentSpecialties: (form) => (
    <TreatmentSpecialtiesBlockFields form={form} />
  ),
  treatments: (form) => <TreatmentsBlockFields form={form} />,
  doctors: (form) => <DoctorsBlockFields form={form} />,
  tabbedGuide: (form) => <TabbedGuideBlockFields form={form} />,
};

export function BlockInspector({
  block,
  onChange,
}: {
  block: BlockInstance;
  onChange: (next: BlockInstance) => void;
}) {
  const form = useSyncedForm(block, onChange);
  const definition = blockRegistry[block.type];

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">{definition.label}</h3>
            <p className="text-sm text-muted-foreground">
              {definition.description}
            </p>
          </div>
          <Badge variant="outline" className="uppercase">
            {definition.category}
          </Badge>
        </div>
      </div>
      <Separator />
      <Form {...form}>
        <form className="space-y-6 pb-6">
          {blockEditors[block.type](form)}
          <Separator />
          <Accordion
            type="multiple"
            defaultValue={["layout", "background"]}
            className="space-y-3"
          >
            <AccordionItem value="presets">
              <AccordionTrigger>Style Presets</AccordionTrigger>
              <AccordionContent>
                <StylePresetSection form={form as AnyForm} showTitle={false} />
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="layout">
              <AccordionTrigger>Layout &amp; Spacing</AccordionTrigger>
              <AccordionContent>
                <StyleLayoutSection form={form as AnyForm} showTitle={false} />
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="background">
              <AccordionTrigger>Background</AccordionTrigger>
              <AccordionContent>
                <StyleBackgroundSection
                  form={form as AnyForm}
                  showTitle={false}
                />
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="typography">
              <AccordionTrigger>Typography</AccordionTrigger>
              <AccordionContent>
                <StyleTypographySection
                  form={form as AnyForm}
                  showTitle={false}
                />
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="effects">
              <AccordionTrigger>Effects &amp; Motion</AccordionTrigger>
              <AccordionContent>
                <StyleEffectsSection form={form as AnyForm} showTitle={false} />
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="visibility">
              <AccordionTrigger>Visibility</AccordionTrigger>
              <AccordionContent>
                <StyleVisibilitySection
                  form={form as AnyForm}
                  showTitle={false}
                />
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="advanced">
              <AccordionTrigger>Advanced</AccordionTrigger>
              <AccordionContent>
                <AdvancedSettingsSection
                  form={form as AnyForm}
                  showTitle={false}
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </form>
      </Form>
    </div>
  );
}

export function EmptyInspector() {
  return (
    <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-border/70 p-6 text-center text-sm text-muted-foreground">
      Select a block to edit its content.
    </div>
  );
}

export function AddBlockButtons({
  onAdd,
}: {
  onAdd: (type: BlockType) => void;
}) {
  const categories = Object.values(blockRegistry).reduce<
    Record<string, BlockType[]>
  >((acc, def) => {
    const current = acc[def.category] ?? [];
    current.push(def.type as BlockType);
    acc[def.category] = current;
    return acc;
  }, {});

  return (
    <div className="space-y-3">
      {Object.entries(categories).map(([category, types]) => (
        <div key={category} className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {category}
          </h4>
          <div className="flex flex-wrap gap-2">
            {types.map((type) => {
              const definition = blockRegistry[type];
              return (
                <Button
                  key={type}
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => onAdd(type)}
                >
                  {definition.label}
                </Button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export function blockSummary(block: BlockInstance): string {
  switch (block.type) {
    case "hero":
      return block.heading;
    case "homeHero":
      return `${block.headingPrefix} ${block.headingHighlight}`.trim();
    case "aboutHero":
      return block.heading;
    case "featuredTreatmentsHome":
      return block.title ?? `${block.limit} homepage treatments`;
    case "journeySteps":
      return `${block.steps.length} step${block.steps.length === 1 ? "" : "s"}`;
    case "differentiators":
      return `${block.items.length} differentiator${block.items.length === 1 ? "" : "s"}`;
    case "homeCta":
      return `${block.headingPrefix} ${block.headingHighlight}`.trim();
    case "storyNarrative":
      return block.heading;
    case "missionVisionValues":
      return block.heading ?? block.valuesTitle;
    case "trustSignals":
      return `${block.items.length} signals`;
    case "leadershipGrid":
      return `${block.people.length} people`;
    case "statGrid":
      return `${block.items.length} stats`;
    case "richText":
      return `${block.markdown.slice(0, 48)}${block.markdown.length > 48 ? "…" : ""}`;
    case "imageFeature":
      return block.heading;
    case "featureGrid":
      return `${block.items.length} features`;
    case "dataGrid":
      return `${block.rows.length} rows`;
    case "infoPanels":
      return `${block.panels.length} panels`;
    case "hotelShowcase":
      return `${block.items.length} stays`;
    case "serviceCatalog":
      return `${block.items.length} services`;
    case "logoGrid":
      return `${block.logos.length} logos`;
    case "callToAction":
      return block.heading;
    case "startJourneyEmbed":
      return block.heading;
    case "contactFormEmbed":
      return block.heading;
    case "faq":
      return `${block.items.length} questions`;
    case "faqDirectory":
      return block.heading ?? "Dynamic FAQ directory";
    case "quote":
      return block.attribution ?? "Quote";
    case "treatmentSpecialties":
      return block.heading ?? `${block.limit} treatment specialties`;
    case "treatments":
      return block.title ?? `${block.limit} treatments`;
    case "doctors":
      return block.title ?? `${block.limit} doctors`;
    case "tabbedGuide":
      return `${block.tabs.length} tab${block.tabs.length === 1 ? "" : "s"}`;
    default:
      return "";
  }
}
