import { NextResponse } from "next/server";

import { getFaqsWithFallback } from "@/lib/faq/queries";

export const revalidate = 0;

export async function GET() {
  const result = await getFaqsWithFallback();

  return NextResponse.json({
    data: result.faqs,
    categories: result.categories,
    source: result.source,
    error: result.error,
  });
}
