import { useEffect, useRef } from "react";
import { useFieldArray, useForm, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";

import { blockRegistry, type BlockType, type BlockValue, type BlockSchema } from "@/lib/cms/blocks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

function useSyncedForm<T extends BlockType>(
  block: BlockValue<T>,
  onChange: (next: BlockValue<T>) => void,
) {
  const definition = blockRegistry[block.type];
  const schema = definition.schema as BlockSchema<T>;
  const isResettingRef = useRef(false);

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    values: block,
    mode: "onChange",
  });

  useEffect(() => {
    isResettingRef.current = true;
    form.reset(block, { keepDirty: false, keepTouched: false });
    const timeout = setTimeout(() => {
      isResettingRef.current = false;
    }, 0);
    return () => {
      clearTimeout(timeout);
      isResettingRef.current = false;
    };
  }, [block, form]);

  useEffect(() => {
    const subscription = form.watch(() => {
      if (isResettingRef.current) return;
      const values = form.getValues();
      const parsed = schema.safeParse({ ...values, type: block.type });
      if (parsed.success) {
        onChange(parsed.data as BlockValue<T>);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, schema, onChange, block.type]);

  return form;
}

function HeroBlockFields({ form }: { form: UseFormReturn<BlockValue<"hero">> }) {
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
                <Input placeholder="Optional label above headline" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormDescription>Short label that appears above the main heading.</FormDescription>
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
                <Input placeholder="Impactful headline" {...field} value={field.value ?? ""} />
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
                <Input placeholder="Optional highlighted line" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormDescription>Shown as a gradient line beneath the heading.</FormDescription>
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
                <Textarea rows={4} placeholder="Expand on the headline with supporting context" {...field} value={field.value ?? ""} />
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
            onCheckedChange={(checked) => (checked ? ensureAction("primaryAction") : removeAction("primaryAction"))}
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
                <Input placeholder="Button text" {...field} value={field.value ?? ""} />
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
                <Input placeholder="/consultation" {...field} value={field.value ?? ""} />
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
                  <Select value={field.value ?? "_self"} onValueChange={field.onChange}>
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
            onCheckedChange={(checked) => (checked ? ensureAction("secondaryAction") : removeAction("secondaryAction"))}
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
                    <Input placeholder="Button text" {...field} value={field.value ?? ""} />
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
                    <Input placeholder="/contact" {...field} value={field.value ?? ""} />
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
                  <Select value={field.value ?? "_self"} onValueChange={field.onChange}>
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
          <Switch checked={Boolean(media)} onCheckedChange={(checked) => (checked ? ensureMedia() : form.setValue("media", undefined))} />
        </div>
        {media ? (
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="media.type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select value={field.value ?? "image"} onValueChange={field.onChange}>
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
                  onChange={(url) => form.setValue("media.src", url ?? "", { shouldDirty: true })}
                  bucket="media"
                  folder="cms"
                />
              ) : null}
              <FormDescription>Or provide a URL below.</FormDescription>
              <FormControl>
                <Input placeholder="/hero.jpg" {...field} value={field.value ?? ""} />
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
                    <Input placeholder="Describe the media" {...field} value={field.value ?? ""} />
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
                    <Input placeholder="Optional caption" {...field} value={field.value ?? ""} />
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

function StatGridBlockFields({ form }: { form: UseFormReturn<BlockValue<"statGrid">> }) {
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
                <Input placeholder="Optional label" {...field} value={field.value ?? ""} />
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
                <Input placeholder="Section title" {...field} value={field.value ?? ""} />
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
              <Textarea rows={3} placeholder="Optional supporting copy" {...field} value={field.value ?? ""} />
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
              <Select value={String(field.value)} onValueChange={(value) => field.onChange(Number(value))}>
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
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormDescription>Bold the numeric value for extra prominence.</FormDescription>
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
            <div key={fieldItem.id} className="rounded-lg border border-border/60 p-4">
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
                    onClick={() => index < fields.length - 1 && move(index, index + 1)}
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
                        <Input placeholder="5000+" {...field} value={field.value ?? ""} />
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
                        <Input placeholder="Successful procedures" {...field} value={field.value ?? ""} />
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
                        <Input placeholder="Optional supporting text" {...field} value={field.value ?? ""} />
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
                        <Input placeholder="Heart" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormDescription>Lucide icon component name (e.g., Heart, Award).</FormDescription>
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

function RichTextBlockFields({ form }: { form: UseFormReturn<BlockValue<"richText">> }) {
  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="markdown"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Content</FormLabel>
            <FormControl>
              <Textarea rows={12} placeholder="Markdown body content" {...field} value={field.value ?? ""} />
            </FormControl>
            <FormDescription>Supports Markdown with tables, lists, and emphasis.</FormDescription>
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

function ImageFeatureBlockFields({ form }: { form: UseFormReturn<BlockValue<"imageFeature">> }) {
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
                <Input placeholder="Optional label" {...field} value={field.value ?? ""} />
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
                <Input placeholder="Section title" {...field} value={field.value ?? ""} />
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
                <Textarea rows={4} placeholder="Supporting narrative" {...field} value={field.value ?? ""} />
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
                onChange={(url) => form.setValue("image.src", url ?? "", { shouldDirty: true })}
                bucket="media"
                folder="cms"
              />
              <FormDescription>Or provide a URL below.</FormDescription>
              <FormControl>
                <Input placeholder="/feature.jpg" {...field} value={field.value ?? ""} />
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
                <Input placeholder="Describe the image" {...field} value={field.value ?? ""} />
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
            onClick={() => append({ title: "Key benefit", description: "Explain the value" })}
          >
            <Plus className="mr-2 h-4 w-4" /> Add item
          </Button>
        </div>
        <div className="space-y-4">
          {fields.map((fieldItem, index) => (
            <div key={fieldItem.id} className="rounded-lg border border-border/60 p-4 space-y-4">
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
                    onClick={() => index < fields.length - 1 && move(index, index + 1)}
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
                          <Input placeholder="Headline" {...field} value={field.value ?? ""} />
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
                          <Textarea rows={2} placeholder="Detail" {...field} value={field.value ?? ""} />
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
                          <Input {...field} placeholder="Optional icon (e.g., Shield)" value={field.value ?? ""} />
                        </FormControl>
                        <FormDescription>Lucide icon component name.</FormDescription>
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
              actionsArray.append({ label: "Learn more", href: "/about", variant: "secondary" })
            }
            disabled={actionsArray.fields.length >= 2}
          >
            <Plus className="mr-2 h-4 w-4" /> Add action
          </Button>
        </div>
        <div className="space-y-4">
          {actionsArray.fields.map((fieldItem, index) => (
            <div key={fieldItem.id} className="rounded-lg border border-border/60 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant="secondary">Action #{index + 1}</Badge>
                <Button type="button" size="icon" variant="ghost" onClick={() => actionsArray.remove(index)}>
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
                  name={`actions.${index}.target` as const}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target</FormLabel>
                      <Select value={field.value ?? "_self"} onValueChange={field.onChange}>
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

function FeatureGridBlockFields({ form }: { form: UseFormReturn<BlockValue<"featureGrid">> }) {
  const { fields, append, remove, move } = useFieldArray({ control: form.control, name: "items" });

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
                <Input placeholder="Optional label" {...field} value={field.value ?? ""} />
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
                <Input placeholder="Section title" {...field} value={field.value ?? ""} />
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
                <Textarea rows={3} placeholder="Optional supporting copy" {...field} value={field.value ?? ""} />
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
              <Select value={String(field.value)} onValueChange={(value) => field.onChange(Number(value))}>
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
            onClick={() => append({ title: "Feature", description: "Explain why this matters" })}
          >
            <Plus className="mr-2 h-4 w-4" /> Add feature
          </Button>
        </div>
        <div className="space-y-4">
          {fields.map((fieldItem, index) => (
            <div key={fieldItem.id} className="rounded-lg border border-border/60 p-4 space-y-4">
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
                    onClick={() => index < fields.length - 1 && move(index, index + 1)}
                    disabled={index === fields.length - 1}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button type="button" size="icon" variant="ghost" onClick={() => remove(index)}>
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
                      <Input placeholder="Feature" {...field} value={field.value ?? ""} />
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
                      <Textarea rows={2} placeholder="Supporting copy" {...field} value={field.value ?? ""} />
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
                      <Input placeholder="Optional icon" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormDescription>Lucide icon component name.</FormDescription>
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
                      <Input placeholder="Optional badge" {...field} value={field.value ?? ""} />
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

function CallToActionBlockFields({ form }: { form: UseFormReturn<BlockValue<"callToAction">> }) {
  const actionsArray = useFieldArray({ control: form.control, name: "actions" });
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
                <Input placeholder="Optional label" {...field} value={field.value ?? ""} />
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
                <Input placeholder="CTA headline" {...field} value={field.value ?? ""} />
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
                <Textarea rows={3} placeholder="Support the ask with persuasive copy" {...field} value={field.value ?? ""} />
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
                  onChange={(url) => form.setValue("image.src", url ?? "", { shouldDirty: true })}
                  bucket="media"
                  folder="cms"
                />
                <FormDescription>Or provide a URL below.</FormDescription>
                <FormControl>
                  <Input placeholder="/cta-bg.jpg" {...field} value={field.value ?? ""} />
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
                    <Switch checked={field.value ?? true} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormDescription>Add a dark overlay for legibility.</FormDescription>
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
              actionsArray.append({ label: "Book consultation", href: "/consultation", variant: "default" })
            }
            disabled={actionsArray.fields.length >= 2}
          >
            <Plus className="mr-2 h-4 w-4" /> Add action
          </Button>
        </div>
        <div className="space-y-4">
          {actionsArray.fields.map((fieldItem, index) => (
            <div key={fieldItem.id} className="rounded-lg border border-border/60 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant="secondary">Action #{index + 1}</Badge>
                <Button type="button" size="icon" variant="ghost" onClick={() => actionsArray.remove(index)}>
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
                  name={`actions.${index}.target` as const}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target</FormLabel>
                      <Select value={field.value ?? "_self"} onValueChange={field.onChange}>
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
  const { fields, append, remove, move } = useFieldArray({ control: form.control, name: "items" });

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
                <Input placeholder="Optional label" {...field} value={field.value ?? ""} />
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
                <Input placeholder="FAQ title" {...field} value={field.value ?? ""} />
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
                <Textarea rows={3} placeholder="Optional introduction" {...field} value={field.value ?? ""} />
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
            onClick={() => append({ question: "What is included?", answer: "Provide a clear answer." })}
          >
            <Plus className="mr-2 h-4 w-4" /> Add question
          </Button>
        </div>
        <div className="space-y-4">
          {fields.map((fieldItem, index) => (
            <div key={fieldItem.id} className="rounded-lg border border-border/60 p-4 space-y-4">
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
                    onClick={() => index < fields.length - 1 && move(index, index + 1)}
                    disabled={index === fields.length - 1}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button type="button" size="icon" variant="ghost" onClick={() => remove(index)}>
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
                      <Input placeholder="Question" {...field} value={field.value ?? ""} />
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
                      <Textarea rows={3} placeholder="Provide a reassuring answer" {...field} value={field.value ?? ""} />
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

function QuoteBlockFields({ form }: { form: UseFormReturn<BlockValue<"quote">> }) {
  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="eyebrow"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Eyebrow</FormLabel>
            <FormControl>
              <Input placeholder="Optional label" {...field} value={field.value ?? ""} />
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
              <Textarea rows={4} placeholder="Insert the quote text" {...field} value={field.value ?? ""} />
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
              <Input placeholder="Optional highlighted sentence" {...field} value={field.value ?? ""} />
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
                <Input placeholder="Patient name" {...field} value={field.value ?? ""} />
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
                <Input placeholder="Procedure • Country" {...field} value={field.value ?? ""} />
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
              <FormLabel>Avatar image</FormLabel>
              <FormControl>
                <Input placeholder="/avatar.jpg" {...field} value={field.value ?? ""} />
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
                <Input placeholder="Describe the person" {...field} value={field.value ?? ""} />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}

function TreatmentsBlockFields({ form }: { form: UseFormReturn<BlockValue<"treatments">> }) {
  const categoriesToString = (values: string[] | undefined) => (values ?? []).join(", ");
  const listToArray = (value: string) => value.split(/[\n,]+/).map((entry) => entry.trim()).filter(Boolean);

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
                <Input placeholder="For example: Featured Treatments" {...field} value={field.value ?? ""} />
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
                <Textarea rows={3} placeholder="Optional supporting copy" {...field} value={field.value ?? ""} />
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
                  onChange={(event) => field.onChange(Number(event.target.value) || 1)}
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
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
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
                  onChange={(event) => field.onChange(listToArray(event.target.value))}
                />
              </FormControl>
              <FormDescription>Optional comma-separated category slugs to filter.</FormDescription>
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
                  onChange={(event) => field.onChange(listToArray(event.target.value))}
                />
              </FormControl>
              <FormDescription>Overrides auto-selection when entries are provided.</FormDescription>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}

function DoctorsBlockFields({ form }: { form: UseFormReturn<BlockValue<"doctors">> }) {
  const listToArray = (value: string) => value.split(/[\n,]+/).map((entry) => entry.trim()).filter(Boolean);

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
                <Input placeholder="Meet our doctors" {...field} value={field.value ?? ""} />
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
                <Textarea rows={3} placeholder="Optional supporting copy" {...field} value={field.value ?? ""} />
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
                  onChange={(event) => field.onChange(Number(event.target.value) || 1)}
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
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormDescription>Highlight only featured doctors.</FormDescription>
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
                  onChange={(event) => field.onChange(listToArray(event.target.value))}
                />
              </FormControl>
              <FormDescription>Optional comma-separated specialties to filter.</FormDescription>
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
                  onChange={(event) => field.onChange(listToArray(event.target.value))}
                />
              </FormControl>
              <FormDescription>Overrides filters when entries are provided.</FormDescription>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}

const blockEditors: Record<BlockType, (form: UseFormReturn<any>) => React.ReactElement> = {
  hero: (form) => <HeroBlockFields form={form} />,
  statGrid: (form) => <StatGridBlockFields form={form} />,
  richText: (form) => <RichTextBlockFields form={form} />,
  imageFeature: (form) => <ImageFeatureBlockFields form={form} />,
  featureGrid: (form) => <FeatureGridBlockFields form={form} />,
  callToAction: (form) => <CallToActionBlockFields form={form} />,
  faq: (form) => <FaqBlockFields form={form} />,
  quote: (form) => <QuoteBlockFields form={form} />,
  treatments: (form) => <TreatmentsBlockFields form={form} />,
  doctors: (form) => <DoctorsBlockFields form={form} />,
};

export function BlockInspector({ block, onChange }: { block: BlockValue; onChange: (next: BlockValue) => void }) {
  const form = useSyncedForm(block, onChange);
  const definition = blockRegistry[block.type];

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">{definition.label}</h3>
            <p className="text-sm text-muted-foreground">{definition.description}</p>
          </div>
          <Badge variant="outline" className="uppercase">
            {definition.category}
          </Badge>
        </div>
      </div>
      <Separator />
      <Form {...form}>
        <form className="space-y-6">
          {blockEditors[block.type](form)}
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
  const categories = Object.values(blockRegistry).reduce<Record<string, BlockType[]>>((acc, def) => {
    const current = acc[def.category] ?? [];
    current.push(def.type as BlockType);
    acc[def.category] = current;
    return acc;
  }, {});

  return (
    <div className="space-y-3">
      {Object.entries(categories).map(([category, types]) => (
        <div key={category} className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{category}</h4>
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

export function duplicateBlock<T extends BlockType>(block: BlockValue<T>): BlockValue<T> {
  return JSON.parse(JSON.stringify(block)) as BlockValue<T>;
}

export function blockSummary(block: BlockValue): string {
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
