"use client";

import { useEffect } from "react";

const ANIMATION_SELECTOR = "[data-animate]";

function activateElement(element: HTMLElement, reduceMotion: boolean) {
  if (!element) return;
  if (element.dataset.animateState === "visible") return;

  const type = element.dataset.animate ?? "none";
  if (type === "none" || reduceMotion) {
    element.dataset.animateState = "visible";
    element.style.transitionDuration = "0ms";
    element.style.transitionDelay = "0ms";
    return;
  }

  const duration = Number(element.dataset.animateDuration ?? 500);
  const delay = Number(element.dataset.animateDelay ?? 0);

  element.style.transitionProperty =
    element.style.transitionProperty || "opacity, transform";
  element.style.transitionDuration = `${duration}ms`;
  element.style.transitionTimingFunction = "cubic-bezier(0.25, 0.8, 0.25, 1)";
  element.style.transitionDelay = `${delay}ms`;

  requestAnimationFrame(() => {
    element.dataset.animateState = "visible";
  });
}

export function AnimationController() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const elements = Array.from(
      document.querySelectorAll<HTMLElement>(ANIMATION_SELECTOR),
    );
    if (!elements.length) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const loadElements: HTMLElement[] = [];
    const scrollElements: HTMLElement[] = [];

    elements.forEach((element) => {
      const trigger = element.dataset.animateTrigger ?? "load";
      if (trigger === "scroll") {
        scrollElements.push(element);
      } else {
        loadElements.push(element);
      }
    });

    loadElements.forEach((element) => {
      activateElement(element, reduceMotion);
    });

    if (!scrollElements.length) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const target = entry.target as HTMLElement;
          if (!entry.isIntersecting) return;
          activateElement(target, reduceMotion);
          if (target.dataset.animateOnce !== "false") {
            observer.unobserve(target);
          }
        });
      },
      { threshold: 0.2, rootMargin: "0px 0px -10% 0px" },
    );

    scrollElements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, []);

  return null;
}
