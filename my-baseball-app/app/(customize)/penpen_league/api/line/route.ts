import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const { searchParams, origin } = new URL(request.url);

  const targetId =
    searchParams.get("to") ?? process.env.LINE_DEFAULT_TARGET_ID ?? "";
  const gameDate = searchParams.get("date") ?? "日付未設定";
  const gameTime = searchParams.get("time") ?? "時間未設定";
  const gameId = searchParams.get("gameId") ?? "";
  const awayTeam = searchParams.get("awayTeam") ?? "未設定";
  const homeTeam = searchParams.get("homeTeam") ?? "未設定";

  const liffUrl = new URL(
    process.env.LINE_LIFF_URL ?? "https://liff.line.me/2009699401-fRQomcUo",
  );
  liffUrl.searchParams.set("date", gameDate);
  liffUrl.searchParams.set("time", gameTime);
  liffUrl.searchParams.set("awayTeam", awayTeam);
  liffUrl.searchParams.set("homeTeam", homeTeam);
  if (gameId) {
    liffUrl.searchParams.set("gameId", gameId);
  }

  if (!CHANNEL_ACCESS_TOKEN) {
    return NextResponse.json(
      {
        success: false,
        error: "LINE_CHANNEL_ACCESS_TOKEN が設定されていません",
      },
      { status: 500 },
    );
  }

  if (!targetId) {
    return NextResponse.json(
      {
        success: false,
        error:
          "通知先IDが未指定です。to クエリまたは LINE_DEFAULT_TARGET_ID を設定してください",
      },
      { status: 400 },
    );
  }

  const message = {
    to: targetId,
    messages: [
      {
        type: "flex",
        altText: `試合結果入力 ${awayTeam} vs ${homeTeam}`,
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
                text: `${gameDate} ${gameTime}`,
                size: "sm",
                color: "#334155",
              },
              {
                type: "text",
                text: `${awayTeam} vs ${homeTeam}`,
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

  const res = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${CHANNEL_ACCESS_TOKEN}`,
    },
    body: JSON.stringify(message),
  });

  // エラー内容をターミナル（コンソール）に表示させる
  const errorData = await res.json();
  if (!res.ok) {
    console.error("LINE API Error:", errorData);
    return NextResponse.json({ success: false, error: errorData });
  }

  return NextResponse.json({ success: true });
}
