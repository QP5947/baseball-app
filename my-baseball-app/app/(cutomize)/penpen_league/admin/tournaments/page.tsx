"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";

type LeagueItem = {
  id: number;
  name: string;
  isEnabled: boolean;
};

type TournamentItem = {
  id: number;
  leagueName: string;
  imageDataUrl: string;
  imageFileName: string;
};

const TOURNAMENT_STORAGE_KEY = "penpen_league_tournament_entries_v1";
const LEAGUE_STORAGE_KEY = "penpen_league_leagues_v1";

const fallbackLeagueOptions = ["リーグ戦", "トーナメント"];

const normalizeTournaments = (items: TournamentItem[]) =>
  items.map((item) => ({
    id: item.id,
    leagueName: item.leagueName ?? "",
    imageDataUrl: item.imageDataUrl ?? "",
    imageFileName: item.imageFileName ?? "",
  }));

const getLeagueOptions = () => {
  const raw = localStorage.getItem(LEAGUE_STORAGE_KEY);
  if (!raw) {
    return fallbackLeagueOptions;
  }

  try {
    const parsed = JSON.parse(raw) as LeagueItem[];
    const enabledNames = parsed
      .filter((item) => item.isEnabled)
      .map((item) => item.name.trim())
      .filter(Boolean);
    const unique = Array.from(new Set(enabledNames));
    return unique.length > 0 ? unique : fallbackLeagueOptions;
  } catch {
    return fallbackLeagueOptions;
  }
};

export default function PenpenAdminTournamentsPage() {
  const [leagueOptions, setLeagueOptions] = useState<string[]>(
    fallbackLeagueOptions,
  );
  const [tournaments, setTournaments] = useState<TournamentItem[]>([]);
  const [draftTournaments, setDraftTournaments] = useState<TournamentItem[]>(
    [],
  );
  const [newLeagueName, setNewLeagueName] = useState("");
  const [newImageDataUrl, setNewImageDataUrl] = useState("");
  const [newImageFileName, setNewImageFileName] = useState("");
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const options = getLeagueOptions();
    setLeagueOptions(options);
    setNewLeagueName(options[0] ?? "");

    const raw = localStorage.getItem(TOURNAMENT_STORAGE_KEY);
    if (raw) {
      try {
        const loaded = normalizeTournaments(
          JSON.parse(raw) as TournamentItem[],
        );
        setTournaments(loaded);
        setDraftTournaments(loaded);
      } catch {
        setTournaments([]);
        setDraftTournaments([]);
      }
    }

    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }
    localStorage.setItem(TOURNAMENT_STORAGE_KEY, JSON.stringify(tournaments));
  }, [tournaments, isHydrated]);

  const withCurrentLeagueOptions = useMemo(
    () => (value: string) => {
      if (!value || leagueOptions.includes(value)) {
        return leagueOptions;
      }
      return [value, ...leagueOptions];
    },
    [leagueOptions],
  );

  const readImageFile = (
    file: File,
    onSuccess: (dataUrl: string, fileName: string) => void,
  ) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        onSuccess(reader.result, file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleNewImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    readImageFile(file, (dataUrl, fileName) => {
      setNewImageDataUrl(dataUrl);
      setNewImageFileName(fileName);
    });
  };

  const handleDraftImageChange = (
    id: number,
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    readImageFile(file, (dataUrl, fileName) => {
      setDraftTournaments((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, imageDataUrl: dataUrl, imageFileName: fileName }
            : item,
        ),
      );
    });
  };

  const addTournament = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!newLeagueName || !newImageDataUrl) {
      return;
    }

    const next: TournamentItem = {
      id: Date.now(),
      leagueName: newLeagueName,
      imageDataUrl: newImageDataUrl,
      imageFileName: newImageFileName,
    };

    setTournaments((prev) => [...prev, next]);
    setDraftTournaments((prev) => [...prev, next]);
    setNewImageDataUrl("");
    setNewImageFileName("");
  };

  const updateDraftLeagueName = (id: number, leagueName: string) => {
    setDraftTournaments((prev) =>
      prev.map((item) => (item.id === id ? { ...item, leagueName } : item)),
    );
  };

  const saveTournament = (id: number) => {
    const target = draftTournaments.find((item) => item.id === id);
    if (!target) {
      return;
    }

    const leagueName = target.leagueName.trim();
    if (!leagueName || !target.imageDataUrl) {
      return;
    }

    setTournaments((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              leagueName,
              imageDataUrl: target.imageDataUrl,
              imageFileName: target.imageFileName,
            }
          : item,
      ),
    );

    setDraftTournaments((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              leagueName,
              imageDataUrl: target.imageDataUrl,
              imageFileName: target.imageFileName,
            }
          : item,
      ),
    );
  };

  const deleteTournament = (id: number) => {
    const target = tournaments.find((item) => item.id === id);
    const confirmed = window.confirm(
      `${target?.leagueName ?? "このトーナメント"} を削除します。よろしいですか？`,
    );

    if (!confirmed) {
      return;
    }

    setTournaments((prev) => prev.filter((item) => item.id !== id));
    setDraftTournaments((prev) => prev.filter((item) => item.id !== id));
  };

  const cancelTournamentChanges = (id: number) => {
    const saved = tournaments.find((item) => item.id === id);
    if (!saved) {
      return;
    }

    setDraftTournaments((prev) =>
      prev.map((item) => (item.id === id ? { ...saved } : item)),
    );
  };

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl md:text-3xl font-black text-gray-900">
            トーナメント管理
          </h1>
          <p className="text-base text-gray-600 mt-2">
            大会名のプルダウンと画像アップロードのセットを管理できます。
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

        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 md:p-6">
          <h2 className="text-xl font-black text-gray-900">新規セット追加</h2>

          <form onSubmit={addTournament} className="mt-4 space-y-4">
            <label className="space-y-2 block">
              <span className="text-base font-bold text-gray-700">大会名</span>
              <select
                value={newLeagueName}
                onChange={(event) => setNewLeagueName(event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white"
                required
              >
                {leagueOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 block">
              <span className="text-base font-bold text-gray-700">
                画像アップロード
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleNewImageChange}
                className="block w-full text-base"
                required
              />
            </label>

            {newImageDataUrl ? (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-2">
                <p className="text-base font-bold text-gray-700">
                  ファイル名: {newImageFileName || "未設定"}
                </p>
                <img
                  src={newImageDataUrl}
                  alt="新規画像プレビュー"
                  className="w-full max-h-56 object-contain bg-white rounded-lg border border-gray-300"
                />
              </div>
            ) : null}

            <button
              type="submit"
              className="bg-blue-600 text-white font-black px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors"
            >
              追加
            </button>
          </form>
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 md:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-black text-gray-900">登録済みセット</h2>
            <p className="text-base text-gray-600">
              編集後に保存してください。
            </p>
          </div>

          {tournaments.length === 0 ? (
            <p className="mt-4 text-base text-gray-500">
              登録済みセットはまだありません。
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {tournaments.map((item, index) => {
                const draft =
                  draftTournaments.find(
                    (draftItem) => draftItem.id === item.id,
                  ) ?? item;
                const options = withCurrentLeagueOptions(draft.leagueName);

                return (
                  <article
                    key={item.id}
                    className="rounded-xl border border-gray-200 bg-gray-50 p-4 md:p-5"
                  >
                    <p className="text-base font-black text-gray-700">
                      セット {index + 1}
                    </p>

                    <div className="mt-3 space-y-3">
                      <label className="space-y-2 block">
                        <span className="text-base font-bold text-gray-700">
                          大会名
                        </span>
                        <select
                          value={draft.leagueName}
                          onChange={(event) =>
                            updateDraftLeagueName(item.id, event.target.value)
                          }
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white"
                        >
                          {options.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="space-y-2 block">
                        <span className="text-base font-bold text-gray-700">
                          画像アップロード
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(event) =>
                            handleDraftImageChange(item.id, event)
                          }
                          className="block w-full text-base"
                        />
                      </label>

                      {draft.imageDataUrl ? (
                        <div className="rounded-lg border border-gray-200 bg-white p-3 space-y-2">
                          <p className="text-base font-bold text-gray-700">
                            ファイル名: {draft.imageFileName || "未設定"}
                          </p>
                          <img
                            src={draft.imageDataUrl}
                            alt="トーナメント画像プレビュー"
                            className="w-full max-h-56 object-contain bg-white rounded-lg border border-gray-300"
                          />
                        </div>
                      ) : (
                        <p className="text-base text-gray-600">
                          画像が未設定です。画像をアップロードしてください。
                        </p>
                      )}
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => saveTournament(item.id)}
                        className="w-full md:w-auto bg-blue-600 text-white font-black px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        保存
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteTournament(item.id)}
                        className="w-full md:w-auto bg-red-600 text-white font-black px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
                      >
                        削除
                      </button>
                      <button
                        type="button"
                        onClick={() => cancelTournamentChanges(item.id)}
                        className="w-full md:w-auto bg-gray-200 text-gray-800 font-black px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors"
                      >
                        キャンセル
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
