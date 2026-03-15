"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { penpenAdminMutate } from "../lib/adminApi";

type RuleBlock = {
  id: string;
  title: string;
  body: string;
  isEnabled: boolean;
  sortOrder: number;
};

const normalizeRules = (items: RuleBlock[]) =>
  items.map((item) => ({
    id: item.id,
    title: item.title ?? "",
    body: item.body ?? "",
    isEnabled: Boolean(item.isEnabled),
    sortOrder: item.sortOrder ?? 0,
  }));

export default function PenpenAdminRulesPage() {
  useEffect(() => {
    document.title = "大会規定管理 | ペンペンリーグ";
  }, []);

  const supabase = createClient();

  const [rules, setRules] = useState<RuleBlock[]>([]);
  const [draftRules, setDraftRules] = useState<RuleBlock[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [savingRowId, setSavingRowId] = useState<string | null>(null);
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
        .from("rule_blocks")
        .select("id, title, body, is_enabled, sort_order")
        .order("sort_order", { ascending: true });

      if (error) {
        window.alert(`規定データの取得に失敗しました: ${error.message}`);
        return;
      }

      const loaded = normalizeRules(
        (data ?? []).map((item) => ({
          id: item.id,
          title: item.title,
          body: item.body,
          isEnabled: item.is_enabled,
          sortOrder: item.sort_order,
        })),
      );

      setRules(loaded);
      setDraftRules(loaded);
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

  const addRule = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const title = newTitle.trim();
    const body = newBody.trim();
    if (!title || !body) return;

    type InsertedRule = {
      id: string;
      title: string;
      body: string;
      is_enabled: boolean;
      sort_order: number;
    };

    let data: InsertedRule;
    try {
      const response = await penpenAdminMutate<InsertedRule>({
        action: "insert",
        table: "rule_blocks",
        rows: [
          {
            title,
            body,
            is_enabled: true,
            sort_order: rules.length,
          },
        ],
        returning: ["id", "title", "body", "is_enabled", "sort_order"],
        single: true,
      });
      data = response.data;
    } catch (error) {
      window.alert(
        `規定の追加に失敗しました: ${error instanceof Error ? error.message : "unknown"}`,
      );
      return;
    }

    const nextRule: RuleBlock = {
      id: data.id,
      title: data.title,
      body: data.body,
      isEnabled: data.is_enabled,
      sortOrder: data.sort_order,
    };

    setRules((prev) => [...prev, nextRule]);
    setDraftRules((prev) => [...prev, nextRule]);
    setNewTitle("");
    setNewBody("");
  };

  const updateDraft = <K extends keyof RuleBlock>(
    id: string,
    key: K,
    value: RuleBlock[K],
  ) => {
    setDraftRules((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [key]: value } : item)),
    );
    setSavedRowIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const saveRule = async (id: string) => {
    const target = draftRules.find((item) => item.id === id);
    if (!target) return;

    const title = target.title.trim();
    const body = target.body.trim();
    if (!title || !body) return;

    setSavingRowId(id);
    try {
      await penpenAdminMutate({
        action: "update",
        table: "rule_blocks",
        values: {
          title,
          body,
          is_enabled: target.isEnabled,
        },
        match: [{ column: "id", value: id }],
      });
    } catch (error) {
      window.alert(
        `規定の保存に失敗しました: ${error instanceof Error ? error.message : "unknown"}`,
      );
      return;
    } finally {
      setSavingRowId(null);
    }

    setRules((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, title, body, isEnabled: target.isEnabled }
          : item,
      ),
    );
    setDraftRules((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, title, body, isEnabled: target.isEnabled }
          : item,
      ),
    );
    markRowSaved(id);
  };

  const deleteRule = async (id: string) => {
    const target = rules.find((item) => item.id === id);
    const confirmed = window.confirm(
      `${target?.title ?? "この規定"} を削除します。よろしいですか？`,
    );
    if (!confirmed) return;

    try {
      await penpenAdminMutate({
        action: "delete",
        table: "rule_blocks",
        match: [{ column: "id", value: id }],
      });
    } catch (error) {
      window.alert(
        `規定の削除に失敗しました: ${error instanceof Error ? error.message : "unknown"}`,
      );
      return;
    }

    setRules((prev) => prev.filter((item) => item.id !== id));
    setDraftRules((prev) => prev.filter((item) => item.id !== id));
    setSavedRowIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });

    const existingTimer = savedResetTimers.current[id];
    if (existingTimer) {
      clearTimeout(existingTimer);
      delete savedResetTimers.current[id];
    }
  };

  const cancelRuleChanges = (id: string) => {
    const saved = rules.find((item) => item.id === id);
    if (!saved) return;

    setDraftRules((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              title: saved.title,
              body: saved.body,
              isEnabled: saved.isEnabled,
            }
          : item,
      ),
    );
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
            大会規定管理
          </h1>
          <p className="text-base text-gray-600 mt-2">
            タイトルと本文のブロックを追加・編集・削除できます。
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
          <h2 className="text-xl font-black text-gray-900">新規ブロック追加</h2>

          <form onSubmit={addRule} className="mt-4 space-y-4">
            <label className="space-y-2 block">
              <span className="text-base font-bold text-gray-700">
                タイトル
              </span>
              <input
                type="text"
                value={newTitle}
                onChange={(event) => setNewTitle(event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white"
                placeholder="タイトルを入力"
                required
              />
            </label>

            <label className="space-y-2 block">
              <span className="text-base font-bold text-gray-700">本文</span>
              <textarea
                value={newBody}
                onChange={(event) => setNewBody(event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white"
                placeholder="本文を入力"
                rows={4}
                required
              />
            </label>

            <button
              type="submit"
              className="bg-blue-600 text-white font-black px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
            >
              追加
            </button>
          </form>
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 md:p-6">
          <h2 className="text-xl font-black text-gray-900">規定ブロック一覧</h2>

          {rules.length === 0 ? (
            <p className="mt-4 text-base text-gray-500">
              規定ブロックはまだありません。
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {rules.map((rule, index) => {
                const draft =
                  draftRules.find((item) => item.id === rule.id) ?? rule;

                return (
                  <article
                    key={rule.id}
                    className="rounded-xl border border-gray-200 bg-gray-50 p-4 md:p-5"
                  >
                    <p className="text-base font-black text-gray-700">
                      ブロック {index + 1}
                    </p>

                    <div className="mt-3 space-y-3">
                      <label className="space-y-2 block">
                        <span className="text-base font-bold text-gray-700">
                          タイトル
                        </span>
                        <input
                          type="text"
                          value={draft.title}
                          onChange={(event) =>
                            updateDraft(rule.id, "title", event.target.value)
                          }
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white"
                        />
                      </label>

                      <label className="space-y-2 block">
                        <span className="text-base font-bold text-gray-700">
                          本文
                        </span>
                        <textarea
                          value={draft.body}
                          onChange={(event) =>
                            updateDraft(rule.id, "body", event.target.value)
                          }
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white"
                          rows={5}
                        />
                      </label>

                      <label className="inline-flex items-center gap-2 text-base font-bold text-gray-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={draft.isEnabled}
                          onChange={(event) =>
                            updateDraft(
                              rule.id,
                              "isEnabled",
                              event.target.checked,
                            )
                          }
                          className="h-4 w-4"
                        />
                        公開する
                      </label>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => void saveRule(rule.id)}
                        disabled={savingRowId === rule.id}
                        className="w-full md:w-auto bg-blue-600 text-white font-black px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        <span className="inline-flex items-center gap-1.5">
                          {savedRowIds.has(rule.id) ? (
                            <Check size={16} />
                          ) : null}
                          保存
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => cancelRuleChanges(rule.id)}
                        className="w-full md:w-auto bg-gray-200 text-gray-800 font-black px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors cursor-pointer"
                      >
                        キャンセル
                      </button>

                      <button
                        type="button"
                        onClick={() => void deleteRule(rule.id)}
                        className="w-full md:w-auto bg-red-600 text-white font-black px-6 py-3 rounded-lg hover:bg-red-700 transition-colors cursor-pointer"
                      >
                        削除
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
