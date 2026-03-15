export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

const PENPEN_ADMIN_COOKIE = "penpen_admin_session";

type SaveGamePayload = {
  gameId: string;
  awayScore: string;
  homeScore: string;
  canceled: boolean;
  forfeitWinner: "away" | "home" | null;
};

type SaveRequestBody = {
  scheduleDayId: string;
  note: string;
  games: SaveGamePayload[];
};

type ErrorLike = {
  message?: unknown;
  details?: unknown;
  hint?: unknown;
  code?: unknown;
};

const isForfeitWinner = (
  value: unknown,
): value is SaveGamePayload["forfeitWinner"] => {
  return value === null || value === "away" || value === "home";
};

const parseRequestBody = (value: unknown): SaveRequestBody | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const body = value as Record<string, unknown>;
  const scheduleDayId =
    typeof body.scheduleDayId === "string" ? body.scheduleDayId.trim() : "";
  const note = typeof body.note === "string" ? body.note : "";
  const games = Array.isArray(body.games) ? body.games : null;

  if (!scheduleDayId || !games) {
    return null;
  }

  const parsedGames = games.map((game) => {
    if (!game || typeof game !== "object") {
      return null;
    }

    const row = game as Record<string, unknown>;
    const gameId = typeof row.gameId === "string" ? row.gameId.trim() : "";
    const awayScore = typeof row.awayScore === "string" ? row.awayScore : "";
    const homeScore = typeof row.homeScore === "string" ? row.homeScore : "";
    const canceled = typeof row.canceled === "boolean" ? row.canceled : null;
    const forfeitWinner = isForfeitWinner(row.forfeitWinner)
      ? row.forfeitWinner
      : undefined;

    if (!gameId || canceled === null || forfeitWinner === undefined) {
      return null;
    }

    return {
      gameId,
      awayScore,
      homeScore,
      canceled,
      forfeitWinner,
    } satisfies SaveGamePayload;
  });

  if (parsedGames.some((game) => game === null)) {
    return null;
  }

  return {
    scheduleDayId,
    note,
    games: parsedGames.filter((game): game is SaveGamePayload => game !== null),
  };
};

const parseScore = (value: string) => {
  if (value === "") {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error("スコアは 0 以上の数値で入力してください。");
  }

  return parsed;
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }

  if (error && typeof error === "object") {
    const { message, details, hint, code } = error as ErrorLike;
    const parts = [message, details, hint, code]
      .filter(
        (value): value is string =>
          typeof value === "string" && value.trim().length > 0,
      )
      .map((value) => value.trim());

    if (parts.length > 0) {
      return parts.join(" / ");
    }
  }

  return "unknown";
};

export async function POST(request: NextRequest) {
  const hasPenpenAdminSession =
    request.cookies.get(PENPEN_ADMIN_COOKIE)?.value === "1";

  if (!hasPenpenAdminSession) {
    return NextResponse.json(
      { message: "管理画面の認証が切れています。再ログインしてください。" },
      { status: 401 },
    );
  }

  let rawBody: unknown;

  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json(
      { message: "不正なリクエストです。" },
      { status: 400 },
    );
  }

  const body = parseRequestBody(rawBody);
  if (!body) {
    return NextResponse.json(
      { message: "送信データが不正です。" },
      { status: 400 },
    );
  }

  try {
    const supabase = createServiceClient();

    const rows = body.games.map((game) => {
      const awayScore =
        game.canceled || game.forfeitWinner !== null
          ? null
          : parseScore(game.awayScore);
      const homeScore =
        game.canceled || game.forfeitWinner !== null
          ? null
          : parseScore(game.homeScore);

      return {
        scheduled_game_id: game.gameId,
        away_score: awayScore,
        home_score: homeScore,
        is_canceled: game.canceled,
        forfeit_winner: game.forfeitWinner,
      };
    });

    if (rows.length > 0) {
      const { error } = await supabase
        .schema("penpen")
        .from("game_results")
        .upsert(rows, { onConflict: "scheduled_game_id" });

      if (error) {
        throw error;
      }
    }

    const { error: noteError } = await supabase
      .schema("penpen")
      .from("schedule_day_results")
      .upsert(
        {
          schedule_day_id: body.scheduleDayId,
          note: body.note,
          is_finalized: false,
        },
        { onConflict: "schedule_day_id" },
      );

    if (noteError) {
      throw noteError;
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[penpen results save]", error);

    return NextResponse.json(
      {
        message: getErrorMessage(error),
      },
      { status: 500 },
    );
  }
}
