type GridImageLoadingOptions = {
  eagerCount?: number;
};

type HeroImageLoading = "eager";

export function shouldEagerLoadGridImage(
  index: number,
  options: GridImageLoadingOptions = {},
) {
  const eagerCount = options.eagerCount ?? 3;
  return index >= 0 && index < eagerCount;
}

export function resolveGridImageLoading(
  index: number,
  options: GridImageLoadingOptions = {},
): "eager" | "lazy" {
  return shouldEagerLoadGridImage(index, options) ? "eager" : "lazy";
}

export function resolveHeroImageLoading(): HeroImageLoading {
  return "eager";
}
