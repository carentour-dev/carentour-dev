"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { nanoid } from "nanoid";
import {
  Check,
  Copy,
  FileText,
  History,
  Lightbulb,
  Loader2,
  RefreshCw,
  Sparkles,
  Trash2,
  UploadCloud,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import { cn } from "@/lib/utils";

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

type KnowledgeFileState =
  | "STATE_UNSPECIFIED"
  | "PROCESSING"
  | "ACTIVE"
  | "FAILED"
  | string;

type KnowledgeFile = {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
  state: KnowledgeFileState;
  expiresAt: string | null;
};

type PendingKnowledgeFile = KnowledgeFile & {
  pendingSince: number;
};

type KnowledgeAnswer = {
  answer: string;
  model: string;
  referencedFileIds: string[];
  usage?: {
    totalTokens?: number | null;
    promptTokens?: number | null;
    completionTokens?: number | null;
  };
};

const KNOWLEDGE_FILES_QUERY_KEY = ["cnt-ai", "knowledge", "files"] as const;
const KNOWLEDGE_ACCEPTED_TYPES = [
  ".pdf",
  ".doc",
  ".docx",
  ".txt",
  ".csv",
  ".json",
] as const;
const MAX_KNOWLEDGE_SELECTION = 6;
const KNOWLEDGE_POLL_INTERVAL_MS = 5_000;
const MAX_PENDING_SYNC_DURATION_MS = 60_000;

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}

function formatTimestamp(iso: string) {
  try {
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function getKnowledgeStateProps(state: KnowledgeFileState, isRemote: boolean) {
  if (!isRemote) {
    return { label: "Syncing…", variant: "secondary" as const };
  }
  switch (state) {
    case "ACTIVE":
      return { label: "Ready", variant: "success" as const };
    case "FAILED":
      return { label: "Failed", variant: "destructive" as const };
    case "PROCESSING":
      return { label: "Processing", variant: "secondary" as const };
    default:
      return { label: "Unknown", variant: "outline" as const };
  }
}

function isKnowledgeFileReady(state: KnowledgeFileState) {
  return state === "ACTIVE";
}

function isKnowledgeFileSettled(state: KnowledgeFileState) {
  return state === "ACTIVE" || state === "FAILED";
}

export default function OperationsCntAiPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
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
  const [selectedKnowledge, setSelectedKnowledge] = useState<string[]>([]);
  const [knowledgeQuestion, setKnowledgeQuestion] = useState("");
  const [knowledgeAnswer, setKnowledgeAnswer] =
    useState<KnowledgeAnswer | null>(null);
  const isSmsChannel = channel === "sms";
  const knowledgeFilesQuery = useQuery({
    queryKey: KNOWLEDGE_FILES_QUERY_KEY,
    queryFn: async () => {
      return await adminFetch<KnowledgeFile[]>(
        "/api/admin/operations/cnt-ai/files",
      );
    },
    staleTime: 30_000,
  });
  const checklistPrompts = useMemo(() => {
    return CNT_AI_CHECKLIST_SNIPPETS.filter((snippet) =>
      selectedSnippets.includes(snippet.id),
    ).map((snippet) => snippet.prompt);
  }, [selectedSnippets]);
  const [pendingKnowledgeFiles, setPendingKnowledgeFiles] = useState<
    PendingKnowledgeFile[]
  >([]);
  const knowledgeFiles = useMemo(
    () => knowledgeFilesQuery.data ?? [],
    [knowledgeFilesQuery.data],
  );
  const refetchKnowledgeFiles = knowledgeFilesQuery.refetch;
  const remoteKnowledgeMap = useMemo(() => {
    return knowledgeFiles.reduce<Map<string, KnowledgeFile>>((map, file) => {
      map.set(file.id, file);
      return map;
    }, new Map());
  }, [knowledgeFiles]);
  const isKnowledgeLoading = knowledgeFilesQuery.isLoading;
  const mergedKnowledgeFiles = useMemo(() => {
    const unresolvedPending = pendingKnowledgeFiles.filter(
      (file) => !remoteKnowledgeMap.has(file.id),
    );
    return [...unresolvedPending, ...knowledgeFiles];
  }, [knowledgeFiles, pendingKnowledgeFiles, remoteKnowledgeMap]);
  const selectedKnowledgeFiles = useMemo(() => {
    if (!selectedKnowledge.length) {
      return [];
    }
    const selectedSet = new Set(selectedKnowledge);
    return knowledgeFiles.filter((file) => selectedSet.has(file.id));
  }, [knowledgeFiles, selectedKnowledge]);
  const shouldPollKnowledge = useMemo(() => {
    if (pendingKnowledgeFiles.length) {
      return true;
    }
    return knowledgeFiles.some(
      (file) => !isKnowledgeFileSettled(file.state ?? "STATE_UNSPECIFIED"),
    );
  }, [knowledgeFiles, pendingKnowledgeFiles.length]);

  useEffect(() => {
    if (!pendingKnowledgeFiles.length) {
      return;
    }
    setPendingKnowledgeFiles((current) =>
      current.filter((file) => {
        const remote = remoteKnowledgeMap.get(file.id);
        if (!remote) {
          return true;
        }
        return !isKnowledgeFileSettled(remote.state);
      }),
    );
  }, [pendingKnowledgeFiles.length, remoteKnowledgeMap]);

  useEffect(() => {
    if (!pendingKnowledgeFiles.length) {
      return;
    }
    const unresolvedPending = pendingKnowledgeFiles.some(
      (file) => !knowledgeFiles.some((remote) => remote.id === file.id),
    );
    if (!unresolvedPending) {
      return;
    }

    const remoteIds = new Set(knowledgeFiles.map((file) => file.id));
    const intervalDelay = Math.max(
      5_000,
      Math.floor(MAX_PENDING_SYNC_DURATION_MS / 3),
    );

    const watchdogId = window.setInterval(() => {
      setPendingKnowledgeFiles((current) => {
        if (!current.length) {
          return current;
        }
        const now = Date.now();
        const next: PendingKnowledgeFile[] = [];
        const stuck: PendingKnowledgeFile[] = [];

        current.forEach((file) => {
          if (remoteIds.has(file.id)) {
            next.push(file);
            return;
          }
          if (now - file.pendingSince > MAX_PENDING_SYNC_DURATION_MS) {
            stuck.push(file);
            return;
          }
          next.push(file);
        });

        if (stuck.length) {
          stuck.forEach((file) => {
            toast({
              title: "Document still syncing",
              description: `${file.name} is taking longer than expected. Refresh to verify or upload again.`,
              variant: "destructive",
            });
          });
        }

        return next;
      });
    }, intervalDelay);

    return () => {
      window.clearInterval(watchdogId);
    };
  }, [knowledgeFiles, pendingKnowledgeFiles, toast]);

  useEffect(() => {
    if (!selectedKnowledge.length) {
      return;
    }
    setSelectedKnowledge((current) =>
      current.filter((id) => remoteKnowledgeMap.has(id)),
    );
  }, [remoteKnowledgeMap, selectedKnowledge.length]);
  useEffect(() => {
    if (!shouldPollKnowledge) {
      return;
    }
    void refetchKnowledgeFiles();
    const pollId = window.setInterval(() => {
      void refetchKnowledgeFiles();
    }, KNOWLEDGE_POLL_INTERVAL_MS);
    return () => {
      window.clearInterval(pollId);
    };
  }, [refetchKnowledgeFiles, shouldPollKnowledge]);

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
  const uploadKnowledgeMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return await adminFetch<KnowledgeFile>(
        "/api/admin/operations/cnt-ai/files",
        {
          method: "POST",
          body: formData,
        },
      );
    },
    onSuccess: (uploaded) => {
      setPendingKnowledgeFiles((previous) => {
        const withoutDuplicate = previous.filter(
          (file) => file.id !== uploaded.id,
        );
        return [
          {
            ...uploaded,
            pendingSince: Date.now(),
          },
          ...withoutDuplicate,
        ];
      });
      void queryClient.invalidateQueries({
        queryKey: KNOWLEDGE_FILES_QUERY_KEY,
      });
      void refetchKnowledgeFiles();
      toast({
        title: "Document added",
        description: isKnowledgeFileReady(uploaded.state)
          ? `${uploaded.name} is ready for Q&A.`
          : `${uploaded.name} is processing…`,
      });
    },
    onError: (error: unknown) => {
      toast({
        title: "Upload failed",
        description:
          error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    },
  });
  const deleteKnowledgeMutation = useMutation({
    mutationFn: async (fileId: string) => {
      return await adminFetch<{ success: boolean }>(
        `/api/admin/operations/cnt-ai/files/${fileId}`,
        {
          method: "DELETE",
        },
      );
    },
    onSuccess: (_data, fileId) => {
      setSelectedKnowledge((previous) =>
        previous.filter((id) => id !== fileId),
      );
      setPendingKnowledgeFiles((previous) =>
        previous.filter((file) => file.id !== fileId),
      );
      queryClient.setQueryData<KnowledgeFile[]>(
        KNOWLEDGE_FILES_QUERY_KEY,
        (current) => current?.filter((file) => file.id !== fileId),
      );
      void queryClient.invalidateQueries({
        queryKey: KNOWLEDGE_FILES_QUERY_KEY,
      });
      toast({
        title: "Document removed",
        description: "The file was deleted from CNT AI knowledge.",
      });
    },
    onError: (error: unknown) => {
      toast({
        title: "Could not delete file",
        description:
          error instanceof Error
            ? error.message
            : "Try again in a few seconds.",
        variant: "destructive",
      });
    },
  });
  const knowledgeQuestionMutation = useMutation({
    mutationFn: async (payload: { question: string; fileIds: string[] }) => {
      return await adminFetch<KnowledgeAnswer>(
        "/api/admin/operations/cnt-ai/queries",
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
      );
    },
    onSuccess: (data) => {
      setKnowledgeAnswer(data);
      toast({
        title: "Answer ready",
        description: "CNT AI analyzed the selected documents.",
      });
    },
    onError: (error: unknown) => {
      toast({
        title: "Could not answer question",
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

  const handleKnowledgeFileInput = (
    event: ChangeEvent<HTMLInputElement>,
  ): void => {
    const file = event.target.files?.[0];
    if (file) {
      uploadKnowledgeMutation.mutate(file);
      event.target.value = "";
    }
  };

  const handleKnowledgeSelection = (fileId: string) => {
    if (!remoteKnowledgeMap.has(fileId)) {
      toast({
        title: "Still processing",
        description:
          "Wait a few seconds until the document finishes processing.",
        variant: "destructive",
      });
      return;
    }
    setSelectedKnowledge((previous) => {
      if (previous.includes(fileId)) {
        return previous.filter((id) => id !== fileId);
      }
      if (previous.length >= MAX_KNOWLEDGE_SELECTION) {
        toast({
          title: "Selection limit reached",
          description: `Choose up to ${MAX_KNOWLEDGE_SELECTION} documents at a time.`,
          variant: "destructive",
        });
        return previous;
      }
      return [...previous, fileId];
    });
  };

  const handleKnowledgeQuestionSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!knowledgeQuestion.trim()) {
      toast({
        title: "Question required",
        description: "Describe what you want CNT AI to find.",
        variant: "destructive",
      });
      return;
    }
    if (!selectedKnowledge.length) {
      toast({
        title: "Select a document",
        description: "Choose at least one file for CNT AI to analyze.",
        variant: "destructive",
      });
      return;
    }
    const missingRemote = selectedKnowledge.some(
      (fileId) => !remoteKnowledgeMap.has(fileId),
    );
    if (missingRemote) {
      toast({
        title: "Document still processing",
        description: "Wait until the document finishes syncing before asking.",
        variant: "destructive",
      });
      return;
    }
    setKnowledgeAnswer(null);
    knowledgeQuestionMutation.mutate({
      question: knowledgeQuestion.trim(),
      fileIds: selectedKnowledge,
    });
  };

  const handleKnowledgeDelete = (fileId: string) => {
    deleteKnowledgeMutation.mutate(fileId);
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

  const isKnowledgeActionDisabled =
    knowledgeQuestionMutation.isPending ||
    !knowledgeQuestion.trim() ||
    !selectedKnowledge.length;

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
            <FileText className="h-5 w-5 text-primary" />
            CNT AI knowledge workspace
          </CardTitle>
          <CardDescription>
            Upload patient-facing files, select the ones you care about, and ask
            CNT AI to find the answer for you. Documents stay scoped to your
            account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">
                  Upload documents
                </Label>
                <label
                  htmlFor="cnt-ai-knowledge-upload"
                  className={cn(
                    "flex flex-col items-center justify-center rounded-lg border border-dashed border-muted-foreground/50 bg-muted/40 p-6 text-center transition focus-within:ring-2 focus-within:ring-primary/40",
                    uploadKnowledgeMutation.isPending
                      ? "cursor-not-allowed opacity-60"
                      : "cursor-pointer hover:border-primary/60",
                  )}
                >
                  <input
                    id="cnt-ai-knowledge-upload"
                    type="file"
                    accept={KNOWLEDGE_ACCEPTED_TYPES.join(",")}
                    className="sr-only"
                    onChange={handleKnowledgeFileInput}
                    disabled={uploadKnowledgeMutation.isPending}
                  />
                  {uploadKnowledgeMutation.isPending ? (
                    <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      Uploading document…
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <UploadCloud className="mx-auto h-8 w-8 text-primary" />
                      <p className="text-sm font-medium text-foreground">
                        Drag & drop or click to upload
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PDF, DOC/DOCX, TXT, CSV, or JSON up to 10MB
                      </p>
                    </div>
                  )}
                </label>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm font-medium text-foreground">
                  <span>Uploaded documents</span>
                  <span className="text-xs text-muted-foreground">
                    {mergedKnowledgeFiles.length}/{MAX_KNOWLEDGE_SELECTION} max
                    stored
                  </span>
                </div>
                {isKnowledgeLoading ? (
                  <div className="flex items-center gap-2 rounded-lg border border-dashed border-muted-foreground/40 bg-muted/40 p-4 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    Loading documents…
                  </div>
                ) : mergedKnowledgeFiles.length ? (
                  <div className="space-y-3">
                    {mergedKnowledgeFiles.map((file) => {
                      const isRemote = remoteKnowledgeMap.has(file.id);
                      const stateProps = getKnowledgeStateProps(
                        file.state,
                        isRemote,
                      );
                      const isReady = isKnowledgeFileReady(file.state);
                      const isSelected = selectedKnowledge.includes(file.id);
                      const canSelect = isReady && isRemote;
                      return (
                        <div
                          key={file.id}
                          className="flex items-start gap-3 rounded-lg border border-border/70 bg-background/80 p-3"
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => {
                              if (canSelect) {
                                handleKnowledgeSelection(file.id);
                              }
                            }}
                            disabled={!canSelect}
                            className="mt-1"
                          />
                          <div className="flex-1 space-y-1">
                            <div className="flex flex-wrap items-center gap-2 text-sm font-medium leading-tight">
                              <span
                                className="min-w-0 flex-1 break-words text-left"
                                title={file.name}
                              >
                                {file.name}
                              </span>
                              <Badge
                                variant={stateProps.variant}
                                className="shrink-0 whitespace-nowrap"
                              >
                                {stateProps.label}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(file.size)} · Uploaded{" "}
                              {formatTimestamp(file.uploadedAt)}
                            </p>
                          </div>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => handleKnowledgeDelete(file.id)}
                            disabled={deleteKnowledgeMutation.isPending}
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-muted-foreground/50 bg-muted/30 p-4 text-sm text-muted-foreground">
                    No documents yet. Upload a treatment plan, intake summary,
                    or any file you want CNT AI to analyze.
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-4">
              <form
                onSubmit={handleKnowledgeQuestionSubmit}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="cnt-ai-knowledge-question">
                    Ask about the selected files
                  </Label>
                  <Textarea
                    id="cnt-ai-knowledge-question"
                    placeholder="E.g. What dates should we confirm with the patient?"
                    value={knowledgeQuestion}
                    onChange={(event) =>
                      setKnowledgeQuestion(event.target.value)
                    }
                    rows={6}
                  />
                  <p className="text-xs text-muted-foreground">
                    {selectedKnowledgeFiles.length
                      ? `${selectedKnowledgeFiles.length} file${selectedKnowledgeFiles.length === 1 ? "" : "s"} selected`
                      : "Choose up to 6 files to include in your question."}
                  </p>
                </div>
                {!!selectedKnowledgeFiles.length && (
                  <div className="flex flex-wrap gap-2">
                    {selectedKnowledgeFiles.map((file) => (
                      <Badge
                        key={file.id}
                        variant="outline"
                        className="max-w-full flex-wrap justify-start whitespace-normal break-words text-left leading-snug normal-case"
                        title={file.name}
                      >
                        {file.name}
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="flex flex-wrap gap-3">
                  <Button type="submit" disabled={isKnowledgeActionDisabled}>
                    {knowledgeQuestionMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Ask CNT AI
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setKnowledgeAnswer(null);
                      setKnowledgeQuestion("");
                      setSelectedKnowledge([]);
                    }}
                    disabled={knowledgeQuestionMutation.isPending}
                  >
                    Reset
                  </Button>
                </div>
              </form>
              {knowledgeQuestionMutation.isPending && (
                <div className="rounded-lg border border-dashed border-muted-foreground/50 bg-muted/40 p-4 text-sm text-muted-foreground">
                  CNT AI is analyzing your documents…
                </div>
              )}
              {knowledgeAnswer && (
                <div className="space-y-3 rounded-lg border border-muted-foreground/40 bg-background/70 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium text-foreground">
                      Answer
                    </p>
                    <Badge variant="outline">{knowledgeAnswer.model}</Badge>
                  </div>
                  <div
                    className="rounded-md border border-border/50 bg-muted/40"
                    role="region"
                    aria-label="CNT AI answer"
                  >
                    <div
                      className="max-h-[65vh] min-h-[220px] overflow-y-auto whitespace-pre-wrap px-4 py-3 text-sm leading-relaxed text-foreground focus-visible:outline-none"
                      style={{ scrollbarGutter: "stable both-edges" }}
                      tabIndex={0}
                    >
                      {knowledgeAnswer.answer}
                    </div>
                  </div>
                  {knowledgeAnswer.usage && (
                    <p className="text-xs text-muted-foreground">
                      Prompt: {knowledgeAnswer.usage.promptTokens ?? "—"} ·
                      Output: {knowledgeAnswer.usage.completionTokens ?? "—"} ·
                      Total: {knowledgeAnswer.usage.totalTokens ?? "—"}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

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
