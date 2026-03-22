export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import {
  fetchPenpenMasters,
  fetchPenpenScheduleEntries,
} from "../../../lib/penpenData";
import { getErrorMessage, requirePenpenAdminSession } from "../_shared";

export async function GET(request: NextRequest) {
  const unauthorized = requirePenpenAdminSession(request);
  if (unauthorized) {
    return unauthorized;
  }

  try {
    const supabase = createServiceClient();
    const [entries, masters] = await Promise.all([
      fetchPenpenScheduleEntries(supabase),
      fetchPenpenMasters(supabase),
    ]);

    return NextResponse.json({
      ok: true,
      entries,
      masters,
    });
  } catch (error) {
    console.error("[penpen admin dashboard]", error);
    return NextResponse.json(
      { message: getErrorMessage(error) },
      { status: 500 },
    );
  }
}
