import { NextRequest } from "next/server";
import { adminRoute } from "@/server/utils/adminRoute";
import { jsonResponse } from "@/server/utils/http";
import { patientStories } from "@/server/modules/testimonials/stories";

export const GET = adminRoute(async () => {
  const stories = await patientStories.list();
  return jsonResponse(stories);
});

export const POST = adminRoute(async (req: NextRequest) => {
  const body = await req.json();
  const story = await patientStories.create(body);
  return jsonResponse(story, 201);
});
