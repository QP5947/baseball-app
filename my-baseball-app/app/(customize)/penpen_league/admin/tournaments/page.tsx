"use client";

import Link from "next/link";
import Image from "next/image";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  removePenpenImageIfStored,
  resolvePenpenImageUrl,
  uploadPenpenImage,
} from "../../lib/penpenStorage";

type LeagueItem = {
  id: string;
  name: string;
  isEnabled: boolean;
};

type TournamentItem = {
  id: string;
  leagueId: string;
  imagePath: string;
  imageFileName: string;
  sortOrder: number;
};

const normalizeTournaments = (items: TournamentItem[]) =>
  items.map((item) => ({
    id: item.id,
    leagueId: item.leagueId ?? "",
    imagePath: item.imagePath ?? "",
    imageFileName: item.imageFileName ?? "",
    sortOrder: item.sortOrder ?? 0,
  }));

export default function PenpenAdminTournamentsPage() {
  useEffect(() => {
    document.title = "トーナメント管理 | ペンペンリーグ";
  }, []);

  const supabase = createClient();

  const [leagueOptions, setLeagueOptions] = useState<LeagueItem[]>([]);
  const [tournaments, setTournaments] = useState<TournamentItem[]>([]);
  const [draftTournaments, setDraftTournaments] = useState<TournamentItem[]>(
    [],
  );
  const [newLeagueId, setNewLeagueId] = useState("");
  const [newImagePath, setNewImagePath] = useState("");
  const [newImageFileName, setNewImageFileName] = useState("");

  useEffect(() => {
    const load = async () => {
      const penpen = supabase.schema("penpen");

      const [leagueRes, tournamentRes] = await Promise.all([
        penpen
          .from("leagues")
          .select("id, name, is_enabled")
          .order("sort_order", { ascending: true }),
        penpen
          .from("tournaments")
          .select("id, league_id, image_path, image_file_name, sort_order")
          .order("sort_order", { ascending: true }),
      ]);

      if (leagueRes.error) {
        window.alert(
          `大会マスタの取得に失敗しました: ${leagueRes.error.message}`,
        );
        return;
      }
      if (tournamentRes.error) {
        window.alert(
          `トーナメントの取得に失敗しました: ${tournamentRes.error.message}`,
        );
        return;
      }

      const leagues = (leagueRes.data ?? []).map((item) => ({
        id: item.id,
        name: item.name,
        isEnabled: item.is_enabled,
      }));
      setLeagueOptions(leagues);
      setNewLeagueId(
        leagues.find((item) => item.isEnabled)?.id ?? leagues[0]?.id ?? "",
      );

      const loaded = normalizeTournaments(
        (tournamentRes.data ?? []).map((item) => ({
          id: item.id,
          leagueId: item.league_id,
          imagePath: item.image_path,
          imageFileName: item.image_file_name ?? "",
          sortOrder: item.sort_order,
        })),
      );

      setTournaments(loaded);
      setDraftTournaments(loaded);
    };

    void load();
  }, [supabase]);

  const leagueNameById = useMemo(() => {
    return new Map(leagueOptions.map((item) => [item.id, item.name]));
  }, [leagueOptions]);

  const uploadImageFile = async (file: File) => {
    try {
      return await uploadPenpenImage(supabase, file, "tournaments");
    } catch (error) {
      window.alert(
        `画像アップロードに失敗しました: ${error instanceof Error ? error.message : "unknown"}`,
      );
      return null;
    }
  };

  const handleNewImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    void (async () => {
      const uploaded = await uploadImageFile(file);
      if (!uploaded) return;

      setNewImagePath(uploaded.path);
      setNewImageFileName(file.name);
    })();
  };

  const handleDraftImageChange = (
    id: string,
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    void (async () => {
      const uploaded = await uploadImageFile(file);
      if (!uploaded) return;

      setDraftTournaments((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, imagePath: uploaded.path, imageFileName: file.name }
            : item,
        ),
      );
    })();
  };

  const addTournament = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!newLeagueId || !newImagePath) return;

    const { data, error } = await supabase
      .schema("penpen")
      .from("tournaments")
      .insert({
        league_id: newLeagueId,
        image_path: newImagePath,
        image_file_name: newImageFileName || null,
        sort_order: tournaments.length,
      })
      .select("id, league_id, image_path, image_file_name, sort_order")
      .single();

    if (error || !data) {
      window.alert(
        `トーナメント追加に失敗しました: ${error?.message ?? "unknown"}`,
      );
      return;
    }

    const next: TournamentItem = {
      id: data.id,
      leagueId: data.league_id,
      imagePath: data.image_path,
      imageFileName: data.image_file_name ?? "",
      sortOrder: data.sort_order,
    };

    setTournaments((prev) => [...prev, next]);
    setDraftTournaments((prev) => [...prev, next]);
    setNewImagePath("");
    setNewImageFileName("");
  };

  const saveTournament = async (id: string) => {
    const target = draftTournaments.find((item) => item.id === id);
    if (!target) return;
    if (!target.leagueId || !target.imagePath) return;

    const { error } = await supabase
      .schema("penpen")
      .from("tournaments")
      .update({
        league_id: target.leagueId,
        image_path: target.imagePath,
        image_file_name: target.imageFileName || null,
      })
      .eq("id", id);

    if (error) {
      window.alert(`トーナメント保存に失敗しました: ${error.message}`);
      return;
    }

    setTournaments((prev) =>
      prev.map((item) => (item.id === id ? { ...target } : item)),
    );
  };

  const deleteTournament = async (id: string) => {
    const target = tournaments.find((item) => item.id === id);
    const confirmed = window.confirm(
      `${leagueNameById.get(target?.leagueId ?? "") ?? "このトーナメント"} を削除します。よろしいですか？`,
    );
    if (!confirmed) return;

    const { error } = await supabase
      .schema("penpen")
      .from("tournaments")
      .delete()
      .eq("id", id);

    if (error) {
      window.alert(`トーナメント削除に失敗しました: ${error.message}`);
      return;
    }

    await removePenpenImageIfStored(supabase, target?.imagePath);

    setTournaments((prev) => prev.filter((item) => item.id !== id));
    setDraftTournaments((prev) => prev.filter((item) => item.id !== id));
  };

  const cancelTournamentChanges = (id: string) => {
    const saved = tournaments.find((item) => item.id === id);
    if (!saved) return;

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
            大会の選択と画像アップロードのセットを管理できます。
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

          <form
            onSubmit={addTournament}
            className="mt-4 grid grid-cols-1 gap-4"
          >
            <label className="space-y-2 block">
              <span className="text-base font-bold text-gray-700">大会</span>
              <select
                value={newLeagueId}
                onChange={(event) => setNewLeagueId(event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white"
                required
              >
                {leagueOptions
                  .filter((item) => item.isEnabled)
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
              </select>
            </label>

            <label className="space-y-2 block">
              <span className="text-base font-bold text-gray-700">画像</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleNewImageChange}
                className="block w-full text-base"
                required
              />
            </label>

            {newImagePath ? (
              <Image
                src={resolvePenpenImageUrl(supabase, newImagePath)}
                alt="新規画像プレビュー"
                width={1200}
                height={675}
                unoptimized
                className="w-full max-h-56 object-contain rounded-lg border border-gray-200 bg-white"
              />
            ) : null}

            <button
              type="submit"
              className="w-full md:w-auto bg-blue-600 text-white font-black px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
            >
              追加
            </button>
          </form>
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 md:p-6">
          <h2 className="text-xl font-black text-gray-900">登録済み一覧</h2>

          {tournaments.length === 0 ? (
            <p className="mt-4 text-base text-gray-500">
              データはまだありません。
            </p>
          ) : (
            <div className="mt-4 space-y-4">
              {tournaments.map((item, index) => {
                const draft =
                  draftTournaments.find((t) => t.id === item.id) ?? item;

                return (
                  <article
                    key={item.id}
                    className="rounded-xl border border-gray-200 bg-gray-50 p-4 md:p-5 space-y-4"
                  >
                    <p className="text-base font-black text-gray-700">
                      セット {index + 1}
                    </p>

                    <label className="space-y-2 block">
                      <span className="text-base font-bold text-gray-700">
                        大会
                      </span>
                      <select
                        value={draft.leagueId}
                        onChange={(event) =>
                          setDraftTournaments((prev) =>
                            prev.map((row) =>
                              row.id === item.id
                                ? { ...row, leagueId: event.target.value }
                                : row,
                            ),
                          )
                        }
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white"
                      >
                        {leagueOptions.map((league) => (
                          <option key={league.id} value={league.id}>
                            {league.name}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="space-y-2 block">
                      <span className="text-base font-bold text-gray-700">
                        画像
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

                    {draft.imagePath ? (
                      <Image
                        src={resolvePenpenImageUrl(supabase, draft.imagePath)}
                        alt="トーナメント画像プレビュー"
                        width={1200}
                        height={675}
                        unoptimized
                        className="w-full max-h-56 object-contain rounded-lg border border-gray-200 bg-white"
                      />
                    ) : null}

                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => void saveTournament(item.id)}
                        className="w-full md:w-auto bg-blue-600 text-white font-black px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                      >
                        保存
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteTournament(item.id)}
                        className="w-full md:w-auto bg-red-600 text-white font-black px-6 py-3 rounded-lg hover:bg-red-700 transition-colors cursor-pointer"
                      >
                        削除
                      </button>
                      <button
                        type="button"
                        onClick={() => cancelTournamentChanges(item.id)}
                        className="w-full md:w-auto bg-gray-200 text-gray-800 font-black px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors cursor-pointer"
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
