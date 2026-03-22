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

type ScheduledGameRow = {
  id: string;
  schedule_day_id: string;
  away_team_id: string;
  home_team_id: string;
  game_type: string;
  league_id: string | null;
};

type ScheduleDayRow = {
  id: string;
  match_date: string;
};

type TournamentBindingRow = {
  league_id: string;
  season_year: number;
  third_place_code: string | null;
  bindings: unknown;
};

type GameBinding = {
  gameId: string;
  code: string;
  awaySourceCode: string;
  homeSourceCode: string;
};

type BindingTargetSide = "away" | "home";
type TargetOutcome = "winner" | "loser";

type BindingTarget = {
  gameId: string;
  side: BindingTargetSide;
  outcome: TargetOutcome;
};

type BindingIndex = {
  codeByGameId: Map<string, string>;
  targetsBySourceCode: Map<string, BindingTarget[]>;
};

type OutcomeRow = {
  row: ScheduledGameRow;
  seasonYear: number;
  winnerTeamId: string | null;
  loserTeamId: string | null;
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

const toLeagueSeasonKey = (leagueId: string, seasonYear: number) =>
  `${leagueId}:${seasonYear}`;

const getSeasonYearFromDate = (dateText: string) => {
  const date = new Date(`${dateText}T00:00:00+09:00`);
  if (Number.isNaN(date.getTime())) {
    return new Date().getFullYear();
  }
  return date.getFullYear();
};

const toGameBinding = (value: unknown): GameBinding | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const row = value as Record<string, unknown>;
  if (
    typeof row.gameId !== "string" ||
    typeof row.code !== "string" ||
    typeof row.awaySourceCode !== "string" ||
    typeof row.homeSourceCode !== "string"
  ) {
    return null;
  }

  return {
    gameId: row.gameId,
    code: row.code,
    awaySourceCode: row.awaySourceCode,
    homeSourceCode: row.homeSourceCode,
  };
};

const parseBindings = (raw: unknown): GameBinding[] => {
  let items: unknown[] = [];

  if (Array.isArray(raw)) {
    items = raw;
  } else if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        items = parsed;
      }
    } catch {
      items = [];
    }
  }

  return items
    .map(toGameBinding)
    .filter((item): item is GameBinding => item !== null);
};

const pickGameOutcomeTeamIds = (
  payload: SaveGamePayload,
  game: ScheduledGameRow,
) => {
  if (payload.canceled) {
    return { winnerTeamId: null, loserTeamId: null };
  }

  if (payload.forfeitWinner === "away") {
    return {
      winnerTeamId: game.away_team_id,
      loserTeamId: game.home_team_id,
    };
  }
  if (payload.forfeitWinner === "home") {
    return {
      winnerTeamId: game.home_team_id,
      loserTeamId: game.away_team_id,
    };
  }

  const awayScore = parseScore(payload.awayScore);
  const homeScore = parseScore(payload.homeScore);
  if (awayScore === null || homeScore === null || awayScore === homeScore) {
    return { winnerTeamId: null, loserTeamId: null };
  }

  if (awayScore > homeScore) {
    return {
      winnerTeamId: game.away_team_id,
      loserTeamId: game.home_team_id,
    };
  }

  return {
    winnerTeamId: game.home_team_id,
    loserTeamId: game.away_team_id,
  };
};

const buildBindingIndex = (rows: TournamentBindingRow[]) => {
  const index = new Map<string, BindingIndex>();

  rows.forEach((row) => {
    const key = toLeagueSeasonKey(row.league_id, row.season_year);
    const current = index.get(key) ?? {
      codeByGameId: new Map<string, string>(),
      targetsBySourceCode: new Map<string, BindingTarget[]>(),
    };

    const parsedBindings = parseBindings(row.bindings);
    const codeByGameId = new Map(
      parsedBindings
        .map((binding) => [binding.gameId, binding.code.trim()] as const)
        .filter(([, code]) => code.length > 0),
    );

    parsedBindings.forEach((binding) => {
      const code = binding.code.trim();
      if (code) {
        current.codeByGameId.set(binding.gameId, code);
      }

      const targetOutcome: TargetOutcome =
        row.third_place_code && code === row.third_place_code
          ? "loser"
          : "winner";

      const pushTarget = (sourceCode: string, side: BindingTargetSide) => {
        const codeValue = sourceCode.trim();
        if (!codeValue) {
          return;
        }

        const selfCode = codeByGameId.get(binding.gameId);
        if (selfCode && selfCode === codeValue) {
          return;
        }

        const targets = current.targetsBySourceCode.get(codeValue) ?? [];
        targets.push({ gameId: binding.gameId, side, outcome: targetOutcome });
        current.targetsBySourceCode.set(codeValue, targets);
      };

      pushTarget(binding.awaySourceCode, "away");
      pushTarget(binding.homeSourceCode, "home");
    });

    index.set(key, current);
  });

  return index;
};

const propagateTournamentWinners = async (
  supabase: ReturnType<typeof createServiceClient>,
  games: SaveGamePayload[],
) => {
  if (games.length === 0) {
    return;
  }

  const gameIds = games.map((game) => game.gameId);
  const { data: scheduledRowsRaw, error: scheduledError } = await supabase
    .schema("penpen")
    .from("scheduled_games")
    .select(
      "id, schedule_day_id, away_team_id, home_team_id, game_type, league_id",
    )
    .in("id", gameIds);

  if (scheduledError) {
    throw scheduledError;
  }

  const scheduledRows = (scheduledRowsRaw ?? []) as ScheduledGameRow[];
  if (scheduledRows.length === 0) {
    return;
  }

  const dayIds = [...new Set(scheduledRows.map((row) => row.schedule_day_id))];
  const { data: dayRowsRaw, error: dayError } = await supabase
    .schema("penpen")
    .from("schedule_days")
    .select("id, match_date")
    .in("id", dayIds);

  if (dayError) {
    throw dayError;
  }

  const dayRows = (dayRowsRaw ?? []) as ScheduleDayRow[];
  const seasonYearByDayId = new Map(
    dayRows.map((row) => [row.id, getSeasonYearFromDate(row.match_date)]),
  );

  const { data: undecidedTeamRow, error: undecidedTeamError } = await supabase
    .schema("penpen")
    .from("teams")
    .select("id")
    .eq("name", "未定")
    .maybeSingle();

  if (undecidedTeamError) {
    throw undecidedTeamError;
  }

  const undecidedTeamId = undecidedTeamRow?.id ?? null;
  if (!undecidedTeamId) {
    return;
  }

  const payloadByGameId = new Map(games.map((game) => [game.gameId, game]));

  const outcomeRows: OutcomeRow[] = [];
  for (const row of scheduledRows) {
    if (row.game_type !== "tournament" || !row.league_id) {
      continue;
    }

    const payload = payloadByGameId.get(row.id);
    const seasonYear = seasonYearByDayId.get(row.schedule_day_id);
    if (!payload || typeof seasonYear !== "number") {
      continue;
    }

    const { winnerTeamId, loserTeamId } = pickGameOutcomeTeamIds(payload, row);
    if (!winnerTeamId && !loserTeamId) {
      continue;
    }

    outcomeRows.push({
      row,
      seasonYear,
      winnerTeamId,
      loserTeamId,
    });
  }

  if (outcomeRows.length === 0) {
    return;
  }

  const leagueIds = [
    ...new Set(outcomeRows.map((item) => item.row.league_id!)),
  ];
  const seasonYears = [...new Set(outcomeRows.map((item) => item.seasonYear))];

  const { data: bindingRowsRaw, error: bindingError } = await supabase
    .schema("penpen")
    .from("tournament_bindings")
    .select("league_id, season_year, third_place_code, bindings")
    .in("league_id", leagueIds)
    .in("season_year", seasonYears);

  if (bindingError) {
    throw bindingError;
  }

  const bindingRows = (bindingRowsRaw ?? []) as TournamentBindingRow[];
  if (bindingRows.length === 0) {
    return;
  }

  const bindingIndex = buildBindingIndex(bindingRows);
  const targetGameIds = new Set<string>();

  outcomeRows.forEach((item) => {
    const key = toLeagueSeasonKey(item.row.league_id!, item.seasonYear);
    const index = bindingIndex.get(key);
    if (!index) {
      return;
    }

    const sourceCode = index.codeByGameId.get(item.row.id);
    if (!sourceCode) {
      return;
    }

    const targets = index.targetsBySourceCode.get(sourceCode) ?? [];
    targets.forEach((target) => {
      if (target.gameId !== item.row.id) {
        targetGameIds.add(target.gameId);
      }
    });
  });

  if (targetGameIds.size === 0) {
    return;
  }

  const { data: targetRowsRaw, error: targetError } = await supabase
    .schema("penpen")
    .from("scheduled_games")
    .select("id, away_team_id, home_team_id")
    .in("id", [...targetGameIds]);

  if (targetError) {
    throw targetError;
  }

  const targetRowMap = new Map(
    (
      (targetRowsRaw ?? []) as Pick<
        ScheduledGameRow,
        "id" | "away_team_id" | "home_team_id"
      >[]
    ).map((row) => [row.id, row]),
  );

  const updates = new Map<
    string,
    { away_team_id?: string; home_team_id?: string }
  >();

  outcomeRows.forEach((item) => {
    const key = toLeagueSeasonKey(item.row.league_id!, item.seasonYear);
    const index = bindingIndex.get(key);
    if (!index) {
      return;
    }

    const sourceCode = index.codeByGameId.get(item.row.id);
    if (!sourceCode) {
      return;
    }

    const targets = index.targetsBySourceCode.get(sourceCode) ?? [];
    targets.forEach((target) => {
      const targetRow = targetRowMap.get(target.gameId);
      if (!targetRow) {
        return;
      }

      const resolvedTeamId =
        target.outcome === "loser" ? item.loserTeamId : item.winnerTeamId;
      if (!resolvedTeamId) {
        return;
      }

      const current = updates.get(target.gameId) ?? {};
      if (
        target.side === "away" &&
        targetRow.away_team_id === undecidedTeamId &&
        !current.away_team_id
      ) {
        current.away_team_id = resolvedTeamId;
      }

      if (
        target.side === "home" &&
        targetRow.home_team_id === undecidedTeamId &&
        !current.home_team_id
      ) {
        current.home_team_id = resolvedTeamId;
      }

      if (current.away_team_id || current.home_team_id) {
        updates.set(target.gameId, current);
      }
    });
  });

  for (const [gameId, values] of updates.entries()) {
    const { error } = await supabase
      .schema("penpen")
      .from("scheduled_games")
      .update(values)
      .eq("id", gameId);

    if (error) {
      throw error;
    }
  }
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

      await propagateTournamentWinners(supabase, body.games);
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
