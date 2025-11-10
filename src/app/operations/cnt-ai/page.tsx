"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { nanoid } from "nanoid";
import {
  Check,
  Copy,
  History,
  Lightbulb,
  Loader2,
  RefreshCw,
  Sparkles,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { adminFetch } from "@/components/admin/hooks/useAdminFetch";
import { useToast } from "@/hooks/use-toast";
import {
  CNT_AI_CHECKLIST_SNIPPETS,
  CNT_AI_REWRITE_OPTIONS,
} from "@/lib/operations/cntAiGuidance";

const TONE_OPTIONS = [
  { value: "professional", label: "Professional" },
  { value: "friendly", label: "Friendly" },
  { value: "concise", label: "Concise" },
  { value: "reassuring", label: "Reassuring" },
] as const;

const CHANNEL_OPTIONS = [
  { value: "email", label: "Email" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "sms", label: "SMS" },
] as const;

const LANGUAGE_OPTIONS = [
  { value: "English", label: "English" },
  { value: "Arabic", label: "Arabic" },
  { value: "French", label: "French" },
  { value: "Spanish", label: "Spanish" },
] as const;

const DEFAULT_TONE = TONE_OPTIONS[0]!.value;
const DEFAULT_CHANNEL = CHANNEL_OPTIONS[0]!.value;
const DEFAULT_LANGUAGE = LANGUAGE_OPTIONS[0]!.value;
const SMS_MAX_CHAR_COUNT = 160;

function getChannelLabel(value?: CntAiChannel) {
  if (!value) {
    return CHANNEL_OPTIONS[0]!.label;
  }
  return (
    CHANNEL_OPTIONS.find((option) => option.value === value)?.label ??
    CHANNEL_OPTIONS[0]!.label
  );
}

function getRewriteLabel(id: string | null) {
  if (!id) return null;
  return (
    CNT_AI_REWRITE_OPTIONS.find((option) => option.id === id)?.label ?? null
  );
}

type CntAiChannel = (typeof CHANNEL_OPTIONS)[number]["value"];

type GenerateReplyPayload = {
  message: string;
  tone?: string;
  channel?: CntAiChannel;
  language?: string;
  guidance?: string;
  checklist?: string[];
  mode?: "draft" | "rewrite" | "insights";
  previousDraft?: string;
  rewriteStyle?: string;
};

type DraftHistoryEntry = {
  id: string;
  label: string;
  text: string;
  mode: "draft" | "rewrite";
  createdAt: number;
};

type GenerateReplyResponse = {
  reply: string;
  provider: string;
  model: string;
  finishReason?: string | null;
  usage?: {
    totalTokens?: number | null;
    promptTokens?: number | null;
    completionTokens?: number | null;
  };
};

export default function OperationsCntAiPage() {
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [tone, setTone] = useState<string>(DEFAULT_TONE);
  const [channel, setChannel] = useState<CntAiChannel>(DEFAULT_CHANNEL);
  const [language, setLanguage] = useState<string>(DEFAULT_LANGUAGE);
  const [guidance, setGuidance] = useState("");
  const [selectedSnippets, setSelectedSnippets] = useState<string[]>([]);
  const [reply, setReply] = useState("");
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<DraftHistoryEntry[]>([]);
  const [keyPoints, setKeyPoints] = useState<string[]>([]);
  const [activeRewrite, setActiveRewrite] = useState<string | null>(null);
  const [metadata, setMetadata] =
    useState<
      Pick<
        GenerateReplyResponse,
        "provider" | "model" | "finishReason" | "usage"
      >
    >();
  const isSmsChannel = channel === "sms";
  const checklistPrompts = useMemo(() => {
    return CNT_AI_CHECKLIST_SNIPPETS.filter((snippet) =>
      selectedSnippets.includes(snippet.id),
    ).map((snippet) => snippet.prompt);
  }, [selectedSnippets]);

  useEffect(() => {
    setKeyPoints([]);
  }, [message]);

  const generateMutation = useMutation({
    mutationFn: async (payload: GenerateReplyPayload) => {
      return await adminFetch<GenerateReplyResponse>(
        "/api/admin/operations/cnt-ai",
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
      );
    },
    onSuccess: (data, variables) => {
      const nextReply = data.reply.trim();
      setReply(nextReply);
      setCopied(false);
      setMetadata({
        provider: data.provider,
        model: data.model,
        finishReason: data.finishReason,
        usage: data.usage,
      });
      setActiveRewrite(null);
      const mode = variables?.mode === "rewrite" ? "rewrite" : "draft";
      const channelLabel = getChannelLabel(
        (variables?.channel as CntAiChannel | undefined) ?? channel,
      );
      const languageLabel = variables?.language ?? language ?? DEFAULT_LANGUAGE;
      const rewriteLabel =
        mode === "rewrite" ? getRewriteLabel(activeRewrite) : null;

      setHistory((previous) => {
        const nextHistory: DraftHistoryEntry[] = [
          {
            id: nanoid(),
            label: [
              mode === "rewrite"
                ? `Rewrite${rewriteLabel ? ` – ${rewriteLabel}` : ""}`
                : "Draft",
              channelLabel,
              languageLabel,
            ]
              .filter(Boolean)
              .join(" · "),
            text: nextReply,
            mode,
            createdAt: Date.now(),
          },
          ...previous,
        ];
        return nextHistory.slice(0, 5);
      });
      toast({
        title: "Reply ready",
        description: "CNT AI generated a response you can review.",
      });
    },
    onError: (error: unknown) => {
      setMetadata(undefined);
      setActiveRewrite(null);
      toast({
        title: "Could not generate reply",
        description:
          error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    },
  });
  const insightsMutation = useMutation({
    mutationFn: async (payload: GenerateReplyPayload) => {
      return await adminFetch<GenerateReplyResponse>(
        "/api/admin/operations/cnt-ai",
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
      );
    },
    onSuccess: (data) => {
      const normalized = data.reply
        .split("\n")
        .map((line) => line.replace(/^[-*\d.\s]+/, "").trim())
        .filter(Boolean);
      setKeyPoints(normalized.length ? normalized : [data.reply.trim()]);
      toast({
        title: "Key points ready",
        description: "Talking points updated for this inquiry.",
      });
    },
    onError: (error: unknown) => {
      toast({
        title: "Could not analyze message",
        description:
          error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const isGenerating = generateMutation.isPending;
  const isInsightsLoading = insightsMutation.isPending;
  const isCopyDisabled = !reply.trim();
  const isMessageEmpty = !message.trim();
  const isRewriteDisabled = isGenerating || !reply.trim();

  const buildPayload = (overrides?: Partial<GenerateReplyPayload>) => {
    const trimmedGuidance = guidance.trim();
    const payload: GenerateReplyPayload = {
      message: message.trim(),
      tone,
      channel,
      language,
      guidance: trimmedGuidance ? trimmedGuidance : undefined,
      checklist: checklistPrompts.length ? checklistPrompts : undefined,
      mode: "draft",
    };

    return {
      ...payload,
      ...overrides,
    };
  };

  const handleGenerate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isMessageEmpty) {
      toast({
        title: "Message required",
        description: "Paste the inbound message before using CNT AI.",
        variant: "destructive",
      });
      return;
    }

    setReply("");
    setMetadata(undefined);
    setActiveRewrite(null);
    generateMutation.mutate(buildPayload());
  };

  const handleRewrite = (optionId: string) => {
    if (isRewriteDisabled || isMessageEmpty) {
      toast({
        title: "Need a draft first",
        description: "Generate a reply before trying a rewrite.",
        variant: "destructive",
      });
      return;
    }

    const option = CNT_AI_REWRITE_OPTIONS.find(
      (rewriteOption) => rewriteOption.id === optionId,
    );
    if (!option) {
      return;
    }

    setMetadata(undefined);
    setActiveRewrite(option.id);
    generateMutation.mutate(
      buildPayload({
        mode: "rewrite",
        previousDraft: reply.trim(),
        rewriteStyle: option.prompt,
      }),
    );
  };

  const handleInsights = () => {
    if (isMessageEmpty) {
      toast({
        title: "Message required",
        description: "Paste the inbound message before asking for insights.",
        variant: "destructive",
      });
      return;
    }

    insightsMutation.mutate(
      buildPayload({
        mode: "insights",
      }),
    );
  };

  const handleChecklistToggle = (snippetId: string) => {
    setSelectedSnippets((previous) => {
      if (previous.includes(snippetId)) {
        return previous.filter((id) => id !== snippetId);
      }
      return [...previous, snippetId];
    });
  };

  const handleHistorySelect = (entry: DraftHistoryEntry) => {
    setReply(entry.text);
    toast({
      title: "Draft loaded",
      description: entry.label,
    });
  };

  const handleCopy = async () => {
    if (!reply.trim()) {
      return;
    }

    try {
      await navigator.clipboard.writeText(reply);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copied",
        description: "Reply copied to clipboard.",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description:
          error instanceof Error ? error.message : "Please copy manually.",
        variant: "destructive",
      });
    }
  };

  const usageSummary = useMemo(() => {
    if (!metadata?.usage) return null;
    const { promptTokens, completionTokens, totalTokens } = metadata.usage;
    return [
      promptTokens ? `Prompt: ${promptTokens}` : null,
      completionTokens ? `Output: ${completionTokens}` : null,
      totalTokens ? `Total: ${totalTokens}` : null,
    ]
      .filter(Boolean)
      .join(" · ");
  }, [metadata]);

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-tight text-primary">
          CNT AI
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Draft fast, on-brand replies
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Paste an inbound patient message, choose the tone, and let CNT AI
          (powered by Gemini) suggest a response. Always review and personalize
          before sending.
        </p>
      </header>

      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-5 w-5 text-primary" />
            Generate reply
          </CardTitle>
          <CardDescription>
            CNT AI keeps everything on-device in this session—nothing is saved.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleGenerate} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cnt-ai-message">Inbound message</Label>
                <Textarea
                  id="cnt-ai-message"
                  placeholder="Paste the patient's note or question..."
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  minLength={1}
                  maxLength={4000}
                  rows={8}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Tone</Label>
                  <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select tone" />
                    </SelectTrigger>
                    <SelectContent>
                      {TONE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    Channel
                  </Label>
                  <Select
                    value={channel}
                    onValueChange={(value) => setChannel(value as CntAiChannel)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select channel" />
                    </SelectTrigger>
                    <SelectContent>
                      {CHANNEL_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    Reply language
                  </Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cnt-ai-guidance">
                  Extra guidance (optional)
                </Label>
                <Textarea
                  id="cnt-ai-guidance"
                  placeholder="Mention visa paperwork, reference a doctor, etc."
                  value={guidance}
                  onChange={(event) => setGuidance(event.target.value)}
                  rows={3}
                  maxLength={600}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">
                  Quality checklist
                </Label>
                <div className="flex flex-wrap gap-2">
                  {CNT_AI_CHECKLIST_SNIPPETS.map((snippet) => {
                    const isSelected = selectedSnippets.includes(snippet.id);
                    return (
                      <Button
                        key={snippet.id}
                        type="button"
                        size="sm"
                        variant={isSelected ? "default" : "outline"}
                        onClick={() => handleChecklistToggle(snippet.id)}
                        title={snippet.description}
                      >
                        {snippet.label}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={isGenerating}>
                {isGenerating && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isGenerating ? "Generating..." : "Generate reply"}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={isCopyDisabled}
                onClick={handleCopy}
              >
                {copied ? (
                  <Check className="mr-2 h-4 w-4" />
                ) : (
                  <Copy className="mr-2 h-4 w-4" />
                )}
                {copied ? "Copied" : "Copy reply"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={isInsightsLoading || isMessageEmpty}
                onClick={handleInsights}
              >
                {isInsightsLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Lightbulb className="mr-2 h-4 w-4" />
                )}
                {isInsightsLoading ? "Analyzing..." : "Key points"}
              </Button>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <RefreshCw className="h-4 w-4 text-primary" />
                Rewrite quick actions
              </Label>
              <div className="flex flex-wrap gap-2">
                {CNT_AI_REWRITE_OPTIONS.map((option) => (
                  <Button
                    key={option.id}
                    type="button"
                    size="sm"
                    variant={
                      activeRewrite === option.id ? "default" : "outline"
                    }
                    disabled={isRewriteDisabled}
                    onClick={() => handleRewrite(option.id)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
            {keyPoints.length > 0 && (
              <div className="space-y-2 rounded-md border border-border/60 p-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Lightbulb className="h-4 w-4 text-primary" />
                  Key points to mention
                </div>
                <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {keyPoints.map((point, index) => (
                    <li key={`${point}-${index}`}>{point}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="cnt-ai-reply">Suggested reply</Label>
                {isSmsChannel && (
                  <span
                    className={`text-xs ${
                      reply.length > SMS_MAX_CHAR_COUNT
                        ? "text-destructive"
                        : "text-muted-foreground"
                    }`}
                  >
                    {reply.length}/{SMS_MAX_CHAR_COUNT} characters
                  </span>
                )}
              </div>
              <Textarea
                id="cnt-ai-reply"
                readOnly
                value={reply}
                placeholder="CNT AI will draft a reply here."
                rows={8}
              />
              {metadata && (
                <p className="text-xs text-muted-foreground">
                  {metadata.provider.toUpperCase()} · {metadata.model}
                  {metadata.finishReason ? ` · ${metadata.finishReason}` : ""}
                  {usageSummary ? ` · ${usageSummary}` : ""}
                </p>
              )}
            </div>
            {history.length > 0 && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <History className="h-4 w-4 text-primary" />
                  Recent drafts
                </Label>
                <div className="flex flex-wrap gap-2">
                  {history.map((entry) => (
                    <Button
                      key={entry.id}
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleHistorySelect(entry)}
                    >
                      {entry.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
