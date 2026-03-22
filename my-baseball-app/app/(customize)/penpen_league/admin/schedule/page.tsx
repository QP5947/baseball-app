"use client";

import Link from "next/link";
import {
  Calendar,
  DoorClosedLocked,
  DoorOpen,
  MapPin,
  Plus,
  Trash2,
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { penpenAdminMutate } from "../lib/adminApi";
import {
  getPeriodFromDate,
  type PenpenMaster,
  type PenpenScheduleEntry,
} from "../../lib/penpenData";

type GameType = string;
type GameTypeOption = {
  id: string;
  name: string;
};
type PeriodFilter = "spring" | "summer" | "autumn";

type GameInput = {
  tempId: string;
  startTime: string;
  endTime: string;
  awayTeamId: string;
  homeTeamId: string;
  gameType: GameType;
};

const TBD_TEAM_VALUE = "__TBD_TEAM__";

const periodLabelMap: Record<PeriodFilter, string> = {
  spring: "3〜5月",
  summer: "6〜8月",
  autumn: "9〜11月",
};

const resolveGameTypeValue = (value: string, options: GameTypeOption[]) => {
  if (options.some((option) => option.id === value)) {
    return value;
  }

  const exactNameMatch = options.find((option) => option.name === value);
  if (exactNameMatch) {
    return exactNameMatch.id;
  }

  if (value.includes("トーナメント")) {
    return (
      options.find((option) => option.name.includes("トーナメント"))?.id ?? ""
    );
  }

  if (value.includes("リーグ")) {
    return options.find((option) => option.name.includes("リーグ"))?.id ?? "";
  }

  return options[0]?.id ?? "";
};

const toGameTypeCode = (value: string): "league" | "tournament" =>
  value.includes("トーナメント") ? "tournament" : "league";

const toFormTeamValue = (teamId: string, undecidedTeamId: string | null) => {
  if (undecidedTeamId && teamId === undecidedTeamId) {
    return TBD_TEAM_VALUE;
  }
  return teamId;
};

const toPersistTeamId = (teamId: string, undecidedTeamId: string | null) => {
  if (teamId === TBD_TEAM_VALUE) {
    return undecidedTeamId ?? "";
  }
  return teamId;
};

const createGame = (gameType: GameType = ""): GameInput => ({
  tempId: `${Date.now()}_${Math.random()}`,
  startTime: "",
  endTime: "",
  awayTeamId: "",
  homeTeamId: "",
  gameType,
});

const toDateInput = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const getTodayDateInput = () => {
  return toDateInput(new Date());
};

const getNextSundayAfterLastEntry = (entries: PenpenScheduleEntry[]) => {
  if (entries.length === 0) {
    return getTodayDateInput();
  }

  const latestDate = entries.reduce(
    (max, entry) => (entry.date > max ? entry.date : max),
    entries[0].date,
  );
  const latest = new Date(`${latestDate}T00:00:00`);
  if (Number.isNaN(latest.getTime())) {
    return getTodayDateInput();
  }

  const day = latest.getDay();
  const addDays = (7 - day) % 7 || 7;
  latest.setDate(latest.getDate() + addDays);
  return toDateInput(latest);
};

const createDefaultGames = (gameType: GameType = ""): GameInput[] => [
  {
    ...createGame(gameType),
    startTime: "08:30",
    endTime: "10:30",
  },
  {
    ...createGame(gameType),
    startTime: "10:45",
    endTime: "12:45",
  },
  {
    ...createGame(gameType),
    startTime: "13:00",
    endTime: "15:00",
  },
];

export default function PenpenAdminSchedulePage() {
  useEffect(() => {
    document.title = "試合日程入力 | ペンペンリーグ";
  }, []);

  const [date, setDate] = useState(() => getTodayDateInput());
  const [stadiumId, setStadiumId] = useState("");
  const [games, setGames] = useState<GameInput[]>(() => createDefaultGames());
  const [note, setNote] = useState("");
  const [entries, setEntries] = useState<PenpenScheduleEntry[]>([]);
  const [leagues, setLeagues] = useState<PenpenMaster[]>([]);
  const [teams, setTeams] = useState<PenpenMaster[]>([]);
  const [undecidedTeamId, setUndecidedTeamId] = useState<string | null>(null);
  const [stadiums, setStadiums] = useState<PenpenMaster[]>([]);
  const [restTeamIds, setRestTeamIds] = useState<string[]>([]);
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("spring");
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [isNewEntryOpen, setIsNewEntryOpen] = useState(false);

  const gameTypeOptions = useMemo<GameTypeOption[]>(() => {
    const options = leagues
      .filter((item) => item.isEnabled)
      .map((item) => ({
        id: item.id,
        name: item.name.trim(),
      }))
      .filter((item) => item.name.length > 0);

    return options;
  }, [leagues]);

  const gameTypeOptionIds = useMemo(
    () => gameTypeOptions.map((option) => option.id),
    [gameTypeOptions],
  );

  const defaultGameType = gameTypeOptionIds[0] ?? "";

  const gameTypeNameById = useMemo(
    () => new Map(gameTypeOptions.map((option) => [option.id, option.name])),
    [gameTypeOptions],
  );

  const teamNameById = useMemo(() => {
    const map = new Map(teams.map((item) => [item.id, item.name]));
    if (undecidedTeamId) {
      map.set(undecidedTeamId, "未定");
    }
    return map;
  }, [teams, undecidedTeamId]);

  const ensureUndecidedTeam = useCallback(async () => {
    const response = await penpenAdminMutate<{ teamId: string }>({
      action: "ensureUndecidedTeam",
    });
    return response.data.teamId;
  }, []);

  const loadAll = useCallback(async () => {
    try {
      const [dashboardResponse, undecidedId] = await Promise.all([
        fetch("/penpen_league/admin/api/dashboard", {
          method: "GET",
          credentials: "same-origin",
        }),
        ensureUndecidedTeam(),
      ]);

      const dashboardPayload = (await dashboardResponse
        .json()
        .catch(() => null)) as {
        message?: string;
        entries?: PenpenScheduleEntry[];
        masters?: {
          leagues: PenpenMaster[];
          teams: PenpenMaster[];
          stadiums: PenpenMaster[];
        };
      } | null;

      if (!dashboardResponse.ok) {
        throw new Error(dashboardPayload?.message ?? "unknown");
      }

      const leagueData = dashboardPayload?.masters?.leagues ?? [];
      const teamData = dashboardPayload?.masters?.teams ?? [];
      const stadiumData = dashboardPayload?.masters?.stadiums ?? [];
      const entryData = dashboardPayload?.entries ?? [];

      setLeagues(leagueData);
      setUndecidedTeamId(undecidedId);
      setTeams(
        teamData.filter(
          (item) => item.id !== undecidedId && item.name.trim() !== "未定",
        ),
      );
      setStadiums(stadiumData);
      setEntries(entryData);
      if (editingEntryId === null) {
        setDate(getNextSundayAfterLastEntry(entryData));
      }
      setStadiumId(
        (prev) => prev || stadiumData.find((item) => item.isEnabled)?.id || "",
      );
    } catch (error) {
      window.alert(
        `日程データの取得に失敗しました: ${error instanceof Error ? error.message : "unknown"}`,
      );
    }
  }, [editingEntryId, ensureUndecidedTeam]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const enabledTeams = useMemo(
    () => teams.filter((item) => item.isEnabled),
    [teams],
  );
  const playableTeams = useMemo(
    () => enabledTeams.filter((item) => item.id !== undecidedTeamId),
    [enabledTeams, undecidedTeamId],
  );
  const enabledStadiums = useMemo(
    () => stadiums.filter((item) => item.isEnabled),
    [stadiums],
  );
  const enabledTeamIds = useMemo(
    () => playableTeams.map((team) => team.id),
    [playableTeams],
  );
  const selectedTeamIds = useMemo(
    () =>
      new Set(
        games
          .flatMap((game) => [game.awayTeamId, game.homeTeamId])
          .filter((teamId) => teamId && teamId !== TBD_TEAM_VALUE),
      ),
    [games],
  );

  useEffect(() => {
    if (enabledTeamIds.length === 0) {
      return;
    }

    setRestTeamIds((prev) =>
      prev.length > 0
        ? prev.filter((teamId) => enabledTeamIds.includes(teamId))
        : enabledTeamIds,
    );
  }, [enabledTeamIds]);

  useEffect(() => {
    setRestTeamIds((prev) =>
      prev.filter((teamId) => !selectedTeamIds.has(teamId)),
    );
  }, [selectedTeamIds]);

  useEffect(() => {
    setGames((prev) =>
      prev.map((game) =>
        gameTypeOptionIds.includes(game.gameType)
          ? game
          : {
              ...game,
              gameType: resolveGameTypeValue(game.gameType, gameTypeOptions),
            },
      ),
    );
  }, [gameTypeOptionIds, gameTypeOptions]);

  const addGame = () => {
    setGames((prev) => [...prev, createGame(defaultGameType)]);
  };

  const removeGame = (tempId: string) => {
    setGames((prev) => prev.filter((game) => game.tempId !== tempId));
  };

  const updateGame = <K extends keyof GameInput>(
    tempId: string,
    key: K,
    value: GameInput[K],
  ) => {
    setGames((prev) =>
      prev.map((game) =>
        game.tempId === tempId ? { ...game, [key]: value } : game,
      ),
    );
  };

  const resetForm = () => {
    setDate(getNextSundayAfterLastEntry(entries));
    setStadiumId(enabledStadiums[0]?.id ?? "");
    setGames(createDefaultGames(defaultGameType));
    setRestTeamIds(enabledTeamIds);
    setNote("");
    setEditingEntryId(null);
  };

  const handleEdit = (entry: PenpenScheduleEntry) => {
    setIsNewEntryOpen(false);
    setDate(entry.date);
    setStadiumId(entry.stadiumId ?? "");
    setGames(
      entry.games.length > 0
        ? entry.games.map((game) => ({
            tempId: game.id,
            startTime: game.startTime,
            endTime: game.endTime,
            awayTeamId: toFormTeamValue(game.awayTeamId, undecidedTeamId),
            homeTeamId: toFormTeamValue(game.homeTeamId, undecidedTeamId),
            gameType: game.leagueId ?? game.gameType,
          }))
        : [createGame(defaultGameType)],
    );
    setRestTeamIds(entry.restTeamIds);
    setNote(entry.note);
    setEditingEntryId(entry.id);
  };

  const handleDeleteEntry = async (entryId: string) => {
    const target = entries.find((entry) => entry.id === entryId);
    const confirmed = window.confirm(
      `${target?.date ?? "この日程"} を削除します。よろしいですか？`,
    );
    if (!confirmed) return;

    try {
      await penpenAdminMutate({
        action: "delete",
        table: "schedule_days",
        match: [{ column: "id", value: entryId }],
      });
    } catch (error) {
      window.alert(
        `日程の削除に失敗しました: ${error instanceof Error ? error.message : "unknown"}`,
      );
      return;
    }

    await loadAll();
    if (editingEntryId === entryId) {
      resetForm();
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (
      !undecidedTeamId &&
      games.some(
        (game) =>
          game.awayTeamId === TBD_TEAM_VALUE ||
          game.homeTeamId === TBD_TEAM_VALUE,
      )
    ) {
      window.alert(
        "「未定」を保存するには、チームマスタに「未定」を登録してください。",
      );
      return;
    }

    const validGames = games.filter((game) => {
      const awayTeamId = toPersistTeamId(game.awayTeamId, undecidedTeamId);
      const homeTeamId = toPersistTeamId(game.homeTeamId, undecidedTeamId);

      return game.startTime && game.endTime && awayTeamId && homeTeamId;
    });

    try {
      let dayId = editingEntryId;

      if (!dayId) {
        const response = await penpenAdminMutate<{ id: string }>({
          action: "insert",
          table: "schedule_days",
          rows: [
            {
              match_date: date,
              stadium_id: stadiumId || null,
              note: note || null,
            },
          ],
          returning: ["id"],
          single: true,
        });

        dayId = response.data.id;
      } else {
        await penpenAdminMutate({
          action: "update",
          table: "schedule_days",
          values: {
            match_date: date,
            stadium_id: stadiumId || null,
            note: note || null,
          },
          match: [{ column: "id", value: dayId }],
        });

        await Promise.all([
          penpenAdminMutate({
            action: "delete",
            table: "scheduled_games",
            match: [{ column: "schedule_day_id", value: dayId }],
          }),
          penpenAdminMutate({
            action: "delete",
            table: "schedule_day_rest_teams",
            match: [{ column: "schedule_day_id", value: dayId }],
          }),
        ]);
      }

      if (validGames.length > 0) {
        const gameRows = validGames.map((game, index) => {
          const gameTypeName = gameTypeNameById.get(game.gameType) ?? "";
          const awayTeamId = toPersistTeamId(game.awayTeamId, undecidedTeamId);
          const homeTeamId = toPersistTeamId(game.homeTeamId, undecidedTeamId);
          return {
            schedule_day_id: dayId,
            display_order: index + 1,
            start_time: `${game.startTime}:00`,
            end_time: `${game.endTime}:00`,
            away_team_id: awayTeamId,
            home_team_id: homeTeamId,
            game_type: toGameTypeCode(gameTypeName),
            league_id: game.gameType || null,
          };
        });

        await penpenAdminMutate({
          action: "insert",
          table: "scheduled_games",
          rows: gameRows,
        });
      }

      if (restTeamIds.length > 0) {
        const restRows = restTeamIds.map((teamId) => ({
          schedule_day_id: dayId,
          team_id: teamId,
        }));

        await penpenAdminMutate({
          action: "insert",
          table: "schedule_day_rest_teams",
          rows: restRows,
        });
      }

      resetForm();
      await loadAll();
    } catch (error) {
      window.alert(
        `日程保存に失敗しました: ${error instanceof Error ? error.message : "unknown"}`,
      );
    }
  };

  const filteredEntries = useMemo(() => {
    return entries
      .filter((entry) => getPeriodFromDate(entry.date) === periodFilter)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [entries, periodFilter]);

  const renderScheduleForm = (addTopMargin: boolean) => (
    <form
      className={`space-y-8 ${addTopMargin ? "mt-4" : ""}`}
      onSubmit={handleSubmit}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="space-y-2 block">
          <span className="text-base font-bold text-gray-700">日付</span>
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white"
            required
          />
        </label>

        <label className="space-y-2 block">
          <span className="text-base font-bold text-gray-700">球場</span>
          <select
            value={stadiumId}
            onChange={(event) => setStadiumId(event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white"
            required
          >
            <option value="">選択してください</option>
            {enabledStadiums.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
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
            className="inline-flex items-center gap-2 bg-blue-600 text-white font-bold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
          >
            <Plus size={18} />
            試合を追加
          </button>
        </div>

        <div className="space-y-4">
          {games.length > 0 && (
            <div className="overflow-x-auto md:overflow-x-visible rounded-xl border border-gray-200 bg-white">
              <table className="w-full min-w-245 md:min-w-full table-fixed text-base">
                <thead className="bg-gray-100 text-gray-700">
                  <tr>
                    <th className="w-16 px-3 py-2 text-left font-black">
                      試合
                    </th>
                    <th className="w-32 px-3 py-2 text-left font-black">
                      開始時間
                    </th>
                    <th className="w-32 px-3 py-2 text-left font-black">
                      終了時間
                    </th>
                    <th className="w-52 px-3 py-2 text-left font-black">
                      3塁側
                    </th>
                    <th className="w-52 px-3 py-2 text-left font-black">
                      1塁側
                    </th>
                    <th className="w-32 px-3 py-2 text-left font-black">
                      大会種類
                    </th>
                    <th className="w-16 px-3 py-2 text-left font-black">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {games.map((game, idx) => (
                    <tr key={game.tempId} className="border-t border-gray-200">
                      <td className="px-3 py-2 font-bold text-gray-800 whitespace-nowrap">
                        第{idx + 1}試合
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="time"
                          value={game.startTime}
                          onChange={(event) =>
                            updateGame(
                              game.tempId,
                              "startTime",
                              event.target.value,
                            )
                          }
                          step={900}
                          className="w-full min-w-0 rounded-lg border border-gray-300 px-3 py-2 bg-white"
                          required
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="time"
                          value={game.endTime}
                          onChange={(event) =>
                            updateGame(
                              game.tempId,
                              "endTime",
                              event.target.value,
                            )
                          }
                          step={900}
                          className="w-full min-w-0 rounded-lg border border-gray-300 px-3 py-2 bg-white"
                          required
                        />
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={game.awayTeamId}
                          onChange={(event) =>
                            updateGame(
                              game.tempId,
                              "awayTeamId",
                              event.target.value,
                            )
                          }
                          className="w-full min-w-0 rounded-lg border border-gray-300 px-3 py-2 bg-white"
                          required
                        >
                          <option value="">選択してください</option>
                          {playableTeams.map((team) => (
                            <option key={team.id} value={team.id}>
                              {team.name}
                            </option>
                          ))}
                          <option value={TBD_TEAM_VALUE}>未定</option>
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={game.homeTeamId}
                          onChange={(event) =>
                            updateGame(
                              game.tempId,
                              "homeTeamId",
                              event.target.value,
                            )
                          }
                          className="w-full min-w-0 rounded-lg border border-gray-300 px-3 py-2 bg-white"
                          required
                        >
                          <option value="">選択してください</option>
                          {playableTeams.map((team) => (
                            <option key={team.id} value={team.id}>
                              {team.name}
                            </option>
                          ))}
                          <option value={TBD_TEAM_VALUE}>未定</option>
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={game.gameType}
                          onChange={(event) =>
                            updateGame(
                              game.tempId,
                              "gameType",
                              event.target.value as GameType,
                            )
                          }
                          className="w-full min-w-0 rounded-lg border border-gray-300 px-3 py-2 bg-white"
                        >
                          {gameTypeOptions.map((option) => (
                            <option key={option.id} value={option.id}>
                              {option.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          onClick={() => removeGame(game.tempId)}
                          aria-label="試合を削除"
                          title="削除"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-40 cursor-pointer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {games.length === 0 && (
            <p className="text-base font-bold text-gray-600">休み</p>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-xl font-black text-gray-900">休みチーム</h2>
        {playableTeams.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {playableTeams.map((team) => {
              const isUsedInGame = selectedTeamIds.has(team.id);
              const isChecked = restTeamIds.includes(team.id);
              return (
                <label
                  key={team.id}
                  className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-base font-bold ${
                    isUsedInGame
                      ? "border-gray-200 bg-gray-100 text-gray-400"
                      : "border-gray-300 bg-white text-gray-700"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    disabled={isUsedInGame}
                    onChange={(event) => {
                      if (event.target.checked) {
                        setRestTeamIds((prev) =>
                          prev.includes(team.id) ? prev : [...prev, team.id],
                        );
                        return;
                      }

                      setRestTeamIds((prev) =>
                        prev.filter((teamId) => teamId !== team.id),
                      );
                    }}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <span>{team.name}</span>
                </label>
              );
            })}
          </div>
        ) : (
          <p className="text-base font-bold text-gray-600">なし</p>
        )}
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
          className="w-full md:w-auto bg-blue-600 text-white font-black px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
        >
          {editingEntryId ? "保存" : "入力内容を保存"}
        </button>
        {editingEntryId ? (
          <button
            type="button"
            onClick={resetForm}
            className="w-full md:w-auto bg-gray-200 text-gray-800 font-black px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors cursor-pointer"
          >
            キャンセル
          </button>
        ) : null}
      </div>
    </form>
  );

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl md:text-3xl font-black text-gray-900">
            試合日程入力
          </h1>
          <p className="text-base text-gray-600 mt-2">
            日程、試合、休みチームをDBに保存します。
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

        {editingEntryId === null ? (
          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
            <button
              type="button"
              onClick={() => setIsNewEntryOpen((prev) => !prev)}
              className="w-full flex items-center justify-between gap-3 text-left cursor-pointer"
            >
              <h2 className="text-xl font-black text-gray-900">新規入力</h2>
              <span className="text-base font-bold text-blue-700 hover:underline">
                {isNewEntryOpen ? "閉じる" : "開く"}
              </span>
            </button>

            {isNewEntryOpen ? renderScheduleForm(true) : null}
          </section>
        ) : null}

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
                    className={`px-4 py-2 text-base font-bold cursor-pointer ${
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
                <article
                  key={entry.id}
                  className={`rounded-xl border p-4 space-y-3 ${
                    editingEntryId === entry.id
                      ? "border-blue-200 bg-blue-50"
                      : entry.games.length === 0
                        ? "border-red-200 bg-red-50"
                        : "border-gray-200 bg-gray-50"
                  }`}
                >
                  {editingEntryId === entry.id ? (
                    renderScheduleForm(false)
                  ) : (
                    <>
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
                          <button
                            type="button"
                            onClick={() => handleEdit(entry)}
                            className="text-base font-bold text-blue-700 hover:underline cursor-pointer"
                          >
                            編集
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDeleteEntry(entry.id)}
                            className="text-base font-bold text-red-700 hover:underline cursor-pointer"
                          >
                            削除
                          </button>
                        </div>
                      </div>

                      {entry.games.length > 0 ? (
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-base font-bold text-gray-700">
                            <span className="inline-flex items-center gap-1">
                              <DoorOpen size={18} className="text-orange-500" />
                              準備当番: {entry.games[0].awayTeam}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <DoorClosedLocked
                                size={18}
                                className="text-orange-500"
                              />
                              片付け当番:{" "}
                              {entry.games[entry.games.length - 1].homeTeam}
                            </span>
                          </div>

                          <div className="overflow-x-auto md:overflow-x-visible rounded-lg border border-gray-200 bg-white">
                            <table className="w-full min-w-190 md:min-w-full table-fixed text-base">
                              <thead className="bg-gray-100 text-gray-700">
                                <tr>
                                  <th className="w-20 md:w-auto px-3 py-2 text-left font-black">
                                    試合
                                  </th>
                                  <th className="w-36 md:w-auto px-3 py-2 text-left font-black">
                                    時間
                                  </th>
                                  <th className="w-60 md:w-auto px-3 py-2 text-left font-black">
                                    3塁側
                                  </th>
                                  <th className="w-60 md:w-auto px-3 py-2 text-left font-black">
                                    1塁側
                                  </th>
                                  <th className="w-32 md:w-auto px-3 py-2 text-left font-black">
                                    大会種類
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {entry.games.map((game, idx) => (
                                  <tr
                                    key={`${entry.id}-${game.id}`}
                                    className="border-t border-gray-200"
                                  >
                                    <td className="px-3 py-2 font-bold text-gray-800 whitespace-nowrap">
                                      第{idx + 1}試合
                                    </td>
                                    <td className="px-3 py-2 text-gray-700 whitespace-nowrap">
                                      {game.startTime}〜{game.endTime}
                                    </td>
                                    <td className="px-3 py-2 text-gray-700 whitespace-nowrap">
                                      <span className="inline-flex items-center gap-1">
                                        {idx === 0 ? (
                                          <DoorOpen
                                            size={16}
                                            className="text-orange-500"
                                          />
                                        ) : null}
                                        {teamNameById.get(game.awayTeamId)}
                                      </span>
                                    </td>
                                    <td className="px-3 py-2 text-gray-700 whitespace-nowrap">
                                      <span className="inline-flex items-center gap-1">
                                        {idx === entry.games.length - 1 ? (
                                          <DoorClosedLocked
                                            size={16}
                                            className="text-orange-500"
                                          />
                                        ) : null}
                                        {teamNameById.get(game.homeTeamId)}
                                      </span>
                                    </td>
                                    <td className="px-3 py-2 text-gray-700 whitespace-nowrap">
                                      {game.gameType}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ) : (
                        <p className="text-base font-bold text-gray-700">
                          休み（試合なし）
                        </p>
                      )}

                      <p className="text-base text-gray-700">
                        休みチーム:{" "}
                        {entry.restTeams.length > 0
                          ? entry.restTeams.join("、")
                          : "なし"}
                      </p>
                      <p className="text-base text-gray-700">
                        備考: {entry.note.trim() ? entry.note : "なし"}
                      </p>
                    </>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
