import type { JsonLdNode } from "@/lib/seo/types";
import { StructuredDataScriptManager } from "./StructuredDataScriptManager";

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

function hashJsonLd(serializedJson: string) {
  let hash = 5381;

  for (let index = 0; index < serializedJson.length; index += 1) {
    hash = (hash * 33) ^ serializedJson.charCodeAt(index);
  }

  return (hash >>> 0).toString(36);
}

export function StructuredDataScripts({ payload }: StructuredDataScriptsProps) {
  if (!Array.isArray(payload) || payload.length === 0) {
    return null;
  }

  const scripts = payload.map((entry, index) => {
    const json = serializeJsonLd(entry);

    return {
      id: `jsonld-${index}-${hashJsonLd(json)}`,
      json,
    };
  });

  if (process.env.NODE_ENV === "development") {
    return <StructuredDataScriptManager scripts={scripts} />;
  }

  return (
    <>
      {scripts.map(({ id, json }) => (
        <script
          key={id}
          id={id}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: json }}
        />
      ))}
    </>
  );
}
