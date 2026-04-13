import * as RouteModule from "@/app/(public)/[locale]/consultation/page";
import { buildDefaultLocaleRoute } from "@/app/default-locale-public";

const route = buildDefaultLocaleRoute(RouteModule);

export const revalidate = 300;
export const generateMetadata = route.generateMetadata;
export default route.Page;
