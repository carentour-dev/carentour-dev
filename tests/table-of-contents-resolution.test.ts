import assert from "node:assert/strict";
import test from "node:test";

import { resolveTocItems } from "../src/lib/blog/toc-resolver.ts";

test("resolveTocItems remaps TOC ids to matching rendered heading ids by text", () => {
  const items = [
    {
      id: "heading-what-medical-tourism-egypt-packages-usually-include-0",
      text: "What medical tourism Egypt packages usually include",
      level: 2,
    },
    {
      id: "heading-why-egypt-is-gaining-attention-for-medical-travel-1",
      text: "Why Egypt is gaining attention for medical travel",
      level: 2,
    },
  ];

  const resolved = resolveTocItems(items, [
    {
      id: "toc-heading-a",
      text: "What medical tourism Egypt packages usually include",
    },
    {
      id: "toc-heading-b",
      text: "Why Egypt is gaining attention for medical travel",
    },
  ]);

  assert.deepEqual(resolved, [
    {
      id: "toc-heading-a",
      text: "What medical tourism Egypt packages usually include",
      level: 2,
    },
    {
      id: "toc-heading-b",
      text: "Why Egypt is gaining attention for medical travel",
      level: 2,
    },
  ]);
});

test("resolveTocItems adopts rendered heading text after Arabic digit localization", () => {
  const items = [
    {
      id: "heading-step-1-start-with-medical-fit-0",
      text: "الخطوة 1: ابدأ بالملاءمة الطبية",
      level: 2,
    },
  ];

  const resolved = resolveTocItems(items, [
    {
      id: "heading-step-1-start-with-medical-fit-0",
      text: "الخطوة ١: ابدأ بالملاءمة الطبية",
    },
  ]);

  assert.deepEqual(resolved, [
    {
      id: "heading-step-1-start-with-medical-fit-0",
      text: "الخطوة ١: ابدأ بالملاءمة الطبية",
      level: 2,
    },
  ]);
});
