import { NextResponse } from "next/server";

// LINE Webhook: グループIDを取得するための一時エンドポイント
// 使い方:
//   1. LINE Developers > Messaging API > Webhook URL に
//      https://dashbase.jp/penpen_league/api/line/webhook を設定
//   2. 対象グループで何かメッセージを送信
//   3. サーバーログ (Vercel Functions のログ等) で group_id を確認
export async function POST(request: Request) {
  const body = await request.json();

  // グループIDをサーバーログに出力
  for (const event of body?.events ?? []) {
    const groupId = event?.source?.groupId;
    const userId = event?.source?.userId;
    const type = event?.source?.type;
    console.log(
      "[LINE Webhook] source:",
      JSON.stringify({ type, groupId, userId }),
    );
  }

  // LINE は 200 OK を返さないと再送してくるため必ず 200 を返す
  return NextResponse.json({ ok: true });
}

// LINE の Webhook 検証リクエスト (GET) にも応答する
export async function GET() {
  return NextResponse.json({ ok: true });
}
