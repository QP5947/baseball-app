"use client";

import Link from "next/link";
import {
  Calendar,
  CircleCheck,
  MapPin,
  Plus,
  Trash2,
  Wrench,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

type GameType = "リーグ戦" | "トーナメント";

type GameInput = {
  id: number;
  startTime: string;
  endTime: string;
  awayTeam: string;
  homeTeam: string;
  gameType: GameType;
};

type ScheduleEntry = {
  id: number;
  date: string;
  stadium: string;
  games: GameInput[];
  restTeams: string[];
  note: string;
};

type PeriodFilter = "spring" | "summer" | "autumn";
type SlotKey = "first" | "second" | "third" | "rest";

type AssignmentState = {
  slotCounts: Record<string, Record<SlotKey, number>>;
  dutyCounts: Record<string, { setup: number; cleanup: number }>;
  matchupCounts: Record<string, number>;
};

const TEAM_OPTIONS = [
  "フレンドリー",
  "ウインズ",
  "KJフェニックス",
  "ノンベーズ",
  "イエローストーン",
  "ロケッツ",
];

const STADIUM_OPTIONS = ["庄内川西", "庄内川東"];
const SCHEDULE_STORAGE_KEY = "penpen_league_schedule_entries_v1";

const createGame = (id: number): GameInput => ({
  id,
  startTime: "",
  endTime: "",
  awayTeam: "",
  homeTeam: "",
  gameType: "リーグ戦",
});

const periodLabelMap: Record<PeriodFilter, string> = {
  spring: "3〜5月",
  summer: "6〜8月",
  autumn: "9〜11月",
};

const getPeriodFromDate = (dateString: string): PeriodFilter | null => {
  if (!dateString) {
    return null;
  }

  const month = Number(dateString.split("-")[1]);

  if (month >= 3 && month <= 5) {
    return "spring";
  }
  if (month >= 6 && month <= 8) {
    return "summer";
  }
  if (month >= 9 && month <= 11) {
    return "autumn";
  }

  return null;
};

const TIME_SLOTS = [
  { start: "08:30", end: "10:30" },
  { start: "10:45", end: "12:45" },
  { start: "13:00", end: "15:00" },
];

const getSlotKey = (index: number): SlotKey => {
  if (index === 0) {
    return "first";
  }
  if (index === 1) {
    return "second";
  }
  return "third";
};

const createEmptyState = (): AssignmentState => {
  const slotCounts: AssignmentState["slotCounts"] = {};
  const dutyCounts: AssignmentState["dutyCounts"] = {};

  TEAM_OPTIONS.forEach((team) => {
    slotCounts[team] = { first: 0, second: 0, third: 0, rest: 0 };
    dutyCounts[team] = { setup: 0, cleanup: 0 };
  });

  return {
    slotCounts,
    dutyCounts,
    matchupCounts: {},
  };
};

const cloneState = (state: AssignmentState): AssignmentState => {
  const slotCounts: AssignmentState["slotCounts"] = {};
  const dutyCounts: AssignmentState["dutyCounts"] = {};

  TEAM_OPTIONS.forEach((team) => {
    slotCounts[team] = { ...state.slotCounts[team] };
    dutyCounts[team] = { ...state.dutyCounts[team] };
  });

  return {
    slotCounts,
    dutyCounts,
    matchupCounts: { ...state.matchupCounts },
  };
};

const matchupKey = (teamA: string, teamB: string) =>
  [teamA, teamB].sort().join("__");

const getAllSundaysOfPeriod = (year: number, period: PeriodFilter) => {
  const monthRanges: Record<PeriodFilter, [number, number]> = {
    spring: [3, 5],
    summer: [6, 8],
    autumn: [9, 11],
  };

  const [startMonth, endMonth] = monthRanges[period];
  const result: string[] = [];

  for (let month = startMonth; month <= endMonth; month += 1) {
    const date = new Date(year, month - 1, 1);

    while (date.getMonth() === month - 1) {
      if (date.getDay() === 0) {
        result.push(date.toISOString().slice(0, 10));
      }
      date.setDate(date.getDate() + 1);
    }
  }

  return result;
};

const buildStateFromEntries = (entries: ScheduleEntry[]) => {
  const state = createEmptyState();

  entries.forEach((entry) => {
    const playingTeams = new Set<string>();

    entry.games.forEach((game, index) => {
      const slotKey = getSlotKey(index);
      playingTeams.add(game.awayTeam);
      playingTeams.add(game.homeTeam);

      state.slotCounts[game.awayTeam][slotKey] += 1;
      state.slotCounts[game.homeTeam][slotKey] += 1;

      if (index === 0) {
        state.dutyCounts[game.awayTeam].setup += 1;
      }
      if (index === entry.games.length - 1) {
        state.dutyCounts[game.homeTeam].cleanup += 1;
      }

      const key = matchupKey(game.awayTeam, game.homeTeam);
      state.matchupCounts[key] = (state.matchupCounts[key] ?? 0) + 1;
    });

    if (entry.restTeams.length > 0) {
      entry.restTeams.forEach((team) => {
        state.slotCounts[team].rest += 1;
      });
    } else if (entry.games.length === 0) {
      TEAM_OPTIONS.forEach((team) => {
        state.slotCounts[team].rest += 1;
      });
    } else {
      TEAM_OPTIONS.forEach((team) => {
        if (!playingTeams.has(team)) {
          state.slotCounts[team].rest += 1;
        }
      });
    }
  });

  return state;
};

const totalGamesCount = (state: AssignmentState, team: string) =>
  state.slotCounts[team].first +
  state.slotCounts[team].second +
  state.slotCounts[team].third;

const spread = (values: number[]) => Math.max(...values) - Math.min(...values);

const fairnessScore = (state: AssignmentState) => {
  const first = TEAM_OPTIONS.map((team) => state.slotCounts[team].first);
  const second = TEAM_OPTIONS.map((team) => state.slotCounts[team].second);
  const third = TEAM_OPTIONS.map((team) => state.slotCounts[team].third);
  const rest = TEAM_OPTIONS.map((team) => state.slotCounts[team].rest);
  const setup = TEAM_OPTIONS.map((team) => state.dutyCounts[team].setup);
  const cleanup = TEAM_OPTIONS.map((team) => state.dutyCounts[team].cleanup);

  return (
    spread(first) +
    spread(second) +
    spread(third) +
    spread(rest) +
    spread(setup) +
    spread(cleanup)
  );
};

const chooseRestTeams = (state: AssignmentState, restCount: number) => {
  if (restCount <= 0) {
    return [] as string[];
  }

  return [...TEAM_OPTIONS]
    .sort((a, b) => {
      const restDiff = state.slotCounts[a].rest - state.slotCounts[b].rest;
      if (restDiff !== 0) {
        return restDiff;
      }
      return totalGamesCount(state, b) - totalGamesCount(state, a);
    })
    .slice(0, restCount);
};

const buildDaySchedule = (
  baseState: AssignmentState,
  gameCount: number,
): {
  games: GameInput[];
  restTeams: string[];
  nextState: AssignmentState;
} => {
  const state = cloneState(baseState);
  const restTeams = chooseRestTeams(
    state,
    Math.max(0, TEAM_OPTIONS.length - gameCount * 2),
  );
  const restSet = new Set(restTeams);
  const available = TEAM_OPTIONS.filter((team) => !restSet.has(team));
  const games: GameInput[] = [];

  for (let index = 0; index < gameCount; index += 1) {
    const slotKey = getSlotKey(index);
    let bestPair: [string, string] | null = null;
    let bestScore = Number.POSITIVE_INFINITY;

    for (let i = 0; i < available.length; i += 1) {
      for (let j = i + 1; j < available.length; j += 1) {
        const teamA = available[i];
        const teamB = available[j];
        const matchup = matchupKey(teamA, teamB);
        const score =
          state.slotCounts[teamA][slotKey] +
          state.slotCounts[teamB][slotKey] +
          0.3 *
            (totalGamesCount(state, teamA) + totalGamesCount(state, teamB)) +
          1.5 * (state.matchupCounts[matchup] ?? 0);

        if (score < bestScore) {
          bestScore = score;
          bestPair = [teamA, teamB];
        }
      }
    }

    if (!bestPair) {
      break;
    }

    let [awayTeam, homeTeam] = bestPair;

    if (
      index === 0 &&
      state.dutyCounts[awayTeam].setup > state.dutyCounts[homeTeam].setup
    ) {
      [awayTeam, homeTeam] = [homeTeam, awayTeam];
    }
    if (
      index === gameCount - 1 &&
      state.dutyCounts[homeTeam].cleanup > state.dutyCounts[awayTeam].cleanup
    ) {
      [awayTeam, homeTeam] = [homeTeam, awayTeam];
    }

    const slot = TIME_SLOTS[index] ?? TIME_SLOTS[TIME_SLOTS.length - 1];
    games.push({
      id: Date.now() + index,
      startTime: slot.start,
      endTime: slot.end,
      awayTeam,
      homeTeam,
      gameType: "リーグ戦",
    });

    state.slotCounts[awayTeam][slotKey] += 1;
    state.slotCounts[homeTeam][slotKey] += 1;

    if (index === 0) {
      state.dutyCounts[awayTeam].setup += 1;
    }
    if (index === gameCount - 1) {
      state.dutyCounts[homeTeam].cleanup += 1;
    }

    const matchup = matchupKey(awayTeam, homeTeam);
    state.matchupCounts[matchup] = (state.matchupCounts[matchup] ?? 0) + 1;

    const removeAway = available.indexOf(awayTeam);
    if (removeAway >= 0) {
      available.splice(removeAway, 1);
    }
    const removeHome = available.indexOf(homeTeam);
    if (removeHome >= 0) {
      available.splice(removeHome, 1);
    }
  }

  restTeams.forEach((team) => {
    state.slotCounts[team].rest += 1;
  });

  return {
    games,
    restTeams,
    nextState: state,
  };
};

export default function PenpenAdminSchedulePage() {
  const [date, setDate] = useState("");
  const [stadium, setStadium] = useState("");
  const [games, setGames] = useState<GameInput[]>([createGame(1)]);
  const [restTeams, setRestTeams] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [entries, setEntries] = useState<ScheduleEntry[]>([]);
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("spring");
  const [editingEntryId, setEditingEntryId] = useState<number | null>(null);
  const [autoPeriod, setAutoPeriod] = useState<PeriodFilter>("spring");
  const [autoStadium, setAutoStadium] = useState<string>(STADIUM_OPTIONS[0]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isAutoGenerateOpen, setIsAutoGenerateOpen] = useState(false);
  const [isNewEntryOpen, setIsNewEntryOpen] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(SCHEDULE_STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as ScheduleEntry[];
        setEntries(parsed);
      } catch {
        setEntries([]);
      }
    }
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }
    localStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(entries));
  }, [entries, isHydrated]);

  const addGame = () => {
    setGames((prev) => [...prev, createGame(Date.now())]);
  };

  const removeGame = (id: number) => {
    setGames((prev) => prev.filter((game) => game.id !== id));
  };

  const updateGame = <K extends keyof GameInput>(
    id: number,
    key: K,
    value: GameInput[K],
  ) => {
    setGames((prev) =>
      prev.map((game) => (game.id === id ? { ...game, [key]: value } : game)),
    );
  };

  const toggleRestTeam = (team: string) => {
    setRestTeams((prev) =>
      prev.includes(team) ? prev.filter((t) => t !== team) : [...prev, team],
    );
  };

  const resetForm = () => {
    setDate("");
    setStadium("");
    setGames([createGame(Date.now())]);
    setRestTeams([]);
    setNote("");
    setEditingEntryId(null);
  };

  const handleEdit = (entry: ScheduleEntry) => {
    setDate(entry.date);
    setStadium(entry.stadium);
    setGames(entry.games.map((game) => ({ ...game })));
    setRestTeams([...entry.restTeams]);
    setNote(entry.note);
    setEditingEntryId(entry.id);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData: ScheduleEntry = {
      id: Date.now(),
      date,
      stadium,
      games,
      restTeams,
      note,
    };

    if (editingEntryId !== null) {
      setEntries((prev) =>
        prev.map((entry) =>
          entry.id === editingEntryId
            ? { ...formData, id: editingEntryId }
            : entry,
        ),
      );
      resetForm();
      return;
    }

    setEntries((prev) => [{ ...formData, id: Date.now() }, ...prev]);
    resetForm();
  };

  const filteredEntries = useMemo(() => {
    return entries
      .filter((entry) => getPeriodFromDate(entry.date) === periodFilter)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [entries, periodFilter]);

  const handleAutoGenerate = () => {
    const year = new Date().getFullYear();
    const sundays = getAllSundaysOfPeriod(year, autoPeriod);
    const existingDates = new Set(entries.map((entry) => entry.date));
    const targetDates = sundays.filter((date) => !existingDates.has(date));

    if (targetDates.length === 0) {
      window.alert("対象期間の未作成日程はありません。");
      return;
    }

    let state = buildStateFromEntries(entries);
    const generated: ScheduleEntry[] = [];

    targetDates.forEach((date) => {
      const candidate3 = buildDaySchedule(state, 3);
      const candidate2 = buildDaySchedule(state, 2);
      const score3 = fairnessScore(candidate3.nextState);
      const score2 = fairnessScore(candidate2.nextState) + 1;
      const selected = score3 <= score2 ? candidate3 : candidate2;

      state = selected.nextState;
      generated.push({
        id: Date.now() + generated.length,
        date,
        stadium: autoStadium,
        games: selected.games,
        restTeams: selected.restTeams,
        note: "",
      });
    });

    setEntries((prev) => [...generated.reverse(), ...prev]);
    window.alert(`${generated.length}件の対戦日程を自動作成しました。`);
  };

  const renderScheduleForm = () => (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
      <form className="space-y-8" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="space-y-2 block">
            <span className="text-base font-bold text-gray-700">日付</span>
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
              required
            />
          </label>

          <label className="space-y-2 block">
            <span className="text-base font-bold text-gray-700">球場</span>
            <select
              value={stadium}
              onChange={(event) => setStadium(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white"
              required
            >
              <option value="">選択してください</option>
              {STADIUM_OPTIONS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-black text-gray-900">試合情報</h2>
            <button
              type="button"
              onClick={addGame}
              className="inline-flex items-center gap-2 bg-blue-600 text-white font-bold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={18} />
              試合を追加
            </button>
          </div>

          {editingEntryId !== null && (
            <p className="text-base font-bold text-blue-700">
              入力済みデータを編集中です
            </p>
          )}

          <div className="space-y-4">
            {games.map((game, idx) => (
              <div
                key={game.id}
                className="border border-gray-200 rounded-xl p-4 md:p-5 space-y-4 bg-gray-50"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-gray-800">
                    第{idx + 1}試合
                  </h3>
                  <button
                    type="button"
                    onClick={() => removeGame(game.id)}
                    className="inline-flex items-center gap-1 text-red-600 font-bold disabled:opacity-40"
                  >
                    <Trash2 size={16} />
                    削除
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <label className="space-y-2 block">
                    <span className="text-base font-bold text-gray-700">
                      開始時間
                    </span>
                    <input
                      type="time"
                      value={game.startTime}
                      onChange={(event) =>
                        updateGame(game.id, "startTime", event.target.value)
                      }
                      step={900}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white"
                      required
                    />
                  </label>

                  <label className="space-y-2 block">
                    <span className="text-base font-bold text-gray-700">
                      終了時間
                    </span>
                    <input
                      type="time"
                      value={game.endTime}
                      onChange={(event) =>
                        updateGame(game.id, "endTime", event.target.value)
                      }
                      step={900}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white"
                      required
                    />
                  </label>

                  <label className="space-y-2 block">
                    <span className="text-base font-bold text-gray-700">
                      3塁側
                    </span>
                    <select
                      value={game.awayTeam}
                      onChange={(event) =>
                        updateGame(game.id, "awayTeam", event.target.value)
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white"
                      required
                    >
                      <option value="">選択してください</option>
                      {TEAM_OPTIONS.map((team) => (
                        <option key={team} value={team}>
                          {team}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="space-y-2 block">
                    <span className="text-base font-bold text-gray-700">
                      1塁側
                    </span>
                    <select
                      value={game.homeTeam}
                      onChange={(event) =>
                        updateGame(game.id, "homeTeam", event.target.value)
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white"
                      required
                    >
                      <option value="">選択してください</option>
                      {TEAM_OPTIONS.map((team) => (
                        <option key={team} value={team}>
                          {team}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="space-y-2 block">
                    <span className="text-base font-bold text-gray-700">
                      大会種類
                    </span>
                    <select
                      value={game.gameType}
                      onChange={(event) =>
                        updateGame(
                          game.id,
                          "gameType",
                          event.target.value as GameType,
                        )
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white"
                    >
                      <option value="リーグ戦">リーグ戦</option>
                      <option value="トーナメント">トーナメント</option>
                    </select>
                  </label>
                </div>
              </div>
            ))}
            {games.length === 0 && (
              <p className="text-base font-bold text-gray-600">休み</p>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-xl font-black text-gray-900">
            休みチーム（複数選択）
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {TEAM_OPTIONS.map((team) => (
              <label
                key={team}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-base font-bold text-gray-700"
              >
                <input
                  type="checkbox"
                  checked={restTeams.includes(team)}
                  onChange={() => toggleRestTeam(team)}
                  className="h-4 w-4"
                />
                {team}
              </label>
            ))}
          </div>
        </div>

        <label className="space-y-2 block">
          <span className="text-base font-bold text-gray-700">備考</span>
          <input
            type="text"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white"
            placeholder="備考があれば入力してください"
          />
        </label>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            className="w-full md:w-auto bg-blue-600 text-white font-black px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {editingEntryId !== null ? "入力内容を更新" : "入力内容を保存"}
          </button>
          {editingEntryId !== null && (
            <button
              type="button"
              onClick={resetForm}
              className="w-full md:w-auto bg-gray-200 text-gray-800 font-black px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors"
            >
              キャンセル
            </button>
          )}
        </div>
      </form>
    </section>
  );

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl md:text-3xl font-black text-gray-900">
            試合日程入力
          </h1>
          <p className="text-base text-gray-600 mt-2">
            1画面で入力と確認ができるモックです。
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

        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-black text-gray-900">
              対戦日程を自動作成
            </h2>
            <button
              type="button"
              onClick={() => setIsAutoGenerateOpen((prev) => !prev)}
              className="text-base font-bold text-blue-700 hover:underline"
            >
              {isAutoGenerateOpen ? "閉じる" : "開く"}
            </button>
          </div>

          {isAutoGenerateOpen && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <label className="space-y-2 block">
                  <span className="text-base font-bold text-gray-700">
                    対象期間
                  </span>
                  <select
                    value={autoPeriod}
                    onChange={(event) =>
                      setAutoPeriod(event.target.value as PeriodFilter)
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white"
                  >
                    <option value="spring">3〜5月</option>
                    <option value="summer">6〜8月</option>
                    <option value="autumn">9〜11月</option>
                  </select>
                </label>

                <label className="space-y-2 block">
                  <span className="text-base font-bold text-gray-700">
                    球場
                  </span>
                  <select
                    value={autoStadium}
                    onChange={(event) => setAutoStadium(event.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white"
                  >
                    {STADIUM_OPTIONS.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={handleAutoGenerate}
                    className="w-full bg-blue-600 text-white font-black px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    自動作成
                  </button>
                </div>
              </div>
              <p className="text-base text-gray-600">
                毎週日曜を対象に、入力済みデータを維持したまま不足分のみ作成します。
              </p>
            </>
          )}
        </section>

        {editingEntryId === null && (
          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-black text-gray-900">新規入力欄</h2>
              <button
                type="button"
                onClick={() => setIsNewEntryOpen((prev) => !prev)}
                className="text-base font-bold text-blue-700 hover:underline"
              >
                {isNewEntryOpen ? "閉じる" : "開く"}
              </button>
            </div>
            {isNewEntryOpen && renderScheduleForm()}
          </section>
        )}

        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-xl font-black text-gray-900">入力済みデータ</h2>
            <div className="inline-flex rounded-lg border border-gray-300 overflow-hidden">
              {(["spring", "summer", "autumn"] as PeriodFilter[]).map(
                (period) => (
                  <button
                    key={period}
                    type="button"
                    onClick={() => setPeriodFilter(period)}
                    className={`px-4 py-2 text-base font-bold ${
                      periodFilter === period
                        ? "bg-blue-600 text-white"
                        : "bg-white text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {periodLabelMap[period]}
                  </button>
                ),
              )}
            </div>
          </div>

          {filteredEntries.length === 0 ? (
            <p className="text-base text-gray-500">
              該当期間のデータはまだありません。
            </p>
          ) : (
            <div className="space-y-4">
              {filteredEntries.map((entry) => (
                <div key={entry.id} className="space-y-4">
                  <article
                    className={`rounded-xl border p-4 space-y-3 ${
                      editingEntryId === entry.id
                        ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                        : entry.games.length === 0
                          ? "border-red-200 bg-red-50"
                          : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-base font-bold text-gray-800">
                        <span className="inline-flex items-center gap-1 text-xl md:text-2xl font-black text-gray-900">
                          <Calendar size={18} className="text-blue-600" />
                          {entry.date}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MapPin size={18} className="text-blue-600" />
                          球場: {entry.stadium}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        {editingEntryId === entry.id && (
                          <span className="text-base font-black text-blue-700">
                            編集中
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleEdit(entry)}
                          className="text-base font-bold text-blue-700 hover:underline"
                        >
                          編集
                        </button>
                      </div>
                    </div>

                    {entry.games.length > 0 && (
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-base font-bold text-gray-700">
                        <span className="inline-flex items-center gap-1">
                          <Wrench size={18} className="text-orange-500" />
                          準備当番: {entry.games[0].awayTeam}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <CircleCheck size={18} className="text-orange-500" />
                          片付け当番:{" "}
                          {entry.games[entry.games.length - 1].homeTeam}
                        </span>
                      </div>
                    )}

                    <div className="space-y-2">
                      {entry.games.length === 0 ? (
                        <p className="text-base font-bold text-gray-600">
                          休み
                        </p>
                      ) : (
                        entry.games.map((game, idx) => (
                          <div
                            key={`${entry.id}-${game.id}`}
                            className="rounded-lg border border-gray-200 bg-white p-3"
                          >
                            <p className="text-base font-bold text-gray-800">
                              第{idx + 1}試合
                            </p>
                            <p className="text-base text-gray-700 mt-1">
                              {game.startTime}〜{game.endTime} /{" "}
                              <span className="inline-flex items-center gap-1">
                                {idx === 0 && (
                                  <Wrench
                                    size={16}
                                    className="text-orange-500"
                                  />
                                )}
                                {game.awayTeam}
                              </span>{" "}
                              vs{" "}
                              <span className="inline-flex items-center gap-1">
                                {idx === entry.games.length - 1 && (
                                  <CircleCheck
                                    size={16}
                                    className="text-orange-500"
                                  />
                                )}
                                {game.homeTeam}
                              </span>{" "}
                              / {game.gameType}
                            </p>
                          </div>
                        ))
                      )}
                    </div>

                    <p className="text-base text-gray-700">
                      休みチーム:{" "}
                      {entry.restTeams.length > 0
                        ? entry.restTeams.join("、")
                        : "なし"}
                    </p>
                    <p className="text-base text-gray-700">
                      備考: {entry.note.trim() ? entry.note : "なし"}
                    </p>
                  </article>
                  {editingEntryId === entry.id && renderScheduleForm()}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
