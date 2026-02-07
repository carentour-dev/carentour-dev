export const isPasswordRecoveryHref = (href: string): boolean => {
  let currentUrl: URL;

  try {
    currentUrl = new URL(href);
  } catch {
    return false;
  }

  if (currentUrl.searchParams.get("reset") === "true") {
    return true;
  }

  if (currentUrl.searchParams.get("type") === "recovery") {
    return true;
  }

  const hash = currentUrl.hash.startsWith("#")
    ? currentUrl.hash.slice(1)
    : currentUrl.hash;

  if (!hash) {
    return false;
  }

  return new URLSearchParams(hash).get("type") === "recovery";
};

export const isPasswordRecoveryCurrentUrl = (): boolean => {
  if (typeof window === "undefined") {
    return false;
  }

  return isPasswordRecoveryHref(window.location.href);
};
