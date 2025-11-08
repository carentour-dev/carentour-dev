"use client";

import { FormEvent, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Check, Copy, Loader2, Sparkles } from "lucide-react";

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

type GenerateReplyPayload = {
  message: string;
  tone?: string;
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

const TONE_OPTIONS = [
  { value: "professional", label: "Professional" },
  { value: "friendly", label: "Friendly" },
  { value: "concise", label: "Concise" },
  { value: "reassuring", label: "Reassuring" },
] as const;

const DEFAULT_TONE = TONE_OPTIONS[0]!.value;

export default function OperationsCntAiPage() {
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [tone, setTone] = useState<string>(DEFAULT_TONE);
  const [reply, setReply] = useState("");
  const [copied, setCopied] = useState(false);
  const [metadata, setMetadata] =
    useState<
      Pick<
        GenerateReplyResponse,
        "provider" | "model" | "finishReason" | "usage"
      >
    >();

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
    onSuccess: (data) => {
      setReply(data.reply.trim());
      setMetadata({
        provider: data.provider,
        model: data.model,
        finishReason: data.finishReason,
        usage: data.usage,
      });
      toast({
        title: "Reply ready",
        description: "CNT AI generated a response you can review.",
      });
    },
    onError: (error: unknown) => {
      setMetadata(undefined);
      toast({
        title: "Could not generate reply",
        description:
          error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const isGenerating = generateMutation.isPending;
  const isCopyDisabled = !reply.trim();

  const handleGenerate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!message.trim()) {
      toast({
        title: "Message required",
        description: "Paste the inbound message before using CNT AI.",
        variant: "destructive",
      });
      return;
    }

    setReply("");
    setMetadata(undefined);
    generateMutation.mutate({
      message: message.trim(),
      tone,
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
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="cnt-ai-message">Inbound message</Label>
                <div className="flex items-center gap-3">
                  <Label className="text-xs text-muted-foreground">Tone</Label>
                  <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger className="w-40">
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
              </div>
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
            </div>
            <div className="space-y-2">
              <Label htmlFor="cnt-ai-reply">Suggested reply</Label>
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
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
