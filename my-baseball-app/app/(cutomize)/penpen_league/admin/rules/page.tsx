"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

type RuleBlock = {
  id: number;
  title: string;
  body: string;
};

const RULES_STORAGE_KEY = "penpen_league_rules_blocks_v1";

const initialRules: RuleBlock[] = [
  {
    id: 1,
    title: "試合時間",
    body: "1試合2時間を目安とし、開始・終了時刻を厳守してください。",
  },
  {
    id: 2,
    title: "中止判断",
    body: "雨天・グラウンド不良時は当日朝に代表者連絡で判断します。",
  },
];

const normalizeRules = (items: RuleBlock[]) =>
  items.map((item) => ({
    id: item.id,
    title: item.title ?? "",
    body: item.body ?? "",
  }));

export default function PenpenAdminRulesPage() {
  const [rules, setRules] = useState<RuleBlock[]>(initialRules);
  const [draftRules, setDraftRules] = useState<RuleBlock[]>(initialRules);
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(RULES_STORAGE_KEY);
    if (raw) {
      try {
        const loaded = normalizeRules(JSON.parse(raw) as RuleBlock[]);
        setRules(loaded);
        setDraftRules(loaded);
      } catch {
        setRules(initialRules);
        setDraftRules(initialRules);
      }
    }
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }
    localStorage.setItem(RULES_STORAGE_KEY, JSON.stringify(rules));
  }, [rules, isHydrated]);

  const addRule = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const title = newTitle.trim();
    const body = newBody.trim();

    if (!title || !body) {
      return;
    }

    const nextRule = { id: Date.now(), title, body };
    setRules((prev) => [...prev, nextRule]);
    setDraftRules((prev) => [...prev, nextRule]);
    setNewTitle("");
    setNewBody("");
  };

  const updateDraftTitle = (id: number, value: string) => {
    setDraftRules((prev) =>
      prev.map((item) => (item.id === id ? { ...item, title: value } : item)),
    );
  };

  const updateDraftBody = (id: number, value: string) => {
    setDraftRules((prev) =>
      prev.map((item) => (item.id === id ? { ...item, body: value } : item)),
    );
  };

  const saveRule = (id: number) => {
    const target = draftRules.find((item) => item.id === id);
    if (!target) {
      return;
    }

    const title = target.title.trim();
    const body = target.body.trim();

    if (!title || !body) {
      return;
    }

    setRules((prev) =>
      prev.map((item) => (item.id === id ? { ...item, title, body } : item)),
    );

    setDraftRules((prev) =>
      prev.map((item) => (item.id === id ? { ...item, title, body } : item)),
    );
  };

  const deleteRule = (id: number) => {
    const target = rules.find((item) => item.id === id);
    const confirmed = window.confirm(
      `${target?.title ?? "この規定"} を削除します。よろしいですか？`,
    );

    if (!confirmed) {
      return;
    }

    setRules((prev) => prev.filter((item) => item.id !== id));
    setDraftRules((prev) => prev.filter((item) => item.id !== id));
  };

  const cancelRuleChanges = (id: number) => {
    const saved = rules.find((item) => item.id === id);
    if (!saved) {
      return;
    }

    setDraftRules((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, title: saved.title, body: saved.body }
          : item,
      ),
    );
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
              className="bg-blue-600 text-white font-black px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors"
            >
              追加
            </button>
          </form>
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 md:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-black text-gray-900">
              規定ブロック一覧
            </h2>
          </div>

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
                            updateDraftTitle(rule.id, event.target.value)
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
                            updateDraftBody(rule.id, event.target.value)
                          }
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white"
                          rows={5}
                        />
                      </label>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => saveRule(rule.id)}
                        className="w-full md:w-auto bg-blue-600 text-white font-black px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        保存
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteRule(rule.id)}
                        className="w-full md:w-auto bg-red-600 text-white font-black px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
                      >
                        削除
                      </button>
                      <button
                        type="button"
                        onClick={() => cancelRuleChanges(rule.id)}
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
