import React from "react";
import Link from "next/link";
import FrontMenu from "./components/FrontMenu";
import Footer from "./components/Footer";
import { createClient } from "@/lib/supabase/server";
import { formatRate } from "@/utils/rateFormat";
import { aggregateBattingRows } from "@/utils/statsAggregation";
import ToastRedirect from "@/components/ToastRedirect";

interface Props {
  params: Promise<{
    teamId: string;
  }>;
}

export default async function TopPage({ params }: Props) {
  const { teamId } = await params;
  const supabase = await createClient();

  // チーム情報を取得
  const { data: team } = await supabase
    .from("myteams")
    .select("*")
    .eq("id", teamId)
    .single();

  if (!team) {
    return <ToastRedirect message="チームが見つかりません" redirectPath="/" />;
  }

  // 現在日時
  const now = new Date().toISOString();

  // 次の試合を取得
  const { data: nextGame } = await supabase
    .from("games")
    .select("*,vsteams(*)")
    .eq("team_id", teamId)
    .gt("start_datetime", now)
    .order("start_datetime", { ascending: true })
    .limit(1)
    .maybeSingle();

  // 直近の試合結果を取得（試合中も含む）
  const { data: latestGame } = await supabase
    .from("games")
    .select("*,vsteams(*)")
    .eq("team_id", teamId)
    .lt("start_datetime", now)
    .gte("status", 0)
    .order("start_datetime", { ascending: false })
    .limit(1)
    .maybeSingle();

  const currentYear = new Date().getFullYear();

  // 今年の開始日と終了日
  const yearStart = `${currentYear}-01-01T00:00:00`;
  const yearEnd = `${currentYear}-12-31T23:59:59`;

  const { data: teamDailyStats } = await supabase
    .from("mv_player_daily_stats")
    .select("game_id, ab, h")
    .eq("team_id", teamId)
    .gte("game_date", `${currentYear}-01-01`)
    .lte("game_date", `${currentYear}-12-31`);

  const teamStats = aggregateBattingRows(teamDailyStats || []);

  // 試合数（今年分・gamesテーブル基準）
  const { count: gameCount } = await supabase
    .from("games")
    .select("*", { count: "exact", head: true })
    .eq("team_id", teamId)
    .eq("sum_flg", true)
    .not("status", "in", "(0,6)")
    .gte("start_datetime", yearStart)
    .lte("start_datetime", yearEnd);

  // 勝ち数（今年分）
  const { count: winCount } = await supabase
    .from("games")
    .select("*", { count: "exact", head: true })
    .eq("team_id", teamId)
    .eq("sum_flg", true)
    .eq("status", 1)
    .gte("start_datetime", yearStart)
    .lte("start_datetime", yearEnd);

  // 負け数（今年分）
  const { count: loseCount } = await supabase
    .from("games")
    .select("*", { count: "exact", head: true })
    .eq("team_id", teamId)
    .eq("sum_flg", true)
    .eq("status", 2)
    .gte("start_datetime", yearStart)
    .lte("start_datetime", yearEnd);

  // 日付のフォーマット
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat("ja-JP", {
      month: "long",
      day: "numeric",
    }).format(date);
  };

  // 試合ステータス
  const statusMap: { [key: number]: string } = {
    0: "試合中",
    1: "勝利",
    2: "敗戦",
    3: "引き分け",
    4: "不戦勝",
    5: "不戦敗",
    6: "中止",
  };

  // 試合の得点を計算
  const getGameScore = (
    game: any,
  ): { myScore: number; vsScore: number } | null => {
    if (!game?.top_points || !game?.bottom_points) return null;

    const topTotal = game.top_points.reduce((a: number, b: number) => a + b, 0);
    const bottomTotal = game.bottom_points.reduce(
      (a: number, b: number) => a + b,
      0,
    );

    if (game.is_batting_first) {
      return { myScore: topTotal, vsScore: bottomTotal };
    } else {
      return { myScore: bottomTotal, vsScore: topTotal };
    }
  };

  const latestScore = latestGame ? getGameScore(latestGame) : null;

  // Supabaseストレージの画像URLを取得
  const getStorageUrl = (
    path: string | null,
    bucket: string = "team_assets",
  ) => {
    if (!path) return null;
    // すでにフルURLの場合はそのまま返す
    if (path.startsWith("http://") || path.startsWith("https://")) {
      return path;
    }
    // 相対パスの場合はSupabaseストレージのURLを構築
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
  };

  const topImageUrl = getStorageUrl(team.top_image);
  const teamLogoUrl = getStorageUrl(team.team_logo);
  const teamIconUrl = getStorageUrl(team.team_icon);

  // 自チームのアイコンを優先順位に従って取得
  const getTeamIconDisplay = () => {
    // 優先順位1: team_icon
    if (teamIconUrl) {
      return { type: "image", content: teamIconUrl, alt: team.name };
    }
    // 優先順位2: one_name（1文字表示）
    if (team.one_name) {
      return { type: "text", content: team.one_name };
    }
    // 優先順位3: チーム名の1文字目
    return { type: "text", content: team.name.charAt(0) };
  };

  const teamIconDisplay = getTeamIconDisplay();

  // 相手チームのアイコンを優先順位に従って取得
  const getVsTeamIconDisplay = (vsTeamData: any) => {
    if (!vsTeamData) return { type: "text", content: "?", alt: "Unknown" };

    const vsTeamIconUrl = getStorageUrl(vsTeamData.icon, "vsteams");

    // 優先順位1: icon
    if (vsTeamIconUrl) {
      return { type: "image", content: vsTeamIconUrl, alt: vsTeamData.name };
    }
    // 優先順位2: one_name（1文字表示）
    if (vsTeamData.one_name) {
      return { type: "text", content: vsTeamData.one_name };
    }
    // 優先順位3: 相手チーム名の1文字目
    return { type: "text", content: vsTeamData.name.charAt(0) };
  };

  const vsTeamIconDisplay = nextGame
    ? getVsTeamIconDisplay(nextGame.vsteams)
    : null;

  // 色の定義
  const primaryColor = team.team_color || "#3b82f6";
  const victoryColor = "#ef4444";

  const themeStyle = {
    "--team-color": primaryColor,
    "--victory-color": victoryColor,
  } as React.CSSProperties;

  return (
    <div
      className="min-h-screen bg-gray-50 text-slate-800 font-sans"
      style={themeStyle}
    >
      <FrontMenu
        teamName={team.name}
        teamColor={primaryColor}
        teamId={teamId}
        teamLogo={teamLogoUrl}
      />

      {/* ヘッダー2段分(約160px〜180px)の余白を確保 */}
      <main className="pt-40 md:pt-48">
        {/* トップ写真 */}
        {topImageUrl && (
          <section className="relative w-full overflow-hidden bg-gray-50 px-4 md:px-0">
            <div className="max-w-6xl mx-auto relative">
              <div className="relative aspect-video md:aspect-21/9 lg:aspect-25/9 w-full">
                <img
                  src={topImageUrl}
                  alt="チームトップ写真"
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-linear-to-t from-white via-transparent to-transparent " />
              </div>
            </div>
          </section>
        )}

        <div
          className={`w-full ${topImageUrl ? "-mt-8 md:-mt-16" : ""} relative z-20 space-y-12 pb-20`}
        >
          <div className="max-w-5xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-4 md:gap-6 lg:gap-8">
              {/* 次の試合 */}
              {nextGame ? (
                <Link
                  href={`/${teamId}/games/${nextGame.id}`}
                  className="block group"
                >
                  <div className="bg-white h-full rounded-[2.5rem] p-6 md:p-10 shadow-xl shadow-slate-200/50 border border-white hover:border-(--team-color) cursor-pointer">
                    <div className="flex justify-between items-center mb-8">
                      <span className="text-white text-xs font-black px-4 py-1.5 rounded-full bg-(--team-color)">
                        次の試合
                      </span>
                      <span className="text-slate-400 font-bold">
                        {formatDate(nextGame.start_datetime)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between md:justify-center mx-auto">
                      <div className="text-center font-black">
                        <div className="md:w-20 md:h-20 mb-3 flex items-center justify-center mx-auto">
                          {teamIconDisplay.type === "image" ? (
                            <img
                              src={teamIconDisplay.content}
                              className="w-14 h-14 md:w-20 md:h-20 object-contain"
                              alt={teamIconDisplay.alt}
                            />
                          ) : (
                            <span className="text-2xl md:text-4xl font-black text-(--team-color)">
                              {teamIconDisplay.content}
                            </span>
                          )}
                        </div>
                        <div className="w-30 md:w-40 text-(--team-color) truncate">
                          {team.name}
                        </div>
                      </div>
                      <div className="text-2xl font-black text-slate-500 italic">
                        VS
                      </div>
                      <div className="text-center font-black">
                        <div className="md:w-20 md:h-20 mb-3 flex items-center justify-center mx-auto">
                          {vsTeamIconDisplay?.type === "image" ? (
                            <img
                              src={vsTeamIconDisplay.content}
                              className="w-14 h-14 md:w-20 md:h-20 object-contain"
                              alt={vsTeamIconDisplay.alt}
                            />
                          ) : (
                            <span className="text-2xl md:text-4xl font-black text-slate-400">
                              {vsTeamIconDisplay?.content || "?"}
                            </span>
                          )}
                        </div>
                        <p className="w-30 md:w-40 text-slate-400 truncate">
                          {nextGame.vsteams?.name || "未定"}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              ) : (
                <div className="bg-white h-full rounded-[2.5rem] p-6 md:p-10 shadow-xl shadow-slate-200/50 border border-white">
                  <div className="flex justify-between items-center mb-8">
                    <span className="text-white text-xs font-black px-4 py-1.5 rounded-full bg-(--team-color)">
                      次の試合
                    </span>
                  </div>
                  <div className="flex items-center justify-center h-32">
                    <p className="text-slate-400 font-bold">
                      予定されている試合がありません
                    </p>
                  </div>
                </div>
              )}

              {/* 最新結果 */}
              {latestGame &&
              (latestScore || [4, 5, 6].includes(latestGame.status)) ? (
                <Link
                  href={`/${teamId}/games/${latestGame.id}`}
                  className="block group"
                >
                  <div className="bg-white rounded-[2.5rem] p-6 md:p-10 shadow-xl shadow-slate-200/50 border border-white hover:border-(--team-color) cursor-pointer">
                    <div className="flex justify-between items-center mb-8">
                      <span
                        className="text-white text-xs font-black px-4 py-1.5 rounded-full"
                        style={{
                          backgroundColor:
                            latestGame.status === 1 || latestGame.status === 4
                              ? "var(--victory-color)"
                              : "var(--team-color)",
                        }}
                      >
                        {latestGame.status === 0 ? "試合中" : "直近の結果"}
                      </span>
                      <span className="text-slate-400 font-bold">
                        {formatDate(latestGame.start_datetime)}
                      </span>
                    </div>
                    {/* 中央寄せ */}
                    <div className="flex flex-col items-center justify-center gap-6 text-center">
                      <div>
                        <span
                          className="text-6xl font-black italic leading-none whitespace-nowrap"
                          style={{
                            color:
                              latestGame.status === 1 || latestGame.status === 4
                                ? "var(--victory-color)"
                                : "var(--team-color)",
                          }}
                        >
                          {statusMap[latestGame.status] || "試合終了"}
                        </span>
                        <p className="text-sm font-bold text-slate-400 mt-4">
                          VS {latestGame.vsteams?.name || "未定"}
                        </p>
                      </div>
                      {/* スコア部分（4,5,6の場合は非表示） */}
                      {latestScore &&
                        ![4, 5, 6].includes(latestGame.status) && (
                          <div className="text-6xl md:text-7xl font-black tracking-tighter italic text-slate-900 whitespace-nowrap">
                            {latestScore.myScore} - {latestScore.vsScore}
                          </div>
                        )}
                    </div>
                  </div>
                </Link>
              ) : (
                <div className="bg-white rounded-[2.5rem] p-6 md:p-10 shadow-xl shadow-slate-200/50 border border-white">
                  <div className="flex justify-between items-center mb-8">
                    <span
                      className="text-white text-xs font-black px-4 py-1.5 rounded-full"
                      style={{ backgroundColor: "var(--victory-color)" }}
                    >
                      直近の結果
                    </span>
                  </div>
                  <div className="flex items-center justify-center h-32">
                    <p className="text-slate-400 font-bold">
                      試合結果がありません
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* チーム成績 */}
            <Link href={`/${teamId}/stats`} className="block group">
              <div className="bg-white rounded-[2.5rem] mt-3 md:mt-10 p-6 md:p-10 shadow-xl shadow-slate-200/50 border border-white hover:border-(--team-color) grid grid-cols-1 md:grid-cols-3 gap-8 items-center text-center cursor-pointer transition-colors">
                {/* 試合数 */}
                <div className="flex flex-col items-center">
                  <p className="text-sm font-black text-slate-400 tracking-[0.4em] mb-2">
                    今季試合数
                  </p>
                  <div className="flex items-baseline gap-1 text-slate-900">
                    <p className="text-6xl font-black italic tracking-tighter">
                      {gameCount ?? 0}
                    </p>
                    <span className="text-xl font-bold italic">試合</span>
                  </div>
                </div>

                {/* 勝敗 */}
                <div className="flex flex-col items-center border-y md:border-y-0 md:border-x border-slate-100 py-6 md:py-0">
                  <p className="text-sm font-black text-slate-400 tracking-[0.4em] mb-2">
                    勝敗
                  </p>
                  <div className="flex items-baseline gap-2 text-slate-900">
                    <p className="text-6xl font-black italic tracking-tighter">
                      {winCount ?? 0}
                    </p>
                    <span className="text-xl font-bold italic">勝</span>
                    <p className="text-6xl font-black italic tracking-tighter">
                      {loseCount ?? 0}
                    </p>
                    <span className="text-xl font-bold italic">敗</span>
                  </div>
                </div>

                {/* チーム打率 */}
                <div className="flex flex-col items-center">
                  <p className="text-sm font-black text-slate-400 tracking-[0.4em] mb-2">
                    チーム打率
                  </p>
                  <p className="text-6xl font-black italic tracking-tighter text-slate-900">
                    {teamStats.avg ? formatRate(teamStats.avg) : ".---"}
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
