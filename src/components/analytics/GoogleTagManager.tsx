"use client";

import { useEffect } from "react";

type AnalyticsWindow = Window & {
  __carentourGoogleTagLoaded?: boolean;
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
};

const DEFAULT_GOOGLE_TAG_ID = "G-RYJ3Q9HMVQ";

export default function GoogleTagManager() {
  const googleTagId =
    process.env.NEXT_PUBLIC_GOOGLE_TAG_ID ?? DEFAULT_GOOGLE_TAG_ID;
  const isProduction = process.env.NODE_ENV === "production";

  useEffect(() => {
    if (!isProduction || !googleTagId) {
      return;
    }

    const analyticsWindow = window as AnalyticsWindow;

    const loadGoogleTag = () => {
      if (analyticsWindow.__carentourGoogleTagLoaded) {
        return;
      }

      analyticsWindow.__carentourGoogleTagLoaded = true;
      analyticsWindow.dataLayer = analyticsWindow.dataLayer || [];
      analyticsWindow.gtag = (...args: unknown[]) => {
        analyticsWindow.dataLayer?.push(args);
      };
      analyticsWindow.gtag("js", new Date());
      analyticsWindow.gtag("config", googleTagId);

      const script = document.createElement("script");
      script.id = "google-tag-script";
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(googleTagId)}`;
      document.head.appendChild(script);
    };

    const scheduleLoad = () => {
      if ("requestIdleCallback" in window) {
        window.requestIdleCallback(loadGoogleTag);
        return;
      }

      globalThis.setTimeout(loadGoogleTag, 1);
    };

    if (document.readyState === "complete") {
      scheduleLoad();
      return;
    }

    window.addEventListener("load", scheduleLoad, { once: true });

    return () => {
      window.removeEventListener("load", scheduleLoad);
    };
  }, [googleTagId, isProduction]);

  return null;
}
