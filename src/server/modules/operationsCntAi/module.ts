import {
  GoogleGenerativeAI,
  type GenerateContentResult,
} from "@google/generative-ai";

import { ApiError } from "@/server/utils/errors";

export type GenerateCntAiReplyInput = {
  message: string;
  tone?: string | null;
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

const generationConfig = {
  temperature: Number(process.env.CNT_AI_TEMPERATURE ?? "0.6"),
  topP: Number(process.env.CNT_AI_TOP_P ?? "0.9"),
  topK: Number(process.env.CNT_AI_TOP_K ?? "40"),
  maxOutputTokens: MAX_OUTPUT_TOKENS,
};

let geminiClient: GoogleGenerativeAI | null = null;
let cachedModelName: string | null = null;
let cachedGeminiModel: ReturnType<
  GoogleGenerativeAI["getGenerativeModel"]
> | null = null;

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

function getGeminiModel() {
  assertProviderConfigured();

  const modelName = process.env.CNT_AI_GEMINI_MODEL ?? DEFAULT_MODEL;

  if (
    geminiClient === null ||
    cachedGeminiModel === null ||
    cachedModelName !== modelName
  ) {
    geminiClient = new GoogleGenerativeAI(process.env.CNT_AI_GEMINI_KEY!);
    cachedGeminiModel = geminiClient.getGenerativeModel({ model: modelName });
    cachedModelName = modelName;
  }

  return { model: cachedGeminiModel, modelName };
}

function buildPrompt(input: GenerateCntAiReplyInput) {
  const tone = input.tone?.trim().toLowerCase() || "professional";
  const normalizedMessage = input.message.trim();

  return [
    "You are CNT AI, an assistant supporting Care N Tour's operations coordinators.",
    "Your job is to draft clear, empathetic replies to prospective patients.",
    `Tone: ${tone}.`,
    "Guidelines:",
    "- Keep the reply concise (3–6 sentences) but helpful.",
    "- Reflect Care N Tour's hospitality and professionalism.",
    "- If information is missing, ask targeted follow-up questions.",
    "- Never hallucinate medical details or pricing.",
    "",
    "Original message:",
    `"""`,
    normalizedMessage,
    `"""`,
    "",
    "Draft the reply they could send verbatim, ready for email or WhatsApp.",
  ].join("\n");
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

export async function generateCntAiReply(
  input: GenerateCntAiReplyInput,
): Promise<GenerateCntAiReplyResult> {
  const { model, modelName } = getGeminiModel();
  const prompt = buildPrompt(input);

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig,
    });

    const response = result.response;
    const reply = extractReply(response);

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
    if (error instanceof ApiError) {
      throw error;
    }

    const message =
      error instanceof Error ? error.message : "Unexpected Gemini error";
    throw new ApiError(502, "Gemini request failed", message);
  }
}
