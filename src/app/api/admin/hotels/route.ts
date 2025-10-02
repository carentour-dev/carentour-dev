import { NextRequest } from "next/server";
import { adminRoute } from "@/server/utils/adminRoute";
import { jsonResponse } from "@/server/utils/http";
import { hotelController } from "@/server/modules/hotels/module";

export const GET = adminRoute(async () => {
  const hotels = await hotelController.list();
  return jsonResponse(hotels);
});

export const POST = adminRoute(async (req: NextRequest) => {
  const body = await req.json();
  const hotel = await hotelController.create(body);
  return jsonResponse(hotel, 201);
});
