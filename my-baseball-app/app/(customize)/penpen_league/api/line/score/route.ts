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

type ScheduledGameRow = {
  id: string;
  schedule_day_id: string;
  start_time: string;
  end_time: string;
  away_team_id: string;
  home_team_id: string;
};

type ScheduleDayRow = {
  match_date: string;
};

type TeamRow = {
  id: string;
  name: string;
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

const buildResultMessage = (params: {
  awayTeamName: string;
  homeTeamName: string;
  awayScore: number | null;
  homeScore: number | null;
  isCanceled: boolean;
  forfeitWinner: "away" | "home" | null;
  matchDate: string;
  startTime: string;
}) => {
  let resultText: string;
  let statusColor: string;

  if (params.isCanceled) {
    resultText = "中止";
    statusColor = "#ef4444";
  } else if (params.forfeitWinner === "home") {
    resultText = "不戦勝";
    statusColor = "#f59e0b";
  } else if (params.forfeitWinner === "away") {
    resultText = "不戦敗";
    statusColor = "#f59e0b";
  } else {
    const awayScore = params.awayScore ?? 0;
    const homeScore = params.homeScore ?? 0;
    resultText = `${awayScore} - ${homeScore}`;
    statusColor = "#10b981";
  }

  const scoreText = params.isCanceled
    ? "中止"
    : params.forfeitWinner === "away"
      ? "不戦勝 - 不戦敗"
      : params.forfeitWinner === "home"
        ? "不戦敗 - 不戦勝"
        : `${params.awayScore ?? 0} - ${params.homeScore ?? 0}`;

  return {
    type: "flex",
    altText: `試合結果: ${params.awayTeamName} vs ${params.homeTeamName}`,
    contents: {
      type: "bubble",
      size: "mega",
      body: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        contents: [
          {
            type: "text",
            text: "⚾ 試合結果",
            weight: "bold",
            size: "xl",
            color: "#1d4ed8",
          },
          {
            type: "text",
            text: `${params.matchDate} ${params.startTime}`,
            size: "sm",
            color: "#334155",
          },
          {
            type: "box",
            layout: "horizontal",
            margin: "lg",
            spacing: "sm",
            contents: [
              {
                type: "text",
                text: params.awayTeamName,
                size: "md",
                color: "#0f172a",
                flex: 3,
                wrap: true,
                gravity: "center",
              },
              {
                type: "text",
                text: scoreText,
                size: "lg",
                weight: "bold",
                color: statusColor,
                align: "center",
                flex: 2,
                gravity: "center",
              },
              {
                type: "text",
                text: params.homeTeamName,
                size: "md",
                color: "#0f172a",
                flex: 3,
                wrap: true,
                align: "end",
                gravity: "center",
              },
            ],
          },
        ],
      },
    },
  };
};

const pushResultMessage = async (params: {
  targetId: string;
  channelAccessToken: string;
  awayTeamName: string;
  homeTeamName: string;
  awayScore: number | null;
  homeScore: number | null;
  isCanceled: boolean;
  forfeitWinner: "away" | "home" | null;
  matchDate: string;
  startTime: string;
}) => {
  const message = {
    to: params.targetId,
    messages: [buildResultMessage(params)],
  };

  const response = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${params.channelAccessToken}`,
    },
    body: JSON.stringify(message),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`LINE push failed: ${JSON.stringify(data)}`);
  }
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

    // 試合情報を取得して LINE 通知を送信
    const gameRes = await penpen
      .from("scheduled_games")
      .select(
        "id, schedule_day_id, start_time, end_time, away_team_id, home_team_id",
      )
      .eq("id", gameId)
      .single();

    if (gameRes.error) {
      console.error("[penpen line score - get game error]", gameRes.error);
    } else if (gameRes.data) {
      const game = gameRes.data as ScheduledGameRow;

      // schedule_day の情報を取得
      const dayRes = await penpen
        .from("schedule_days")
        .select("match_date")
        .eq("id", game.schedule_day_id)
        .single();

      if (dayRes.error) {
        console.error(
          "[penpen line score - get schedule_day error]",
          dayRes.error,
        );
      } else if (dayRes.data) {
        const day = dayRes.data as ScheduleDayRow;
        const teamIds = [game.away_team_id, game.home_team_id];

        const teamsRes = await penpen
          .from("teams")
          .select("id, name")
          .in("id", teamIds);

        if (teamsRes.error) {
          console.error(
            "[penpen line score - get teams error]",
            teamsRes.error,
          );
        } else if (teamsRes.data) {
          const teams = (teamsRes.data ?? []) as TeamRow[];
          const teamMap = new Map(teams.map((team) => [team.id, team.name]));

          const awayTeamName = teamMap.get(game.away_team_id) ?? "未設定";
          const homeTeamName = teamMap.get(game.home_team_id) ?? "未設定";

          const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
          const targetId = process.env.LINE_DEFAULT_TARGET_ID ?? "";

          if (channelAccessToken && targetId) {
            try {
              const startTime = (game.start_time ?? "").slice(0, 5);
              const matchDate = day.match_date ?? "日付未設定";

              await pushResultMessage({
                targetId,
                channelAccessToken,
                awayTeamName,
                homeTeamName,
                awayScore: normalizedAwayScore,
                homeScore: normalizedHomeScore,
                isCanceled: canceled,
                forfeitWinner,
                matchDate,
                startTime,
              });

              // 通知ログに記録
              await penpen.from("line_notification_logs").insert({
                scheduled_game_id: gameId,
                notification_type: "result_posted",
              });
            } catch (pushError) {
              console.error("[penpen line score - push error]", pushError);
              // 通知エラーは結果保存に影響させない
            }
          }
        }
      }
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
