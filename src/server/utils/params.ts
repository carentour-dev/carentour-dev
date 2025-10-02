export function getRouteParam(
  params: Record<string, string | string[]> | undefined,
  key: string,
) {
  const value = params?.[key];
  return Array.isArray(value) ? value[0] : value;
}
