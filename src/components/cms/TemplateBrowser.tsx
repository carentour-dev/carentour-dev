"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Eye, Layers, Sparkles } from "lucide-react";

import { BlockPreviewRenderer } from "@/components/cms/PreviewRenderer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { PublicLocale } from "@/i18n/routing";
import type { BlockValue } from "@/lib/cms/blocks";
import { cmsTemplates } from "@/lib/cms/templates";
import { buildAdminLocaleHref } from "@/lib/public/adminLocale";
import { cn } from "@/lib/utils";

type TemplateBrowserProps = {
  locale: PublicLocale;
  selectedSlug?: string | null;
  appliedSlug?: string | null;
  className?: string;
};

const templates = cmsTemplates;

export function TemplateBrowser({
  locale,
  selectedSlug,
  appliedSlug,
  className,
}: TemplateBrowserProps) {
  const [activeSlug, setActiveSlug] = useState<string>(
    selectedSlug && templates.some((template) => template.slug === selectedSlug)
      ? selectedSlug
      : (templates[0]?.slug ?? ""),
  );

  useEffect(() => {
    if (!selectedSlug) return;
    if (!templates.some((template) => template.slug === selectedSlug)) return;
    setActiveSlug(selectedSlug);
  }, [selectedSlug]);

  const activeTemplate =
    templates.find((template) => template.slug === activeSlug) ?? templates[0];

  if (!activeTemplate) {
    return null;
  }

  const activeHref =
    locale === "ar"
      ? `/cms/new?template=${encodeURIComponent(activeTemplate.slug)}`
      : buildAdminLocaleHref(
          `/cms/new?template=${encodeURIComponent(activeTemplate.slug)}`,
          locale,
        );

  return (
    <div
      className={cn(
        "grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.95fr)]",
        className,
      )}
    >
      <div className="rounded-xl border border-border/60 bg-muted/10">
        <div className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-foreground">
              Template catalog
            </p>
            <p className="text-xs text-muted-foreground">
              Scan the structure first, inspect one template at a time.
            </p>
          </div>
          <Badge variant="secondary" className="shrink-0">
            {templates.length} ready
          </Badge>
        </div>
        <div className="grid gap-2 p-3 sm:grid-cols-2">
          {templates.map((template) => {
            const isActive = template.slug === activeTemplate.slug;
            const isApplied = appliedSlug === template.slug;

            return (
              <button
                key={template.slug}
                type="button"
                onClick={() => setActiveSlug(template.slug)}
                className={cn(
                  "w-full rounded-xl border px-3 py-3 text-left transition",
                  "hover:border-primary/40 hover:bg-primary/5",
                  isActive
                    ? "border-primary/50 bg-primary/10 shadow-sm"
                    : "border-border/60 bg-background",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {template.name}
                      </p>
                      {isApplied ? (
                        <Badge className="bg-primary/15 text-primary hover:bg-primary/15">
                          Selected
                        </Badge>
                      ) : null}
                    </div>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      /{template.defaultSlug} • {template.blocks.length} blocks
                    </p>
                  </div>
                  <div className="shrink-0 rounded-full bg-muted/50 p-2 text-muted-foreground">
                    <Sparkles className="h-3.5 w-3.5" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex h-full flex-col rounded-xl border border-border/60 bg-background p-4">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="whitespace-nowrap border-primary/30 bg-primary/5 px-4 py-2 text-[11px] uppercase tracking-[0.18em]"
            >
              Focused preview
            </Badge>
            <Badge variant="secondary">/{activeTemplate.defaultSlug}</Badge>
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">
              {activeTemplate.name}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {activeTemplate.description}
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="w-full">
                  <Eye className="mr-2 h-4 w-4" />
                  Full preview
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>{activeTemplate.name}</DialogTitle>
                  <DialogDescription>
                    Review the block structure before creating a new page from
                    this template.
                  </DialogDescription>
                </DialogHeader>
                <div className="max-h-[75vh] overflow-y-auto rounded-lg border border-border/60 bg-background p-4">
                  <BlockPreviewRenderer
                    blocks={activeTemplate.blocks}
                    locale={locale}
                  />
                </div>
              </DialogContent>
            </Dialog>
            <Button size="sm" className="w-full" asChild>
              <Link href={activeHref}>
                {appliedSlug === activeTemplate.slug
                  ? "Selected"
                  : "Use template"}
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {Array.from(new Set(activeTemplate.blocks.map((block) => block.type)))
            .slice(0, 8)
            .map((type) => (
              <Badge
                key={type}
                variant="outline"
                className="text-[11px] uppercase tracking-wide"
              >
                {formatBlockType(type)}
              </Badge>
            ))}
        </div>

        <div className="mt-4 flex-1">
          <TemplatePreview
            blocks={activeTemplate.blocks}
            locale={locale}
            className="h-full min-h-[22rem]"
            minHeight={352}
          />
        </div>
      </div>
    </div>
  );
}

function formatBlockType(type: string) {
  return type.replace(/([a-z])([A-Z])/g, "$1 $2");
}

function TemplatePreview({
  blocks,
  locale,
  className,
  minHeight = 0,
}: {
  blocks: BlockValue[];
  locale: PublicLocale;
  className?: string;
  minHeight?: number;
}) {
  const sampleBlocks = useMemo(
    () => blocks.slice(0, Math.min(2, blocks.length)),
    [blocks],
  );

  const previewWrapperRef = useRef<HTMLDivElement | null>(null);
  const previewContentRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [contentHeight, setContentHeight] = useState<number>(0);
  const hasBlocks = sampleBlocks.length > 0;

  useEffect(() => {
    if (!hasBlocks) {
      setContainerWidth(0);
      return;
    }
    const wrapper = previewWrapperRef.current;
    if (!wrapper || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(([entry]) => {
      const width = entry.contentRect.width;
      setContainerWidth((previous) =>
        Math.abs(previous - width) < 0.5 ? previous : width,
      );
    });
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, [hasBlocks]);

  useEffect(() => {
    if (!hasBlocks) {
      setContentHeight(0);
      return;
    }
    const content = previewContentRef.current;
    if (!content || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(([entry]) => {
      const height = entry.contentRect.height;
      setContentHeight((previous) =>
        Math.abs(previous - height) < 0.5 ? previous : height,
      );
    });
    observer.observe(content);
    return () => observer.disconnect();
  }, [hasBlocks, sampleBlocks]);

  const desktopWidth = 1280;
  const maxPreviewHeight = 520;
  const scale = useMemo(() => {
    if (!containerWidth) return 0.3;
    return Math.min(containerWidth / desktopWidth, 0.7);
  }, [containerWidth]);
  const scaledHeight =
    contentHeight && scale
      ? Math.min(contentHeight * scale, maxPreviewHeight)
      : maxPreviewHeight;
  const previewHeight = Math.max(scaledHeight, minHeight);

  if (!hasBlocks) {
    return null;
  }

  return (
    <div
      ref={previewWrapperRef}
      className={cn(
        "cms-template-thumbnail relative overflow-hidden rounded-xl border border-border/50 bg-muted/20",
        className,
      )}
      style={{ height: previewHeight }}
    >
      <style>
        {`
          .cms-template-thumbnail .container {
            max-width: none !important;
            margin-left: 0 !important;
            margin-right: 0 !important;
            padding-left: 0 !important;
            padding-right: 0 !important;
          }
        `}
      </style>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="flex h-full w-full items-start justify-center">
          <div
            className="origin-top"
            style={{
              transform: `scale(${scale})`,
              transformOrigin: "top center",
            }}
          >
            <div ref={previewContentRef} className="w-[1280px]">
              <BlockPreviewRenderer
                className="space-y-0"
                blocks={sampleBlocks}
                disableAnimations
                locale={locale}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-background via-background/50 to-transparent" />
    </div>
  );
}
