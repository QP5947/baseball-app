"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import {
  Bracket as TournamentBracket,
  BracketGame,
  Model,
} from "react-tournament-bracket";
import { useEffect, useMemo, useState } from "react";
import {
  computeStandings,
  type PenpenMaster,
  type PenpenScheduleEntry,
  type TeamStanding,
  type GameResult,
} from "../lib/penpenData";
import { PENPEN_DEFAULT_HEADER_IMAGE } from "../lib/penpenStorage";

type TournamentImage = {
  id: string;
  leagueName: string;
  imagePath: string;
};

type TournamentScheduleGame = {
  id: string;
  date: string;
  startTime: string;
  awayTeamId: string;
  awayTeam: string;
  homeTeamId: string;
  homeTeam: string;
  awayScore: number | null;
  homeScore: number | null;
  isCanceled: boolean;
  forfeitWinner: "away" | "home" | null;
};

type GameBinding = {
  gameId: string;
  code: string;
  awaySourceCode: string;
  homeSourceCode: string;
};

type TournamentBindingPayload = {
  league_id: string;
  league_name: string;
  season_year: number;
  final_code: string | null;
  third_place_code: string | null;
  bindings: unknown;
};

type SourceOutcome = "winner" | "loser";

type ForfeitInfo = {
  forfeitWinner: "away" | "home" | null;
};

const ForfeitAwareBracketGame = (
  props: any,
  forfeitMap?: Map<string, ForfeitInfo>,
) => {
  const BRACKET_LABEL_STYLES = {
    backgroundColor: "#58595e",
    hoverBackgroundColor: "#222",
    scoreBackground: "#787a80",
    winningScoreBackground: "#ff7324",
    teamNameStyle: {
      fill: "#fff",
      fontSize: 12,
      textShadow: "1px 1px 1px #222",
    },
    teamScoreStyle: { fill: "#23252d", fontSize: 12 },
    gameNameStyle: { fill: "#bbb", fontSize: 13 },
    gameTimeStyle: { fill: "#bbb", fontSize: 11 },
    teamSeparatorStyle: { stroke: "#444549", strokeWidth: 1 },
  };

  const gameCode = props.game?.id as string | undefined;
  const forfeitWinner = gameCode
    ? forfeitMap?.get(gameCode)?.forfeitWinner
    : null;

  if (!forfeitWinner) {
    return <BracketGame {...props} styles={BRACKET_LABEL_STYLES} />;
  }

  const forfeitStyles = {
    ...BRACKET_LABEL_STYLES,
    // 数字は隠しつつ、winningScoreBackground の色差で勝者側を示す
    teamScoreStyle: {
      ...BRACKET_LABEL_STYLES.teamScoreStyle,
      fill: "transparent",
    },
  };

  return <BracketGame {...props} styles={forfeitStyles} />;
};

const STANDINGS_LEAGUE_ID = "1b8cbac7-ab3f-4006-bcad-d4db00e7e65c";
const UNDECIDED_TEAM_NAME = "未定";
const SOURCE_OUTCOME_LABEL: Record<SourceOutcome, string> = {
  winner: "勝者",
  loser: "敗者",
};

const createSeedFromGame = (
  label: string,
  sourceGame: Model.Game,
): Model.SideInfo["seed"] => ({
  displayName: label,
  rank: 1,
  sourceGame,
  sourcePool: {},
});

const toScheduledTimestamp = (date: string, startTime: string) => {
  const iso = `${date}T${startTime || "00:00"}:00+09:00`;
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return Date.now();
  }
  return parsed.getTime();
};

const toSafeScore = (value: number | null | undefined) => {
  if (typeof value !== "number") {
    return undefined;
  }
  return { score: value };
};

const isUndecidedTeam = (teamName: string) =>
  teamName.trim() === UNDECIDED_TEAM_NAME;

const toKnownTeam = (teamId: string, teamName: string) => {
  if (isUndecidedTeam(teamName) || !teamId) {
    return undefined;
  }

  return {
    id: teamId,
    name: teamName,
  };
};

const toSourceReferenceLabel = (code: string, outcome: SourceOutcome) => {
  if (!code) {
    return "";
  }
  return `${code} ${SOURCE_OUTCOME_LABEL[outcome]}`;
};

const toGameBinding = (value: unknown): GameBinding | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const item = value as Record<string, unknown>;
  if (
    typeof item.gameId !== "string" ||
    typeof item.code !== "string" ||
    typeof item.awaySourceCode !== "string" ||
    typeof item.homeSourceCode !== "string"
  ) {
    return null;
  }

  return {
    gameId: item.gameId,
    code: item.code,
    awaySourceCode: item.awaySourceCode,
    homeSourceCode: item.homeSourceCode,
  };
};

export default function StandingsPage() {
  useEffect(() => {
    document.title = "勝敗表 | ペンペンリーグ";
  }, []);

  const [activeTab, setActiveTab] = useState("standings");
  const [standings, setStandings] = useState<TeamStanding[]>([]);
  const [entries, setEntries] = useState<PenpenScheduleEntry[]>([]);
  const [tournaments, setTournaments] = useState<TournamentImage[]>([]);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [headerImageUrl, setHeaderImageUrl] = useState(
    PENPEN_DEFAULT_HEADER_IMAGE,
  );
  const [tournamentBindings, setTournamentBindings] = useState<
    TournamentBindingPayload[]
  >([]);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch("/penpen_league/api/standings", {
          method: "GET",
          credentials: "same-origin",
        });

        const payload = (await response.json().catch(() => null)) as {
          message?: string;
          masters?: {
            teams: PenpenMaster[];
          };
          entries?: PenpenScheduleEntry[];
          tournaments?: TournamentImage[];
          headerImageUrl?: string;
          currentYear?: number;
          tournamentBindings?: TournamentBindingPayload[];
        } | null;

        if (!response.ok) {
          throw new Error(payload?.message ?? `HTTP ${response.status}`);
        }

        const teamData = payload?.masters?.teams ?? [];
        const entries = payload?.entries ?? [];
        setEntries(entries);

        const enabledTeams = teamData.filter((item) => item.isEnabled);
        const leagueEntries = entries.map((entry) => ({
          ...entry,
          games: entry.games.filter(
            (game) => game.leagueId === STANDINGS_LEAGUE_ID,
          ),
        }));
        setStandings(computeStandings(leagueEntries, enabledTeams));

        setTournaments(payload?.tournaments ?? []);
        setCurrentYear(payload?.currentYear ?? new Date().getFullYear());
        setHeaderImageUrl(
          payload?.headerImageUrl ?? PENPEN_DEFAULT_HEADER_IMAGE,
        );

        setTournamentBindings(payload?.tournamentBindings ?? []);
      } catch (error) {
        window.alert(
          `勝敗表データの取得に失敗しました: ${error instanceof Error ? error.message : "unknown"}`,
        );
      }
    };

    void load();
  }, []);

  const orderedTeams = useMemo(
    () => standings.map((item) => item),
    [standings],
  );

  const getWinRate = (team: TeamStanding) =>
    team.w + team.l > 0 ? team.w / (team.w + team.l) : 0;

  const formatWinRate = (winRate: number) =>
    winRate.toFixed(3).replace(/^0(?=\.)/, "");

  const isSameRank = (a: TeamStanding, b: TeamStanding) => {
    if (a.pts !== b.pts) {
      return false;
    }

    const aGames = a.w + a.l;
    const bGames = b.w + b.l;
    if (aGames === 0 || bGames === 0) {
      return aGames === bGames;
    }

    return a.w * bGames === b.w * aGames;
  };

  const rankedTeams = useMemo(() => {
    let currentRank = 0;
    let previousTeam: TeamStanding | undefined;

    return orderedTeams.map((team, index) => {
      if (!previousTeam || !isSameRank(team, previousTeam)) {
        currentRank = index + 1;
      }

      previousTeam = team;
      return {
        team,
        rank: currentRank,
        winRate: getWinRate(team),
      };
    });
  }, [orderedTeams]);

  const getResultSymbols = (results: GameResult[] | undefined) => {
    if (!results || results.length === 0)
      return <span className="text-slate-200">-</span>;
    return (
      <span className="inline-flex gap-0.5 flex-wrap justify-center">
        {results.map((r, i) =>
          r === "w" ? (
            <span
              key={i}
              className="text-rose-500 font-black text-lg"
              title="勝ち"
            >
              ●
            </span>
          ) : r === "d" ? (
            <span
              key={i}
              className="text-slate-500 font-black text-lg"
              title="引き分け"
            >
              ▲
            </span>
          ) : r === "fw" ? (
            <span
              key={i}
              className="text-rose-500 font-black text-lg"
              title="不戦勝"
            >
              ■
            </span>
          ) : r === "fl" ? (
            <span
              key={i}
              className="text-blue-600 font-black text-lg"
              title="不戦敗"
            >
              ■
            </span>
          ) : (
            <span
              key={i}
              className="text-blue-600 font-black text-lg"
              title="負け"
            >
              ●
            </span>
          ),
        )}
      </span>
    );
  };

  const bracketSections = useMemo(() => {
    return tournamentBindings.map((binding) => {
      const filtered: TournamentScheduleGame[] = [];

      for (const entry of entries) {
        const date = new Date(`${entry.date}T00:00:00+09:00`);
        if (
          Number.isNaN(date.getTime()) ||
          date.getFullYear() !== binding.season_year
        ) {
          continue;
        }

        for (const game of entry.games) {
          if (game.gameType !== "トーナメント") {
            continue;
          }
          if (game.leagueId !== binding.league_id) {
            continue;
          }

          filtered.push({
            id: game.id,
            date: entry.date,
            startTime: game.startTime,
            awayTeamId: game.awayTeamId,
            awayTeam: game.awayTeam,
            homeTeamId: game.homeTeamId,
            homeTeam: game.homeTeam,
            awayScore: game.awayScore,
            homeScore: game.homeScore,
            isCanceled: game.isCanceled,
            forfeitWinner: game.forfeitWinner,
          });
        }
      }

      const tournamentGames = filtered.sort((a, b) => {
        const aKey = `${a.date}-${a.startTime}`;
        const bKey = `${b.date}-${b.startTime}`;
        return aKey.localeCompare(bKey);
      });

      const shouldInferSourcesFromMatchups =
        tournamentGames.length > 0 &&
        tournamentGames.every(
          (game) =>
            !isUndecidedTeam(game.awayTeam) && !isUndecidedTeam(game.homeTeam),
        );

      if (tournamentGames.length === 0) {
        return {
          key: `${binding.league_id}-${binding.season_year}`,
          title: binding.league_name,
          mainGame: null as Model.Game | null,
          thirdPlaceGame: null as Model.Game | null,
          forfeitByCode: new Map<string, ForfeitInfo>(),
        };
      }

      let rawBindings: unknown[] = [];
      if (Array.isArray(binding.bindings)) {
        rawBindings = binding.bindings;
      } else if (typeof binding.bindings === "string") {
        try {
          const parsed = JSON.parse(binding.bindings) as unknown;
          if (Array.isArray(parsed)) {
            rawBindings = parsed;
          }
        } catch {
          rawBindings = [];
        }
      }

      const parsedBindings: GameBinding[] = rawBindings
        .map(toGameBinding)
        .filter((item): item is GameBinding => item !== null);

      const bindingByGameId = new Map(
        parsedBindings.map((item) => [item.gameId, item]),
      );

      const gameByCode = new Map<string, Model.Game>();
      const outcomeByCode = new Map<
        string,
        { winner?: Model.SideInfo["team"]; loser?: Model.SideInfo["team"] }
      >();
      const forfeitByCode = new Map<string, ForfeitInfo>();
      const gameOrderById = new Map<string, number>();

      tournamentGames.forEach((game, index) => {
        gameOrderById.set(game.id, index);
      });

      const normalizeTeamName = (name: string) =>
        name.replace(/\s*\((不戦勝|中止)\)$/, "").trim();

      const inferSourceCodeFromTeam = (
        currentGameId: string,
        selfCode: string,
        teamName: string,
      ) => {
        if (!teamName || isUndecidedTeam(teamName)) {
          return "";
        }

        const currentOrder = gameOrderById.get(currentGameId);
        if (typeof currentOrder !== "number") {
          return "";
        }

        const normalizedTarget = normalizeTeamName(teamName);
        for (let order = currentOrder - 1; order >= 0; order -= 1) {
          const candidateGame = tournamentGames[order];
          if (!candidateGame || candidateGame.isCanceled) {
            continue;
          }

          const candidateCode = bindingByGameId
            .get(candidateGame.id)
            ?.code?.trim();
          if (!candidateCode || candidateCode === selfCode) {
            continue;
          }

          const away = normalizeTeamName(candidateGame.awayTeam);
          const home = normalizeTeamName(candidateGame.homeTeam);
          if (away === normalizedTarget || home === normalizedTarget) {
            return candidateCode;
          }
        }

        return "";
      };

      const previewReferencedCodes = new Set<string>();

      for (const game of tournamentGames) {
        const gameBinding = bindingByGameId.get(game.id);
        const code = gameBinding?.code?.trim();
        if (!gameBinding || !code) {
          continue;
        }

        const awayTeam = toKnownTeam(game.awayTeamId, game.awayTeam);
        const homeTeam = toKnownTeam(game.homeTeamId, game.homeTeam);

        let winner: Model.SideInfo["team"] | undefined;
        let loser: Model.SideInfo["team"] | undefined;

        if (!game.isCanceled) {
          if (game.forfeitWinner === "away") {
            winner = awayTeam;
            loser = homeTeam;
          } else if (game.forfeitWinner === "home") {
            winner = homeTeam;
            loser = awayTeam;
          } else if (
            typeof game.awayScore === "number" &&
            typeof game.homeScore === "number" &&
            game.awayScore !== game.homeScore
          ) {
            if (game.awayScore > game.homeScore) {
              winner = awayTeam;
              loser = homeTeam;
            } else {
              winner = homeTeam;
              loser = awayTeam;
            }
          }
        }

        const modelGame: Model.Game = {
          id: code,
          name: game.isCanceled ? `${code} (中止)` : code,
          scheduled: toScheduledTimestamp(game.date, game.startTime),
          sides: {
            [Model.Side.HOME]: {
              team: awayTeam,
              score: toSafeScore(game.awayScore),
            },
            [Model.Side.VISITOR]: {
              team: homeTeam,
              score: toSafeScore(game.homeScore),
            },
          },
        };

        if (game.isCanceled) {
          modelGame.sides[Model.Side.HOME].score = undefined;
          modelGame.sides[Model.Side.VISITOR].score = undefined;
        } else if (game.forfeitWinner === "away") {
          modelGame.sides[Model.Side.HOME].score = { score: 1 };
          modelGame.sides[Model.Side.VISITOR].score = { score: 0 };
        } else if (game.forfeitWinner === "home") {
          modelGame.sides[Model.Side.HOME].score = { score: 0 };
          modelGame.sides[Model.Side.VISITOR].score = { score: 1 };
        }

        gameByCode.set(code, modelGame);
        outcomeByCode.set(code, { winner, loser });
        forfeitByCode.set(code, { forfeitWinner: game.forfeitWinner });
      }

      for (const game of tournamentGames) {
        const gameBinding = bindingByGameId.get(game.id);
        const code = gameBinding?.code?.trim();
        if (!gameBinding || !code) {
          continue;
        }

        const current = gameByCode.get(code);
        if (!current) {
          continue;
        }

        const applySource = (
          side: Model.Side.HOME | Model.Side.VISITOR,
          sourceCode: string,
          sourceOutcome: SourceOutcome,
          preserveExistingTeamWhenUnresolved = false,
        ) => {
          if (!sourceCode) {
            return;
          }

          const sourceGame = gameByCode.get(sourceCode);
          const sourceLabel = toSourceReferenceLabel(sourceCode, sourceOutcome);
          const resolvedTeam = outcomeByCode.get(sourceCode)?.[sourceOutcome];
          const existingTeam = preserveExistingTeamWhenUnresolved
            ? current.sides[side].team
            : undefined;

          current.sides[side].team =
            (resolvedTeam
              ? ({ ...resolvedTeam } as Model.SideInfo["team"])
              : existingTeam) ??
            ({
              id: `placeholder_${code}_${side}`,
              name: sourceLabel,
            } as Model.SideInfo["team"]);

          if (sourceOutcome === "winner" && sourceGame) {
            current.sides[side].seed = createSeedFromGame(
              sourceLabel,
              sourceGame,
            );
          } else {
            current.sides[side].seed = undefined;
          }
        };

        const isThirdPlaceNode =
          Boolean(binding.third_place_code) &&
          code === binding.third_place_code;
        const sourceOutcome: SourceOutcome = isThirdPlaceNode
          ? "loser"
          : "winner";

        let awaySourceCode = gameBinding.awaySourceCode;
        let homeSourceCode = gameBinding.homeSourceCode;

        if (shouldInferSourcesFromMatchups) {
          if (!awaySourceCode) {
            awaySourceCode = inferSourceCodeFromTeam(
              game.id,
              code,
              game.awayTeam,
            );
          }
          if (!homeSourceCode) {
            homeSourceCode = inferSourceCodeFromTeam(
              game.id,
              code,
              game.homeTeam,
            );
          }
        }

        const preserveAwayTeam =
          shouldInferSourcesFromMatchups &&
          !gameBinding.awaySourceCode &&
          Boolean(awaySourceCode);
        const preserveHomeTeam =
          shouldInferSourcesFromMatchups &&
          !gameBinding.homeSourceCode &&
          Boolean(homeSourceCode);

        if (awaySourceCode) {
          previewReferencedCodes.add(awaySourceCode);
        }
        if (homeSourceCode) {
          previewReferencedCodes.add(homeSourceCode);
        }

        applySource(
          Model.Side.HOME,
          awaySourceCode,
          sourceOutcome,
          preserveAwayTeam,
        );
        applySource(
          Model.Side.VISITOR,
          homeSourceCode,
          sourceOutcome,
          preserveHomeTeam,
        );

        // 不戦勝表記は「この試合ノード」の勝者チーム名にのみ付ける
        if (
          game.forfeitWinner === "away" &&
          current.sides[Model.Side.HOME].team
        ) {
          const currentName = current.sides[Model.Side.HOME].team.name;
          current.sides[Model.Side.HOME].team = {
            ...current.sides[Model.Side.HOME].team,
            name: currentName.endsWith(" (不戦勝)")
              ? currentName
              : `${currentName} (不戦勝)`,
          };
        }
        if (
          game.forfeitWinner === "home" &&
          current.sides[Model.Side.VISITOR].team
        ) {
          const currentName = current.sides[Model.Side.VISITOR].team.name;
          current.sides[Model.Side.VISITOR].team = {
            ...current.sides[Model.Side.VISITOR].team,
            name: currentName.endsWith(" (不戦勝)")
              ? currentName
              : `${currentName} (不戦勝)`,
          };
        }
      }

      const referencedCodes = new Set<string>(previewReferencedCodes);
      parsedBindings.forEach((item) => {
        if (item.awaySourceCode) referencedCodes.add(item.awaySourceCode);
        if (item.homeSourceCode) referencedCodes.add(item.homeSourceCode);
      });

      const fallbackMainCode =
        [...gameByCode.keys()].find((code) => !referencedCodes.has(code)) ??
        gameByCode.keys().next().value;
      const mainCode = binding.final_code || fallbackMainCode;
      const mainGame = mainCode ? (gameByCode.get(mainCode) ?? null) : null;

      let thirdPlaceGame = binding.third_place_code
        ? (gameByCode.get(binding.third_place_code) ?? null)
        : null;

      if (mainGame && thirdPlaceGame && mainGame.id === thirdPlaceGame.id) {
        thirdPlaceGame = null;
      }

      return {
        key: `${binding.league_id}-${binding.season_year}`,
        title: binding.league_name,
        mainGame,
        thirdPlaceGame,
        forfeitByCode,
      };
    });
  }, [entries, tournamentBindings]);

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="relative h-48 md:h-64 flex items-center justify-center overflow-hidden">
        <Image
          src={headerImageUrl}
          alt="PENPEN LEAGUE ヘッダー画像"
          fill
          sizes="100vw"
          unoptimized
          className="absolute inset-0 w-full h-full object-cover z-0"
        />
        <div className="absolute inset-0 bg-blue-900/60 z-10"></div>
        <div className="relative z-30 text-center">
          <h1 className="text-4xl md:text-6xl font-black italic text-white drop-shadow-lg">
            PENPEN LEAGUE
          </h1>
          <p className="text-white font-bold text-lg md:text-xl mt-2">
            リーグ戦勝敗表
          </p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 md:p-8">
        <Link
          href="./"
          className="inline-flex items-center gap-2 mb-6 font-bold text-gray-500 hover:text-blue-600"
        >
          <ArrowLeft size={20} /> ホームへ戻る
        </Link>

        <section className="space-y-6 mb-20">
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 mb-2">
            リーグ戦
          </h1>

          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab("standings")}
              className={`py-2 px-4 font-bold cursor-pointer ${
                activeTab === "standings"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              順位表
            </button>
            <button
              onClick={() => setActiveTab("crosstable")}
              className={`py-2 px-4 font-bold cursor-pointer ${
                activeTab === "crosstable"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              対戦成績
            </button>
          </div>

          <div className="bg-white rounded-b-lg shadow-xl border border-blue-100 overflow-hidden">
            <div className="p-4 md:p-8">
              {activeTab === "standings" ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-max border-collapse">
                    <thead>
                      <tr className="bg-slate-900 text-white tracking-[0.2em]">
                        <th className="p-3 border border-slate-700 text-center w-12">
                          順位
                        </th>
                        <th className="p-3 border border-slate-700 text-left w-40 whitespace-nowrap">
                          チーム名
                        </th>
                        <th className="p-3 border border-slate-700 text-center bg-blue-900 w-12 text-blue-200 whitespace-nowrap">
                          試合
                        </th>
                        <th className="p-3 border border-slate-700 text-center bg-blue-900 w-12 text-blue-200">
                          勝
                        </th>
                        <th className="p-3 border border-slate-700 text-center bg-blue-900 w-12 text-blue-200">
                          敗
                        </th>
                        <th className="p-3 border border-slate-700 text-center bg-blue-900 w-12 text-blue-200">
                          分
                        </th>
                        <th className="p-3 border border-slate-700 text-center bg-blue-900 w-16 text-blue-200 whitespace-nowrap">
                          勝率
                        </th>
                        <th className="p-3 border border-slate-700 text-center bg-amber-600 w-16 whitespace-nowrap">
                          勝ち点
                        </th>
                        <th className="p-3 border border-slate-700 text-center w-16 whitespace-nowrap">
                          得失点
                        </th>
                      </tr>
                    </thead>
                    <tbody className="font-bold">
                      {rankedTeams.map(({ team, rank, winRate }) => (
                        <tr
                          key={team.teamId}
                          className="hover:bg-blue-50/50 transition-colors"
                        >
                          <td className="p-3 border border-slate-100 text-center italic font-black text-slate-400">
                            {rank}
                          </td>
                          <td className="p-3 border border-slate-100 text-slate-800">
                            {team.name}
                          </td>
                          <td className="p-3 border border-slate-100 text-center text-slate-600">
                            {team.g}
                          </td>
                          <td className="p-3 border border-slate-100 text-center text-slate-600">
                            {team.w}
                          </td>
                          <td className="p-3 border border-slate-100 text-center text-slate-600">
                            {team.l}
                          </td>
                          <td className="p-3 border border-slate-100 text-center text-slate-600">
                            {team.d}
                          </td>
                          <td className="p-3 border border-slate-100 text-center text-slate-500 font-mono">
                            {formatWinRate(winRate)}
                          </td>
                          <td className="p-3 border border-slate-100 text-center bg-amber-50 text-amber-700 text-xl font-black">
                            {team.pts}
                          </td>
                          <td
                            className={`p-3 border border-slate-100 text-center font-black ${
                              team.diff >= 0
                                ? "text-emerald-500"
                                : "text-rose-400"
                            }`}
                          >
                            {team.diff > 0 ? `+${team.diff}` : team.diff}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-max border-collapse">
                    <thead>
                      <tr className="bg-slate-900 text-white tracking-[0.2em]">
                        <th className="p-3 border border-slate-700 text-center w-12">
                          順位
                        </th>
                        <th className="p-3 border border-slate-700 text-left w-40 whitespace-nowrap">
                          チーム名
                        </th>
                        {orderedTeams.map((team) => (
                          <th
                            key={team.teamId}
                            className="p-3 border border-slate-700 text-center w-20 whitespace-nowrap"
                          >
                            {team.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="font-bold">
                      {rankedTeams.map(({ team, rank }) => (
                        <tr
                          key={team.teamId}
                          className="hover:bg-blue-50/50 transition-colors"
                        >
                          <td className="p-3 border border-slate-100 text-center italic font-black text-slate-400">
                            {rank}
                          </td>
                          <td className="p-3 border border-slate-100 text-slate-800">
                            {team.name}
                          </td>
                          {orderedTeams.map((opponent) => {
                            const results =
                              team.teamId === opponent.teamId
                                ? undefined
                                : team.resultByTeamId[opponent.teamId];
                            return (
                              <td
                                key={`${team.teamId}_${opponent.teamId}`}
                                className={`p-3 border border-slate-100 text-center text-xs ${
                                  team.teamId === opponent.teamId
                                    ? "bg-slate-200"
                                    : ""
                                }`}
                              >
                                {getResultSymbols(results)}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            {activeTab === "crosstable" && (
              <div className="bg-slate-50 p-4 text-slate-500 font-bold flex flex-wrap gap-x-6 gap-y-2 justify-center border-t border-slate-100">
                <div className="flex items-center gap-1">
                  勝ち：<span className="text-rose-500 text-lg">●</span>
                </div>
                <div className="flex items-center gap-1">
                  負け：<span className="text-blue-600 text-lg">●</span>
                </div>
                <div className="flex items-center gap-1">
                  引き分け：<span className="text-slate-500 text-lg">▲</span>
                </div>
                <div className="flex items-center gap-1">
                  不戦勝：<span className="text-rose-500 text-lg">■</span>
                </div>
                <div className="flex items-center gap-1">
                  不戦敗：<span className="text-blue-600 text-lg">■</span>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="mb-20">
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 mb-5">
            {currentYear}年度 トーナメント
          </h1>

          {bracketSections.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-4 md:p-6 overflow-x-auto">
              <p className="text-gray-500 font-bold">
                トーナメント表示データがありません。
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {bracketSections.map((section) => (
                <div
                  key={section.key}
                  className="bg-white rounded-2xl border border-gray-200 p-4 md:p-6 overflow-x-auto"
                >
                  <h2 className="text-xl font-black text-gray-900 mb-4">
                    {section.title}
                  </h2>
                  <div style={{ minWidth: 860 }}>
                    {section.mainGame ? (
                      <TournamentBracket
                        game={section.mainGame}
                        GameComponent={(props: any) =>
                          ForfeitAwareBracketGame(props, section.forfeitByCode)
                        }
                      />
                    ) : (
                      <p className="text-gray-500 font-bold">
                        トーナメント試合データがありません。
                      </p>
                    )}
                  </div>

                  {section.thirdPlaceGame ? (
                    <div
                      className="mt-8 border-t border-gray-200 pt-6"
                      style={{ minWidth: 520 }}
                    >
                      <h3 className="text-lg font-black text-gray-800 mb-3">
                        3位決定戦
                      </h3>
                      <TournamentBracket
                        game={section.thirdPlaceGame}
                        GameComponent={(props: any) =>
                          ForfeitAwareBracketGame(props, section.forfeitByCode)
                        }
                      />
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}

          {tournaments.length > 0 ? (
            <div className="space-y-4 mt-6">
              {tournaments.map((item) => (
                <section
                  key={item.id}
                  className="bg-white rounded-2xl border border-gray-200 p-4 md:p-6"
                >
                  <h2 className="text-xl font-black text-gray-900 mb-4">
                    {item.leagueName}
                  </h2>
                  <Image
                    src={item.imagePath}
                    alt={item.leagueName}
                    width={1200}
                    height={675}
                    unoptimized
                    className="w-full rounded-xl border border-gray-200 bg-white object-contain"
                  />
                </section>
              ))}
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
