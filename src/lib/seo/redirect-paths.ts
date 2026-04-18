import {
  localizePublicPathname,
  stripPublicLocalePrefix,
} from "../public/routing";
import { isInternalNoindexPath, normalizePath } from "./utils";

export function getRedirectLookupPathCandidates(pathname: string): string[] {
  const normalized = normalizePath(pathname);
  const stripped = stripPublicLocalePrefix(normalized);

  return normalized === stripped ? [normalized] : [normalized, stripped];
}

export function getLocalizedRedirectTargetPath(
  requestPathname: string,
  targetPath: string,
): string {
  const normalizedRequestPath = normalizePath(requestPathname);
  const normalizedTargetPath = normalizePath(targetPath);
  const isArabicRequest =
    normalizedRequestPath === "/ar" || normalizedRequestPath.startsWith("/ar/");

  if (!isArabicRequest || isInternalNoindexPath(normalizedTargetPath)) {
    return normalizedTargetPath;
  }

  return localizePublicPathname(normalizedTargetPath, "ar");
}
