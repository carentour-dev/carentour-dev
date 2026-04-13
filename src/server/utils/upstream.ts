const extractErrorText = (error: unknown) => {
  if (typeof error === "string") {
    return error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    const parts = [
      typeof record.message === "string" ? record.message : "",
      typeof record.details === "string" ? record.details : "",
      typeof record.code === "string" ? record.code : "",
      typeof record.hint === "string" ? record.hint : "",
    ].filter(Boolean);

    return parts.join(" ");
  }

  return "";
};

export function isRecoverableUpstreamFailure(error: unknown) {
  const text = extractErrorText(error).toLowerCase();

  return (
    text.includes("fetch failed") ||
    text.includes("enotfound") ||
    text.includes("failed to fetch") ||
    text.includes("getaddrinfo") ||
    text.includes("network")
  );
}
