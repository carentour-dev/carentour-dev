import type { JsonLdNode } from "@/lib/seo/types";

type StructuredDataScriptsProps = {
  payload: JsonLdNode[];
};

export function StructuredDataScripts({ payload }: StructuredDataScriptsProps) {
  if (!Array.isArray(payload) || payload.length === 0) {
    return null;
  }

  return (
    <>
      {payload.map((entry, index) => (
        <script
          key={`jsonld-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(entry) }}
        />
      ))}
    </>
  );
}
