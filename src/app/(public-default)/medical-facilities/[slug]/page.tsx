import * as RouteModule from "@/app/(public)/[locale]/medical-facilities/[slug]/page";
import { buildDefaultLocaleRoute } from "@/app/default-locale-public";

const route = buildDefaultLocaleRoute(RouteModule);

export const generateMetadata = route.generateMetadata;
export default route.Page;
