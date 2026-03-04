"use client";

import Link from "next/link";
import { GripVertical, Trash2 } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

type TeamItem = {
  id: number;
  name: string;
  isEnabled: boolean;
};

const TEAM_STORAGE_KEY = "penpen_league_teams_v1";

const initialTeams: TeamItem[] = [
  { id: 1, name: "ペンペンズ", isEnabled: true },
  { id: 2, name: "ホワイトベアーズ", isEnabled: true },
  { id: 3, name: "ブルーウィングス", isEnabled: false },
];

const reorderItems = (
  items: TeamItem[],
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

export default function PenpenAdminTeamsPage() {
  const [teams, setTeams] = useState<TeamItem[]>(initialTeams);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamEnabled, setNewTeamEnabled] = useState(true);

  useEffect(() => {
    const raw = localStorage.getItem(TEAM_STORAGE_KEY);
    if (raw) {
      try {
        setTeams(JSON.parse(raw) as TeamItem[]);
      } catch {
        setTeams(initialTeams);
      }
    }
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }
    localStorage.setItem(TEAM_STORAGE_KEY, JSON.stringify(teams));
  }, [teams, isHydrated]);

  const updateName = (id: number, value: string) => {
    setTeams((prev) =>
      prev.map((item) => (item.id === id ? { ...item, name: value } : item)),
    );
  };

  const toggleEnabled = (id: number, checked: boolean) => {
    setTeams((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isEnabled: checked } : item,
      ),
    );
  };

  const addTeam = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = newTeamName.trim();
    if (!trimmedName) {
      return;
    }

    setTeams((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: trimmedName,
        isEnabled: newTeamEnabled,
      },
    ]);

    setNewTeamName("");
    setNewTeamEnabled(true);
  };

  const deleteTeam = (id: number) => {
    const target = teams.find((item) => item.id === id);
    const confirmed = window.confirm(
      `${target?.name ?? "このチーム"} を削除します。よろしいですか？`,
    );

    if (!confirmed) {
      return;
    }

    setTeams((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl md:text-3xl font-black text-gray-900">
            チーム管理
          </h1>
          <p className="text-base text-gray-600 mt-2">
            チーム名と有効状態を管理できます。
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
              onSubmit={addTeam}
              className="rounded-xl border border-gray-200 bg-gray-50 p-4 md:p-5"
            >
              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] items-end gap-4">
                <label className="space-y-2 block">
                  <span className="text-base font-bold text-gray-700">
                    チーム名
                  </span>
                  <input
                    type="text"
                    value={newTeamName}
                    onChange={(event) => setNewTeamName(event.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white"
                    placeholder="新しいチーム名を入力"
                  />
                </label>

                <label className="inline-flex items-center gap-2 text-base font-bold text-gray-700 cursor-pointer mb-2">
                  <input
                    type="checkbox"
                    checked={newTeamEnabled}
                    onChange={(event) =>
                      setNewTeamEnabled(event.target.checked)
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
              {teams.map((team, index) => (
                <div
                  key={team.id}
                  draggable
                  onDragStart={() => setDraggingId(team.id)}
                  onDragEnd={() => setDraggingId(null)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => {
                    if (draggingId === null) {
                      return;
                    }
                    setTeams((prev) => reorderItems(prev, draggingId, team.id));
                    setDraggingId(null);
                  }}
                  className={`rounded-xl border p-4 md:p-5 bg-gray-50 transition ${
                    draggingId === team.id
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
                        チーム名
                      </span>
                      <input
                        type="text"
                        value={team.name}
                        onChange={(event) =>
                          updateName(team.id, event.target.value)
                        }
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white"
                      />
                    </label>

                    <label className="inline-flex items-center gap-2 text-base font-bold text-gray-700 md:mt-7 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={team.isEnabled}
                        onChange={(event) =>
                          toggleEnabled(team.id, event.target.checked)
                        }
                        className="h-4 w-4"
                      />
                      有効
                    </label>

                    <button
                      type="button"
                      onClick={() => deleteTeam(team.id)}
                      aria-label="チームを削除"
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
