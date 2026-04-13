import * as RouteModule from "@/app/(public)/[locale]/blog/author/[slug]/page";
import { buildDefaultLocaleRoute } from "@/app/default-locale-public";
import { BLOG_SURFACE_REVALIDATE_SECONDS } from "@/lib/blog/revalidation";

const route = buildDefaultLocaleRoute(RouteModule);

export const revalidate = BLOG_SURFACE_REVALIDATE_SECONDS;
export const generateMetadata = route.generateMetadata;
export default route.Page;
