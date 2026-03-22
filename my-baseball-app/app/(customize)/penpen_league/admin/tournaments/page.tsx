"use client";

import Link from "next/link";
import {
  Bracket as TournamentBracket,
  BracketGame,
  Model,
} from "react-tournament-bracket";
import { useEffect, useMemo, useState } from "react";
import {
  type PenpenMaster,
  type PenpenScheduleEntry,
} from "../../lib/penpenData";
import { penpenAdminMutate } from "../lib/adminApi";

type TournamentScheduleGame = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  awayTeamId: string;
  awayTeam: string;
  homeTeamId: string;
  homeTeam: string;
  awayScore: number | null;
  homeScore: number | null;
  isCanceled: boolean;
  forfeitWinner: "away" | "home" | null;
};

type SourceOutcome = "winner" | "loser";

type GameBinding = {
  gameId: string;
  code: string;
  awaySourceCode: string;
  homeSourceCode: string;
};

type TournamentBindingRecord = {
  leagueId: string;
  seasonYear: number;
  finalCode: string;
  thirdPlaceCode: string;
  bindings: GameBinding[];
};

const BRACKET_LABEL_STYLES = {
  backgroundColor: "#58595e",
  hoverBackgroundColor: "#222",
  scoreBackground: "#787a80",
  winningScoreBackground: "#ff7324",
  teamNameStyle: { fill: "#fff", fontSize: 12, textShadow: "1px 1px 1px #222" },
  teamScoreStyle: { fill: "#23252d", fontSize: 12 },
  gameNameStyle: { fill: "#bbb", fontSize: 13 },
  gameTimeStyle: { fill: "#bbb", fontSize: 11 },
  teamSeparatorStyle: { stroke: "#444549", strokeWidth: 1 },
};

type ForfeitInfo = {
  forfeitWinner: "away" | "home" | null;
};

const ForfeitAwareBracketGame = (
  props: any,
  forfeitMap?: Map<string, ForfeitInfo>,
) => {
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

const LargeLabelBracketGame = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  props: any,
) => <BracketGame {...props} styles={BRACKET_LABEL_STYLES} />;
const UNDECIDED_TEAM_NAME = "未定";
const FIXED_FINAL_CODE = "決勝";
const FIXED_THIRD_PLACE_CODE = "3位決定戦";
const DEFAULT_LEAGUE_ID = "1b8cbac7-ab3f-4006-bcad-d4db00e7e65c";
const SOURCE_OUTCOME_LABEL: Record<SourceOutcome, string> = {
  winner: "勝者",
  loser: "敗者",
};
const CURRENT_YEAR = new Date().getFullYear();

const createSeedFromGame = (
  label: string,
  sourceGame: Model.Game,
): Model.SideInfo["seed"] => ({
  displayName: label,
  rank: 1,
  sourceGame,
  sourcePool: {},
});

const toAlphabetLabel = (index: number) => {
  let current = index;
  let label = "";

  do {
    label = String.fromCharCode(65 + (current % 26)) + label;
    current = Math.floor(current / 26) - 1;
  } while (current >= 0);

  return label;
};

const buildDisplayNameOptions = (gameCount: number) => {
  if (gameCount <= 0) {
    return [] as string[];
  }
  if (gameCount === 1) {
    return ["決勝"];
  }
  if (gameCount === 2) {
    return [FIXED_FINAL_CODE, FIXED_THIRD_PLACE_CODE];
  }

  const options: string[] = [];
  for (let i = 0; i < gameCount - 2; i += 1) {
    options.push(toAlphabetLabel(i));
  }
  options.push(FIXED_FINAL_CODE, FIXED_THIRD_PLACE_CODE);

  return options;
};

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

const toSourceReferenceLabel = (code: string, outcome: SourceOutcome) => {
  if (!code) {
    return "";
  }
  return `${code} ${SOURCE_OUTCOME_LABEL[outcome]}`;
};

const toUndecidedOptionLabel = (code: string, outcome: SourceOutcome) => {
  if (!code) {
    return "";
  }
  return `${code}の${SOURCE_OUTCOME_LABEL[outcome]}`;
};

const toKnownTeam = (teamId: string, teamName: string) => {
  if (isUndecidedTeam(teamName) || !teamId) {
    return undefined;
  }

  return {
    id: teamId,
    name: teamName,
  };
};

const isUndecidedTeam = (teamName: string) =>
  teamName.trim() === UNDECIDED_TEAM_NAME;

export default function PenpenAdminTournamentTempPage() {
  useEffect(() => {
    document.title = "トーナメント管理 | ペンペンリーグ";
  }, []);

  const [leagues, setLeagues] = useState<PenpenMaster[]>([]);
  const [entries, setEntries] = useState<PenpenScheduleEntry[]>([]);
  const [leagueId, setLeagueId] = useState("");
  const [seasonYear, setSeasonYear] = useState(CURRENT_YEAR);
  const [bindings, setBindings] = useState<Record<string, GameBinding>>({});
  const [savedBindings, setSavedBindings] = useState<TournamentBindingRecord[]>(
    [],
  );

  const enabledLeagues = useMemo(
    () =>
      leagues.filter(
        (league) => league.isEnabled && league.id !== DEFAULT_LEAGUE_ID,
      ),
    [leagues],
  );

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch("/penpen_league/admin/api/dashboard", {
          method: "GET",
          credentials: "same-origin",
        });

        const payload = (await response.json().catch(() => null)) as {
          message?: string;
          entries?: PenpenScheduleEntry[];
          masters?: {
            leagues: PenpenMaster[];
          };
        } | null;

        if (!response.ok) {
          throw new Error(payload?.message ?? "unknown");
        }

        const loadedLeagues = payload?.masters?.leagues ?? [];
        const loadedEntries = payload?.entries ?? [];

        const bindingResponse = await penpenAdminMutate<
          {
            league_id: string;
            season_year: number;
            final_code: string | null;
            third_place_code: string | null;
            bindings: unknown;
          }[]
        >({
          action: "select",
          table: "tournament_bindings",
          columns: [
            "league_id",
            "season_year",
            "final_code",
            "third_place_code",
            "bindings",
          ],
          orderBy: [
            { column: "season_year", ascending: false },
            { column: "updated_at", ascending: false },
          ],
        });

        const parsedBindings = (bindingResponse.data ?? [])
          .map((item) => {
            const rawBindings =
              typeof item.bindings === "string"
                ? (() => {
                    try {
                      return JSON.parse(item.bindings) as unknown;
                    } catch {
                      return [] as unknown;
                    }
                  })()
                : item.bindings;

            const bindingsArray = Array.isArray(rawBindings)
              ? rawBindings
                  .map((binding) => {
                    if (!binding || typeof binding !== "object") return null;
                    const row = binding as Record<string, unknown>;
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
                    } as GameBinding;
                  })
                  .filter((binding): binding is GameBinding => binding !== null)
              : [];

            return {
              leagueId: item.league_id,
              seasonYear: item.season_year,
              finalCode: item.final_code ?? FIXED_FINAL_CODE,
              thirdPlaceCode: item.third_place_code ?? FIXED_THIRD_PLACE_CODE,
              bindings: bindingsArray,
            } as TournamentBindingRecord;
          })
          .filter((item) => Boolean(item.leagueId));

        setLeagues(loadedLeagues);
        setEntries(loadedEntries);
        setSavedBindings(parsedBindings);

        const selectableLeagues = loadedLeagues.filter(
          (item) => item.isEnabled && item.id !== DEFAULT_LEAGUE_ID,
        );
        const defaultLeague = selectableLeagues[0]?.id ?? "";
        setLeagueId(defaultLeague);
      } catch (error) {
        window.alert(
          `データ取得に失敗しました: ${error instanceof Error ? error.message : "unknown"}`,
        );
      }
    };

    void load();
  }, []);

  const yearOptions = useMemo(() => {
    const years = new Set<number>();

    entries.forEach((entry) => {
      const date = new Date(`${entry.date}T00:00:00+09:00`);
      if (!Number.isNaN(date.getTime())) {
        years.add(date.getFullYear());
      }
    });

    savedBindings.forEach((item) => {
      years.add(item.seasonYear);
    });

    years.add(CURRENT_YEAR);

    return [...years].sort((a, b) => b - a);
  }, [entries, savedBindings]);

  useEffect(() => {
    if (!yearOptions.includes(seasonYear)) {
      setSeasonYear(yearOptions[0] ?? CURRENT_YEAR);
    }
  }, [seasonYear, yearOptions]);

  const tournamentGames = useMemo<TournamentScheduleGame[]>(() => {
    const filtered: TournamentScheduleGame[] = [];

    for (const entry of entries) {
      for (const game of entry.games) {
        if (game.gameType !== "トーナメント") {
          continue;
        }
        if (leagueId && game.leagueId !== leagueId) {
          continue;
        }

        const gameDate = new Date(`${entry.date}T00:00:00+09:00`);
        if (
          Number.isNaN(gameDate.getTime()) ||
          gameDate.getFullYear() !== seasonYear
        ) {
          continue;
        }

        filtered.push({
          id: game.id,
          date: entry.date,
          startTime: game.startTime,
          endTime: game.endTime,
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

    return filtered.sort((a, b) => {
      const aKey = `${a.date}-${a.startTime}`;
      const bKey = `${b.date}-${b.startTime}`;
      return aKey.localeCompare(bKey);
    });
  }, [entries, leagueId, seasonYear]);

  const configurableTournamentGames = useMemo(
    () => tournamentGames.filter((game) => !game.isCanceled),
    [tournamentGames],
  );

  const displayNameOptions = useMemo(
    () => buildDisplayNameOptions(configurableTournamentGames.length),
    [configurableTournamentGames.length],
  );

  const effectiveBindings = useMemo(() => {
    const next: Record<string, GameBinding> = {};

    configurableTournamentGames.forEach((game, index) => {
      const existing = bindings[game.id];
      const defaultCode = displayNameOptions[index] ?? toAlphabetLabel(index);
      const existingCode = existing?.code?.trim() ?? "";
      const nextCode =
        existingCode && displayNameOptions.includes(existingCode)
          ? existingCode
          : defaultCode;

      next[game.id] = {
        gameId: game.id,
        code: nextCode,
        awaySourceCode: existing?.awaySourceCode ?? "",
        homeSourceCode: existing?.homeSourceCode ?? "",
      };
    });

    return next;
  }, [bindings, configurableTournamentGames, displayNameOptions]);

  useEffect(() => {
    const selected = savedBindings.find(
      (item) => item.leagueId === leagueId && item.seasonYear === seasonYear,
    );

    const next: Record<string, GameBinding> = {};
    (selected?.bindings ?? []).forEach((binding) => {
      next[binding.gameId] = binding;
    });

    setBindings(next);
  }, [leagueId, seasonYear, savedBindings]);

  const codeOptions = useMemo(() => {
    const used = new Set<string>();

    for (const game of configurableTournamentGames) {
      const code = effectiveBindings[game.id]?.code?.trim();
      if (code) {
        used.add(code);
      }
    }

    return [...used];
  }, [configurableTournamentGames, effectiveBindings]);

  const autoFinalCode = useMemo(() => {
    if (codeOptions.length === 0) {
      return "";
    }

    const referenced = new Set<string>();
    for (const game of configurableTournamentGames) {
      const binding = effectiveBindings[game.id];
      if (!binding) continue;
      if (binding.awaySourceCode) referenced.add(binding.awaySourceCode);
      if (binding.homeSourceCode) referenced.add(binding.homeSourceCode);
    }

    return codeOptions.find((code) => !referenced.has(code)) ?? codeOptions[0];
  }, [codeOptions, configurableTournamentGames, effectiveBindings]);

  const selectedFinalCode = codeOptions.includes(FIXED_FINAL_CODE)
    ? FIXED_FINAL_CODE
    : "";
  const selectedThirdPlaceCode = codeOptions.includes(FIXED_THIRD_PLACE_CODE)
    ? FIXED_THIRD_PLACE_CODE
    : "";

  const shouldInferSourcesFromMatchups = useMemo(
    () =>
      configurableTournamentGames.length > 0 &&
      configurableTournamentGames.every(
        (game) =>
          !isUndecidedTeam(game.awayTeam) && !isUndecidedTeam(game.homeTeam),
      ),
    [configurableTournamentGames],
  );

  const duplicateCodes = useMemo(() => {
    const counts = new Map<string, number>();

    for (const game of configurableTournamentGames) {
      const code = effectiveBindings[game.id]?.code?.trim();
      if (!code) continue;
      counts.set(code, (counts.get(code) ?? 0) + 1);
    }

    return [...counts.entries()]
      .filter(([, count]) => count > 1)
      .map(([code]) => code);
  }, [configurableTournamentGames, effectiveBindings]);

  const updateBinding = <K extends keyof GameBinding>(
    gameId: string,
    key: K,
    value: GameBinding[K],
  ) => {
    setBindings((prev) => {
      const current = prev[gameId] ?? effectiveBindings[gameId];
      if (!current) {
        return prev;
      }

      return {
        ...prev,
        [gameId]: {
          ...current,
          [key]: value,
        },
      };
    });
  };

  const saveDraft = async () => {
    const payload: TournamentBindingRecord = {
      leagueId,
      seasonYear,
      finalCode: FIXED_FINAL_CODE,
      thirdPlaceCode: FIXED_THIRD_PLACE_CODE,
      bindings: Object.values(effectiveBindings),
    };

    try {
      await penpenAdminMutate({
        action: "upsert",
        table: "tournament_bindings",
        rows: [
          {
            league_id: leagueId,
            season_year: seasonYear,
            final_code: payload.finalCode,
            third_place_code: payload.thirdPlaceCode,
            bindings: JSON.stringify(payload.bindings),
          },
        ],
        onConflict: "league_id,season_year",
      });

      setSavedBindings((prev) => {
        const others = prev.filter(
          (item) =>
            !(item.leagueId === leagueId && item.seasonYear === seasonYear),
        );
        return [...others, payload];
      });
      window.alert("保存しました");
    } catch (error) {
      window.alert(
        `保存に失敗しました: ${error instanceof Error ? error.message : "unknown"}`,
      );
    }
  };

  const resetCodes = () => {
    setBindings((prev) => {
      const next: Record<string, GameBinding> = {};

      configurableTournamentGames.forEach((game, index) => {
        const defaultCode = displayNameOptions[index] ?? toAlphabetLabel(index);
        next[game.id] = {
          gameId: game.id,
          code: defaultCode,
          awaySourceCode: "",
          homeSourceCode: "",
        };
      });

      return {
        ...prev,
        ...next,
      };
    });
  };

  const bracketPreview = useMemo(() => {
    if (tournamentGames.length === 0) {
      return {
        mainGame: null as Model.Game | null,
        thirdPlaceGame: null as Model.Game | null,
        forfeitByCode: new Map<string, ForfeitInfo>(),
      };
    }

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

        const candidateCode = effectiveBindings[candidateGame.id]?.code?.trim();
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
      const binding = effectiveBindings[game.id];
      const code = binding?.code?.trim();
      if (!binding || !code) {
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
      const binding = effectiveBindings[game.id];
      const code = binding?.code?.trim();
      if (!binding || !code) {
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
        Boolean(selectedThirdPlaceCode) && code === selectedThirdPlaceCode;
      const sourceOutcome: SourceOutcome = isThirdPlaceNode
        ? "loser"
        : "winner";

      let awaySourceCode = binding.awaySourceCode;
      let homeSourceCode = binding.homeSourceCode;

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
        !binding.awaySourceCode &&
        Boolean(awaySourceCode);
      const preserveHomeTeam =
        shouldInferSourcesFromMatchups &&
        !binding.homeSourceCode &&
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

    if (gameByCode.size === 0) {
      return {
        mainGame: null as Model.Game | null,
        thirdPlaceGame: null as Model.Game | null,
      };
    }

    const referencedCodes = new Set<string>(previewReferencedCodes);
    Object.values(effectiveBindings).forEach((binding) => {
      if (binding.awaySourceCode) referencedCodes.add(binding.awaySourceCode);
      if (binding.homeSourceCode) referencedCodes.add(binding.homeSourceCode);
    });

    let mainCode: string | undefined = selectedFinalCode || autoFinalCode;
    if (!mainCode) {
      mainCode =
        [...gameByCode.keys()].find((code) => !referencedCodes.has(code)) ??
        gameByCode.keys().next().value;
    }

    const mainGame = mainCode ? (gameByCode.get(mainCode) ?? null) : null;
    let thirdPlaceGame = selectedThirdPlaceCode
      ? (gameByCode.get(selectedThirdPlaceCode) ?? null)
      : null;

    if (mainGame && thirdPlaceGame && mainGame.id === thirdPlaceGame.id) {
      thirdPlaceGame = null;
    }

    return {
      mainGame,
      thirdPlaceGame,
      forfeitByCode,
    };
  }, [
    autoFinalCode,
    configurableTournamentGames,
    effectiveBindings,
    selectedFinalCode,
    selectedThirdPlaceCode,
    shouldInferSourcesFromMatchups,
    tournamentGames,
  ]);

  const canSelectSourceCode = (targetGameId: string, candidateCode: string) => {
    const targetCode = effectiveBindings[targetGameId]?.code?.trim();
    if (!candidateCode) {
      return true;
    }
    if (!targetCode) {
      return true;
    }
    return targetCode !== candidateCode;
  };

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl md:text-3xl font-black text-gray-900">
            トーナメント管理
          </h1>
          <p className="text-base text-gray-600 mt-2">
            トーナメントの表示名（A/B/Cなど）と未定チームの参照元を設定します。
          </p>
        </header>

        <div>
          <Link
            href="/penpen_league/admin"
            className="inline-block text-blue-700 font-bold hover:underline"
          >
            ← 管理画面ホームへ戻る
          </Link>
        </div>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 md:p-6 space-y-4">
          <h2 className="text-xl font-black text-gray-900">トーナメント選択</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="space-y-2 block">
              <span className="text-base font-bold text-gray-700">大会名</span>
              <select
                value={leagueId}
                onChange={(event) => setLeagueId(event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white"
              >
                {enabledLeagues.map((league) => (
                  <option key={league.id} value={league.id}>
                    {league.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 block">
              <span className="text-base font-bold text-gray-700">年度</span>
              <select
                value={seasonYear}
                onChange={(event) => setSeasonYear(Number(event.target.value))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white"
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}年度
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={saveDraft}
              className="bg-blue-600 text-white font-black px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
            >
              保存
            </button>
            <button
              type="button"
              onClick={resetCodes}
              className="bg-white text-gray-700 font-black px-5 py-2.5 rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              クリア
            </button>
            <Link
              href="/penpen_league/admin/schedule"
              className="inline-flex items-center font-bold text-blue-700 hover:underline"
            >
              試合日程入力へ
            </Link>
            <Link
              href="/penpen_league/admin/results"
              className="inline-flex items-center font-bold text-blue-700 hover:underline"
            >
              試合結果入力へ
            </Link>
          </div>

          {duplicateCodes.length > 0 ? (
            <p className="text-sm font-bold text-rose-600">
              表示名が重複しています: {duplicateCodes.join("、")}
            </p>
          ) : null}
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 md:p-6 space-y-4">
          <h2 className="text-xl font-black text-gray-900">トーナメント設定</h2>

          {configurableTournamentGames.length === 0 ? (
            <p className="text-gray-500 font-bold">
              選択中の大会にトーナメント試合がありません。先に試合日程入力で登録してください。
            </p>
          ) : (
            <div className="space-y-3">
              {configurableTournamentGames.map((game) => {
                const binding = effectiveBindings[game.id];
                if (!binding) return null;

                const awayUndecided = isUndecidedTeam(game.awayTeam);
                const homeUndecided = isUndecidedTeam(game.homeTeam);
                const isThirdPlaceNode =
                  Boolean(selectedThirdPlaceCode) &&
                  binding.code === selectedThirdPlaceCode;
                const sourceOutcome: SourceOutcome = isThirdPlaceNode
                  ? "loser"
                  : "winner";
                const sourceCandidates = codeOptions.filter((code) =>
                  canSelectSourceCode(game.id, code),
                );

                return (
                  <article
                    key={game.id}
                    className="rounded-xl border border-gray-200 p-4 bg-gray-50 space-y-3"
                  >
                    <div className="text-sm text-gray-500 font-bold">
                      {game.date} {game.startTime}〜{game.endTime}
                    </div>

                    <div className="text-base font-black text-gray-900 flex flex-wrap items-center gap-2">
                      {awayUndecided ? (
                        <select
                          value={binding.awaySourceCode}
                          onChange={(event) =>
                            updateBinding(
                              game.id,
                              "awaySourceCode",
                              event.target.value,
                            )
                          }
                          className="rounded-lg border border-gray-300 px-2 py-1 bg-white text-base font-black text-gray-900"
                        >
                          <option value="">未定</option>
                          {sourceCandidates.map((code) => (
                            <option key={code} value={code}>
                              {toUndecidedOptionLabel(code, sourceOutcome)}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span>{game.awayTeam}</span>
                      )}

                      <span>vs</span>

                      {homeUndecided ? (
                        <select
                          value={binding.homeSourceCode}
                          onChange={(event) =>
                            updateBinding(
                              game.id,
                              "homeSourceCode",
                              event.target.value,
                            )
                          }
                          className="rounded-lg border border-gray-300 px-2 py-1 bg-white text-base font-black text-gray-900"
                        >
                          <option value="">未定</option>
                          {sourceCandidates.map((code) => (
                            <option key={code} value={code}>
                              {toUndecidedOptionLabel(code, sourceOutcome)}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span>{game.homeTeam}</span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <label className="space-y-1">
                        <span className="text-sm font-bold text-gray-700">
                          表示名
                        </span>
                        <select
                          value={binding.code}
                          onChange={(event) =>
                            updateBinding(game.id, "code", event.target.value)
                          }
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white"
                        >
                          {displayNameOptions.map((nameOption) => (
                            <option key={nameOption} value={nameOption}>
                              {nameOption}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 md:p-6 overflow-x-auto">
          <h2 className="text-xl font-black text-gray-900 mb-4">
            トーナメント表プレビュー
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-black text-gray-700 mb-2">
                トーナメント
              </h3>
              <div style={{ minWidth: 860 }}>
                {bracketPreview.mainGame ? (
                  <TournamentBracket
                    game={bracketPreview.mainGame}
                    GameComponent={(props: any) =>
                      ForfeitAwareBracketGame(
                        props,
                        bracketPreview.forfeitByCode,
                      )
                    }
                  />
                ) : null}
              </div>
            </div>

            {bracketPreview.thirdPlaceGame ? (
              <div>
                <h3 className="text-base font-black text-gray-700 mb-2">
                  3位決定戦
                </h3>
                <div style={{ minWidth: 520 }}>
                  <TournamentBracket
                    game={bracketPreview.thirdPlaceGame}
                    GameComponent={(props: any) =>
                      ForfeitAwareBracketGame(
                        props,
                        bracketPreview.forfeitByCode,
                      )
                    }
                  />
                </div>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
