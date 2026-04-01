import type { Metadata } from "next";
import type { ReactNode } from "react";
import { defaultPublicLocale } from "@/i18n/routing";

type RouteParams = Record<string, string>;

type RouteProps = {
  params: Promise<RouteParams>;
};

type DefaultLocaleRouteModule = {
  default: (props: RouteProps) => Promise<ReactNode> | ReactNode;
  generateMetadata?: (props: RouteProps) => Promise<Metadata> | Metadata;
  revalidate?: number | false;
};

function withDefaultLocaleParams(params: RouteParams): Promise<RouteParams> {
  return Promise.resolve({
    locale: defaultPublicLocale,
    ...params,
  });
}

export function buildDefaultLocaleRoute(routeModule: DefaultLocaleRouteModule) {
  async function generateMetadata({ params }: RouteProps): Promise<Metadata> {
    const resolvedParams = await params;

    if (typeof routeModule.generateMetadata !== "function") {
      return {};
    }

    return routeModule.generateMetadata({
      params: withDefaultLocaleParams(resolvedParams),
    });
  }

  async function Page({ params }: RouteProps) {
    const resolvedParams = await params;

    return routeModule.default({
      params: withDefaultLocaleParams(resolvedParams),
    });
  }

  return {
    generateMetadata,
    Page,
    revalidate: routeModule.revalidate,
  };
}
