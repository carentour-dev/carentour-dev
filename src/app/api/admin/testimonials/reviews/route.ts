import { NextRequest } from "next/server";
import { adminRoute } from "@/server/utils/adminRoute";
import { jsonResponse } from "@/server/utils/http";
import { testimonialReviews } from "@/server/modules/testimonials/reviews";

const TESTIMONIALS_PERMISSIONS = {
  allPermissions: ["operations.shared", "operations.testimonials"],
} as const;

export const GET = adminRoute(async () => {
  const reviews = await testimonialReviews.list();
  return jsonResponse(reviews);
}, TESTIMONIALS_PERMISSIONS);

export const POST = adminRoute(async (req: NextRequest) => {
  const body = await req.json();
  const review = await testimonialReviews.create(body);
  return jsonResponse(review, 201);
}, TESTIMONIALS_PERMISSIONS);
