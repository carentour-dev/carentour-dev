import {
  GoogleGenerativeAI,
  GoogleGenerativeAIFetchError,
  type GenerateContentResult,
} from "@google/generative-ai";

import { ApiError } from "@/server/utils/errors";

type CntAiMode = "draft" | "rewrite" | "insights";
type CntAiChannel = "email" | "whatsapp" | "sms";

export type GenerateCntAiReplyInput = {
  message: string;
  tone?: string | null;
  channel?: CntAiChannel | null;
  language?: string | null;
  guidance?: string | null;
  checklist?: string[] | null;
  mode?: CntAiMode | null;
  previousDraft?: string | null;
  rewriteStyle?: string | null;
};

export type GenerateCntAiReplyResult = {
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

const CNT_AI_PROVIDER = (process.env.CNT_AI_PROVIDER ?? "gemini").toLowerCase();
const GEMINI_PROVIDER = "gemini";
const DEFAULT_MODEL = process.env.CNT_AI_GEMINI_MODEL ?? "gemini-1.5-flash";

const MAX_OUTPUT_TOKENS =
  Number(process.env.CNT_AI_MAX_OUTPUT_TOKENS ?? "1024") || 1024;
const MAX_GEMINI_RETRIES =
  Math.max(1, Number(process.env.CNT_AI_MAX_RETRIES ?? "4")) || 4;
const RETRY_BACKOFF_BASE_MS =
  Math.max(100, Number(process.env.CNT_AI_RETRY_BASE_MS ?? "500")) || 500;
const RETRY_JITTER_MS =
  Math.max(0, Number(process.env.CNT_AI_RETRY_JITTER_MS ?? "250")) || 0;
const RETRYABLE_STATUS_CODES = new Set([404, 429, 500, 503]);

const generationConfig = {
  temperature: Number(process.env.CNT_AI_TEMPERATURE ?? "0.6"),
  topP: Number(process.env.CNT_AI_TOP_P ?? "0.9"),
  topK: Number(process.env.CNT_AI_TOP_K ?? "40"),
  maxOutputTokens: MAX_OUTPUT_TOKENS,
};

const DEFAULT_CHANNEL: CntAiChannel = "email";
const DEFAULT_LANGUAGE = "English";

const SMS_MAX_CHAR_COUNT = 160;

const CHANNEL_INSTRUCTIONS: Record<CntAiChannel, string[]> = {
  email: [
    "Write in clear, complete sentences suitable for a polished email.",
    "Open with a warm greeting and close with a courteous Care N Tour sign-off.",
  ],
  whatsapp: [
    "Keep paragraphs to 1–2 sentences for a messaging experience.",
    "Feel free to include one tasteful emoji if it reinforces warmth.",
  ],
  sms: [
    `Hard limit: the entire reply must stay under ${SMS_MAX_CHAR_COUNT} characters (including spaces).`,
    "Use one or two short sentences, no bullets, and avoid links unless absolutely required.",
    "If more information is needed, ask them to continue the conversation on WhatsApp or email.",
  ],
};

const BASE_REPLY_GUIDELINES = [
  "- Keep the reply concise (3–6 sentences) but helpful.",
  "- Reflect Care N Tour's hospitality and professionalism.",
  "- If information is missing, ask targeted follow-up questions.",
  "- Never hallucinate medical details or pricing.",
];

let geminiClient: GoogleGenerativeAI | null = null;
const geminiModelCache = new Map<
  string,
  ReturnType<GoogleGenerativeAI["getGenerativeModel"]>
>();

const sleep = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const parseModelList = (value: string | undefined) =>
  value
    ?.split(",")
    .map((model) => model.trim())
    .filter(Boolean) ?? [];

const getModelPreferenceList = () => {
  const primaryModel = process.env.CNT_AI_GEMINI_MODEL ?? DEFAULT_MODEL;
  const fallbacks = parseModelList(process.env.CNT_AI_FALLBACK_MODELS);
  const uniques: string[] = [];

  for (const model of [primaryModel, ...fallbacks]) {
    const normalized = model.startsWith("models/")
      ? model.replace("models/", "")
      : model;
    if (!uniques.includes(normalized)) {
      uniques.push(normalized);
    }
  }

  return uniques;
};

function enforceSmsLength(text: string) {
  if (text.length <= SMS_MAX_CHAR_COUNT) {
    return text;
  }

  const truncated = text.slice(0, SMS_MAX_CHAR_COUNT - 1);
  const lastSpace = truncated.lastIndexOf(" ");
  const safeSlice = lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated;
  return `${safeSlice.trim()}…`;
}

function assertProviderConfigured() {
  if (CNT_AI_PROVIDER !== GEMINI_PROVIDER) {
    throw new ApiError(
      503,
      "CNT AI provider is not configured for this environment.",
    );
  }

  if (!process.env.CNT_AI_GEMINI_KEY) {
    throw new ApiError(
      503,
      "CNT AI is unavailable. Please add CNT_AI_GEMINI_KEY to the environment.",
    );
  }
}

function getGeminiModel(modelName: string) {
  assertProviderConfigured();

  if (geminiClient === null) {
    geminiClient = new GoogleGenerativeAI(process.env.CNT_AI_GEMINI_KEY!);
  }

  if (!geminiModelCache.has(modelName)) {
    geminiModelCache.set(
      modelName,
      geminiClient.getGenerativeModel({ model: modelName }),
    );
  }

  return geminiModelCache.get(modelName)!;
}

function buildPrompt(input: GenerateCntAiReplyInput) {
  const tone = input.tone?.trim().toLowerCase() || "professional";
  const normalizedMessage = input.message.trim();
  const mode: CntAiMode = (input.mode ?? "draft") as CntAiMode;
  const normalizedChannel = (input.channel ?? DEFAULT_CHANNEL).toLowerCase();
  const channel: CntAiChannel = ["email", "whatsapp", "sms"].includes(
    normalizedChannel,
  )
    ? (normalizedChannel as CntAiChannel)
    : DEFAULT_CHANNEL;
  const channelInstructions =
    CHANNEL_INSTRUCTIONS[channel] ?? CHANNEL_INSTRUCTIONS[DEFAULT_CHANNEL];
  const guidance = input.guidance?.trim();
  const checklist = input.checklist?.map((item) => item.trim()).filter(Boolean);
  const language = input.language?.trim();
  const previousDraft = input.previousDraft?.trim();
  const rewriteStyle = input.rewriteStyle?.trim();

  if (mode === "insights") {
    return [
      "You are CNT AI, an assistant supporting Care N Tour's operations coordinators.",
      "Summarize the inbound message into 3–5 short bullet points highlighting key facts, asks, blockers, and deadlines.",
      "Each bullet must start with '-' and stay under ~20 words. Do not invent new information.",
      "",
      "Inbound message:",
      `"""`,
      normalizedMessage,
      `"""`,
      "",
      "Return only the bullet list with no intro or outro.",
    ].join("\n");
  }

  const instructions = [
    "You are CNT AI, an assistant supporting Care N Tour's operations coordinators.",
    "Your job is to draft clear, empathetic replies to prospective patients.",
    `Tone: ${tone}.`,
    ...channelInstructions,
  ];

  if (guidance) {
    instructions.push(`Coordinator guidance: ${guidance}`);
  }

  if (checklist?.length) {
    instructions.push("Mandatory talking points:");
    checklist.forEach((item) => instructions.push(`- ${item}`));
  }

  if (language && language.toLowerCase() !== DEFAULT_LANGUAGE.toLowerCase()) {
    instructions.push(`Write the reply entirely in ${language}.`);
  }

  if (mode === "rewrite" && previousDraft) {
    instructions.push(
      "You are revising the existing draft below without changing any facts or promises.",
      rewriteStyle ??
        "Improve clarity, warmth, and flow without removing commitments.",
      "",
      "Previous draft:",
      `"""`,
      previousDraft,
      `"""`,
    );
  } else {
    instructions.push(...BASE_REPLY_GUIDELINES);
  }

  instructions.push("", "Inbound message:", `"""`, normalizedMessage, `"""`);

  instructions.push(
    "",
    mode === "rewrite"
      ? "Rewrite the previous draft now and return only the improved version."
      : "Draft the reply they could send verbatim, ready for email or WhatsApp.",
  );

  return instructions.join("\n");
}

function extractReply(result: GenerateContentResult["response"]) {
  const text = result.text();
  if (text?.trim()) {
    return text.trim();
  }

  const candidateText = result.candidates
    ?.map((candidate) =>
      candidate.content?.parts
        ?.map((part) => {
          if ("text" in part && typeof part.text === "string") {
            return part.text;
          }
          return "";
        })
        .join(""),
    )
    .find((value) => value && value.trim());

  return candidateText?.trim() ?? "";
}

function isRetryableGeminiError(
  error: unknown,
): error is GoogleGenerativeAIFetchError {
  return (
    error instanceof GoogleGenerativeAIFetchError &&
    (error.status ? RETRYABLE_STATUS_CODES.has(error.status) : false)
  );
}

async function executeWithRetry<T>(fn: () => Promise<T>): Promise<T> {
  let attempt = 0;
  let lastError: unknown = null;

  while (attempt < MAX_GEMINI_RETRIES) {
    attempt += 1;
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (!isRetryableGeminiError(error) || attempt >= MAX_GEMINI_RETRIES) {
        if (
          error instanceof GoogleGenerativeAIFetchError &&
          typeof error.status === "number"
        ) {
          (
            error as GoogleGenerativeAIFetchError & { cntAiAttempts?: number }
          ).cntAiAttempts = attempt;
        }
        break;
      }

      const backoff = RETRY_BACKOFF_BASE_MS * Math.pow(2, attempt - 1);
      const jitter = RETRY_JITTER_MS ? Math.random() * RETRY_JITTER_MS : 0;
      console.warn("[CNT AI] Gemini retry", {
        status: error.status,
        statusText: error.statusText,
        attempt,
        maxRetries: MAX_GEMINI_RETRIES,
        delay: backoff + jitter,
      });
      await sleep(backoff + jitter);
    }
  }

  throw lastError ?? new Error("Gemini retry failed");
}

type GeminiFailure = {
  error: unknown;
  modelName?: string;
};

function unwrapFailure(input: GeminiFailure | unknown) {
  if (
    input &&
    typeof input === "object" &&
    "error" in input &&
    Object.prototype.hasOwnProperty.call(input, "error")
  ) {
    const failure = input as GeminiFailure;
    return { error: failure.error, modelName: failure.modelName };
  }
  return { error: input, modelName: undefined };
}

function handleGeminiError(failure: GeminiFailure | unknown): never {
  const { error, modelName } = unwrapFailure(failure);

  if (error instanceof ApiError) {
    throw error;
  }

  if (error instanceof GoogleGenerativeAIFetchError) {
    const attempts =
      (error as GoogleGenerativeAIFetchError & { cntAiAttempts?: number })
        .cntAiAttempts ?? 1;
    const suffix = modelName ? ` (model: ${modelName})` : "";

    if (error.status === 503) {
      throw new ApiError(
        503,
        attempts > 1
          ? `Gemini is temporarily overloaded after ${attempts} attempts. Please try again shortly.${suffix}`
          : `Gemini is temporarily overloaded. Please try again in a few seconds.${suffix}`,
      );
    }

    if (error.status === 429) {
      throw new ApiError(
        429,
        attempts > 1
          ? `Gemini rate limit reached after ${attempts} attempts. Wait a moment before retrying.${suffix}`
          : `Gemini rate limit reached. Wait a moment before retrying.${suffix}`,
      );
    }

    if (error.status === 404) {
      throw new ApiError(
        502,
        modelName
          ? `Gemini model "${modelName}" is unavailable to this API key. Update CNT_AI_GEMINI_MODEL / CNT_AI_FALLBACK_MODELS or pick another channel.`
          : "Gemini could not find the requested model. Verify CNT_AI_GEMINI_MODEL.",
      );
    }

    const status =
      typeof error.status === "number" &&
      error.status >= 400 &&
      error.status < 500
        ? 400
        : 502;
    throw new ApiError(
      status,
      error.statusText
        ? `Gemini request failed (${error.statusText}).${suffix}`
        : `Gemini request failed.${suffix}`,
    );
  }

  const message =
    error instanceof Error ? error.message : "Unexpected Gemini error";
  throw new ApiError(502, "Gemini request failed", message);
}

export async function generateCntAiReply(
  input: GenerateCntAiReplyInput,
): Promise<GenerateCntAiReplyResult> {
  if (input.mode === "rewrite" && !input.previousDraft?.trim()) {
    throw new ApiError(
      400,
      "Previous draft is required when requesting a rewrite.",
    );
  }

  const prompt = buildPrompt(input);
  const modelCandidates = getModelPreferenceList();
  let lastError: GeminiFailure | null = null;

  for (let index = 0; index < modelCandidates.length; index++) {
    const modelName = modelCandidates[index]!;
    const model = getGeminiModel(modelName);

    try {
      const result = await executeWithRetry(() =>
        model.generateContent({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig,
        }),
      );

      const response = result.response;
      let reply = extractReply(response);

      if (!reply) {
        const blockReason = response.promptFeedback?.blockReason;
        if (blockReason) {
          throw new ApiError(
            422,
            `Gemini blocked the request (${blockReason.toLowerCase()}). Please edit the message and try again.`,
          );
        }

        const candidate = response.candidates?.[0];
        console.error("[CNT AI] Gemini returned no text", {
          finishReason: candidate?.finishReason,
          promptFeedback: response.promptFeedback,
          safetyRatings: candidate?.safetyRatings,
          maxOutputTokens: MAX_OUTPUT_TOKENS,
        });

        throw new ApiError(
          502,
          candidate?.finishReason === "MAX_TOKENS"
            ? "Gemini hit its token limit while drafting the reply. Try again with a shorter inbound message or increase CNT_AI_MAX_OUTPUT_TOKENS."
            : "CNT AI did not return a reply. Please try again in a few seconds.",
        );
      }

      if (input.channel === "sms" && reply.length > SMS_MAX_CHAR_COUNT) {
        console.warn("[CNT AI] Trimming SMS reply to fit character limit", {
          originalLength: reply.length,
          limit: SMS_MAX_CHAR_COUNT,
          model: modelName,
        });
        reply = enforceSmsLength(reply);
      }

      const usageMetadata = response.usageMetadata;
      const candidate = response.candidates?.[0];

      return {
        reply,
        provider: GEMINI_PROVIDER,
        model: modelName,
        finishReason: candidate?.finishReason ?? null,
        usage: usageMetadata
          ? {
              totalTokens: usageMetadata.totalTokenCount ?? null,
              promptTokens: usageMetadata.promptTokenCount ?? null,
              completionTokens: usageMetadata.candidatesTokenCount ?? null,
            }
          : undefined,
      };
    } catch (error) {
      lastError = { error, modelName };
      const hasFallback = index < modelCandidates.length - 1;
      if (hasFallback && isRetryableGeminiError(error)) {
        console.warn("[CNT AI] Switching Gemini model after failure", {
          failedModel: modelName,
          status: error.status,
          statusText: error.statusText,
          nextModel: modelCandidates[index + 1],
        });
        continue;
      }

      handleGeminiError({ error, modelName });
    }
  }

  handleGeminiError(lastError ?? { error: new Error("Gemini request failed") });
}
