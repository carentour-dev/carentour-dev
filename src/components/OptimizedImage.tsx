import NextImage, { type ImageProps } from "next/image";
import { getOptimizedImageProps } from "@/lib/supabase/imageOptimization";

export default function OptimizedImage({ src, ...props }: ImageProps) {
  const optimizationProps =
    typeof src === "string" ? getOptimizedImageProps(src) : {};

  return <NextImage src={src} {...optimizationProps} {...props} />;
}
