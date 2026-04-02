"use client";

import { useEffect, useState } from "react";
import type { PublicLocale } from "@/i18n/routing";
import { resolveBlogUiText } from "@/lib/blog/localization";
import { cn } from "@/lib/utils";
import { TocItem } from "@/lib/blog/toc-generator";
import { resolveTocItems, type HeadingTarget } from "@/lib/blog/toc-resolver";

interface TableOfContentsProps {
  items: TocItem[];
  className?: string;
  title?: string;
  locale?: PublicLocale;
}

export function TableOfContents({
  items = [],
  className,
  title = "On This Page",
  locale = "en",
}: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>("");
  const [resolvedItems, setResolvedItems] = useState<TocItem[]>(items);
  const resolvedTitle = resolveBlogUiText("tocHeading", locale, title);

  useEffect(() => {
    if (typeof document === "undefined") {
      setResolvedItems(items);
      return;
    }

    const root = document.querySelector("[data-toc-root]");
    if (!root || items.length === 0) {
      setResolvedItems(items);
      return;
    }

    const headingTargets = Array.from(
      root.querySelectorAll<HTMLHeadingElement>("h1, h2, h3, h4"),
    )
      .map((heading, index) => {
        const text = (heading.textContent || "").trim();
        if (!text) {
          return null;
        }

        if (!heading.id || heading.id.trim().length === 0) {
          heading.id = `toc-heading-${index}`;
        }

        return {
          id: heading.id,
          text,
        } satisfies HeadingTarget;
      })
      .filter((heading): heading is HeadingTarget => Boolean(heading));

    setResolvedItems(resolveTocItems(items, headingTargets));
  }, [items]);

  useEffect(() => {
    if (!resolvedItems || resolvedItems.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "-100px 0px -66%" },
    );

    resolvedItems.forEach((item) => {
      const element = document.getElementById(item.id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      resolvedItems.forEach((item) => {
        const element = document.getElementById(item.id);
        if (element) {
          observer.unobserve(element);
        }
      });
    };
  }, [resolvedItems]);

  if (!resolvedItems || resolvedItems.length === 0) {
    return null;
  }

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    const element = document.getElementById(id);
    if (!element) {
      return;
    }

    e.preventDefault();
    const offset = 80; // Account for fixed header
    const elementPosition =
      element.getBoundingClientRect().top + window.pageYOffset;
    window.scrollTo({
      top: elementPosition - offset,
      behavior: "smooth",
    });
    setActiveId(id);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <h3 className="mb-4 text-sm font-semibold text-foreground">
        {resolvedTitle}
      </h3>
      <nav>
        <ul className="space-y-2">
          {resolvedItems.map((item) => (
            <li
              key={item.id}
              style={{
                paddingLeft: `${Math.max(0, (item.level - 2) * 12)}px`,
              }}
            >
              <a
                href={`#${item.id}`}
                onClick={(e) => handleClick(e, item.id)}
                className={cn(
                  "text-sm transition-colors hover:text-primary block py-1",
                  activeId === item.id
                    ? "text-primary font-medium"
                    : "text-muted-foreground",
                )}
              >
                {item.text}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
