"use client";

import React, { useEffect, useMemo, useState } from "react";
import FrontMenu from "../../components/FrontMenu";
import Footer from "../../components/Footer";
import {
  aggregateBattingRows,
  aggregatePitchingRows,
  type BattingAggregate,
  type PitchingAggregate,
} from "@/utils/statsAggregation";
import { formatRate } from "@/utils/rateFormat";

type TabKey = "年度別" | "対チーム別" | "球場別" | "リーグ別";
type SortDirection = "asc" | "desc";

type BattingSortKey =
  | "name"
  | "avg"
  | "games"
  | "pa"
  | "ab"
  | "h"
  | "hr"
  | "rbi"
  | "sb"
  | "obp"
  | "ops";

type PitchingSortKey =
  | "name"
  | "era"
  | "wins"
  | "losses"
  | "games"
  | "ip"
  | "strikeouts"
  | "walks"
  | "whip";

interface Props {
  teamId: string;
  teamName: string;
  teamColor: string;
  teamLogo: string | null;
  battingDaily: Record<string, any>[];
  pitchingDaily: Record<string, any>[];
  playerNameMap: Record<string, string>;
  playerNumberMap: Record<string, number | null>;
  gamesForQualification: {
    gameId: string;
    seasonYear: string;
    leagueName: string;
    groundName: string;
    vsteamName: string;
  }[];
}

const normalize = (value: string | null | undefined) =>
  value && value.trim() ? value : "未設定";

const toNumber = (value: unknown) =>
  typeof value === "number" ? value : Number(value ?? 0);

function matchesFilter(
  row: Record<string, any>,
  tab: TabKey,
  selected: string,
  selectedYear: string,
) {
  if (tab !== "年度別" && selectedYear) {
    if (String(row.season_year ?? "") !== selectedYear) {
      return false;
    }
  }

  if (!selected) return true;

  if (tab === "年度別") {
    return String(row.season_year ?? "") === selected;
  }
  if (tab === "対チーム別") {
    return normalize(row.vsteam_name) === selected;
  }
  if (tab === "球場別") {
    return normalize(row.ground_name) === selected;
  }
  return normalize(row.league_name) === selected;
}

function formatDecimal1(value: number) {
  return Number.isFinite(value) ? value.toFixed(1) : "0.0";
}

function formatInningsWithOuts(ip: number) {
  const safeIp = Number.isFinite(ip) ? Math.max(0, ip) : 0;
  const totalOuts = Math.round(safeIp * 3);
  const normalizedInnings = Math.floor(totalOuts / 3);
  const outs = totalOuts % 3;
  return `${normalizedInnings}回 ${outs}/3`;
}

function sortIndicator(active: boolean, direction: SortDirection) {
  if (!active) return "";
  return direction === "asc" ? " ▲" : " ▼";
}

export default function StatsAnalysisClient({
  teamId,
  teamName,
  teamColor,
  teamLogo,
  battingDaily,
  pitchingDaily,
  playerNameMap,
  playerNumberMap,
  gamesForQualification,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>("年度別");
  const [selectedFilter, setSelectedFilter] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [battingSort, setBattingSort] = useState<{
    key: BattingSortKey;
    direction: SortDirection;
  }>({ key: "avg", direction: "desc" });
  const [pitchingSort, setPitchingSort] = useState<{
    key: PitchingSortKey;
    direction: SortDirection;
  }>({ key: "era", direction: "asc" });

  const validPlayerIds = useMemo(
    () => new Set(Object.keys(playerNameMap)),
    [playerNameMap],
  );

  const themeStyle = {
    "--team-color": teamColor,
  } as React.CSSProperties;

  const filterOptions = useMemo(() => {
    const years = new Set<string>();
    const teams = new Set<string>();
    const grounds = new Set<string>();
    const leagues = new Set<string>();

    [...battingDaily, ...pitchingDaily].forEach((row) => {
      if (row.season_year !== null && row.season_year !== undefined) {
        years.add(String(row.season_year));
      }
      teams.add(normalize(row.vsteam_name));
      grounds.add(normalize(row.ground_name));
      leagues.add(normalize(row.league_name));
    });

    return {
      年度別: [...years].sort((a, b) => Number(b) - Number(a)),
      対チーム別: [...teams].sort((a, b) => a.localeCompare(b, "ja")),
      球場別: [...grounds].sort((a, b) => a.localeCompare(b, "ja")),
      リーグ別: [...leagues].sort((a, b) => a.localeCompare(b, "ja")),
    };
  }, [battingDaily, pitchingDaily]);

  useEffect(() => {
    const options = filterOptions[activeTab];
    setSelectedFilter(options[0] ?? "");
  }, [activeTab, filterOptions]);

  useEffect(() => {
    setSelectedYear(filterOptions["年度別"][0] ?? "");
  }, [filterOptions]);

  const handleBattingSort = (key: BattingSortKey) => {
    setBattingSort((prev) =>
      prev.key === key
        ? { key, direction: prev.direction === "asc" ? "desc" : "asc" }
        : { key, direction: key === "name" ? "asc" : "desc" },
    );
  };

  const handlePitchingSort = (key: PitchingSortKey) => {
    setPitchingSort((prev) =>
      prev.key === key
        ? { key, direction: prev.direction === "asc" ? "desc" : "asc" }
        : {
            key,
            direction:
              key === "name" || key === "era" || key === "whip"
                ? "asc"
                : "desc",
          },
    );
  };

  const filteredGamesForQualification = useMemo(() => {
    return gamesForQualification.filter((game) => {
      if (activeTab === "年度別") {
        return game.seasonYear === selectedFilter;
      }

      if (selectedYear && game.seasonYear !== selectedYear) {
        return false;
      }

      if (activeTab === "対チーム別") {
        return normalize(game.vsteamName) === selectedFilter;
      }

      if (activeTab === "球場別") {
        return normalize(game.groundName) === selectedFilter;
      }

      return normalize(game.leagueName) === selectedFilter;
    });
  }, [gamesForQualification, activeTab, selectedFilter, selectedYear]);

  const filteredBattingDaily = useMemo(
    () =>
      battingDaily.filter(
        (row) =>
          matchesFilter(row, activeTab, selectedFilter, selectedYear) &&
          !!row.player_id &&
          validPlayerIds.has(String(row.player_id)),
      ),
    [battingDaily, activeTab, selectedFilter, selectedYear, validPlayerIds],
  );

  const battingGameCount = filteredGamesForQualification.length;

  const battingQualifiedPa = useMemo(
    () => battingGameCount * 3.1,
    [battingGameCount],
  );

  const battingRows = useMemo(() => {
    const grouped = new Map<string, Record<string, any>[]>();
    filteredBattingDaily.forEach((row) => {
      if (!row.player_id) return;
      const key = String(row.player_id);
      const current = grouped.get(key) ?? [];
      current.push(row);
      grouped.set(key, current);
    });

    return Array.from(grouped.entries())
      .map(([playerId, rowsForPlayer]) => {
        const agg: BattingAggregate = aggregateBattingRows(rowsForPlayer, {
          playerId,
        });
        return {
          playerId,
          name: playerNameMap[playerId] || "不明",
          no: playerNumberMap[playerId],
          avg: agg.avg,
          pa: agg.pa,
          games: agg.g_count,
          ab: agg.ab,
          h: agg.h,
          hr: agg.hr,
          rbi: agg.rbi,
          sb: agg.sb,
          obp: agg.obp,
          ops: agg.ops,
          isQualified: agg.pa >= battingQualifiedPa,
        };
      })
      .sort((a, b) => {
        if (a.isQualified !== b.isQualified) return a.isQualified ? -1 : 1;

        if (battingSort.key === "name") {
          const aName = `${a.no ?? ""}${a.name}`;
          const bName = `${b.no ?? ""}${b.name}`;
          const result = aName.localeCompare(bName, "ja");
          return battingSort.direction === "asc" ? result : -result;
        }

        const aValue = toNumber(a[battingSort.key]);
        const bValue = toNumber(b[battingSort.key]);
        const result = aValue - bValue;
        return battingSort.direction === "asc" ? result : -result;
      });
  }, [
    filteredBattingDaily,
    playerNameMap,
    playerNumberMap,
    battingQualifiedPa,
    battingSort,
  ]);

  const filteredPitchingDaily = useMemo(
    () =>
      pitchingDaily.filter(
        (row) =>
          matchesFilter(row, activeTab, selectedFilter, selectedYear) &&
          !!row.player_id &&
          validPlayerIds.has(String(row.player_id)),
      ),
    [pitchingDaily, activeTab, selectedFilter, selectedYear, validPlayerIds],
  );

  const pitchingGameCount = filteredGamesForQualification.length;

  const pitchingQualifiedIp = useMemo(
    () => pitchingGameCount,
    [pitchingGameCount],
  );

  const pitchingRows = useMemo(() => {
    const grouped = new Map<string, Record<string, any>[]>();
    filteredPitchingDaily.forEach((row) => {
      if (!row.player_id) return;
      const key = String(row.player_id);
      const current = grouped.get(key) ?? [];
      current.push(row);
      grouped.set(key, current);
    });

    return Array.from(grouped.entries())
      .map(([playerId, rowsForPlayer]) => {
        const agg: PitchingAggregate = aggregatePitchingRows(rowsForPlayer, {
          playerId,
        });
        return {
          playerId,
          name: playerNameMap[playerId] || "不明",
          no: playerNumberMap[playerId],
          era: agg.era,
          wins: agg.wins,
          losses: agg.losses,
          games: agg.appearances,
          ip: agg.ip,
          strikeouts: agg.so,
          walks: agg.bb,
          whip: agg.whip,
          isQualified: agg.ip >= pitchingQualifiedIp,
        };
      })
      .filter(
        (row) =>
          row.games > 0 ||
          row.ip > 0 ||
          row.wins > 0 ||
          row.losses > 0 ||
          row.strikeouts > 0,
      )
      .sort((a, b) => {
        if (a.isQualified !== b.isQualified) return a.isQualified ? -1 : 1;

        if (pitchingSort.key === "name") {
          const aName = `${a.no ?? ""}${a.name}`;
          const bName = `${b.no ?? ""}${b.name}`;
          const result = aName.localeCompare(bName, "ja");
          return pitchingSort.direction === "asc" ? result : -result;
        }

        const aValue = toNumber(a[pitchingSort.key]);
        const bValue = toNumber(b[pitchingSort.key]);
        const result = aValue - bValue;
        return pitchingSort.direction === "asc" ? result : -result;
      });
  }, [
    filteredPitchingDaily,
    playerNameMap,
    playerNumberMap,
    pitchingQualifiedIp,
    pitchingSort,
  ]);

  const targetYear = activeTab === "年度別" ? selectedFilter : selectedYear;

  const teamYearBatting = useMemo(() => {
    if (!targetYear) return null;
    const rows = battingDaily.filter(
      (row) =>
        String(row.season_year ?? "") === targetYear &&
        !!row.player_id &&
        validPlayerIds.has(String(row.player_id)),
    );
    return aggregateBattingRows(rows);
  }, [battingDaily, targetYear, validPlayerIds]);

  const teamYearPitching = useMemo(() => {
    if (!targetYear) return null;
    const rows = pitchingDaily.filter(
      (row) =>
        String(row.season_year ?? "") === targetYear &&
        !!row.player_id &&
        validPlayerIds.has(String(row.player_id)),
    );
    return aggregatePitchingRows(rows);
  }, [pitchingDaily, targetYear, validPlayerIds]);

  const battingHeaders: { label: string; key: BattingSortKey }[] = [
    { label: "打率", key: "avg" },
    { label: "試合", key: "games" },
    { label: "打席", key: "pa" },
    { label: "打数", key: "ab" },
    { label: "安打", key: "h" },
    { label: "本塁打", key: "hr" },
    { label: "打点", key: "rbi" },
    { label: "盗塁", key: "sb" },
    { label: "出塁率", key: "obp" },
    { label: "OPS", key: "ops" },
  ];

  const pitchingHeaders: { label: string; key: PitchingSortKey }[] = [
    { label: "防御率", key: "era" },
    { label: "勝利", key: "wins" },
    { label: "敗戦", key: "losses" },
    { label: "試合", key: "games" },
    { label: "投球回", key: "ip" },
    { label: "奪三振", key: "strikeouts" },
    { label: "与四球", key: "walks" },
    { label: "WHIP", key: "whip" },
  ];

  const filterLabel =
    activeTab === "年度別"
      ? "年度"
      : activeTab === "対チーム別"
        ? "対戦チーム"
        : activeTab === "球場別"
          ? "球場"
          : "リーグ";

  return (
    <div
      className="min-h-screen bg-gray-50 text-slate-800 pb-20"
      style={themeStyle}
    >
      <FrontMenu
        teamName={teamName}
        teamColor={teamColor}
        teamId={teamId}
        teamLogo={teamLogo || undefined}
      />

      <main className="pt-40 md:pt-48 max-w-6xl mx-auto px-6">
        <div className="flex items-center gap-4">
          <span className="w-2 h-10 bg-(--team-color) rounded-full"></span>
          <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-slate-900">
            個人成績
          </h2>
        </div>

        <div className="flex flex-wrap gap-2 mb-8 bg-white p-2 rounded-4xl shadow-sm border border-slate-100 mt-5">
          {(["年度別", "対チーム別", "球場別", "リーグ別"] as const).map(
            (tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 min-w-25 py-3 px-6 rounded-full font-black transition-all ${
                  activeTab === tab
                    ? "bg-(--team-color) text-white shadow-lg scale-105"
                    : "text-slate-400 hover:bg-slate-50 cursor-pointer"
                }`}
              >
                {tab}
              </button>
            ),
          )}
        </div>

        <div className="bg-white p-6 rounded-4xl shadow-sm border border-slate-100 mb-8 flex flex-wrap gap-4 items-center">
          <span className="font-black text-slate-400 uppercase tracking-widest">
            分析条件:
          </span>
          {activeTab !== "年度別" && (
            <>
              <span className="font-bold text-slate-500">年度</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-slate-50 border-none rounded-xl px-4 py-2 font-bold focus:ring-2 focus:ring-(--team-color)"
              >
                {(filterOptions["年度別"] || []).length === 0 ? (
                  <option value="">データなし</option>
                ) : (
                  filterOptions["年度別"].map((value) => (
                    <option key={value} value={value}>
                      {value}年度
                    </option>
                  ))
                )}
              </select>
            </>
          )}
          <span className="font-bold text-slate-500">{filterLabel}</span>
          <select
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
            className="bg-slate-50 border-none rounded-xl px-4 py-2 font-bold focus:ring-2 focus:ring-(--team-color)"
          >
            {(filterOptions[activeTab] || []).length === 0 ? (
              <option value="">データなし</option>
            ) : (
              filterOptions[activeTab].map((value) => (
                <option key={value} value={value}>
                  {activeTab === "年度別" ? `${value}年度` : value}
                </option>
              ))
            )}
          </select>
        </div>

        <section className="bg-white rounded-[2.5rem] p-6 md:p-8 shadow-sm border border-slate-100 overflow-hidden mb-12">
          <div className="flex justify-between items-end mb-6">
            <h4 className="flex items-center gap-2 text-xl font-black text-blue-500">
              <span className="w-1.5 h-6 bg-blue-500 rounded-full"></span>
              打撃成績
            </h4>
          </div>

          <div className="overflow-x-auto -mx-6">
            <table className="w-full text-center min-w-225">
              <thead className="bg-slate-50 text-slate-400 font-bold border-y border-slate-100">
                <tr>
                  <th
                    className="p-4 pl-10 text-left sticky left-0 bg-slate-50 z-10 cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => handleBattingSort("name")}
                  >
                    選手名
                    {sortIndicator(
                      battingSort.key === "name",
                      battingSort.direction,
                    )}
                  </th>
                  {battingHeaders.map((header) => (
                    <th
                      key={header.key}
                      className="p-4 cursor-pointer hover:bg-slate-100 transition-colors"
                      onClick={() => handleBattingSort(header.key)}
                    >
                      {header.label}
                      {sortIndicator(
                        battingSort.key === header.key,
                        battingSort.direction,
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="font-bold text-slate-700 italic">
                {battingRows.length === 0 && (
                  <tr>
                    <td
                      colSpan={11}
                      className="p-6 text-slate-400 not-italic font-semibold"
                    >
                      対象データがありません
                    </td>
                  </tr>
                )}
                {battingRows.map((p, i) => (
                  <React.Fragment key={p.playerId}>
                    {!p.isQualified &&
                      (i === 0 || battingRows[i - 1]?.isQualified) && (
                        <tr className="bg-blue-50/50">
                          <td
                            colSpan={2}
                            className="sticky left-0 bg-blue-50 z-10 py-2 pl-10 text-[12px] font-black text-blue-400 text-left whitespace-nowrap"
                          >
                            ▼ 規定打席未到達（規定打席:{" "}
                            {formatDecimal1(battingQualifiedPa)}）
                          </td>
                          <td
                            colSpan={9}
                            className="py-2 px-4 font-black bg-blue-50 text-blue-400 text-left"
                          ></td>
                        </tr>
                      )}
                    <tr
                      className={`border-b border-slate-50 hover:bg-slate-50 transition-colors ${
                        !p.isQualified ? "opacity-50" : ""
                      }`}
                    >
                      <td className="p-4 pl-10 text-left not-italic font-black text-slate-900 sticky left-0 bg-white z-10 border-b border-slate-50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                        {p.no !== null && p.no !== undefined ? `#${p.no} ` : ""}
                        {p.name}
                      </td>
                      <td className="p-4 text-blue-600 text-lg">
                        {formatRate(p.avg ?? 0)}
                      </td>
                      <td>{p.games}</td>
                      <td>{p.pa}</td>
                      <td>{p.ab}</td>
                      <td>{p.h}</td>
                      <td>{p.hr}</td>
                      <td>{p.rbi}</td>
                      <td>{p.sb}</td>
                      <td>{formatRate(p.obp ?? 0)}</td>
                      <td>{formatRate(p.ops ?? 0)}</td>
                    </tr>
                  </React.Fragment>
                ))}
                {teamYearBatting && (
                  <tr className="border-t-2 border-blue-200 bg-blue-50/40 text-slate-900 not-italic">
                    <td className="p-4 pl-10 text-left font-black sticky left-0 bg-blue-50/40 z-10">
                      チーム成績
                    </td>
                    <td className="p-4 text-blue-700 text-lg font-black">
                      {formatRate(teamYearBatting.avg ?? 0)}
                    </td>
                    <td className="font-black">{battingGameCount}</td>
                    <td className="font-black">{teamYearBatting.pa}</td>
                    <td className="font-black">{teamYearBatting.ab}</td>
                    <td className="font-black">{teamYearBatting.h}</td>
                    <td className="font-black">{teamYearBatting.hr}</td>
                    <td className="font-black">{teamYearBatting.rbi}</td>
                    <td className="font-black">{teamYearBatting.sb}</td>
                    <td className="font-black">
                      {formatRate(teamYearBatting.obp ?? 0)}
                    </td>
                    <td className="font-black">
                      {formatRate(teamYearBatting.ops ?? 0)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="bg-white rounded-[2.5rem] p-6 md:p-8 shadow-sm border border-slate-100 overflow-hidden mb-5">
          <div className="flex justify-between items-end mb-6">
            <h4 className="flex items-center gap-2 font-black text-red-600">
              <span className="w-1.5 h-6 bg-red-600 rounded-full"></span>
              投手成績
            </h4>
          </div>

          <div className="overflow-x-auto -mx-6">
            <table className="w-full text-center min-w-225">
              <thead className="bg-slate-50 text-slate-400 font-bold border-y border-slate-100">
                <tr>
                  <th
                    className="p-4 pl-10 text-left sticky left-0 bg-slate-50 z-10 cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => handlePitchingSort("name")}
                  >
                    選手名
                    {sortIndicator(
                      pitchingSort.key === "name",
                      pitchingSort.direction,
                    )}
                  </th>
                  {pitchingHeaders.map((header) => (
                    <th
                      key={header.key}
                      className="p-4 cursor-pointer hover:bg-slate-100 transition-colors"
                      onClick={() => handlePitchingSort(header.key)}
                    >
                      {header.label}
                      {sortIndicator(
                        pitchingSort.key === header.key,
                        pitchingSort.direction,
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="font-bold text-slate-700 italic">
                {pitchingRows.length === 0 && (
                  <tr>
                    <td
                      colSpan={9}
                      className="p-6 text-slate-400 not-italic font-semibold"
                    >
                      対象データがありません
                    </td>
                  </tr>
                )}
                {pitchingRows.map((p, i) => (
                  <React.Fragment key={p.playerId}>
                    {!p.isQualified &&
                      (i === 0 || pitchingRows[i - 1]?.isQualified) && (
                        <tr className="bg-red-50/50">
                          <td
                            colSpan={2}
                            className="sticky left-0 bg-red-50 z-10 py-2 pl-10 text-[12px] font-black text-red-400 text-left whitespace-nowrap"
                          >
                            ▼ 規定投球回未到達（規定投球回:{" "}
                            {pitchingQualifiedIp}）
                          </td>
                          <td
                            colSpan={7}
                            className="py-2 px-4 font-black bg-red-50 text-red-400 text-left"
                          ></td>
                        </tr>
                      )}
                    <tr
                      className={`border-b border-slate-50 hover:bg-slate-50 transition-colors ${
                        !p.isQualified ? "opacity-50" : ""
                      }`}
                    >
                      <td className="p-4 pl-10 text-left not-italic font-black text-slate-900 sticky left-0 bg-white">
                        {p.no !== null && p.no !== undefined ? `#${p.no} ` : ""}
                        {p.name}
                      </td>
                      <td className="p-4 text-red-600 text-lg">
                        {toNumber(p.era).toFixed(2)}
                      </td>
                      <td>{p.wins}</td>
                      <td>{p.losses}</td>
                      <td>{p.games}</td>
                      <td>{formatInningsWithOuts(p.ip)}</td>
                      <td>{p.strikeouts}</td>
                      <td>{p.walks}</td>
                      <td>{toNumber(p.whip).toFixed(2)}</td>
                    </tr>
                  </React.Fragment>
                ))}
                {teamYearPitching && (
                  <tr className="border-t-2 border-red-200 bg-red-50/40 text-slate-900 not-italic">
                    <td className="p-4 pl-10 text-left font-black sticky left-0 bg-red-50/40 z-10">
                      チーム成績
                    </td>
                    <td className="p-4 text-red-700 text-lg font-black">
                      {toNumber(teamYearPitching.era).toFixed(2)}
                    </td>
                    <td className="font-black">{teamYearPitching.wins}</td>
                    <td className="font-black">{teamYearPitching.losses}</td>
                    <td className="font-black">{battingGameCount}</td>
                    <td className="font-black">
                      {formatInningsWithOuts(teamYearPitching.ip)}
                    </td>
                    <td className="font-black">{teamYearPitching.so}</td>
                    <td className="font-black">{teamYearPitching.bb}</td>
                    <td className="font-black">
                      {toNumber(teamYearPitching.whip).toFixed(2)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
