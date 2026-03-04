"use client";

import Link from "next/link";
import { GripVertical, Trash2 } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

type LeagueItem = {
  id: number;
  name: string;
  isEnabled: boolean;
};

const LEAGUE_STORAGE_KEY = "penpen_league_leagues_v1";

const initialLeagues: LeagueItem[] = [
  { id: 1, name: "リーグ戦", isEnabled: true },
  { id: 2, name: "トーナメント 夏季", isEnabled: true },
  { id: 3, name: "トーナメント 秋季", isEnabled: false },
];

const reorderItems = (
  items: LeagueItem[],
  sourceId: number,
  targetId: number,
) => {
  if (sourceId === targetId) {
    return items;
  }

  const sourceIndex = items.findIndex((item) => item.id === sourceId);
  const targetIndex = items.findIndex((item) => item.id === targetId);

  if (sourceIndex < 0 || targetIndex < 0) {
    return items;
  }

  const copied = [...items];
  const [moved] = copied.splice(sourceIndex, 1);
  copied.splice(targetIndex, 0, moved);
  return copied;
};

export default function PenpenAdminLeaguesPage() {
  const [leagues, setLeagues] = useState<LeagueItem[]>(initialLeagues);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [newLeagueName, setNewLeagueName] = useState("");
  const [newLeagueEnabled, setNewLeagueEnabled] = useState(true);

  useEffect(() => {
    const raw = localStorage.getItem(LEAGUE_STORAGE_KEY);
    if (raw) {
      try {
        setLeagues(JSON.parse(raw) as LeagueItem[]);
      } catch {
        setLeagues(initialLeagues);
      }
    }
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }
    localStorage.setItem(LEAGUE_STORAGE_KEY, JSON.stringify(leagues));
  }, [leagues, isHydrated]);

  const updateName = (id: number, value: string) => {
    setLeagues((prev) =>
      prev.map((item) => (item.id === id ? { ...item, name: value } : item)),
    );
  };

  const toggleEnabled = (id: number, checked: boolean) => {
    setLeagues((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isEnabled: checked } : item,
      ),
    );
  };

  const addLeague = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = newLeagueName.trim();
    if (!trimmedName) {
      return;
    }

    setLeagues((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: trimmedName,
        isEnabled: newLeagueEnabled,
      },
    ]);

    setNewLeagueName("");
    setNewLeagueEnabled(true);
  };

  const deleteLeague = (id: number) => {
    const target = leagues.find((item) => item.id === id);
    const confirmed = window.confirm(
      `${target?.name ?? "この大会"} を削除します。よろしいですか？`,
    );

    if (!confirmed) {
      return;
    }

    setLeagues((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl md:text-3xl font-black text-gray-900">
            大会管理
          </h1>
          <p className="text-base text-gray-600 mt-2">
            大会名と有効状態を管理できます。
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
          <div className="space-y-4">
            <form
              onSubmit={addLeague}
              className="rounded-xl border border-gray-200 bg-gray-50 p-4 md:p-5"
            >
              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] items-end gap-4">
                <label className="space-y-2 block">
                  <span className="text-base font-bold text-gray-700">
                    大会名
                  </span>
                  <input
                    type="text"
                    value={newLeagueName}
                    onChange={(event) => setNewLeagueName(event.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white"
                    placeholder="新しい大会名を入力"
                  />
                </label>

                <label className="inline-flex items-center gap-2 text-base font-bold text-gray-700 cursor-pointer mb-2">
                  <input
                    type="checkbox"
                    checked={newLeagueEnabled}
                    onChange={(event) =>
                      setNewLeagueEnabled(event.target.checked)
                    }
                    className="h-4 w-4"
                  />
                  有効
                </label>

                <button
                  type="submit"
                  className="bg-blue-600 text-white font-black px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  追加
                </button>
              </div>
            </form>

            <div className="space-y-3">
              {leagues.map((league, index) => (
                <div
                  key={league.id}
                  draggable
                  onDragStart={() => setDraggingId(league.id)}
                  onDragEnd={() => setDraggingId(null)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => {
                    if (draggingId === null) {
                      return;
                    }
                    setLeagues((prev) =>
                      reorderItems(prev, draggingId, league.id),
                    );
                    setDraggingId(null);
                  }}
                  className={`rounded-xl border p-4 md:p-5 bg-gray-50 transition ${
                    draggingId === league.id
                      ? "border-blue-400 bg-blue-50"
                      : "border-gray-200"
                  } cursor-grab active:cursor-grabbing`}
                >
                  <div className="grid grid-cols-1 md:grid-cols-[auto_1fr_auto_auto] items-center gap-4">
                    <div className="inline-flex items-center gap-2 text-gray-500 font-bold cursor-grab">
                      <GripVertical size={18} />
                      <span className="text-base">{index + 1}</span>
                    </div>

                    <label className="space-y-2 block">
                      <span className="text-base font-bold text-gray-700">
                        大会名
                      </span>
                      <input
                        type="text"
                        value={league.name}
                        onChange={(event) =>
                          updateName(league.id, event.target.value)
                        }
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white"
                      />
                    </label>

                    <label className="inline-flex items-center gap-2 text-base font-bold text-gray-700 md:mt-7 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={league.isEnabled}
                        onChange={(event) =>
                          toggleEnabled(league.id, event.target.checked)
                        }
                        className="h-4 w-4"
                      />
                      有効
                    </label>

                    <button
                      type="button"
                      onClick={() => deleteLeague(league.id)}
                      aria-label="大会を削除"
                      title="削除"
                      className="md:mt-7 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-red-300 text-red-700 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
