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
import { ImageUploader } from "@/components/admin/ImageUploader";
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
    id: "hero-dark",
    label: "Hero • Dark Gradient",
    description: "Midnight gradient with luminous headings and larger spacing.",
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
    label: "Panel • Muted Surface",
    description: "Soft muted panel with balanced spacing and neutral text.",
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
          base: "var(--muted)",
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
                  <SelectValue />
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
                  <SelectItem value="gradient">Gradient</SelectItem>
                  <SelectItem value="primary">Primary</SelectItem>
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
                  <SelectValue />
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
              <FormLabel>Manual treatments</FormLabel>
              <FormControl>
                <Textarea
                  rows={3}
                  placeholder="UUIDs or slugs, one per line"
                  value={(field.value ?? []).join("\n")}
                  onChange={(event) =>
                    field.onChange(listToArray(event.target.value))
                  }
                />
              </FormControl>
              <FormDescription>
                Overrides auto-selection when entries are provided.
              </FormDescription>
            </FormItem>
          )}
        />
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
              <FormLabel>Manual doctors</FormLabel>
              <FormControl>
                <Textarea
                  rows={3}
                  placeholder="UUIDs or slugs, one per line"
                  value={(field.value ?? []).join("\n")}
                  onChange={(event) =>
                    field.onChange(listToArray(event.target.value))
                  }
                />
              </FormControl>
              <FormDescription>
                Overrides filters when entries are provided.
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
  statGrid: (form) => <StatGridBlockFields form={form} />,
  richText: (form) => <RichTextBlockFields form={form} />,
  imageFeature: (form) => <ImageFeatureBlockFields form={form} />,
  featureGrid: (form) => <FeatureGridBlockFields form={form} />,
  logoGrid: (form) => <LogoGridBlockFields form={form} />,
  callToAction: (form) => <CallToActionBlockFields form={form} />,
  faq: (form) => <FaqBlockFields form={form} />,
  quote: (form) => <QuoteBlockFields form={form} />,
  treatments: (form) => <TreatmentsBlockFields form={form} />,
  doctors: (form) => <DoctorsBlockFields form={form} />,
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
    case "statGrid":
      return `${block.items.length} stats`;
    case "richText":
      return `${block.markdown.slice(0, 48)}${block.markdown.length > 48 ? "…" : ""}`;
    case "imageFeature":
      return block.heading;
    case "featureGrid":
      return `${block.items.length} features`;
    case "logoGrid":
      return `${block.logos.length} logos`;
    case "callToAction":
      return block.heading;
    case "faq":
      return `${block.items.length} questions`;
    case "quote":
      return block.attribution ?? "Quote";
    case "treatments":
      return block.title ?? `${block.limit} treatments`;
    case "doctors":
      return block.title ?? `${block.limit} doctors`;
    default:
      return "";
  }
}
