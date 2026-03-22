export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import {
  fetchPenpenMasters,
  fetchPenpenScheduleEntries,
} from "../../lib/penpenData";
import {
  fetchPenpenHeaderImageUrl,
  resolvePenpenImageUrl,
} from "../../lib/penpenStorage";

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }

  if (error && typeof error === "object") {
    const maybeMessage = (error as { message?: unknown }).message;
    if (typeof maybeMessage === "string" && maybeMessage.trim()) {
      return maybeMessage.trim();
    }
  }

  return "unknown";
};

export async function GET() {
  try {
    const supabase = createServiceClient();
    const penpen = supabase.schema("penpen");
    const currentYear = new Date().getFullYear();

    const [
      masters,
      entries,
      tournamentsRes,
      leaguesRes,
      headerImageUrl,
      bindingsRes,
    ] = await Promise.all([
      fetchPenpenMasters(supabase),
      fetchPenpenScheduleEntries(supabase),
      penpen
        .from("tournaments")
        .select("id, league_id, image_path")
        .order("sort_order", { ascending: true }),
      penpen.from("leagues").select("id, name"),
      fetchPenpenHeaderImageUrl(supabase),
      penpen
        .from("tournament_bindings")
        .select(
          "league_id, season_year, final_code, third_place_code, bindings, updated_at",
        )
        .eq("season_year", currentYear)
        .order("updated_at", { ascending: false }),
    ]);

    if (tournamentsRes.error) {
      throw tournamentsRes.error;
    }
    if (leaguesRes.error) {
      throw leaguesRes.error;
    }
    if (bindingsRes.error) {
      throw bindingsRes.error;
    }

    const leagueNameMap = new Map(
      (leaguesRes.data ?? []).map((row) => [row.id, row.name]),
    );

    const tournaments = (tournamentsRes.data ?? []).map((item) => ({
      id: item.id,
      leagueName: leagueNameMap.get(item.league_id) ?? "トーナメント",
      imagePath: resolvePenpenImageUrl(supabase, item.image_path),
    }));

    const tournamentBindings = (bindingsRes.data ?? []).map((item) => ({
      league_id: item.league_id,
      league_name: leagueNameMap.get(item.league_id) ?? "トーナメント",
      season_year: item.season_year,
      final_code: item.final_code,
      third_place_code: item.third_place_code,
      bindings: item.bindings,
    }));

    return NextResponse.json({
      ok: true,
      currentYear,
      masters,
      entries,
      tournaments,
      headerImageUrl,
      tournamentBindings,
    });
  } catch (error) {
    console.error("[penpen standings api]", error);
    return NextResponse.json(
      { message: getErrorMessage(error) },
      { status: 500 },
    );
  }
}
