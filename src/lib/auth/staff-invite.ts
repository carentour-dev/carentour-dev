const STAFF_INVITE_FLOW_TYPES = new Set(["invite", "magiclink"]);

export type StaffInviteAuthParams = {
  accessToken: string | null;
  refreshToken: string | null;
  code: string | null;
  flowType: string | null;
  errorCode: string | null;
  errorDescription: string | null;
};

function parseUrlParamsSegment(segment: string): URLSearchParams | null {
  const normalizedSegment = segment.startsWith("#")
    ? segment.slice(1)
    : segment.startsWith("?")
      ? segment.slice(1)
      : segment;

  if (!normalizedSegment) {
    return null;
  }

  return new URLSearchParams(normalizedSegment);
}

export function parseStaffInviteHref(href: string): StaffInviteAuthParams {
  let currentUrl: URL;

  try {
    currentUrl = new URL(href);
  } catch {
    return {
      accessToken: null,
      refreshToken: null,
      code: null,
      flowType: null,
      errorCode: null,
      errorDescription: null,
    };
  }

  const searchParams = currentUrl.searchParams;
  const hashParams = parseUrlParamsSegment(currentUrl.hash);

  return {
    accessToken:
      hashParams?.get("access_token") ?? searchParams.get("access_token"),
    refreshToken:
      hashParams?.get("refresh_token") ?? searchParams.get("refresh_token"),
    code: searchParams.get("code") ?? hashParams?.get("code") ?? null,
    flowType: searchParams.get("type") ?? hashParams?.get("type") ?? null,
    errorCode: searchParams.get("error_code") ?? hashParams?.get("error_code"),
    errorDescription:
      searchParams.get("error_description") ??
      hashParams?.get("error_description") ??
      searchParams.get("error") ??
      hashParams?.get("error") ??
      null,
  };
}

export function hasStaffInviteLoginInformation(
  params: StaffInviteAuthParams,
): boolean {
  return Boolean(params.code || (params.accessToken && params.refreshToken));
}

export function hasCompleteStaffInviteSessionTokens(
  params: StaffInviteAuthParams,
): boolean {
  return Boolean(params.accessToken && params.refreshToken);
}

export function isAllowedStaffInviteFlowType(
  flowType: string | null | undefined,
): boolean {
  return !flowType || STAFF_INVITE_FLOW_TYPES.has(flowType);
}
