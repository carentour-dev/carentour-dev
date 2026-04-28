import Script from "next/script";

import type { JsonLdNode } from "@/lib/seo/types";

type StructuredDataScriptsProps = {
  payload: JsonLdNode[];
};

function serializeJsonLd(entry: JsonLdNode) {
  return JSON.stringify(entry)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

export function StructuredDataScripts({ payload }: StructuredDataScriptsProps) {
  if (!Array.isArray(payload) || payload.length === 0) {
    return null;
  }

  return (
    <>
      {payload.map((entry, index) => (
        <Script
          key={`jsonld-${index}`}
          id={`jsonld-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(entry) }}
        />
      ))}
    </>
  );
}
