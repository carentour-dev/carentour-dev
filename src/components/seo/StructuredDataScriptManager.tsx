"use client";

import { useEffect, useId } from "react";

type StructuredDataScript = {
  id: string;
  json: string;
};

type StructuredDataScriptManagerProps = {
  scripts: StructuredDataScript[];
};

const ownerAttribute = "data-carentour-jsonld-owner";

export function StructuredDataScriptManager({
  scripts,
}: StructuredDataScriptManagerProps) {
  const ownerId = useId();

  useEffect(() => {
    const ownedScripts = Array.from(
      document.querySelectorAll<HTMLScriptElement>(
        `script[${ownerAttribute}="${ownerId}"]`,
      ),
    );
    const nextScriptIds = new Set(scripts.map((script) => script.id));

    for (const script of ownedScripts) {
      if (!nextScriptIds.has(script.id)) {
        script.remove();
      }
    }

    for (const { id, json } of scripts) {
      const existing = document.getElementById(id);
      const script =
        existing instanceof HTMLScriptElement &&
        existing.getAttribute(ownerAttribute) === ownerId
          ? existing
          : document.createElement("script");

      script.id = id;
      script.type = "application/ld+json";
      script.setAttribute(ownerAttribute, ownerId);
      if (script.textContent !== json) {
        script.textContent = json;
      }
      document.head.appendChild(script);
    }

    return () => {
      for (const script of document.querySelectorAll<HTMLScriptElement>(
        `script[${ownerAttribute}="${ownerId}"]`,
      )) {
        script.remove();
      }
    };
  }, [ownerId, scripts]);

  return null;
}
