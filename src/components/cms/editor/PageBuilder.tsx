"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronUp,
  Copy,
  Eye,
  Maximize2,
  Monitor,
  Smartphone,
  Tablet,
  Trash2,
} from "lucide-react";

import {
  blockRegistry,
  createDefaultBlock,
  type BlockType,
  type BlockValue,
} from "@/lib/cms/blocks";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BlockPreviewRenderer } from "@/components/cms/PreviewRenderer";
import { cn } from "@/lib/utils";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  AddBlockButtons,
  BlockInspector,
  EmptyInspector,
  blockSummary,
  duplicateBlock,
} from "./BlockInspector";

type PreviewDevice = "responsive" | "desktop" | "tablet" | "mobile";

const PREVIEW_DEVICE_STORAGE_KEY = "cms.preview.device";
const previewWidths: Record<PreviewDevice, number | "100%"> = {
  responsive: "100%",
  desktop: 1280,
  tablet: 834,
  mobile: 375,
};

interface PageBuilderProps {
  blocks: BlockValue[];
  onChange: (blocks: BlockValue[]) => void;
  previewKey?: string;
}

export function PageBuilder({
  blocks,
  onChange,
  previewKey,
}: PageBuilderProps) {
  const [selectedIndex, setSelectedIndex] = useState(blocks.length ? 0 : -1);
  const [structureCollapsed, setStructureCollapsed] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<PreviewDevice>(() => {
    if (typeof window === "undefined") return "responsive";
    const stored = window.localStorage.getItem(PREVIEW_DEVICE_STORAGE_KEY);
    return stored === "desktop" ||
      stored === "tablet" ||
      stored === "mobile" ||
      stored === "responsive"
      ? (stored as PreviewDevice)
      : "responsive";
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(PREVIEW_DEVICE_STORAGE_KEY, previewDevice);
  }, [previewDevice]);

  const selectedBlock = selectedIndex >= 0 ? blocks[selectedIndex] : null;

  useEffect(() => {
    if (!blocks.length) {
      setSelectedIndex(-1);
      return;
    }
    if (selectedIndex < 0) {
      setSelectedIndex(0);
      return;
    }
    if (selectedIndex > blocks.length - 1) {
      setSelectedIndex(blocks.length - 1);
    }
  }, [blocks, selectedIndex]);

  const handleUpdateBlock = useCallback(
    (index: number, updated: BlockValue) => {
      const next = [...blocks];
      next[index] = updated;
      onChange(next);
    },
    [blocks, onChange],
  );

  const handleAddBlock = useCallback(
    (type: BlockType) => {
      const nextBlock = createDefaultBlock(type);
      const next = [...blocks, nextBlock];
      onChange(next);
      setSelectedIndex(next.length - 1);
    },
    [blocks, onChange],
  );

  const moveBlock = useCallback(
    (index: number, direction: -1 | 1) => {
      const target = index + direction;
      if (target < 0 || target >= blocks.length) return;
      const next = [...blocks];
      const [item] = next.splice(index, 1);
      next.splice(target, 0, item);
      onChange(next);
      setSelectedIndex(target);
    },
    [blocks, onChange],
  );

  const removeBlock = useCallback(
    (index: number) => {
      const next = [...blocks];
      next.splice(index, 1);
      onChange(next);
      setSelectedIndex((prev) => {
        if (prev === index) return Math.min(index, next.length - 1);
        if (prev > index) return prev - 1;
        return prev;
      });
    },
    [blocks, onChange],
  );

  const duplicate = useCallback(
    (index: number) => {
      const next = [...blocks];
      next.splice(index + 1, 0, duplicateBlock(blocks[index] as BlockValue));
      onChange(next);
      setSelectedIndex(index + 1);
    },
    [blocks, onChange],
  );

  const previewBlocks = useMemo(() => blocks, [blocks]);
  const previewInstanceKey = previewKey ?? previewBlocks.length;
  const previewWidth = previewWidths[previewDevice];
  const previewFrameStyle: CSSProperties =
    previewWidth === "100%"
      ? { width: "100%" }
      : { width: `${previewWidth}px`, maxWidth: "100%" };

  const renderStructureCard = () => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <CardTitle className="text-base font-semibold">Structure</CardTitle>
          <Badge variant="outline">{blocks.length} blocks</Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setStructureCollapsed((prev) => !prev)}
          aria-label={
            structureCollapsed
              ? "Expand structure panel"
              : "Collapse structure panel"
          }
          className="flex items-center gap-1"
        >
          {structureCollapsed ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronUp className="h-4 w-4" />
          )}
          <span className="text-xs font-semibold">
            {structureCollapsed ? "Show" : "Hide"}
          </span>
        </Button>
      </CardHeader>
      {!structureCollapsed ? (
        <CardContent className="space-y-6">
          <ScrollArea className="h-[420px] rounded-md border border-border/60">
            <div className="divide-y divide-border/60">
              {blocks.map((block, index) => {
                const definition = blockRegistry[block.type];
                const isActive = index === selectedIndex;
                return (
                  <div
                    key={`${block.type}-${index}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedIndex(index)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelectedIndex(index);
                      }
                    }}
                    className={cn(
                      "flex w-full flex-col gap-3 px-4 py-4 text-left transition focus:outline-none focus:ring-2 focus:ring-primary/60",
                      isActive ? "bg-primary/10" : "hover:bg-muted",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant={isActive ? "default" : "secondary"}>
                          {index + 1}
                        </Badge>
                        <span className="text-sm font-semibold text-foreground">
                          {definition.label}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            moveBlock(index, -1);
                          }}
                          disabled={index === 0}
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            moveBlock(index, 1);
                          }}
                          disabled={index === blocks.length - 1}
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            duplicate(index);
                          }}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            removeBlock(index);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {blockSummary(block)}
                    </span>
                  </div>
                );
              })}
              {!blocks.length ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  No blocks yet. Add one below to get started.
                </div>
              ) : null}
            </div>
          </ScrollArea>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground">
              Add block
            </h4>
            <AddBlockButtons onAdd={handleAddBlock} />
          </div>
        </CardContent>
      ) : null}
    </Card>
  );

  const renderPreviewCard = () => (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex flex-col gap-4 pb-0 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Eye className="h-4 w-4 text-muted-foreground" /> Live preview
        </CardTitle>
        <div className="flex items-center gap-2">
          <ToggleGroup
            type="single"
            size="sm"
            value={previewDevice}
            onValueChange={(value) => {
              if (!value) return;
              setPreviewDevice(value as PreviewDevice);
            }}
            variant="outline"
            className="hidden sm:flex"
            aria-label="Preview width presets"
          >
            <ToggleGroupItem value="responsive" aria-label="Responsive width">
              Auto
            </ToggleGroupItem>
            <ToggleGroupItem value="desktop" aria-label="Desktop width">
              <Monitor className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="tablet" aria-label="Tablet width">
              <Tablet className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="mobile" aria-label="Mobile width">
              <Smartphone className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setPreviewDialogOpen(true)}
            aria-label="Open preview in modal"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        {previewBlocks.length ? (
          <div className="h-full overflow-auto p-4 sm:p-6">
            <div className="mx-auto w-full max-w-full rounded-lg border border-border/60 bg-background shadow-sm">
              <div className="flex justify-center bg-muted/20 p-4 sm:p-6">
                <div className="w-full max-w-full" style={previewFrameStyle}>
                  <BlockPreviewRenderer
                    blocks={previewBlocks}
                    key={previewInstanceKey}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-full min-h-[200px] items-center justify-center text-sm text-muted-foreground">
            Add blocks to see a live preview.
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderInspectorCard = () => (
    <Card className="flex h-full flex-col">
      <CardHeader className="space-y-1">
        <CardTitle className="text-base font-semibold">
          Block settings
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Edit the selected block&apos;s content and appearance.
        </p>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto">
        {selectedBlock ? (
          <BlockInspector
            block={selectedBlock}
            onChange={(next) => handleUpdateBlock(selectedIndex, next)}
          />
        ) : (
          <EmptyInspector />
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {renderStructureCard()}

      <div className="hidden lg:block">
        <ResizablePanelGroup
          direction="horizontal"
          autoSaveId="cms-page-builder-layout-v3"
          className="flex w-full min-h-[620px] gap-4"
        >
          <ResizablePanel defaultSize={60} minSize={45}>
            {renderPreviewCard()}
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={40} minSize={30}>
            {renderInspectorCard()}
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      <div className="space-y-6 lg:hidden">
        {renderPreviewCard()}
        {renderInspectorCard()}
      </div>

      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-hidden">
          <DialogHeader className="pb-2">
            <DialogTitle>Live preview</DialogTitle>
          </DialogHeader>
          {previewBlocks.length ? (
            <div className="max-h-[70vh] overflow-auto rounded-lg border border-border/60 bg-background p-6">
              <div
                className="mx-auto w-full max-w-full"
                style={previewFrameStyle}
              >
                <BlockPreviewRenderer
                  blocks={previewBlocks}
                  key={`${previewInstanceKey}-dialog`}
                />
              </div>
            </div>
          ) : (
            <div className="flex h-[240px] items-center justify-center text-sm text-muted-foreground">
              Add blocks to see a live preview.
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
