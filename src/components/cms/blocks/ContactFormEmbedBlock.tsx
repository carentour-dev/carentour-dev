import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ContactRequestForm } from "@/components/contact/ContactRequestForm";
import type { BlockInstance } from "@/lib/cms/blocks";
import { cn } from "@/lib/utils";
import { BlockSurface } from "./BlockSurface";
import { resolveIcon } from "./utils";

export function ContactFormEmbedBlock({
  block,
}: {
  block: BlockInstance<"contactFormEmbed">;
}) {
  return (
    <BlockSurface
      block={block}
      className="border-y border-border/50 bg-[linear-gradient(180deg,hsl(var(--background))_0%,hsl(var(--muted)/0.32)_100%)]"
      defaultPadding={{ top: "6rem", bottom: "6rem" }}
      contentClassName="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-stretch lg:gap-x-12 lg:gap-y-10"
    >
      {() => (
        <>
          <div className="space-y-8">
            <div className="space-y-4">
              {block.eyebrow ? (
                <span className="inline-flex items-center rounded-full border border-primary/15 bg-primary/5 px-4 py-2 text-xs font-medium uppercase tracking-[0.24em] text-primary">
                  {block.eyebrow}
                </span>
              ) : null}
              <h2 className="max-w-2xl text-3xl font-semibold tracking-[-0.04em] text-foreground md:text-5xl">
                {block.heading}
              </h2>
              {block.description ? (
                <p className="max-w-2xl text-base leading-8 text-muted-foreground md:text-lg">
                  {block.description}
                </p>
              ) : null}
            </div>

            {block.responseTimeLabel ? (
              <div className="space-y-3">
                <span className="inline-flex items-center rounded-full border border-border/70 bg-background/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/85">
                  {block.responseTimeLabel}
                </span>
              </div>
            ) : null}

            <div className="space-y-5">
              {block.channelsHeading || block.channelsDescription ? (
                <div className="space-y-2">
                  {block.channelsHeading ? (
                    <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      {block.channelsHeading}
                    </h3>
                  ) : null}
                  {block.channelsDescription ? (
                    <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
                      {block.channelsDescription}
                    </p>
                  ) : null}
                </div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2">
                {block.channels.map((channel, index) => {
                  const Icon = resolveIcon(channel.icon);
                  const hasLink = Boolean(channel.href);
                  const isLastOddCard =
                    block.channels.length % 2 === 1 &&
                    index === block.channels.length - 1;

                  return (
                    <article
                      key={`${channel.title}-${index}`}
                      className={cn(
                        "rounded-[1.5rem] border border-border/60 bg-background/85 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.05)] backdrop-blur",
                        isLastOddCard ? "md:col-span-2" : undefined,
                      )}
                    >
                      <div className="flex items-start gap-4">
                        {Icon ? (
                          <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10 text-primary">
                            <Icon size={20} strokeWidth={1.8} />
                          </div>
                        ) : null}
                        <div className="min-w-0 space-y-2">
                          <h3 className="text-lg font-semibold text-foreground">
                            {channel.title}
                          </h3>
                          {hasLink ? (
                            <Link
                              href={channel.href ?? "#"}
                              target={channel.target ?? "_self"}
                              rel={
                                channel.target === "_blank"
                                  ? "noopener noreferrer"
                                  : undefined
                              }
                              className="inline-flex items-center gap-2 break-words text-base font-medium text-primary transition-colors hover:text-primary/80"
                            >
                              <span>{channel.content}</span>
                              <ArrowUpRight className="h-4 w-4 shrink-0" />
                            </Link>
                          ) : (
                            <p className="break-words text-base font-medium text-foreground">
                              {channel.content}
                            </p>
                          )}
                          {channel.description ? (
                            <p className="text-sm leading-7 text-muted-foreground">
                              {channel.description}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-border/60 bg-background/95 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur md:p-7 lg:h-full">
            <ContactRequestForm block={block} />
          </div>

          {block.supportHeading ||
          block.supportDescription ||
          block.supportItems?.length ? (
            <div className="lg:col-span-2">
              <div className="rounded-[1.75rem] border border-border/60 bg-[hsl(var(--editorial-ink))] p-7 text-[hsl(var(--editorial-ink-foreground))] shadow-[0_24px_80px_rgba(15,23,42,0.18)] md:p-8">
                <div className="space-y-6 lg:grid lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] lg:gap-10 lg:space-y-0">
                  <div className="space-y-3">
                    {block.supportHeading ? (
                      <h3 className="text-xl font-semibold tracking-[-0.03em] md:text-2xl">
                        {block.supportHeading}
                      </h3>
                    ) : null}
                    {block.supportDescription ? (
                      <p className="max-w-2xl text-sm leading-7 text-[hsl(var(--editorial-ink-muted))]">
                        {block.supportDescription}
                      </p>
                    ) : null}
                  </div>
                  {block.supportItems?.length ? (
                    <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
                      {block.supportItems.map((item, index) => (
                        <li
                          key={`${item}-${index}`}
                          className="flex items-start gap-3 text-sm leading-7 text-[hsl(var(--editorial-ink-foreground))]"
                        >
                          <span
                            aria-hidden
                            className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[hsl(var(--editorial-accent))]"
                          />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}
        </>
      )}
    </BlockSurface>
  );
}
