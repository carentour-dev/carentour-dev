import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Copy, Eye, Trash2 } from "lucide-react";

import { blockRegistry, createDefaultBlock, type BlockType, type BlockValue } from "@/lib/cms/blocks";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BlockPreviewRenderer } from "@/components/cms/PreviewRenderer";
import { cn } from "@/lib/utils";

import {
  AddBlockButtons,
  BlockInspector,
  EmptyInspector,
  blockSummary,
  duplicateBlock,
} from "./BlockInspector";

interface PageBuilderProps {
  blocks: BlockValue[];
  onChange: (blocks: BlockValue[]) => void;
  previewKey?: string;
}

export function PageBuilder({ blocks, onChange, previewKey }: PageBuilderProps) {
  const [selectedIndex, setSelectedIndex] = useState(blocks.length ? 0 : -1);
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

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)_minmax(0,480px)] xl:grid-cols-[minmax(0,380px)_minmax(0,1fr)_minmax(0,420px)]">
      <Card className="h-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base font-semibold">Structure</CardTitle>
          <Badge variant="outline">{blocks.length} blocks</Badge>
        </CardHeader>
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
                    <span className="text-sm text-muted-foreground">{blockSummary(block)}</span>
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
            <h4 className="text-sm font-semibold text-muted-foreground">Add block</h4>
            <AddBlockButtons onAdd={handleAddBlock} />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Eye className="h-4 w-4 text-muted-foreground" /> Live preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            {previewBlocks.length ? (
              <div className="rounded-lg border border-border/60 bg-background">
                <BlockPreviewRenderer blocks={previewBlocks} key={previewKey ?? previewBlocks.length} />
              </div>
            ) : (
              <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                Add blocks to see a live preview.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="h-full">
        <CardHeader className="space-y-1">
          <CardTitle className="text-base font-semibold">Block settings</CardTitle>
          <p className="text-sm text-muted-foreground">Edit the selected block&apos;s content and appearance.</p>
        </CardHeader>
        <CardContent>
          {selectedBlock ? (
            <BlockInspector block={selectedBlock} onChange={(next) => handleUpdateBlock(selectedIndex, next)} />
          ) : (
            <EmptyInspector />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
