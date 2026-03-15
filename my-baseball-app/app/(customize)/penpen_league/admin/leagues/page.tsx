"use client";

import Link from "next/link";
import { Check, GripVertical, Save, Trash2 } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { penpenAdminMutate } from "../lib/adminApi";
import type { PenpenMaster } from "../../lib/penpenData";

const reorderItems = (
  items: PenpenMaster[],
  sourceId: string,
  targetId: string,
) => {
  if (sourceId === targetId) return items;

  const sourceIndex = items.findIndex((item) => item.id === sourceId);
  const targetIndex = items.findIndex((item) => item.id === targetId);
  if (sourceIndex < 0 || targetIndex < 0) return items;

  const copied = [...items];
  const [moved] = copied.splice(sourceIndex, 1);
  copied.splice(targetIndex, 0, moved);
  return copied;
};

export default function PenpenAdminLeaguesPage() {
  useEffect(() => {
    document.title = "大会管理 | ペンペンリーグ";
  }, []);

  const supabase = createClient();

  const [leagues, setLeagues] = useState<PenpenMaster[]>([]);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [newLeagueName, setNewLeagueName] = useState("");
  const [newLeagueEnabled, setNewLeagueEnabled] = useState(true);
  const [savingRowId, setSavingRowId] = useState<string | null>(null);
  const [dirtyRowIds, setDirtyRowIds] = useState<Set<string>>(new Set());
  const [savedRowIds, setSavedRowIds] = useState<Set<string>>(new Set());
  const savedResetTimers = useRef<
    Record<string, ReturnType<typeof setTimeout>>
  >({});

  const markRowSaved = (rowId: string) => {
    setSavedRowIds((prev) => {
      const next = new Set(prev);
      next.add(rowId);
      return next;
    });

    const existingTimer = savedResetTimers.current[rowId];
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    savedResetTimers.current[rowId] = setTimeout(() => {
      setSavedRowIds((prev) => {
        const next = new Set(prev);
        next.delete(rowId);
        return next;
      });
      delete savedResetTimers.current[rowId];
    }, 1200);
  };

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .schema("penpen")
        .from("leagues")
        .select("id, name, is_enabled, sort_order")
        .order("sort_order", { ascending: true });

      if (error) {
        window.alert(`大会データの取得に失敗しました: ${error.message}`);
        return;
      }

      setLeagues(
        (data ?? []).map((item) => ({
          id: item.id,
          name: item.name,
          isEnabled: item.is_enabled,
          sortOrder: item.sort_order,
        })),
      );
      setDirtyRowIds(new Set());
    };

    void load();
  }, [supabase]);

  useEffect(() => {
    return () => {
      Object.values(savedResetTimers.current).forEach((timerId) => {
        clearTimeout(timerId);
      });
    };
  }, []);

  const saveLeagues = async (targetLeagues: PenpenMaster[] = leagues) => {
    const payload = targetLeagues.map((item, index) => ({
      id: item.id,
      name: item.name.trim(),
      is_enabled: item.isEnabled,
      sort_order: index,
    }));

    try {
      await penpenAdminMutate({
        action: "upsert",
        table: "leagues",
        rows: payload,
        onConflict: "id",
      });
    } catch (error) {
      window.alert(
        `大会データの保存に失敗しました: ${error instanceof Error ? error.message : "unknown"}`,
      );
      return false;
    }

    setDirtyRowIds(new Set());

    return true;
  };

  const saveLeagueRow = async (leagueId: string) => {
    const index = leagues.findIndex((item) => item.id === leagueId);
    if (index < 0) return;

    const target = leagues[index];
    setSavingRowId(leagueId);
    try {
      await penpenAdminMutate({
        action: "upsert",
        table: "leagues",
        rows: [
          {
            id: target.id,
            name: target.name.trim(),
            is_enabled: target.isEnabled,
            sort_order: index,
          },
        ],
        onConflict: "id",
      });
    } catch (error) {
      window.alert(
        `大会データの保存に失敗しました: ${error instanceof Error ? error.message : "unknown"}`,
      );
      return;
    } finally {
      setSavingRowId(null);
    }

    setDirtyRowIds((prev) => {
      const next = new Set(prev);
      next.delete(leagueId);
      return next;
    });
    markRowSaved(leagueId);
  };

  const updateName = (id: string, value: string) => {
    setLeagues((prev) =>
      prev.map((item) => (item.id === id ? { ...item, name: value } : item)),
    );
    setDirtyRowIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    setSavedRowIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const toggleEnabled = (id: string, checked: boolean) => {
    setLeagues((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isEnabled: checked } : item,
      ),
    );
    setDirtyRowIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    setSavedRowIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const addLeague = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = newLeagueName.trim();
    if (!trimmedName) return;

    type InsertedLeague = {
      id: string;
      name: string;
      is_enabled: boolean;
      sort_order: number;
    };

    try {
      const response = await penpenAdminMutate<InsertedLeague>({
        action: "insert",
        table: "leagues",
        rows: [
          {
            name: trimmedName,
            is_enabled: newLeagueEnabled,
            sort_order: leagues.length,
          },
        ],
        returning: ["id", "name", "is_enabled", "sort_order"],
        single: true,
      });

      const data = response.data;

      setLeagues((prev) => [
        ...prev,
        {
          id: data.id,
          name: data.name,
          isEnabled: data.is_enabled,
          sortOrder: data.sort_order,
        },
      ]);
      setNewLeagueName("");
      setNewLeagueEnabled(true);
    } catch (error) {
      window.alert(
        `大会の追加に失敗しました: ${error instanceof Error ? error.message : "unknown"}`,
      );
    }
  };

  const deleteLeague = async (id: string) => {
    const target = leagues.find((item) => item.id === id);
    const confirmed = window.confirm(
      `${target?.name ?? "この大会"} を削除します。よろしいですか？`,
    );
    if (!confirmed) return;

    try {
      await penpenAdminMutate({
        action: "delete",
        table: "leagues",
        match: [{ column: "id", value: id }],
      });
    } catch (error) {
      window.alert(
        `大会の削除に失敗しました: ${error instanceof Error ? error.message : "unknown"}`,
      );
      return;
    }

    setLeagues((prev) => prev.filter((item) => item.id !== id));
    setDirtyRowIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setSavedRowIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
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
                  className="bg-blue-600 text-white font-black px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  追加
                </button>
              </div>
            </form>

            <div className="space-y-3">
              {leagues.map((league, index) => (
                <div
                  key={league.id}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => {
                    if (draggingId === null) return;
                    const reordered = reorderItems(
                      leagues,
                      draggingId,
                      league.id,
                    );
                    setLeagues(reordered);
                    setDraggingId(null);
                    void saveLeagues(reordered);
                  }}
                  className={`rounded-xl border p-4 md:p-5 bg-gray-50 transition ${
                    draggingId === league.id
                      ? "border-blue-400 bg-blue-50"
                      : dirtyRowIds.has(league.id)
                        ? "border-amber-300 bg-amber-50"
                        : "border-gray-200"
                  }`}
                >
                  <div className="grid grid-cols-1 md:grid-cols-[auto_1fr_auto_auto] items-center gap-4">
                    <div
                      draggable
                      onDragStart={() => setDraggingId(league.id)}
                      onDragEnd={() => setDraggingId(null)}
                      className="inline-flex items-center gap-2 text-gray-500 font-bold cursor-grab active:cursor-grabbing"
                    >
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

                    <label className="inline-flex items-center gap-2 text-base font-bold text-gray-700 cursor-pointer">
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

                    <div className="inline-flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => void saveLeagueRow(league.id)}
                        disabled={savingRowId === league.id}
                        aria-label="大会を保存"
                        title={savingRowId === league.id ? "保存中" : "保存"}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-blue-300 text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {savedRowIds.has(league.id) ? (
                          <Check size={18} />
                        ) : (
                          <Save size={18} />
                        )}
                      </button>

                      {league.id !== "1b8cbac7-ab3f-4006-bcad-d4db00e7e65c" ? (
                        <button
                          type="button"
                          onClick={() => void deleteLeague(league.id)}
                          aria-label="大会を削除"
                          title="削除"
                          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-red-300 text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                        >
                          <Trash2 size={18} />
                        </button>
                      ) : null}
                    </div>
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
