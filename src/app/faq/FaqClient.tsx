"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CircleHelp, Mail, Phone, Search } from "lucide-react";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";

import {
  buildFaqCategories,
  getFragmentForCategory,
  type FaqCategory,
  type FaqEntry,
} from "@/lib/faq/data";
import { type FaqSource } from "@/lib/faq/queries";

type Props = {
  faqs: FaqEntry[];
  categories: FaqCategory[];
  source: FaqSource;
};

export function FaqClient({ faqs, categories, source }: Props) {
  const categoriesWithFaqs = useMemo(
    () => buildFaqCategories(faqs, categories),
    [faqs, categories],
  );
  const fragments = useMemo(() => {
    return categoriesWithFaqs.reduce<Record<string, string>>(
      (map, category) => {
        map[category.meta.fragment] = category.id;
        return map;
      },
      {},
    );
  }, [categoriesWithFaqs]);

  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<string>(
    categoriesWithFaqs[0]?.id ?? "general",
  );
  const [hash, setHash] = useState("");

  useEffect(() => {
    if (
      categoriesWithFaqs.length &&
      !categoriesWithFaqs.find((cat) => cat.id === activeTab)
    ) {
      setActiveTab(categoriesWithFaqs[0]?.id ?? "general");
    }
  }, [categoriesWithFaqs, activeTab]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateHash = () => {
      setHash(window.location.hash.replace("#", ""));
    };

    updateHash();
    window.addEventListener("hashchange", updateHash);
    return () => window.removeEventListener("hashchange", updateHash);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !hash) {
      return;
    }

    const mappedTab = fragments[hash];
    if (!mappedTab) {
      return;
    }

    setActiveTab(mappedTab);

    const waitForActiveTab = () => {
      const activeTabContent = document.querySelector(
        '[data-state="active"][data-orientation="horizontal"]',
      );
      if (activeTabContent) {
        const targetElement =
          activeTabContent.querySelector(`#${hash}`) ?? activeTabContent;
        targetElement.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }

      const tabsSection =
        document.querySelector('[role="tablist"]')?.parentElement;
      if (tabsSection) {
        tabsSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "data-state"
        ) {
          const target = mutation.target as Element;
          if (target.getAttribute("data-state") === "active") {
            observer.disconnect();
            window.setTimeout(waitForActiveTab, 100);
          }
        }
      });
    });

    const tabContents = document.querySelectorAll(
      '[data-orientation="horizontal"]',
    );
    tabContents.forEach((content) => {
      observer.observe(content, {
        attributes: true,
        attributeFilter: ["data-state"],
      });
    });

    const fallbackTimeout = window.setTimeout(() => {
      observer.disconnect();
      waitForActiveTab();
    }, 2000);

    return () => {
      observer.disconnect();
      window.clearTimeout(fallbackTimeout);
    };
  }, [hash, fragments]);

  const filteredFaqs = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const query = searchTerm.toLowerCase();
    return faqs.filter(
      (faq) =>
        faq.question.toLowerCase().includes(query) ||
        faq.answer.toLowerCase().includes(query),
    );
  }, [faqs, searchTerm]);

  const sourceBadge =
    source === "fallback" ? (
      <Badge
        variant="outline"
        className="text-xs border-amber-400 text-amber-700"
      >
        Fallback content
      </Badge>
    ) : null;

  if (!categoriesWithFaqs.length) {
    return (
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl font-bold">FAQ</h1>
          <p className="text-muted-foreground">
            No FAQ entries available right now. Please check back soon.
          </p>
        </div>
      </section>
    );
  }

  return (
    <main>
      <section className="bg-gradient-card py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="mb-4 flex items-center justify-center gap-3">
            <Badge variant="secondary" className="text-sm">
              Frequently Asked Questions
            </Badge>
            {sourceBadge}
          </div>
          <h1 className="mb-6 text-4xl font-bold text-foreground md:text-6xl">
            Your Questions{" "}
            <span className="bg-gradient-hero bg-clip-text text-transparent">
              Answered
            </span>
          </h1>
          <p className="mb-8 max-w-3xl mx-auto text-xl leading-relaxed text-muted-foreground">
            Find comprehensive answers to all your medical tourism questions.
            From treatment options to travel arrangements, we&apos;ve got you
            covered.
          </p>

          <div className="relative mx-auto max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search frequently asked questions..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </section>

      {searchTerm ? (
        <section className="py-12">
          <div className="container mx-auto px-4">
            <h2 className="mb-6 text-2xl font-bold">
              Search Results ({filteredFaqs.length} found)
            </h2>
            {filteredFaqs.length > 0 ? (
              <Accordion type="single" collapsible className="space-y-4">
                {filteredFaqs.map((faq) => (
                  <AccordionItem
                    key={faq.id}
                    value={`search-${faq.id}`}
                    className="rounded-lg border px-4"
                  >
                    <AccordionTrigger className="text-left">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      <div className="prose prose-sm max-w-none text-muted-foreground dark:prose-invert">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          rehypePlugins={[rehypeSanitize]}
                        >
                          {faq.answer}
                        </ReactMarkdown>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <p className="text-muted-foreground">
                No results found. Try different keywords or browse categories
                below.
              </p>
            )}
          </div>
        </section>
      ) : (
        <>
          <section className="py-12">
            <div className="container mx-auto px-4">
              <h2 className="mb-12 text-center text-3xl font-bold">
                Browse by Category
              </h2>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {categoriesWithFaqs.map((category) => {
                  const IconComponent = category.meta.icon ?? CircleHelp;
                  return (
                    <Card
                      key={category.id}
                      className="cursor-pointer transition-shadow hover:shadow-lg"
                      onClick={() => setActiveTab(category.id)}
                    >
                      <CardHeader>
                        <div
                          className={`mb-4 flex h-12 w-12 items-center justify-center rounded-lg ${category.meta.color}`}
                        >
                          <IconComponent className="h-6 w-6" />
                        </div>
                        <CardTitle className="text-lg">
                          {category.meta.label}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {category.meta.description}
                        </p>
                      </CardHeader>
                    </Card>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="py-12">
            <div className="container mx-auto px-4">
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="space-y-8"
              >
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
                  {categoriesWithFaqs.map((category) => (
                    <TabsTrigger
                      key={category.id}
                      value={category.id}
                      className="text-xs lg:text-sm"
                    >
                      {category.meta.label.split(" ")[0]}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {categoriesWithFaqs.map((category) => (
                  <TabsContent
                    key={category.id}
                    value={category.id}
                    id={getFragmentForCategory(category.id, categories)}
                  >
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <category.meta.icon className="h-5 w-5" />
                          {category.meta.label}
                        </CardTitle>
                        <p className="text-muted-foreground">
                          {category.meta.description}
                        </p>
                      </CardHeader>
                      <CardContent>
                        <Accordion
                          type="single"
                          collapsible
                          className="space-y-4"
                        >
                          {category.items.map((faq) => (
                            <AccordionItem
                              key={faq.id}
                              value={`${category.id}-${faq.id}`}
                              className="rounded-lg border px-4"
                            >
                              <AccordionTrigger className="text-left">
                                {faq.question}
                              </AccordionTrigger>
                              <AccordionContent className="text-muted-foreground">
                                <div className="prose prose-sm max-w-none text-muted-foreground dark:prose-invert">
                                  <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    rehypePlugins={[rehypeSanitize]}
                                  >
                                    {faq.answer}
                                  </ReactMarkdown>
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </CardContent>
                    </Card>
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          </section>
        </>
      )}

      <section className="bg-muted/50 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-6 text-3xl font-bold">Still Have Questions?</h2>
          <p className="mb-8 mx-auto max-w-2xl text-xl text-muted-foreground">
            Our medical coordinators are available 24/7 to provide personalized
            answers to your specific questions.
          </p>
          <div className="mb-8 flex flex-col justify-center gap-4 sm:flex-row">
            <Button size="lg" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Call Now: +20 122 9503333
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="flex items-center gap-2"
            >
              <Mail className="h-4 w-4" />
              Email: info@carentour.com
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Available 24/7 in English, Arabic, and other languages
          </p>
        </div>
      </section>
    </main>
  );
}
