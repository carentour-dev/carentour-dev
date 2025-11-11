import { randomUUID } from "crypto";

import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  GoogleAIFileManager,
  FileState,
  type FileMetadataResponse,
} from "@google/generative-ai/server";

import type { AuthorizationContext } from "@/server/auth/requireAdmin";
import { getSupabaseAdmin } from "@/server/supabase/adminClient";
import { ApiError } from "@/server/utils/errors";

const CNT_AI_PROVIDER = (process.env.CNT_AI_PROVIDER ?? "gemini").toLowerCase();
const GEMINI_PROVIDER = "gemini";
const KNOWLEDGE_BUCKET =
  process.env.CNT_AI_KNOWLEDGE_BUCKET?.trim() || "operations-cnt-ai";
const MANIFEST_PREFIX =
  process.env.CNT_AI_KNOWLEDGE_MANIFEST_PREFIX?.trim() || "manifests";
const STORAGE_PREFIX_RAW = process.env.CNT_AI_KNOWLEDGE_STORAGE_PREFIX?.trim();
const MAX_FILE_SIZE_BYTES_RAW = Number(process.env.CNT_AI_MAX_FILE_SIZE_BYTES);
const MAX_FILES_PER_USER_RAW = Number(process.env.CNT_AI_MAX_FILES_PER_USER);
const KNOWLEDGE_MODEL =
  process.env.CNT_AI_KNOWLEDGE_MODEL?.trim() ||
  process.env.CNT_AI_GEMINI_MODEL?.trim() ||
  "gemini-1.5-pro";
const KNOWLEDGE_TEMPERATURE = Number(
  process.env.CNT_AI_KNOWLEDGE_TEMPERATURE ?? "0.2",
);
const KNOWLEDGE_MAX_OUTPUT_TOKENS =
  Number(process.env.CNT_AI_KNOWLEDGE_MAX_OUTPUT_TOKENS ?? "768") || 768;

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/csv",
  "text/markdown",
  "application/json",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

type StoredKnowledgeEntry = {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
  storagePath: string;
  geminiFileId: string;
  geminiDisplayName?: string | null;
  geminiUri: string;
  geminiState: FileState;
  geminiExpiresAt?: string | null;
};

type ManifestPayload = {
  files: StoredKnowledgeEntry[];
  updatedAt: string;
};

const manifestCache = new Map<string, ManifestPayload>();

export type CntAiKnowledgeFile = {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
  state: FileState;
  expiresAt?: string | null;
};

export type AnswerKnowledgeQuestionInput = {
  auth?: AuthorizationContext;
  question: string;
  fileIds: string[];
};

export type AnswerKnowledgeQuestionResult = {
  answer: string;
  model: string;
  referencedFileIds: string[];
  usage?: {
    totalTokens?: number | null;
    promptTokens?: number | null;
    completionTokens?: number | null;
  };
};

let geminiClient: GoogleGenerativeAI | null = null;
let geminiFileManager: GoogleAIFileManager | null = null;

const supabaseAdmin = getSupabaseAdmin();

const sleep = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

function assertKnowledgeEnabled() {
  if (CNT_AI_PROVIDER !== GEMINI_PROVIDER) {
    throw new ApiError(
      503,
      "CNT AI knowledge base is not configured for this environment.",
    );
  }

  if (!process.env.CNT_AI_GEMINI_KEY) {
    throw new ApiError(
      503,
      "CNT AI knowledge base requires CNT_AI_GEMINI_KEY.",
    );
  }
}

function ensureAuthContext(
  auth?: AuthorizationContext,
): AuthorizationContext & { profileId?: string | null } {
  if (!auth?.user?.id) {
    throw new ApiError(401, "Authentication required");
  }

  return auth;
}

function getGeminiClient() {
  assertKnowledgeEnabled();

  if (!geminiClient) {
    geminiClient = new GoogleGenerativeAI(process.env.CNT_AI_GEMINI_KEY!);
  }

  return geminiClient;
}

function getGeminiFileManager() {
  assertKnowledgeEnabled();

  if (!geminiFileManager) {
    geminiFileManager = new GoogleAIFileManager(process.env.CNT_AI_GEMINI_KEY!);
  }

  return geminiFileManager;
}

function sanitizeFileName(value: string) {
  const trimmed = value.split(/[/\\]/).pop()?.trim() ?? "";
  if (!trimmed) {
    return `document-${Date.now()}`;
  }
  return trimmed.replace(/[^\w.\-() ]+/g, "_");
}

function getManifestPath(userId: string) {
  return `${MANIFEST_PREFIX}/${userId}.json`;
}

function getManifestTimestamp(manifest: ManifestPayload | null | undefined) {
  if (!manifest) {
    return 0;
  }
  const timestamp = Date.parse(manifest.updatedAt ?? "");
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function resolveStoragePrefix() {
  if (STORAGE_PREFIX_RAW) {
    return STORAGE_PREFIX_RAW.replace(/\/+$/, "");
  }
  return "uploads";
}

function getStoragePath(userId: string, fileName: string) {
  const prefix = resolveStoragePrefix();
  return `${prefix}/${userId}/${randomUUID()}/${fileName}`;
}

const isStorageNotFoundError = (error: unknown) => {
  if (!error || typeof error !== "object") {
    return false;
  }

  const status = (error as { status?: number }).status;
  if (typeof status === "number" && status === 404) {
    return true;
  }

  const statusCode = (error as { statusCode?: string | number }).statusCode;
  if (
    (typeof statusCode === "number" || typeof statusCode === "string") &&
    Number(statusCode) === 404
  ) {
    return true;
  }

  const message = (error as { message?: string }).message;
  if (
    typeof message === "string" &&
    message.toLowerCase().includes("not found")
  ) {
    return true;
  }

  const nestedError = (error as { error?: string }).error;
  if (
    typeof nestedError === "string" &&
    nestedError.toLowerCase().includes("not found")
  ) {
    return true;
  }

  return false;
};

const isGeminiFileMissingError = (error: unknown) => {
  if (!error || typeof error !== "object") {
    return false;
  }

  const status = (error as { status?: number }).status;
  if (typeof status === "number" && (status === 403 || status === 404)) {
    return true;
  }

  const message = (error as { message?: string }).message;
  if (typeof message === "string") {
    const normalized = message.toLowerCase();
    if (
      normalized.includes("does not exist") ||
      normalized.includes("permission") ||
      normalized.includes("not found")
    ) {
      return true;
    }
  }

  return false;
};

async function readManifest(userId: string): Promise<ManifestPayload> {
  const path = getManifestPath(userId);
  const { data, error } = await supabaseAdmin.storage
    .from(KNOWLEDGE_BUCKET)
    .download(path);

  if (error) {
    if (!isStorageNotFoundError(error)) {
      console.warn("[CNT AI][knowledge] manifest download error", {
        bucket: KNOWLEDGE_BUCKET,
        path,
        error,
      });
    }
    const cached = manifestCache.get(userId);
    if (cached && cached.files.length) {
      console.warn(
        "[CNT AI][knowledge] Falling back to cached manifest after download error",
        {
          userId,
          cachedAt: cached.updatedAt,
        },
      );
      return cached;
    }
    if (isStorageNotFoundError(error)) {
      manifestCache.delete(userId);
    }
    return { files: [], updatedAt: new Date(0).toISOString() };
  }

  try {
    const text = await data.text();
    const manifest = JSON.parse(text) as ManifestPayload;
    const cached = manifestCache.get(userId);
    if (cached) {
      const incomingTs = getManifestTimestamp(manifest);
      const cachedTs = getManifestTimestamp(cached);
      if (incomingTs && cachedTs && incomingTs < cachedTs) {
        console.warn("[CNT AI][knowledge] Ignoring stale manifest snapshot", {
          userId,
          incomingUpdatedAt: manifest.updatedAt,
          cachedUpdatedAt: cached.updatedAt,
        });
        return cached;
      }
    }
    manifestCache.set(userId, manifest);
    return manifest;
  } catch (parseError) {
    console.error("[CNT AI][knowledge] Could not parse manifest", parseError);
    const cached = manifestCache.get(userId);
    if (cached) {
      return cached;
    }
    return { files: [], updatedAt: new Date(0).toISOString() };
  }
}

async function writeManifest(userId: string, manifest: ManifestPayload) {
  const path = getManifestPath(userId);
  const manifestWithTimestamp: ManifestPayload = {
    ...manifest,
    updatedAt: new Date().toISOString(),
  };
  const payload = JSON.stringify(manifestWithTimestamp, null, 2);

  const { error } = await supabaseAdmin.storage
    .from(KNOWLEDGE_BUCKET)
    .upload(path, Buffer.from(payload, "utf-8"), {
      contentType: "application/json",
      upsert: true,
      cacheControl: "1",
    });

  if (error) {
    throw new ApiError(
      500,
      "Failed to persist CNT AI knowledge manifest",
      error.message,
    );
  }

  manifestCache.set(userId, manifestWithTimestamp);
}

function toPublicFile(entry: StoredKnowledgeEntry): CntAiKnowledgeFile {
  return {
    id: entry.id,
    name: entry.name,
    mimeType: entry.mimeType,
    size: entry.size,
    uploadedAt: entry.uploadedAt,
    state: entry.geminiState,
    expiresAt: entry.geminiExpiresAt ?? null,
  };
}

async function uploadToSupabaseStorage(
  storagePath: string,
  buffer: Buffer,
  mimeType: string,
) {
  const { error } = await supabaseAdmin.storage
    .from(KNOWLEDGE_BUCKET)
    .upload(storagePath, buffer, {
      contentType: mimeType || "application/octet-stream",
      upsert: false,
      cacheControl: "3600",
    });

  if (error) {
    throw new ApiError(
      500,
      "Failed to upload file to CNT AI knowledge storage",
      error.message,
    );
  }
}

async function removeFromSupabaseStorage(paths: string[]) {
  if (!paths.length) {
    return;
  }

  const { error } = await supabaseAdmin.storage
    .from(KNOWLEDGE_BUCKET)
    .remove(paths);

  if (error) {
    console.warn("[CNT AI][knowledge] Failed to remove storage objects", {
      paths,
      error,
    });
  }
}

async function getGeminiFileMetadata(fileId: string) {
  const manager = getGeminiFileManager();
  return manager.getFile(fileId);
}

async function pollGeminiFile(
  fileId: string,
  {
    maxAttempts = 5,
    delayMs = 600,
  }: { maxAttempts?: number; delayMs?: number },
) {
  let attempt = 0;
  let metadata: FileMetadataResponse | null = null;

  while (attempt < maxAttempts) {
    attempt += 1;
    metadata = await getGeminiFileMetadata(fileId);

    if (metadata.state === FileState.ACTIVE) {
      return metadata;
    }

    if (metadata.state === FileState.FAILED) {
      const message =
        metadata.error?.message ?? "Gemini could not process file";
      throw new ApiError(422, message);
    }

    await sleep(delayMs);
  }

  return metadata!;
}

export async function listKnowledgeFiles(
  auth?: AuthorizationContext,
): Promise<CntAiKnowledgeFile[]> {
  const context = ensureAuthContext(auth);
  const manifest = await readManifest(context.user.id);

  if (!manifest.files.length) {
    return [];
  }

  const manager = getGeminiFileManager();
  let hasChanges = false;
  const refreshed = (
    await Promise.all(
      manifest.files.map(async (entry) => {
        try {
          const metadata = await manager.getFile(entry.geminiFileId);
          if (
            metadata.state !== entry.geminiState ||
            metadata.expirationTime !== entry.geminiExpiresAt ||
            metadata.uri !== entry.geminiUri
          ) {
            hasChanges = true;
            return {
              ...entry,
              geminiState: metadata.state,
              geminiUri: metadata.uri,
              geminiDisplayName:
                metadata.displayName ?? entry.geminiDisplayName,
              geminiExpiresAt: metadata.expirationTime ?? entry.geminiExpiresAt,
            };
          }
          return entry;
        } catch (error) {
          if (isGeminiFileMissingError(error)) {
            console.warn(
              "[CNT AI][knowledge] Gemini metadata temporarily unavailable",
              {
                fileId: entry.geminiFileId,
                error,
              },
            );
            hasChanges = true;
            return null;
          }
          console.warn(
            "[CNT AI][knowledge] Failed to refresh Gemini metadata",
            {
              fileId: entry.geminiFileId,
              error,
            },
          );
          return entry;
        }
      }),
    )
  ).filter((entry): entry is StoredKnowledgeEntry => Boolean(entry));

  if (hasChanges) {
    await writeManifest(context.user.id, {
      files: refreshed,
      updatedAt: new Date().toISOString(),
    });
  }

  return refreshed.map(toPublicFile);
}

export async function uploadKnowledgeFile(params: {
  auth?: AuthorizationContext;
  file: File;
}): Promise<CntAiKnowledgeFile> {
  const context = ensureAuthContext(params.auth);

  const manifest = await readManifest(context.user.id);
  const maxFilesPerUser =
    Number.isFinite(MAX_FILES_PER_USER_RAW) && MAX_FILES_PER_USER_RAW
      ? Math.max(1, MAX_FILES_PER_USER_RAW)
      : 6;
  if (manifest.files.length >= maxFilesPerUser) {
    throw new ApiError(
      400,
      `You can only store up to ${maxFilesPerUser} documents at a time. Remove one before uploading another.`,
    );
  }

  if (!(params.file instanceof File)) {
    throw new ApiError(400, "File payload is missing");
  }

  const arrayBuffer = await params.file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (buffer.byteLength === 0) {
    throw new ApiError(400, "Uploaded file is empty");
  }

  const maxFileSize =
    Number.isFinite(MAX_FILE_SIZE_BYTES_RAW) && MAX_FILE_SIZE_BYTES_RAW
      ? Math.max(1024, MAX_FILE_SIZE_BYTES_RAW)
      : 10 * 1024 * 1024;
  if (buffer.byteLength > maxFileSize) {
    throw new ApiError(
      400,
      `File exceeds ${(maxFileSize / (1024 * 1024)).toFixed(0)}MB limit.`,
    );
  }

  const mimeType = params.file.type || "application/octet-stream";

  if (ALLOWED_MIME_TYPES.size && !ALLOWED_MIME_TYPES.has(mimeType)) {
    throw new ApiError(
      400,
      "Unsupported file type. Upload PDF, DOC/DOCX, TXT, CSV, or JSON files.",
    );
  }

  const fileName = sanitizeFileName(params.file.name || "document");
  const storagePath = getStoragePath(context.user.id, fileName);

  await uploadToSupabaseStorage(storagePath, buffer, mimeType);

  let metadata: FileMetadataResponse;
  try {
    const manager = getGeminiFileManager();
    const uploadResponse = await manager.uploadFile(buffer, {
      displayName: fileName,
      mimeType,
    });
    metadata = await pollGeminiFile(uploadResponse.file.name, {
      maxAttempts: 5,
      delayMs: 800,
    });
  } catch (error) {
    await removeFromSupabaseStorage([storagePath]);
    const message =
      error instanceof ApiError ? error.message : "Gemini upload failed";
    throw new ApiError(502, message);
  }

  const entry: StoredKnowledgeEntry = {
    id: randomUUID(),
    name: fileName,
    mimeType,
    size: buffer.byteLength,
    uploadedAt: new Date().toISOString(),
    storagePath,
    geminiFileId: metadata.name,
    geminiDisplayName: metadata.displayName ?? fileName,
    geminiUri: metadata.uri,
    geminiState: metadata.state,
    geminiExpiresAt: metadata.expirationTime,
  };

  const nextManifest: ManifestPayload = {
    files: [entry, ...manifest.files],
    updatedAt: new Date().toISOString(),
  };

  await writeManifest(context.user.id, nextManifest);
  return toPublicFile(entry);
}

export async function deleteKnowledgeFile(params: {
  auth?: AuthorizationContext;
  fileId: string;
}): Promise<void> {
  const context = ensureAuthContext(params.auth);
  const manifest = await readManifest(context.user.id);
  const remaining: StoredKnowledgeEntry[] = [];
  let removed: StoredKnowledgeEntry | null = null;

  for (const entry of manifest.files) {
    if (entry.id === params.fileId) {
      removed = entry;
      continue;
    }
    remaining.push(entry);
  }

  if (!removed) {
    throw new ApiError(404, "Document not found");
  }

  await writeManifest(context.user.id, {
    files: remaining,
    updatedAt: new Date().toISOString(),
  });

  await removeFromSupabaseStorage([removed.storagePath]);

  if (removed.geminiFileId) {
    try {
      await getGeminiFileManager().deleteFile(removed.geminiFileId);
    } catch (error) {
      console.warn("[CNT AI][knowledge] Failed to delete Gemini file", {
        fileId: removed.geminiFileId,
        error,
      });
    }
  }
}

export async function answerKnowledgeQuestion(
  params: AnswerKnowledgeQuestionInput,
): Promise<AnswerKnowledgeQuestionResult> {
  const context = ensureAuthContext(params.auth);

  if (!params.question.trim()) {
    throw new ApiError(400, "Question is required");
  }

  if (!params.fileIds.length) {
    throw new ApiError(400, "Select at least one document");
  }

  const manifest = await readManifest(context.user.id);
  const selectedEntries = manifest.files.filter((entry) =>
    params.fileIds.includes(entry.id),
  );

  if (!selectedEntries.length) {
    throw new ApiError(404, "No matching documents found");
  }

  const manager = getGeminiFileManager();
  const resolvedEntries = await Promise.all(
    selectedEntries.map(async (entry) => {
      try {
        const metadata = await manager.getFile(entry.geminiFileId);
        return { entry, metadata };
      } catch (error) {
        if (isGeminiFileMissingError(error)) {
          throw new ApiError(
            410,
            `${entry.name} is no longer available. Please re-upload the document and try again.`,
          );
        }
        console.error("[CNT AI][knowledge] Failed to load Gemini file", {
          fileId: entry.geminiFileId,
          error,
        });
        throw new ApiError(
          502,
          `Could not load ${entry.name}. Please try again later.`,
        );
      }
    }),
  );

  const inactive = resolvedEntries.filter(
    ({ metadata }) => metadata.state !== FileState.ACTIVE,
  );

  if (inactive.length) {
    throw new ApiError(
      400,
      "One or more selected files are still processing. Try again in a few seconds.",
    );
  }

  const fileParts = resolvedEntries.map(({ entry, metadata }) => {
    const fileUri = metadata.uri ?? entry.geminiUri;
    if (!fileUri) {
      throw new ApiError(
        502,
        `CNT AI could not resolve ${entry.name}. Please re-upload the document.`,
      );
    }

    return {
      fileData: {
        mimeType: metadata.mimeType ?? entry.mimeType,
        fileUri,
      },
    };
  });

  const client = getGeminiClient();
  const model = client.getGenerativeModel({
    model: KNOWLEDGE_MODEL,
    generationConfig: {
      maxOutputTokens: KNOWLEDGE_MAX_OUTPUT_TOKENS,
      temperature: KNOWLEDGE_TEMPERATURE,
    },
  });

  const result = await model.generateContent({
    contents: [
      {
        role: "user",
        parts: [
          {
            text: [
              "You are CNT AI, helping operations coordinators answer questions about patient-facing documents.",
              "Answer the question using ONLY the provided files.",
              "If the answer is not in the documents, clearly state that you cannot find it.",
              "",
              `Question: ${params.question.trim()}`,
            ].join("\n"),
          },
          ...fileParts,
        ],
      },
    ],
  });

  const responseText = result.response.text()?.trim();

  if (!responseText) {
    throw new ApiError(
      502,
      "CNT AI did not return an answer. Please try again in a few seconds.",
    );
  }

  const usage = result.response.usageMetadata;

  return {
    answer: responseText,
    model: KNOWLEDGE_MODEL,
    referencedFileIds: selectedEntries.map((entry) => entry.id),
    usage: usage
      ? {
          totalTokens: usage.totalTokenCount ?? null,
          promptTokens: usage.promptTokenCount ?? null,
          completionTokens: usage.candidatesTokenCount ?? null,
        }
      : undefined,
  };
}
