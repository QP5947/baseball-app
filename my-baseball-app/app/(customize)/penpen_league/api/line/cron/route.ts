export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

type ScheduledGameRow = {
  id: string;
  display_order: number;
  start_time: string;
  end_time: string;
  away_team_id: string;
  home_team_id: string;
};

type TeamRow = {
  id: string;
  name: string;
};

type NotificationLogRow = {
  scheduled_game_id: string;
};

const NOTIFICATION_TYPE = "result_input_reminder";

const toHm = (value: string | null | undefined) => (value ?? "").slice(0, 5);

const toSecondsOfDay = (value: string | null | undefined) => {
  const raw = (value ?? "").slice(0, 8);
  const [h, m, s = "0"] = raw.split(":");

  const hour = Number(h);
  const minute = Number(m);
  const second = Number(s);

  if (
    !Number.isInteger(hour) ||
    !Number.isInteger(minute) ||
    !Number.isInteger(second) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59 ||
    second < 0 ||
    second > 59
  ) {
    return null;
  }

  return hour * 3600 + minute * 60 + second;
};

const getJstNow = () => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());

  const map = new Map(parts.map((part) => [part.type, part.value]));
  const date = `${map.get("year")}-${map.get("month")}-${map.get("day")}`;
  const hour = Number(map.get("hour") ?? "0");
  const minute = Number(map.get("minute") ?? "0");
  const second = Number(map.get("second") ?? "0");
  const weekday = new Date(`${date}T12:00:00+09:00`).getDay();

  return { date, hour, minute, second, weekday };
};

const buildLiffUrl = (params: {
  date: string;
  time: string;
  awayTeam: string;
  homeTeam: string;
  gameId: string;
}) => {
  const liffUrl = new URL(
    process.env.LINE_LIFF_URL ?? "https://liff.line.me/2009699401-fRQomcUo",
  );

  liffUrl.searchParams.set("date", params.date);
  liffUrl.searchParams.set("time", params.time);
  liffUrl.searchParams.set("awayTeam", params.awayTeam);
  liffUrl.searchParams.set("homeTeam", params.homeTeam);
  liffUrl.searchParams.set("gameId", params.gameId);

  return liffUrl;
};

const pushScoreInputMessage = async (params: {
  targetId: string;
  channelAccessToken: string;
  date: string;
  time: string;
  awayTeam: string;
  homeTeam: string;
  gameId: string;
}) => {
  const liffUrl = buildLiffUrl({
    date: params.date,
    time: params.time,
    awayTeam: params.awayTeam,
    homeTeam: params.homeTeam,
    gameId: params.gameId,
  });

  const message = {
    to: params.targetId,
    messages: [
      {
        type: "flex",
        altText: `試合結果入力 ${params.awayTeam} vs ${params.homeTeam}`,
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
                text: "⚾ 試合結果入力",
                weight: "bold",
                size: "xl",
                color: "#1d4ed8",
              },
              {
                type: "text",
                text: `${params.date} ${params.time}`,
                size: "sm",
                color: "#334155",
              },
              {
                type: "text",
                text: `${params.awayTeam} vs ${params.homeTeam}`,
                wrap: true,
                size: "md",
                weight: "bold",
                color: "#0f172a",
              },
              {
                type: "button",
                action: {
                  type: "uri",
                  label: "スコア入力を開く",
                  uri: liffUrl.toString(),
                },
                style: "primary",
                color: "#1d4ed8",
                margin: "lg",
                height: "sm",
              },
            ],
          },
          footer: {
            type: "box",
            layout: "vertical",
            spacing: "sm",
            contents: [
              {
                type: "text",
                text: "中止・不戦勝（不戦敗）の場合も入力をお願いします",
                size: "xs",
                color: "#94a3b8",
                align: "center",
              },
            ],
          },
        },
      },
    ],
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

const isAllowedCronWindow = (force: boolean) => {
  if (force) {
    return true;
  }

  const now = getJstNow();
  const isSunday = now.weekday === 0;
  const isDaytime = now.hour >= 9 && now.hour <= 18;
  return isSunday && isDaytime;
};

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const force = requestUrl.searchParams.get("force") === "1";

    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
      const authorization = request.headers.get("authorization");
      if (authorization !== `Bearer ${cronSecret}`) {
        return NextResponse.json(
          { ok: false, message: "unauthorized" },
          { status: 401 },
        );
      }
    }

    if (!isAllowedCronWindow(force)) {
      return NextResponse.json({
        ok: true,
        skipped: true,
        reason: "outside_sunday_daytime_window",
      });
    }

    const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    const targetId = process.env.LINE_DEFAULT_TARGET_ID ?? "";

    if (!channelAccessToken) {
      return NextResponse.json(
        { ok: false, message: "LINE_CHANNEL_ACCESS_TOKEN is missing" },
        { status: 500 },
      );
    }

    if (!targetId) {
      return NextResponse.json(
        { ok: false, message: "LINE_DEFAULT_TARGET_ID is missing" },
        { status: 500 },
      );
    }

    const nowJst = getJstNow();
    const todayJst = nowJst.date;
    const nowSeconds = nowJst.hour * 3600 + nowJst.minute * 60 + nowJst.second;
    const supabase = createServiceClient();
    const penpen = supabase.schema("penpen");

    const dayRes = await penpen
      .from("schedule_days")
      .select("id, match_date")
      .eq("match_date", todayJst)
      .maybeSingle();

    if (dayRes.error) {
      throw dayRes.error;
    }

    if (!dayRes.data) {
      return NextResponse.json({
        ok: true,
        skipped: true,
        reason: "no_schedule_today",
        date: todayJst,
      });
    }

    const dayId = dayRes.data.id;

    const gamesRes = await penpen
      .from("scheduled_games")
      .select(
        "id, display_order, start_time, end_time, away_team_id, home_team_id",
      )
      .eq("schedule_day_id", dayId)
      .order("display_order", { ascending: true });

    if (gamesRes.error) {
      throw gamesRes.error;
    }

    const games = (gamesRes.data ?? []) as ScheduledGameRow[];
    if (games.length === 0) {
      return NextResponse.json({
        ok: true,
        skipped: true,
        reason: "no_games_today",
        date: todayJst,
      });
    }

    const gameIds = games.map((game) => game.id);
    const teamIds = Array.from(
      new Set(games.flatMap((game) => [game.away_team_id, game.home_team_id])),
    );

    const [teamsRes, logsRes] = await Promise.all([
      penpen.from("teams").select("id, name").in("id", teamIds),
      penpen
        .from("line_notification_logs")
        .select("scheduled_game_id")
        .eq("notification_type", NOTIFICATION_TYPE)
        .in("scheduled_game_id", gameIds),
    ]);

    if (teamsRes.error) throw teamsRes.error;
    if (logsRes.error) throw logsRes.error;

    const teamMap = new Map(
      ((teamsRes.data ?? []) as TeamRow[]).map((team) => [team.id, team.name]),
    );

    const postedGameIdSet = new Set(
      ((logsRes.data ?? []) as NotificationLogRow[]).map(
        (row) => row.scheduled_game_id,
      ),
    );

    const targets = games.filter((game) => {
      const endSeconds = toSecondsOfDay(game.end_time);
      const isEndedByTime = endSeconds !== null && nowSeconds > endSeconds;
      return isEndedByTime && !postedGameIdSet.has(game.id);
    });

    if (targets.length === 0) {
      return NextResponse.json({
        ok: true,
        skipped: true,
        reason: "no_post_target_games",
        date: todayJst,
        totalGames: games.length,
      });
    }

    const postedGameIds: string[] = [];
    const failedGames: Array<{ gameId: string; message: string }> = [];

    for (const game of targets) {
      const awayTeam = teamMap.get(game.away_team_id) ?? "未設定";
      const homeTeam = teamMap.get(game.home_team_id) ?? "未設定";

      try {
        await pushScoreInputMessage({
          targetId,
          channelAccessToken,
          date: todayJst,
          time: `${toHm(game.start_time)}-${toHm(game.end_time)}`,
          awayTeam,
          homeTeam,
          gameId: game.id,
        });

        const insertRes = await penpen.from("line_notification_logs").insert({
          scheduled_game_id: game.id,
          notification_type: NOTIFICATION_TYPE,
        });

        if (insertRes.error) {
          throw insertRes.error;
        }

        postedGameIds.push(game.id);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "unknown error";
        failedGames.push({ gameId: game.id, message });
        console.error("[penpen line cron post failed]", {
          gameId: game.id,
          message,
        });
      }
    }

    return NextResponse.json({
      ok: failedGames.length === 0,
      date: todayJst,
      totalGames: games.length,
      targetGames: targets.length,
      postedCount: postedGameIds.length,
      failedCount: failedGames.length,
      postedGameIds,
      failedGames,
    });
  } catch (error) {
    console.error("[penpen line cron]", error);
    const message = error instanceof Error ? error.message : "unknown error";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
