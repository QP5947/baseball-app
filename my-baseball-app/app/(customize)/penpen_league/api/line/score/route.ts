export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

type SaveScoreRequest = {
  gameId?: string;
  homeScore?: number | null;
  awayScore?: number | null;
  canceled?: boolean;
  forfeitWinner?: "away" | "home" | null;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SaveScoreRequest;
    const gameId = body.gameId?.trim() ?? "";
    const canceled = body.canceled === true;
    const forfeitWinner =
      body.forfeitWinner === "away" || body.forfeitWinner === "home"
        ? body.forfeitWinner
        : null;
    const homeScore = body.homeScore;
    const awayScore = body.awayScore;

    if (!gameId || !UUID_PATTERN.test(gameId)) {
      return NextResponse.json(
        { ok: false, message: "gameId が不正です" },
        { status: 400 },
      );
    }

    let normalizedHomeScore: number | null = null;
    let normalizedAwayScore: number | null = null;

    if (!canceled && forfeitWinner === null) {
      if (!Number.isInteger(homeScore) || !Number.isInteger(awayScore)) {
        return NextResponse.json(
          { ok: false, message: "得点は整数で指定してください" },
          { status: 400 },
        );
      }

      normalizedHomeScore = Number(homeScore);
      normalizedAwayScore = Number(awayScore);

      if (normalizedHomeScore < 0 || normalizedAwayScore < 0) {
        return NextResponse.json(
          { ok: false, message: "得点は0以上で指定してください" },
          { status: 400 },
        );
      }

      if (normalizedHomeScore > 99 || normalizedAwayScore > 99) {
        return NextResponse.json(
          { ok: false, message: "得点は99以下で指定してください" },
          { status: 400 },
        );
      }
    }

    const supabase = createServiceClient();
    const penpen = supabase.schema("penpen");

    const { data, error } = await penpen
      .from("game_results")
      .upsert(
        {
          scheduled_game_id: gameId,
          home_score: normalizedHomeScore,
          away_score: normalizedAwayScore,
          is_canceled: canceled,
          forfeit_winner: forfeitWinner,
        },
        {
          onConflict: "scheduled_game_id",
        },
      )
      .select("scheduled_game_id, home_score, away_score, updated_at")
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      ok: true,
      result: data,
    });
  } catch (error) {
    console.error("[penpen line score save]", error);
    return NextResponse.json(
      { ok: false, message: getErrorMessage(error) },
      { status: 500 },
    );
  }
}
