"use client";

import Link from "next/link";
import { GripVertical, Trash2 } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

type GroundItem = {
  id: number;
  name: string;
  isEnabled: boolean;
  googleMapUrl: string;
  note: string;
};

const GROUND_STORAGE_KEY = "penpen_league_grounds_v1";

const initialGrounds: GroundItem[] = [
  {
    id: 1,
    name: "ペンペン第一球場",
    isEnabled: true,
    googleMapUrl: "",
    note: "",
  },
  {
    id: 2,
    name: "ペンペン第二球場",
    isEnabled: true,
    googleMapUrl: "",
    note: "",
  },
  {
    id: 3,
    name: "みなと球場",
    isEnabled: false,
    googleMapUrl: "",
    note: "",
  },
];

const normalizeGrounds = (items: GroundItem[]) =>
  items.map((item) => ({
    id: item.id,
    name: item.name ?? "",
    isEnabled: Boolean(item.isEnabled),
    googleMapUrl: item.googleMapUrl ?? "",
    note: item.note ?? "",
  }));

const reorderItems = (
  items: GroundItem[],
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

export default function PenpenAdminGroundsPage() {
  const [grounds, setGrounds] = useState<GroundItem[]>(initialGrounds);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [newGroundName, setNewGroundName] = useState("");
  const [newGroundMapUrl, setNewGroundMapUrl] = useState("");
  const [newGroundNote, setNewGroundNote] = useState("");
  const [newGroundEnabled, setNewGroundEnabled] = useState(true);

  useEffect(() => {
    const raw = localStorage.getItem(GROUND_STORAGE_KEY);
    if (raw) {
      try {
        setGrounds(normalizeGrounds(JSON.parse(raw) as GroundItem[]));
      } catch {
        setGrounds(initialGrounds);
      }
    }
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }
    localStorage.setItem(GROUND_STORAGE_KEY, JSON.stringify(grounds));
  }, [grounds, isHydrated]);

  const updateName = (id: number, value: string) => {
    setGrounds((prev) =>
      prev.map((item) => (item.id === id ? { ...item, name: value } : item)),
    );
  };

  const toggleEnabled = (id: number, checked: boolean) => {
    setGrounds((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isEnabled: checked } : item,
      ),
    );
  };

  const updateMapUrl = (id: number, value: string) => {
    setGrounds((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, googleMapUrl: value } : item,
      ),
    );
  };

  const updateNote = (id: number, value: string) => {
    setGrounds((prev) =>
      prev.map((item) => (item.id === id ? { ...item, note: value } : item)),
    );
  };

  const addGround = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = newGroundName.trim();
    if (!trimmedName) {
      return;
    }

    setGrounds((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: trimmedName,
        isEnabled: newGroundEnabled,
        googleMapUrl: newGroundMapUrl.trim(),
        note: newGroundNote,
      },
    ]);

    setNewGroundName("");
    setNewGroundMapUrl("");
    setNewGroundNote("");
    setNewGroundEnabled(true);
  };

  const deleteGround = (id: number) => {
    const target = grounds.find((item) => item.id === id);
    const confirmed = window.confirm(
      `${target?.name ?? "この球場"} を削除します。よろしいですか？`,
    );

    if (!confirmed) {
      return;
    }

    setGrounds((prev) => prev.filter((item) => item.id !== id));
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
                    className="bg-blue-600 text-white font-black px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors"
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
                  draggable
                  onDragStart={() => setDraggingId(ground.id)}
                  onDragEnd={() => setDraggingId(null)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => {
                    if (draggingId === null) {
                      return;
                    }
                    setGrounds((prev) =>
                      reorderItems(prev, draggingId, ground.id),
                    );
                    setDraggingId(null);
                  }}
                  className={`rounded-xl border p-4 md:p-5 bg-gray-50 transition ${
                    draggingId === ground.id
                      ? "border-blue-400 bg-blue-50"
                      : "border-gray-200"
                  } cursor-grab active:cursor-grabbing`}
                >
                  <div className="grid grid-cols-1 md:grid-cols-[auto_1fr_auto_auto] items-start gap-4">
                    <div className="inline-flex items-center gap-2 text-gray-500 font-bold cursor-grab">
                      <GripVertical size={18} />
                      <span className="text-base">{index + 1}</span>
                    </div>

                    <div className="space-y-3">
                      <label className="space-y-2 block">
                        <span className="text-base font-bold text-gray-700">
                          球場名
                        </span>
                        <input
                          type="text"
                          value={ground.name}
                          onChange={(event) =>
                            updateName(ground.id, event.target.value)
                          }
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white"
                        />
                      </label>

                      <label className="space-y-2 block">
                        <span className="text-base font-bold text-gray-700">
                          GoogleMapURL
                        </span>
                        <input
                          type="url"
                          value={ground.googleMapUrl}
                          onChange={(event) =>
                            updateMapUrl(ground.id, event.target.value)
                          }
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white"
                          placeholder="https://maps.google.com/..."
                        />
                      </label>

                      <label className="space-y-2 block">
                        <span className="text-base font-bold text-gray-700">
                          注釈
                        </span>
                        <input
                          type="text"
                          value={ground.note}
                          onChange={(event) =>
                            updateNote(ground.id, event.target.value)
                          }
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white"
                          placeholder="駐車場の有無など"
                        />
                      </label>
                    </div>

                    <label className="inline-flex items-center gap-2 text-base font-bold text-gray-700 md:mt-7 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={ground.isEnabled}
                        onChange={(event) =>
                          toggleEnabled(ground.id, event.target.checked)
                        }
                        className="h-4 w-4"
                      />
                      有効
                    </label>

                    <button
                      type="button"
                      onClick={() => deleteGround(ground.id)}
                      aria-label="球場を削除"
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
