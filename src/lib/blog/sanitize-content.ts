import "server-only";

import sanitizeHtml from "sanitize-html";
import type { IOptions } from "sanitize-html";
import type { Database } from "@/integrations/supabase/types";

const allowedTags = [
  "p",
  "span",
  "strong",
  "em",
  "u",
  "s",
  "mark",
  "a",
  "ul",
  "ol",
  "li",
  "blockquote",
  "code",
  "pre",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "img",
  "figure",
  "figcaption",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
  "hr",
  "br",
  "div",
];

const allowedAttributes: IOptions["allowedAttributes"] = {
  "*": ["class", "style"],
  a: ["href", "target", "rel", "class"],
  img: ["src", "alt", "title", "width", "height", "class"],
  code: ["class"],
  pre: ["class"],
};

const allowedStyles: IOptions["allowedStyles"] = {
  "*": {
    "text-align": [/^left$/, /^right$/, /^center$/, /^justify$/],
    color: [
      /^#[0-9a-fA-F]{3,6}$/,
      /^rgb\((\s*\d+\s*,){2}\s*\d+\s*\)$/,
      /^rgba\((\s*\d+\s*,){3}\s*(0|1|0?\.\d+)\s*\)$/,
    ],
    "background-color": [
      /^#[0-9a-fA-F]{3,6}$/,
      /^rgb\((\s*\d+\s*,){2}\s*\d+\s*\)$/,
      /^rgba\((\s*\d+\s*,){3}\s*(0|1|0?\.\d+)\s*\)$/,
    ],
  },
};

/**
 * Sanitize rich text/HTML content before persisting to the database.
 */
export function sanitizeContentHtml(html: string) {
  if (!html) return "";

  return sanitizeHtml(html, {
    allowedTags,
    allowedAttributes,
    allowedStyles,
    transformTags: {
      a: (_tagName, attribs) => ({
        tagName: "a",
        attribs: {
          ...attribs,
          rel: attribs.rel || "noopener noreferrer",
          target: attribs.target || "_blank",
        },
      }),
    },
  });
}

type BlogPostContent =
  Database["public"]["Tables"]["blog_posts"]["Row"]["content"];

/**
 * Normalize the content payload to enforce known shape and sanitize HTML.
 */
export function sanitizeContentPayload(content: any): BlogPostContent {
  if (!content || typeof content !== "object") {
    return { type: "richtext", data: "" };
  }

  const rawType =
    typeof content.type === "string" ? content.type.toLowerCase() : "";

  const contentType =
    rawType === "markdown" || rawType === "html" || rawType === "richtext"
      ? (rawType as "markdown" | "html" | "richtext")
      : "richtext";

  const data =
    typeof content.data === "string"
      ? content.data
      : String(content.data ?? "");

  if (contentType === "richtext" || contentType === "html") {
    return {
      ...content,
      type: contentType,
      data: sanitizeContentHtml(data),
    };
  }

  return {
    ...content,
    type: contentType,
    data,
  };
}
