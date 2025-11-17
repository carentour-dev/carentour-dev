import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { BlockRenderer } from "@/components/cms/BlockRenderer";
import { getPublishedPageBySlug } from "@/lib/cms/server";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const cmsPage = await getPublishedPageBySlug(slug);
  if (!cmsPage) {
    return {};
  }

  return {
    title: cmsPage.seo?.title ?? `${cmsPage.title} | Care N Tour`,
    description: cmsPage.seo?.description ?? undefined,
    openGraph: cmsPage.seo?.ogImage
      ? { images: [cmsPage.seo.ogImage] }
      : undefined,
  } as any;
}

export default async function GenericCmsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const cmsPage = await getPublishedPageBySlug(slug);

  if (!cmsPage || !cmsPage.content?.length) {
    return notFound();
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <BlockRenderer blocks={cmsPage.content} />
      </main>
      <Footer />
    </div>
  );
}
