"use client";

import Link from "next/link";
import { Check, GripVertical, Save, Trash2 } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { penpenAdminMutate } from "../lib/adminApi";
import type { PenpenStadium } from "../../lib/penpenData";

const reorderItems = (
  items: PenpenStadium[],
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

export default function PenpenAdminGroundsPage() {
  useEffect(() => {
    document.title = "球場管理 | ペンペンリーグ";
  }, []);

  const supabase = createClient();

  const [grounds, setGrounds] = useState<PenpenStadium[]>([]);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [newGroundName, setNewGroundName] = useState("");
  const [newGroundAddress, setNewGroundAddress] = useState("");
  const [newGroundMapUrl, setNewGroundMapUrl] = useState("");
  const [newGroundNote, setNewGroundNote] = useState("");
  const [newGroundEnabled, setNewGroundEnabled] = useState(true);
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
        .from("stadiums")
        .select(
          "id, name, address, google_map_url, note, is_enabled, sort_order",
        )
        .order("sort_order", { ascending: true });

      if (error) {
        window.alert(`球場データの取得に失敗しました: ${error.message}`);
        return;
      }

      setGrounds(
        (data ?? []).map((item) => ({
          id: item.id,
          name: item.name,
          address: item.address ?? "",
          googleMapUrl: item.google_map_url ?? "",
          note: item.note ?? "",
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

  const saveGrounds = async (targetGrounds: PenpenStadium[] = grounds) => {
    const payload = targetGrounds.map((item, index) => ({
      id: item.id,
      name: item.name.trim(),
      address: item.address.trim() || null,
      google_map_url: item.googleMapUrl.trim() || null,
      note: item.note.trim() || null,
      is_enabled: item.isEnabled,
      sort_order: index,
    }));

    try {
      await penpenAdminMutate({
        action: "upsert",
        table: "stadiums",
        rows: payload,
        onConflict: "id",
      });
    } catch (error) {
      window.alert(
        `球場データの保存に失敗しました: ${error instanceof Error ? error.message : "unknown"}`,
      );
      return false;
    }

    setDirtyRowIds(new Set());

    return true;
  };

  const saveGroundRow = async (groundId: string) => {
    const index = grounds.findIndex((item) => item.id === groundId);
    if (index < 0) return;

    const target = grounds[index];
    setSavingRowId(groundId);
    try {
      await penpenAdminMutate({
        action: "upsert",
        table: "stadiums",
        rows: [
          {
            id: target.id,
            name: target.name.trim(),
            address: target.address.trim() || null,
            google_map_url: target.googleMapUrl.trim() || null,
            note: target.note.trim() || null,
            is_enabled: target.isEnabled,
            sort_order: index,
          },
        ],
        onConflict: "id",
      });
    } catch (error) {
      window.alert(
        `球場データの保存に失敗しました: ${error instanceof Error ? error.message : "unknown"}`,
      );
      return;
    } finally {
      setSavingRowId(null);
    }

    setDirtyRowIds((prev) => {
      const next = new Set(prev);
      next.delete(groundId);
      return next;
    });
    markRowSaved(groundId);
  };

  const updateField = <K extends keyof PenpenStadium>(
    id: string,
    key: K,
    value: PenpenStadium[K],
  ) => {
    setGrounds((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [key]: value } : item)),
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

  const addGround = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = newGroundName.trim();
    if (!trimmedName) return;

    type InsertedGround = {
      id: string;
      name: string;
      address: string | null;
      google_map_url: string | null;
      note: string | null;
      is_enabled: boolean;
      sort_order: number;
    };

    try {
      const response = await penpenAdminMutate<InsertedGround>({
        action: "insert",
        table: "stadiums",
        rows: [
          {
            name: trimmedName,
            address: newGroundAddress.trim() || null,
            google_map_url: newGroundMapUrl.trim() || null,
            note: newGroundNote.trim() || null,
            is_enabled: newGroundEnabled,
            sort_order: grounds.length,
          },
        ],
        returning: [
          "id",
          "name",
          "address",
          "google_map_url",
          "note",
          "is_enabled",
          "sort_order",
        ],
        single: true,
      });

      const data = response.data;

      setGrounds((prev) => [
        ...prev,
        {
          id: data.id,
          name: data.name,
          address: data.address ?? "",
          googleMapUrl: data.google_map_url ?? "",
          note: data.note ?? "",
          isEnabled: data.is_enabled,
          sortOrder: data.sort_order,
        },
      ]);

      setNewGroundName("");
      setNewGroundAddress("");
      setNewGroundMapUrl("");
      setNewGroundNote("");
      setNewGroundEnabled(true);
    } catch (error) {
      window.alert(
        `球場の追加に失敗しました: ${error instanceof Error ? error.message : "unknown"}`,
      );
    }
  };

  const deleteGround = async (id: string) => {
    const target = grounds.find((item) => item.id === id);
    const confirmed = window.confirm(
      `${target?.name ?? "この球場"} を削除します。よろしいですか？`,
    );
    if (!confirmed) return;

    try {
      await penpenAdminMutate({
        action: "delete",
        table: "stadiums",
        match: [{ column: "id", value: id }],
      });
    } catch (error) {
      window.alert(
        `球場の削除に失敗しました: ${error instanceof Error ? error.message : "unknown"}`,
      );
      return;
    }

    setGrounds((prev) => prev.filter((item) => item.id !== id));
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
            球場管理
          </h1>
          <p className="text-base text-gray-600 mt-2">
            球場名、GoogleMapURL、注釈、有効状態を管理できます。行をドラッグして並び替えてください。
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
              onSubmit={addGround}
              className="rounded-xl border border-gray-200 bg-gray-50 p-4 md:p-5"
            >
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="space-y-2 block">
                    <span className="text-base font-bold text-gray-700">
                      球場名
                    </span>
                    <input
                      type="text"
                      value={newGroundName}
                      onChange={(event) => setNewGroundName(event.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white"
                      placeholder="新しい球場名を入力"
                    />
                  </label>

                  <label className="space-y-2 block">
                    <span className="text-base font-bold text-gray-700">
                      住所
                    </span>
                    <input
                      type="text"
                      value={newGroundAddress}
                      onChange={(event) =>
                        setNewGroundAddress(event.target.value)
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white"
                      placeholder="住所（任意）"
                    />
                  </label>

                  <label className="space-y-2 block md:col-span-2">
                    <span className="text-base font-bold text-gray-700">
                      GoogleMapURL
                    </span>
                    <input
                      type="url"
                      value={newGroundMapUrl}
                      onChange={(event) =>
                        setNewGroundMapUrl(event.target.value)
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white"
                      placeholder="https://maps.google.com/..."
                    />
                  </label>

                  <label className="space-y-2 block md:col-span-2">
                    <span className="text-base font-bold text-gray-700">
                      注釈
                    </span>
                    <input
                      type="text"
                      value={newGroundNote}
                      onChange={(event) => setNewGroundNote(event.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white"
                      placeholder="駐車場の有無など"
                    />
                  </label>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <label className="inline-flex items-center gap-2 text-base font-bold text-gray-700 cursor-pointer mb-2">
                    <input
                      type="checkbox"
                      checked={newGroundEnabled}
                      onChange={(event) =>
                        setNewGroundEnabled(event.target.checked)
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
              </div>
            </form>

            <div className="space-y-3">
              {grounds.map((ground, index) => (
                <div
                  key={ground.id}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => {
                    if (draggingId === null) return;
                    const reordered = reorderItems(
                      grounds,
                      draggingId,
                      ground.id,
                    );
                    setGrounds(reordered);
                    setDraggingId(null);
                    void saveGrounds(reordered);
                  }}
                  className={`rounded-xl border p-4 md:p-5 bg-gray-50 transition ${
                    draggingId === ground.id
                      ? "border-blue-400 bg-blue-50"
                      : dirtyRowIds.has(ground.id)
                        ? "border-amber-300 bg-amber-50"
                        : "border-gray-200"
                  }`}
                >
                  <div className="grid grid-cols-1 md:grid-cols-[auto_1fr_auto] gap-4">
                    <div className="flex items-center justify-between gap-3">
                      <div
                        draggable
                        onDragStart={() => setDraggingId(ground.id)}
                        onDragEnd={() => setDraggingId(null)}
                        className="inline-flex items-center gap-2 text-gray-500 font-bold cursor-grab active:cursor-grabbing"
                      >
                        <GripVertical size={18} />
                        <span className="text-base">{index + 1}</span>
                      </div>

                      <div className="inline-flex items-center gap-2 md:hidden">
                        <button
                          type="button"
                          onClick={() => void saveGroundRow(ground.id)}
                          disabled={savingRowId === ground.id}
                          aria-label="球場を保存"
                          title={savingRowId === ground.id ? "保存中" : "保存"}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-blue-300 text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {savedRowIds.has(ground.id) ? (
                            <Check size={18} />
                          ) : (
                            <Save size={18} />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => void deleteGround(ground.id)}
                          aria-label="球場を削除"
                          title="削除"
                          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-red-300 text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <input
                        type="text"
                        value={ground.name}
                        onChange={(event) =>
                          updateField(ground.id, "name", event.target.value)
                        }
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white"
                        placeholder="球場名"
                      />

                      <input
                        type="text"
                        value={ground.address}
                        onChange={(event) =>
                          updateField(ground.id, "address", event.target.value)
                        }
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white"
                        placeholder="住所"
                      />

                      <input
                        type="url"
                        value={ground.googleMapUrl}
                        onChange={(event) =>
                          updateField(
                            ground.id,
                            "googleMapUrl",
                            event.target.value,
                          )
                        }
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white"
                        placeholder="GoogleMapURL"
                      />

                      <input
                        type="text"
                        value={ground.note}
                        onChange={(event) =>
                          updateField(ground.id, "note", event.target.value)
                        }
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white"
                        placeholder="注釈"
                      />

                      <label className="inline-flex items-center gap-2 text-base font-bold text-gray-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={ground.isEnabled}
                          onChange={(event) =>
                            updateField(
                              ground.id,
                              "isEnabled",
                              event.target.checked,
                            )
                          }
                          className="h-4 w-4"
                        />
                        有効
                      </label>
                    </div>

                    <div className="hidden md:inline-flex md:flex-col md:items-end md:justify-start gap-2">
                      <button
                        type="button"
                        onClick={() => void saveGroundRow(ground.id)}
                        disabled={savingRowId === ground.id}
                        aria-label="球場を保存"
                        title={savingRowId === ground.id ? "保存中" : "保存"}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-blue-300 text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {savedRowIds.has(ground.id) ? (
                          <Check size={18} />
                        ) : (
                          <Save size={18} />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => void deleteGround(ground.id)}
                        aria-label="球場を削除"
                        title="削除"
                        className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-red-300 text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        <Trash2 size={18} />
                      </button>
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
