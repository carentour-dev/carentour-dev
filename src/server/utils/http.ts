import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { ApiError } from "@/server/utils/errors";

export function jsonResponse<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

export function handleRouteError(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: error.message, details: error.details ?? null },
      { status: error.status },
    );
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: "Validation failed", details: error.flatten() },
      { status: 422 },
    );
  }

  console.error(error);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
