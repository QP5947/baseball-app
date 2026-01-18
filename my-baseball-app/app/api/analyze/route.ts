import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const stats = await req.json();

  // 環境変数からAPIキーを読み込む
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

  const prompt = `
    あなたは野球の専門アナリストです。以下のスタッツを分析してください。
    
    【選手の直近成績】: ${JSON.stringify(stats)}
    
    上記を踏まえ、この選手の「強み」と「改善点」を、選手がやる気になるような熱い口調でアドバイスしてください。
    100字以内でお願いします。

    【制約事項】:
  - 回答に「**」などのMarkdown記号は一切使用しないでください。
  - 太字にしたい箇所も、記号を使わずプレーンテキストのみで回答してください。
  `;

  const result = await model.generateContent(prompt);
  const response = await result.response;

  return new Response(JSON.stringify({ advice: response.text() }));
  //return new Response(JSON.stringify({ advice: "テスト用テキスト" }));
}
