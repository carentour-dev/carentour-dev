import { NextRequest } from "next/server";
import { jsonResponse, handleRouteError } from "@/server/utils/http";
import {
  consultationBookingTypeValues,
  consultationSlotController,
} from "@/server/modules/consultationSlots/module";

const isValidBookingType = (value: string | null) =>
  Boolean(
    value &&
      consultationBookingTypeValues.includes(
        value as (typeof consultationBookingTypeValues)[number],
      ),
  );

export async function GET(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams;
    const bookingType = params.get("bookingType");
    const filters: {
      doctorId?: string;
      bookingType?: (typeof consultationBookingTypeValues)[number];
      from?: string;
      to?: string;
      availableOnly: true;
    } = {
      availableOnly: true,
    };

    const doctorId = params.get("doctorId");
    const from = params.get("from");
    const to = params.get("to");

    if (doctorId?.trim()) filters.doctorId = doctorId.trim();
    if (isValidBookingType(bookingType)) {
      filters.bookingType =
        bookingType as (typeof consultationBookingTypeValues)[number];
    }
    if (from?.trim()) filters.from = from.trim();
    if (to?.trim()) filters.to = to.trim();

    const slots = await consultationSlotController.list(filters, {
      publicOnly: true,
    });
    return jsonResponse(slots);
  } catch (error) {
    return handleRouteError(error);
  }
}
