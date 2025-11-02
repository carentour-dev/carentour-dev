"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import Color from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import { Button } from "@/components/ui/button";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Highlighter,
  Type as TextIcon,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  List,
  ListOrdered,
  Minus,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link as LinkIcon,
  Unlink,
  ImageIcon,
  Code2,
  Eraser,
  Redo,
  Undo,
  Palette,
  Table,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

/**
 * Props for the RichTextEditor component
 */
interface RichTextEditorProps {
  /** Current HTML content value */
  value: string;
  /** Callback fired when content changes */
  onChange: (value: string) => void;
  /** Placeholder text shown when editor is empty */
  placeholder?: string;
  /** Whether the editor is disabled */
  disabled?: boolean;
}

/**
 * Props for individual toolbar buttons
 */
interface ToolbarButtonProps {
  /** Icon component to display */
  icon: ReactNode;
  /** Accessible label for the button */
  label: string;
  /** Whether the button represents an active state */
  isActive?: boolean;
  /** Click handler */
  onClick: () => void;
  /** Whether the button is disabled */
  disabled?: boolean;
}

/**
 * Toolbar button component for rich text editor controls
 */
function ToolbarButton({
  icon,
  label,
  isActive = false,
  onClick,
  disabled,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      disabled={disabled}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-md border border-transparent text-muted-foreground transition-colors hover:bg-muted",
        isActive && "bg-primary/10 text-primary border-primary/30 shadow-sm",
        disabled && "opacity-50 cursor-not-allowed hover:bg-transparent",
      )}
      aria-label={label}
      aria-pressed={isActive}
    >
      {icon}
    </button>
  );
}

/**
 * Rich Text Editor component powered by Tiptap
 *
 * Features:
 * - Text formatting (bold, italic, underline, strikethrough)
 * - Headings (H1-H3), paragraphs, and blockquotes
 * - Lists (bullet and ordered)
 * - Text alignment and colors
 * - Links and images
 * - Code blocks
 * - Character count
 * - Undo/redo support
 *
 * @example
 * ```tsx
 * <RichTextEditor
 *   value={content}
 *   onChange={setContent}
 *   placeholder="Start writing..."
 * />
 * ```
 */
export function RichTextEditor({
  value,
  onChange,
  placeholder = "Start writing your story...",
  disabled = false,
}: RichTextEditorProps) {
  const [linkInput, setLinkInput] = useState("");
  const [linkPopoverOpen, setLinkPopoverOpen] = useState(false);
  const isFirstRender = useRef(true);
  const isInternalUpdate = useRef(false);

  // Stabilize onChange callback to prevent editor re-initialization
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const handleUpdate = useCallback(({ editor }: { editor: any }) => {
    isInternalUpdate.current = true;
    onChangeRef.current(editor.getHTML());
  }, []);

  // Memoize extensions to prevent recreation
  const extensions = useMemo(
    () => [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4],
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: "rounded-lg max-w-full h-auto",
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Highlight,
      TextStyle,
      Color,
      Underline,
      Placeholder.configure({
        placeholder,
      }),
      CharacterCount.configure(),
    ],
    [placeholder],
  );

  const editor = useEditor(
    {
      extensions,
      content: value || "<p></p>",
      editorProps: {
        attributes: {
          class:
            "prose prose-sm sm:prose-base dark:prose-invert focus:outline-none min-h-[320px]",
        },
      },
      onUpdate: handleUpdate,
      immediatelyRender: false,
    },
    [extensions],
  );

  // Sync external value changes to editor
  useEffect(() => {
    if (!editor) return;

    // Skip on first render as content is set in useEditor
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Skip if this update came from the editor itself
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false;
      return;
    }

    const current = editor.getHTML();

    // Update content if value changed externally
    if (value && value !== current) {
      editor.commands.setContent(value, { emitUpdate: false });
    }

    // Clear content if value is empty
    if (!value && current !== "<p></p>") {
      editor.commands.clearContent();
    }
  }, [editor, value]);

  const charCount = editor?.storage.characterCount?.characters() ?? 0;

  const palette = useMemo(
    () => [
      "#1F2937",
      "#6B7280",
      "#EF4444",
      "#F97316",
      "#F59E0B",
      "#10B981",
      "#3B82F6",
      "#6366F1",
      "#EC4899",
    ],
    [],
  );

  // Memoize toolbar action handlers
  const handleSetLink = useCallback(() => {
    if (!editor) return;
    const url = linkInput.trim();
    if (!url) {
      editor.chain().focus().unsetLink().run();
      setLinkPopoverOpen(false);
      return;
    }
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: url, target: "_blank" })
      .run();
    setLinkPopoverOpen(false);
  }, [editor, linkInput]);

  const insertImage = useCallback(() => {
    if (!editor) return;
    const url = window.prompt("Image URL");
    if (!url) return;
    editor.chain().focus().setImage({ src: url }).run();
  }, [editor]);

  const insertHorizontalRule = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().setHorizontalRule().run();
  }, [editor]);

  const insertCodeBlock = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().toggleCodeBlock().run();
  }, [editor]);

  if (!editor) {
    return (
      <div className="border rounded-lg bg-background p-4 text-sm text-muted-foreground">
        Loading editor...
      </div>
    );
  }

  return (
    <div className="border rounded-lg bg-card">
      <div className="flex flex-wrap items-center gap-2 border-b bg-muted/40 px-3 py-2">
        <div className="flex items-center gap-1">
          <ToolbarButton
            icon={<Bold className="h-4 w-4" />}
            label="Bold"
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive("bold")}
            disabled={
              disabled || !editor.can().chain().focus().toggleBold().run()
            }
          />
          <ToolbarButton
            icon={<Italic className="h-4 w-4" />}
            label="Italic"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive("italic")}
            disabled={
              disabled || !editor.can().chain().focus().toggleItalic().run()
            }
          />
          <ToolbarButton
            icon={<UnderlineIcon className="h-4 w-4" />}
            label="Underline"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            isActive={editor.isActive("underline")}
            disabled={
              disabled || !editor.can().chain().focus().toggleUnderline().run()
            }
          />
          <ToolbarButton
            icon={<Strikethrough className="h-4 w-4" />}
            label="Strike"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive("strike")}
            disabled={
              disabled || !editor.can().chain().focus().toggleStrike().run()
            }
          />
          <ToolbarButton
            icon={<Highlighter className="h-4 w-4" />}
            label="Highlight"
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            isActive={editor.isActive("highlight")}
            disabled={disabled}
          />
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={disabled}
              className="h-8 w-8"
              aria-label="Set text color"
            >
              <Palette className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            side="bottom"
            align="start"
            className="w-40 space-y-2"
          >
            <p className="text-xs font-medium text-muted-foreground">
              Text color
            </p>
            <div className="flex flex-wrap gap-2">
              {palette.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={cn(
                    "h-6 w-6 rounded-full border border-input",
                    editor.isActive("textStyle", { color }) &&
                      "ring-2 ring-primary",
                  )}
                  style={{ backgroundColor: color }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    editor.chain().focus().setColor(color).run();
                  }}
                />
              ))}
              <input
                type="color"
                className="h-6 w-10 rounded border border-input p-0"
                value={
                  (editor.getAttributes("textStyle")?.color as string) ||
                  "#1F2937"
                }
                onChange={(event) =>
                  editor.chain().focus().setColor(event.target.value).run()
                }
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => editor.chain().focus().unsetColor().run()}
            >
              <Eraser className="mr-2 h-3.5 w-3.5" />
              Reset
            </Button>
          </PopoverContent>
        </Popover>

        <div className="flex items-center gap-1">
          <ToolbarButton
            icon={<Heading1 className="h-4 w-4" />}
            label="Heading 1"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
            isActive={editor.isActive("heading", { level: 1 })}
            disabled={disabled}
          />
          <ToolbarButton
            icon={<Heading2 className="h-4 w-4" />}
            label="Heading 2"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            isActive={editor.isActive("heading", { level: 2 })}
            disabled={disabled}
          />
          <ToolbarButton
            icon={<Heading3 className="h-4 w-4" />}
            label="Heading 3"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
            isActive={editor.isActive("heading", { level: 3 })}
            disabled={disabled}
          />
          <ToolbarButton
            icon={<TextIcon className="h-4 w-4" />}
            label="Paragraph"
            onClick={() => editor.chain().focus().setParagraph().run()}
            isActive={editor.isActive("paragraph")}
            disabled={disabled}
          />
        </div>

        <div className="flex items-center gap-1">
          <ToolbarButton
            icon={<AlignLeft className="h-4 w-4" />}
            label="Align left"
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            isActive={editor.isActive({ textAlign: "left" })}
            disabled={disabled}
          />
          <ToolbarButton
            icon={<AlignCenter className="h-4 w-4" />}
            label="Align center"
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            isActive={editor.isActive({ textAlign: "center" })}
            disabled={disabled}
          />
          <ToolbarButton
            icon={<AlignRight className="h-4 w-4" />}
            label="Align right"
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            isActive={editor.isActive({ textAlign: "right" })}
            disabled={disabled}
          />
          <ToolbarButton
            icon={<AlignJustify className="h-4 w-4" />}
            label="Justify"
            onClick={() => editor.chain().focus().setTextAlign("justify").run()}
            isActive={editor.isActive({ textAlign: "justify" })}
            disabled={disabled}
          />
        </div>

        <div className="flex items-center gap-1">
          <ToolbarButton
            icon={<List className="h-4 w-4" />}
            label="Bullet list"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive("bulletList")}
            disabled={disabled}
          />
          <ToolbarButton
            icon={<ListOrdered className="h-4 w-4" />}
            label="Ordered list"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive("orderedList")}
            disabled={disabled}
          />
          <ToolbarButton
            icon={<Quote className="h-4 w-4" />}
            label="Blockquote"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive("blockquote")}
            disabled={disabled}
          />
          <ToolbarButton
            icon={<Minus className="h-4 w-4" />}
            label="Horizontal rule"
            onClick={insertHorizontalRule}
            disabled={disabled}
          />
        </div>

        <div className="flex items-center gap-1">
          <Popover
            open={linkPopoverOpen}
            onOpenChange={(open) => {
              setLinkPopoverOpen(open);
              if (open) {
                setLinkInput(editor.getAttributes("link")?.href || "");
              }
            }}
          >
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant={editor.isActive("link") ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                aria-label="Insert link"
                disabled={disabled}
              >
                <LinkIcon className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 space-y-3" align="start">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Link URL
                </label>
                <Input
                  placeholder="https://example.com"
                  value={linkInput}
                  onChange={(event) => setLinkInput(event.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setLinkInput("");
                    editor.chain().focus().unsetLink().run();
                    setLinkPopoverOpen(false);
                  }}
                >
                  <Unlink className="mr-2 h-3.5 w-3.5" />
                  Remove
                </Button>
                <Button type="button" size="sm" onClick={handleSetLink}>
                  Apply
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          <ToolbarButton
            icon={<ImageIcon className="h-4 w-4" />}
            label="Insert image"
            onClick={insertImage}
            disabled={disabled}
          />
          <ToolbarButton
            icon={<Code2 className="h-4 w-4" />}
            label="Code block"
            onClick={insertCodeBlock}
            isActive={editor.isActive("codeBlock")}
            disabled={disabled}
          />
        </div>

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled={disabled || !editor.can().chain().focus().undo().run()}
            onMouseDown={(e) => {
              e.preventDefault();
              editor.chain().focus().undo().run();
            }}
            aria-label="Undo"
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled={disabled || !editor.can().chain().focus().redo().run()}
            onMouseDown={(e) => {
              e.preventDefault();
              editor.chain().focus().redo().run();
            }}
            aria-label="Redo"
          >
            <Redo className="h-4 w-4" />
          </Button>
        </div>

        <div className="hidden items-center gap-1 md:flex">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled
            aria-label="Coming soon"
          >
            <Sparkles className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled
            aria-label="Table (coming soon)"
          >
            <Table className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div
        className={cn(
          "px-3 pb-3 pt-4",
          disabled && "pointer-events-none opacity-50",
        )}
      >
        <EditorContent editor={editor} />
      </div>

      <div className="flex items-center justify-between border-t bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
        <span>Characters: {charCount}</span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onMouseDown={(e) => {
            e.preventDefault();
            editor.chain().focus().clearContent().run();
          }}
          disabled={disabled}
        >
          <Eraser className="mr-2 h-3 w-3" />
          Clear
        </Button>
      </div>
    </div>
  );
}

export default RichTextEditor;
