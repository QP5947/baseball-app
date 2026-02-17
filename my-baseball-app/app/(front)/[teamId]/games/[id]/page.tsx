import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import React from "react";
import Footer from "../../components/Footer";
import FrontMenu from "../../components/FrontMenu";
import { createClient } from "@/lib/supabase/server";
import { fetchGameDetail } from "./actions";
import ToastRedirect from "@/components/ToastRedirect";

type Params = Promise<{ teamId: string; id: string }>;
type SearchParams = Promise<{ year?: string; month?: string }>;

const positionMap: { [key: number]: string } = {
  1: "投",
  2: "捕",
  3: "一",
  4: "二",
  5: "三",
  6: "遊",
  7: "左",
  8: "中",
  9: "右",
  10: "DH",
  11: "打",
  12: "走",
};

const getCircledNumber = (value: number | null | undefined) => {
  if (!value || value <= 0) return "";
  if (value >= 1 && value <= 20) {
    return String.fromCharCode(0x245f + value);
  }
  return `${value}`;
};

function getStorageUrl(path: string | null, bucket: string) {
  if (!path) return null;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
}

export default async function GameDetailPage(props: {
  params: Params;
  searchParams: SearchParams;
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const supabase = await createClient();

  // チーム情報を取得
  const { data: teamData, error: teamError } = await supabase
    .from("myteams")
    .select("name,team_color,team_logo,team_icon,one_name")
    .eq("id", params.teamId)
    .single();

  if (teamError || !teamData) {
    console.error("Team data error:", teamError);
    return <ToastRedirect message="チームが見つかりません" redirectPath="/" />;
  }

  const gameDetail = await fetchGameDetail(params.id, params.teamId);
  if (!gameDetail) {
    return (
      <ToastRedirect
        message="試合が見つかりません"
        redirectPath={`/${params.teamId}/games`}
      />
    );
  }

  const { game, battingResults, battingDetails, pitchingResults } = gameDetail;

  // 自チームのアイコンを優先順位に従って取得
  const teamIconUrl = getStorageUrl(teamData.team_icon, "team_assets");
  const getTeamIconDisplay = () => {
    // 優先順位1: team_icon
    if (teamIconUrl) {
      return { type: "image", content: teamIconUrl, alt: teamData.name };
    }
    // 優先順位2: one_name（1文字表示）
    if (teamData.one_name) {
      return { type: "text", content: teamData.one_name };
    }
    // 優先順位3: チーム名の1文字目
    return { type: "text", content: teamData.name.charAt(0) };
  };

  const teamIconDisplay = getTeamIconDisplay();

  // 相手チームのアイコンを優先順位に従って取得
  const vsTeamIconUrl = getStorageUrl(game.vsteams?.icon, "vsteams");
  const getVsTeamIconDisplay = () => {
    if (!game.vsteams) return { type: "text", content: "?" };

    // 優先順位1: icon
    if (vsTeamIconUrl) {
      return { type: "image", content: vsTeamIconUrl, alt: game.vsteams?.name };
    }
    // 優先順位2: one_name（1文字表示）
    if (game.vsteams.one_name) {
      return { type: "text", content: game.vsteams.one_name };
    }
    // 優先順位3: 相手チーム名の1文字目
    return { type: "text", content: game.vsteams?.name?.charAt(0) || "" };
  };

  const vsTeamIconDisplay = getVsTeamIconDisplay();

  const teamSettings = {
    primaryColor: teamData.team_color || "#3b82f6",
    victoryColor: "#ef4444",
    teamName: teamData.name,
    logoUrl: getStorageUrl(teamData.team_logo, "team_assets"),
  };

  const themeStyle = {
    "--team-color": teamSettings.primaryColor,
    "--victory-color": teamSettings.victoryColor,
  } as React.CSSProperties;

  // イニングごとのスコア配列を作成
  const topPoints = game.top_points || [];
  const bottomPoints = game.bottom_points || [];
  const maxInnings = Math.max(topPoints.length, bottomPoints.length, 7);
  const innings = Array.from({ length: maxInnings }, (_, i) => i + 1);

  // 打席結果を整理
  const minBattingIndexByOrder = new Map<number, number>();
  battingResults.forEach((br) => {
    const current = minBattingIndexByOrder.get(br.batting_order);
    if (current === undefined || br.batting_index < current) {
      minBattingIndexByOrder.set(br.batting_order, br.batting_index);
    }
  });

  const batterStats = battingResults.map((br) => {
    const details = battingDetails.filter(
      (bd) => bd.batting_index === br.batting_order,
    );
    let atBatCount = 0;
    let hitCount = 0;
    let rbiCount = 0;
    const results = Array.from({ length: maxInnings }, () => ({
      text: "",
      directionNo: null as number | null,
      resultNo: null as number | null,
      hasRbi: false,
    }));
    details.forEach((d) => {
      if (d.at_bat_results?.is_at_bat === true) {
        atBatCount += 1;
      }
      if (typeof d.at_bat_results?.bases === "number") {
        hitCount += 1;
      }
      if (typeof d.rbi === "number") {
        rbiCount += d.rbi;
      }
      if (d.inning && d.inning <= maxInnings) {
        const directionLabel = d.direction_no
          ? positionMap[d.direction_no]
          : "";
        const resultLabel = d.at_bat_results?.display_name || "";
        const rbiLabel = getCircledNumber(d.rbi);
        const displayText = [directionLabel, resultLabel, rbiLabel]
          .filter(Boolean)
          .join("");
        results[d.inning - 1] = {
          text: displayText,
          directionNo: d.direction_no ?? null,
          resultNo: d.at_bat_results?.no ?? null,
          hasRbi: rbiLabel !== "",
        };
      }
    });
    let rawPositions: number[] = [];
    if (Array.isArray(br.positions)) {
      rawPositions = (br.positions as number[])
        .map((pos: number | string) => Number(pos))
        .filter((pos) => Number.isFinite(pos));
    } else if (typeof br.positions === "string") {
      rawPositions = br.positions
        .replace(/[{}]/g, "")
        .split(",")
        .map((value: any) => Number(value))
        .filter((pos: number) => Number.isFinite(pos));
    } else if (typeof br.positions === "number") {
      rawPositions = [br.positions];
    }

    if (rawPositions.length === 0 && br.position) {
      rawPositions = [Number(br.position)];
    }

    const positionList = rawPositions
      .map((pos) => positionMap[pos])
      .filter(Boolean);
    const posLabel = positionList.length > 0 ? positionList.join("→") : "";
    const minIndex = minBattingIndexByOrder.get(br.batting_order);
    const isSub = minIndex !== undefined && br.batting_index !== minIndex;

    return {
      num: br.batting_order,
      pos: posLabel,
      name: br.playerName,
      results,
      ab: atBatCount,
      h: hitCount,
      rbi: rbiCount,
      sb: br.steal || 0,
      cs: br.steal_miss || 0,
      r: br.run || 0,
      e: br.df_error || 0,
      isSub,
    };
  });

  // 結果表示
  let resultBadge = null;
  if (game.status === null || game.status === 0) {
    resultBadge = (
      <span className="font-black bg-slate-400 text-white px-3 md:px-4 py-1 md:py-1.5 rounded-full shadow-sm">
        試合前
      </span>
    );
  } else if (game.status === 1) {
    resultBadge = (
      <span className="font-black bg-red-500 text-white px-3 md:px-4 py-1 md:py-1.5 rounded-full italic shadow-sm">
        WIN!
      </span>
    );
  } else if (game.status === 2) {
    resultBadge = (
      <span className="font-black bg-blue-500 text-white px-3 md:px-4 py-1 md:py-1.5 rounded-full italic shadow-sm">
        LOSE
      </span>
    );
  } else if (game.status === 3) {
    resultBadge = (
      <span className="font-black bg-gray-500 text-white px-3 md:px-4 py-1 md:py-1.5 rounded-full italic shadow-sm">
        DRAW
      </span>
    );
  } else if (game.status === 4) {
    resultBadge = (
      <span className="font-black bg-green-500 text-white px-3 md:px-4 py-1 md:py-1.5 rounded-full shadow-sm">
        不戦勝
      </span>
    );
  } else if (game.status === 5) {
    resultBadge = (
      <span className="font-black bg-purple-500 text-white px-3 md:px-4 py-1 md:py-1.5 rounded-full shadow-sm">
        不戦敗
      </span>
    );
  } else if (game.status === 6) {
    resultBadge = (
      <span className="font-black bg-orange-500 text-white px-3 md:px-4 py-1 md:py-1.5 rounded-full shadow-sm">
        中止
      </span>
    );
  }

  // サヨナラ判定
  const sumPoints = (points: number[]) =>
    points.reduce((acc, value) => acc + value, 0);
  const lastInningIndex = maxInnings - 1;
  const topBeforeFinal = sumPoints(topPoints.slice(0, lastInningIndex));
  const bottomBeforeFinal = sumPoints(bottomPoints.slice(0, lastInningIndex));
  const afterTopFinalTop = topBeforeFinal + (topPoints[lastInningIndex] ?? 0);
  const afterTopFinalBottom = bottomBeforeFinal;
  const afterBottomFinalBottom =
    bottomBeforeFinal + (bottomPoints[lastInningIndex] ?? 0);
  const bottomBatted = bottomPoints.length >= maxInnings;

  const isWalkoff =
    bottomBatted &&
    afterTopFinalBottom <= afterTopFinalTop &&
    afterBottomFinalBottom > afterTopFinalTop;
  const showNoBottomX = !bottomBatted;

  const formatBottomInningScore = (
    score: number | undefined,
    index: number,
  ) => {
    if (index !== innings.length - 1) return score ?? "";
    if (showNoBottomX) return "x";
    if (isWalkoff) return `${score ?? ""}x`;
    return score ?? "";
  };

  const scoreX = isWalkoff ? "x" : "";

  const gameDate = new Date(game.start_datetime);
  const dateStr = `${gameDate.getFullYear()}年${gameDate.getMonth() + 1}月${gameDate.getDate()}日`;
  const dayNames = ["日", "月", "火", "水", "木", "金", "土"];
  const dayStr = dayNames[gameDate.getDay()];

  const startTime = new Date(game.start_datetime).toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  // 戻るリンク用のURL構築
  const backUrl = new URLSearchParams();
  if (searchParams.year) backUrl.set("year", searchParams.year);
  if (searchParams.month) backUrl.set("month", searchParams.month);
  const backHref = `/${params.teamId}/games${backUrl.toString() ? `?${backUrl.toString()}` : ""}`;

  // スコアボードを非表示にする条件（試合前、不戦勝、不戦敗、中止）
  const shouldHideScoreboard =
    game.result === "next" || game.result === "other";

  // 試合ステータス表示
  const getStatusText = (status: number | null) => {
    if (status === null || status === 0) return "試合前";
    if (status === 1) return "勝利";
    if (status === 2) return "敗北";
    if (status === 3) return "引き分け";
    if (status === 4) return "不戦勝";
    if (status === 5) return "不戦敗";
    if (status === 6) return "中止";
    return "その他";
  };

  return (
    <div
      className="min-h-screen bg-gray-50 text-slate-800 pb-20"
      style={themeStyle}
    >
      <FrontMenu
        teamName={teamSettings.teamName}
        teamLogo={teamSettings.logoUrl}
        teamColor={teamSettings.primaryColor}
      />
      <main className="pt-40 md:pt-48 max-w-6xl mx-auto px-4 md:px-6">
        {/* 戻るボタン */}
        <div className="flex items-center gap-4 mb-12">
          <Link
            href={backHref}
            className="text-gray-500 hover:text-gray-700 flex items-center"
          >
            <ChevronLeft size={24} className="mr-1" /> 試合一覧
          </Link>
        </div>
        <div className="flex items-center gap-4 mb-5">
          <span className="w-2 h-10 bg-(--team-color) rounded-full"></span>
          <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-slate-900">
            試合予定・結果
          </h2>
        </div>
        {/* スコアボード */}
        <section className="bg-white rounded-[2.5rem] p-6 md:p-10 shadow-xl border border-slate-100 mb-8 overflow-hidden">
          <div className="flex justify-between items-center mb-10 px-4">
            {shouldHideScoreboard || !game.is_batting_first ? (
              <>
                {/* 自チーム */}
                <div className="w-1/3 flex flex-col items-center text-center">
                  <p className="font-black text-slate-400 mb-2 uppercase tracking-widest">
                    HOME
                  </p>
                  <div className="w-12 h-12 md:w-20 md:h-20 bg-blue-50 flex items-center justify-center rounded-2xl overflow-hidden">
                    {teamIconDisplay.type === "image" ? (
                      <img
                        src={teamIconDisplay.content}
                        className="w-full h-full object-contain"
                        alt={teamIconDisplay.alt}
                      />
                    ) : (
                      <span className="text-xl md:text-3xl font-black text-slate-600">
                        {teamIconDisplay.content}
                      </span>
                    )}
                  </div>
                </div>
                <div className="px-6 text-center shrink-0">
                  <div className="mt-4">{resultBadge}</div>

                  <span className="text-4xl md:text-8xl font-black italic tracking-tighter mx-4 leading-none">
                    {shouldHideScoreboard
                      ? "-"
                      : `${game.myScore} - ${game.opponentScore}${scoreX}`}
                  </span>
                </div>
                {/* 相手チーム */}
                <div className="w-1/3 flex flex-col items-center text-center">
                  <p className="font-black text-slate-400 mb-2 uppercase tracking-widest">
                    VISITOR
                  </p>
                  <div className="w-12 h-12 md:w-20 md:h-20 bg-blue-50 text-slate-600 flex items-center justify-center rounded-3xl font-black overflow-hidden">
                    {vsTeamIconDisplay.type === "image" ? (
                      <img
                        src={vsTeamIconDisplay.content}
                        className="w-full h-full object-contain"
                        alt={vsTeamIconDisplay.alt}
                      />
                    ) : (
                      <span className="text-xl md:text-3xl">
                        {vsTeamIconDisplay.content}
                      </span>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* 相手チーム（先攻） */}
                <div className="w-1/3 flex flex-col items-center text-center">
                  <p className="font-black text-slate-400 mb-2 uppercase tracking-widest">
                    VISITOR
                  </p>
                  <div className="w-12 h-12 md:w-20 md:h-20 bg-blue-50 text-slate-600 flex items-center justify-center rounded-3xl font-black overflow-hidden">
                    {vsTeamIconDisplay.type === "image" ? (
                      <img
                        src={vsTeamIconDisplay.content}
                        className="w-full h-full object-contain"
                        alt={vsTeamIconDisplay.alt}
                      />
                    ) : (
                      <span className="text-xl md:text-3xl">
                        {vsTeamIconDisplay.content}
                      </span>
                    )}
                  </div>
                </div>
                <div className="px-6 text-center shrink-0">
                  <div className="mt-4">{resultBadge}</div>

                  <span className="text-4xl md:text-8xl font-black italic tracking-tighter mx-4 leading-none">
                    {shouldHideScoreboard
                      ? "-"
                      : `${game.opponentScore} - ${game.myScore}${scoreX}`}
                  </span>
                </div>
                {/* 自チーム（後攻） */}
                <div className="w-1/3 flex flex-col items-center text-center">
                  <p className="font-black text-slate-400 mb-2 uppercase tracking-widest">
                    HOME
                  </p>
                  <div className="w-12 h-12 md:w-20 md:h-20 bg-blue-50 flex items-center justify-center rounded-2xl overflow-hidden">
                    {teamIconDisplay.type === "image" ? (
                      <img
                        src={teamIconDisplay.content}
                        className="w-full h-full object-contain"
                        alt={teamIconDisplay.alt}
                      />
                    ) : (
                      <span className="text-xl md:text-3xl font-black text-slate-600">
                        {teamIconDisplay.content}
                      </span>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
          {!shouldHideScoreboard && (
            <div className="overflow-x-auto rounded-2xl bg-slate-50 p-2 md:p-6 border border-slate-100">
              <table className="w-full font-black border-separate border-spacing-y-1 table-fixed">
                <thead>
                  <tr className="text-slate-400 tracking-widest">
                    <th className="py-2 text-left px-4 w-40 md:w-48">
                      チーム名
                    </th>
                    {innings.map((n) => (
                      <th key={n} className="w-8 md:w-12 text-center">
                        {n}
                      </th>
                    ))}
                    {/* 合計列：border-lで区切りを強調 */}
                    <th className="w-12 md:w-16 text-slate-900 border-l border-slate-200 text-center">
                      計
                    </th>
                  </tr>
                </thead>
                <tbody className="text-xl md:text-3xl italic">
                  {game.is_batting_first ? (
                    <>
                      <tr className="bg-blue-50/50 shadow-sm text-(--team-color)">
                        <td className="py-4 text-left px-4 text-xs md:text-sm not-italic font-bold text-(--team-color)">
                          <div className="truncate md:whitespace-normal">
                            {teamSettings.teamName}
                          </div>
                        </td>
                        {innings.map((n, i) => (
                          <td key={n} className="text-center">
                            {topPoints[i] !== undefined ? topPoints[i] : ""}
                          </td>
                        ))}
                        <td className="text-center border-l border-blue-100 rounded-r-xl bg-blue-100/50">
                          {game.myScore}
                        </td>
                      </tr>

                      <tr className="h-2"></tr>

                      <tr className="bg-white shadow-sm">
                        <td className="py-4 text-left px-4 text-xs md:text-sm not-italic font-bold">
                          <div className="truncate md:whitespace-normal">
                            {game.opponentName}
                          </div>
                        </td>
                        {innings.map((n, i) => (
                          <td key={n} className="text-center">
                            {formatBottomInningScore(bottomPoints[i], i)}
                          </td>
                        ))}
                        <td className="text-center text-slate-900 border-l border-slate-100 rounded-r-xl bg-slate-50/50">
                          {game.opponentScore}
                        </td>
                      </tr>
                    </>
                  ) : (
                    <>
                      <tr className="bg-white shadow-sm">
                        <td className="py-4 text-left px-4 text-base not-italic font-bold">
                          <div className="truncate md:whitespace-normal">
                            {game.opponentName}
                          </div>
                        </td>
                        {innings.map((n, i) => (
                          <td key={n} className="text-center">
                            {topPoints[i] !== undefined ? topPoints[i] : ""}
                          </td>
                        ))}
                        <td className="text-center text-slate-900 border-l border-slate-100 rounded-r-xl bg-slate-50/50">
                          {game.opponentScore}
                        </td>
                      </tr>

                      <tr className="h-2"></tr>

                      <tr className="bg-blue-50/50 shadow-sm text-(--team-color)">
                        <td className="py-4 text-left px-4 text-base not-italic font-bold text-(--team-color)">
                          <div className="truncate md:whitespace-normal">
                            {teamSettings.teamName}
                          </div>
                        </td>
                        {innings.map((n, i) => (
                          <td key={n} className="text-center">
                            {formatBottomInningScore(bottomPoints[i], i)}
                          </td>
                        ))}
                        <td className="text-center border-l border-blue-100 rounded-r-xl bg-blue-100/50">
                          {game.myScore}
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* 試合基本情報 (日時・場所・審判など) */}
        <div className="bg-white rounded-4xl p-6 md:p-8 shadow-sm border border-slate-100 mb-8">
          <h4 className="flex items-center gap-2 text-lg font-black mb-4">
            <span className="w-1.5 h-5 bg-(--team-color) rounded-full"></span>
            試合情報
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6">
            <div>
              <p className="text-slate-400 font-black mb-1">試合ステータス</p>
              <p className="font-bold">{getStatusText(game.status)}</p>
            </div>
            <div>
              <p className="text-slate-400 font-black mb-1">試合日</p>
              <p className="font-bold">
                {dateStr} ({dayStr})
              </p>
            </div>
            <div>
              <p className="text-slate-400 font-black mb-1">試合開始時間</p>
              <p className="font-bold">{startTime}～</p>
            </div>
            <div>
              <p className="text-slate-400 font-black mb-1">リーグ</p>
              <p className="font-bold">{game.leagueName}</p>
            </div>

            <div>
              <p className="text-slate-400 font-black mb-1">グラウンド</p>
              <p className="font-bold">{game.groundName}</p>
            </div>
            <div>
              <p className="text-slate-400 font-black mb-1">成績反映</p>
              <p className="font-bold">
                {game.sum_flg ? "反映する" : "反映しない"}
              </p>
            </div>
            <div className="col-span-2 md:col-span-3">
              <p className="text-slate-400 font-black mb-1">備考</p>
              <p className="font-bold">{game.remarks || "-"}</p>
            </div>
          </div>
        </div>

        {/* 試合講評 */}
        {game.comment && (
          <section className="bg-white rounded-4xl p-6 md:p-8 shadow-sm border border-slate-100 mb-8">
            <h4 className="flex items-center gap-2 text-xl font-black mb-4">
              <span className="w-1.5 h-6 bg-(--team-color) rounded-full"></span>
              試合講評
            </h4>
            <p className="text-slate-600 leading-relaxed font-medium">
              {game.comment}
            </p>
          </section>
        )}

        {/* 打撃成績 */}
        {!shouldHideScoreboard && (
          <section className="bg-white rounded-4xl p-6 md:p-8 shadow-sm border border-slate-100 mb-8 overflow-hidden">
            <div className="flex justify-between items-end mb-6">
              <h4 className="flex items-center gap-2 text-xl font-black">
                <span className="w-1.5 h-6 bg-(--team-color) rounded-full"></span>
                打撃成績
              </h4>
              <span className="font-bold text-slate-300 tracking-widest uppercase italic">
                Batting Box Score
              </span>
            </div>

            <div className="overflow-x-auto -mx-6 px-6">
              <table className="w-full border-collapse min-w-200">
                <thead className="bg-slate-50 text-slate-400 font-black tracking-wider">
                  <tr>
                    <th className="p-3 text-left w-12">打順</th>
                    <th className="p-3 text-left min-w-15">守備</th>
                    <th className="p-3 text-left w-24">選手名</th>
                    {innings.map((n) => (
                      <th key={n} className="p-3 w-17">
                        {n}
                      </th>
                    ))}
                    <th className="p-3 bg-blue-50/50 text-blue-600">打数</th>
                    <th className="p-3 bg-red-50/50 text-red-600">安打</th>
                    <th className="p-3">打点</th>
                    <th className="p-3">得点</th>
                    <th className="p-3">盗塁</th>
                    <th className="p-3">盗失</th>
                    <th className="p-3">失策</th>
                  </tr>
                </thead>
                <tbody className="font-bold text-slate-700">
                  {batterStats.map((row) => (
                    <tr
                      key={row.num}
                      className={`border-b border-slate-50  transition-colors text-center ${
                        row.isSub
                          ? "bg-amber-50/80 hover:bg-amber-100"
                          : "hover:bg-slate-100"
                      }`}
                    >
                      <td className="p-3 text-left text-slate-300 font-black italic">
                        {row.num}
                      </td>
                      <td className="p-3 text-left font-black text-slate-400">
                        {row.pos}
                      </td>
                      <td className="p-3 text-left font-black text-base whitespace-nowrap">
                        {row.name}
                      </td>
                      {row.results.map((r, idx) => (
                        <td key={idx} className="p-2">
                          <span
                            className={`block p-1 rounded-md text-center border whitespace-nowrap ${
                              r.resultNo && [4, 5, 6, 7].includes(r.resultNo)
                                ? "bg-red-50 text-red-600 border-red-100"
                                : r.resultNo && [2, 3].includes(r.resultNo)
                                  ? "bg-blue-50 text-blue-600 border-blue-100"
                                  : "text-slate-500 border-transparent"
                            } ${r.hasRbi ? "font-black" : ""}`}
                          >
                            {r.text}
                          </span>
                        </td>
                      ))}
                      <td className="p-3 bg-blue-50/30 text-slate-900">
                        {row.ab}
                      </td>
                      <td className="p-3 bg-red-50/30 text-red-600">{row.h}</td>
                      <td className="p-3 text-lg italic text-slate-900">
                        {row.rbi}
                      </td>
                      <td className="p-3 text-slate-400">{row.r}</td>
                      <td className="p-3 text-slate-400">{row.sb}</td>
                      <td className="p-3 text-slate-400">{row.cs}</td>
                      <td className="p-3 text-slate-400">{row.e}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* 投手成績 */}
        {!shouldHideScoreboard && (
          <section className="bg-white rounded-4xl p-6 md:p-8 shadow-sm border border-slate-100 mb-5">
            <div className="flex justify-between items-end mb-6">
              <h4 className="flex items-center gap-2 text-xl font-black">
                <span className="w-1.5 h-6 bg-(--team-color) rounded-full"></span>
                投手成績
              </h4>
              <span className="font-bold text-slate-300 tracking-widest uppercase italic">
                Pitching Stats
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-center min-w-175">
                <thead className="bg-slate-50 text-slate-400 font-black tracking-wider">
                  <tr>
                    <th className="p-3 text-left rounded-l-xl">選手名</th>
                    <th className="p-3">結果</th>
                    <th className="p-3">イニング</th>
                    <th className="p-3">失点</th>
                    <th className="p-3">奪三振</th>
                    <th className="p-3">四球</th>
                    <th className="p-3">死球</th>
                    <th className="p-3">安打</th>
                    <th className="p-3">被本</th>
                  </tr>
                </thead>
                <tbody className="font-bold text-slate-700">
                  {pitchingResults.map((pr, idx) => {
                    const inningDisplay =
                      pr.innings && pr.outs
                        ? `${pr.innings}回 ${pr.outs}/3`
                        : pr.innings || 0 + "回";

                    let resultBadge = null;
                    if (pr.is_win_lose) {
                      resultBadge =
                        game.result === "win" ? (
                          <span className="bg-red-500 text-white font-black px-3 py-1 rounded-full italic shadow-sm text-xs">
                            勝利
                          </span>
                        ) : game.result === "lose" ? (
                          <span className="bg-blue-500 text-white font-black px-3 py-1 rounded-full italic shadow-sm text-xs">
                            敗戦
                          </span>
                        ) : null;
                    } else if (pr.is_hold) {
                      resultBadge = (
                        <span className="bg-yellow-500 text-white font-black px-3 py-1 rounded-full italic shadow-sm text-xs">
                          H
                        </span>
                      );
                    } else if (pr.is_save) {
                      resultBadge = (
                        <span className="bg-purple-500 text-white font-black px-3 py-1 rounded-full italic shadow-sm text-xs">
                          セーブ
                        </span>
                      );
                    }

                    return (
                      <tr
                        key={idx}
                        className="border-b border-slate-50 hover:bg-slate-50"
                      >
                        <td className="p-4 text-left font-black text-lg whitespace-nowrap">
                          {pr.playerName}
                        </td>
                        <td className="p-4 whitespace-nowrap">{resultBadge}</td>
                        <td className="p-4 text-2xl font-black italic text-slate-900 tracking-tighter whitespace-nowrap">
                          {inningDisplay}
                        </td>
                        <td className="p-4">{pr.runs || 0}</td>
                        <td className="p-4">{pr.strikeout || 0}</td>
                        <td className="p-4">{pr.walks || 0}</td>
                        <td className="p-4">{pr.hbp || 0}</td>
                        <td className="p-4">{pr.hits || 0}</td>
                        <td className="p-4">{pr.homeruns || 0}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
