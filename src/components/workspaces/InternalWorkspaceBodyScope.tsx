"use client";

import { useEffect } from "react";

export function InternalWorkspaceBodyScope() {
  useEffect(() => {
    const body = document.body;
    const html = document.documentElement;
    const previousBodyValue = body.getAttribute("data-internal-workspace");
    const previousHtmlValue = html.getAttribute("data-internal-workspace");

    body.setAttribute("data-internal-workspace", "true");
    html.setAttribute("data-internal-workspace", "true");

    return () => {
      if (previousBodyValue === null) {
        body.removeAttribute("data-internal-workspace");
      } else {
        body.setAttribute("data-internal-workspace", previousBodyValue);
      }

      if (previousHtmlValue === null) {
        html.removeAttribute("data-internal-workspace");
      } else {
        html.setAttribute("data-internal-workspace", previousHtmlValue);
      }
    };
  }, []);

  return null;
}
