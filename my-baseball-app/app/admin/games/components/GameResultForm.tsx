"use client";
import { Database } from "@/types/supabase";
import { Save } from "lucide-react";
import Link from "next/link";
import { saveGame } from "../results/actions";
import BattingResultForm from "./BattingResultForm";
import PitchingResultForm from "./PitchingResultForm";
import ScoreBoardForm from "./ScoreBoardForm";

// 型の宣言
type GameRow = Database["public"]["Tables"]["games"]["Row"] & {
  leagues: { name: string };
  grounds: { name: string };
  vsteams: { name: string };
};
type PlayerRow = Pick<
  Database["public"]["Tables"]["players"]["Row"],
  "id" | "no" | "name"
>;
type AtBatResultRow = Pick<
  Database["public"]["Tables"]["at_bat_results"]["Row"],
  "no" | "short_name"
>;
type BattingRelustRow =
  Database["public"]["Tables"]["batting_results"]["Row"] & {
    batting_result_details: Database["public"]["Tables"]["batting_result_details"]["Row"][];
  };

// 試合開始日付のフォーマット
const formatted = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

const gameStatusMap = [
  { value: "0", label: "試合中" },
  { value: "1", label: "勝利" },
  { value: "2", label: "敗戦" },
  { value: "3", label: "引き分け" },
  { value: "4", label: "不戦勝" },
  { value: "5", label: "不戦敗" },
  { value: "6", label: "中止" },
];

// 試合結果入力フォーム
export default function GameResultForm({
  game,
  playerData,
  atBatResult,
  battingResult,
  pitchingResult,
}: {
  game: GameRow;
  playerData: PlayerRow[];
  atBatResult: AtBatResultRow[];
  battingResult: BattingRelustRow[];
  pitchingResult: Database["public"]["Tables"]["pitching_results"]["Row"][];
}) {
  const start_datetime = new Date(game.start_datetime);

  // Enterのフォーム送信を防止する
  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    // Enterキーが押された、かつ Shiftキーが押されていない場合
    if (e.key === "Enter" && !e.shiftKey) {
      // textarea の場合は改行したいことが多いので除外する
      const target = e.target as HTMLElement;
      if (target.tagName !== "TEXTAREA") {
        e.preventDefault();
      }
    }
  };

  return (
    <form action={saveGame} onKeyDown={handleKeyDown} className="space-y-4">
      {/* 試合ID */}
      {game?.id && <input type="hidden" name="id" value={game.id} />}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:max-w-fit ">
        {/* 試合開始日時 */}
        <div>
          <label className="block font-bold text-gray-700 mb-2">
            試合開始日時
          </label>
          <label className="block text-gray-600 mb-1">
            {formatted.format(start_datetime)}
          </label>
        </div>

        {/* リーグ */}
        <div>
          <label className="block font-bold text-gray-700 mb-2">リーグ</label>
          <label className="block text-gray-600 mb-1">
            {game?.leagues.name || ""}
          </label>
        </div>

        {/* 球場 */}
        <div>
          <label className="block font-bold text-gray-700 mb-2">球場</label>
          <label className="block text-gray-600 mb-1">
            {game?.grounds.name || ""}
          </label>
        </div>

        {/* 対戦相手 */}
        <div>
          <label className="block font-bold text-gray-700 mb-2">対戦相手</label>
          <label className="block text-gray-600 mb-1">
            {game?.vsteams.name || ""}
          </label>
        </div>
      </div>

      {/* 試合結果 */}
      <div>
        <label className="block font-bold text-gray-700 mb-2">試合結果</label>
        {gameStatusMap.map((opt) => (
          <label className="text-gray-600 pr-2" key={opt.value}>
            <input
              type="radio"
              name="status"
              value={opt.value}
              defaultChecked={opt.value === String(game.status)}
            />
            {opt.label}
          </label>
        ))}
      </div>

      {/* スコアボード */}
      <ScoreBoardForm
        is_batting_first={game.is_batting_first}
        top_points={game.top_points ? game.top_points : []}
        bottom_points={game.bottom_points ? game.bottom_points : []}
      />

      {/* 試合コメント */}
      <div>
        <label className="block font-bold text-gray-700 mb-2">
          試合コメント
        </label>
        <textarea
          name="game_comment"
          className="w-2xl max-w-full h-30 p-3 border rounded-lg focus:ring-2 border-gray-400 focus:ring-blue-500 outline-none transition text-gray-800 placeholder-gray-400"
          defaultValue={game?.game_comment || ""}
        />
      </div>

      {/* 打席・守備結果 */}
      <BattingResultForm
        inningData={game.innings ? game.innings : []}
        playerData={playerData}
        atBatResult={atBatResult}
        battingResult={battingResult}
      />

      {/* 投球結果 */}
      <PitchingResultForm
        playerData={playerData}
        pitchingResult={pitchingResult}
      />

      {/* ボタン類 */}
      <div className="w-2xl max-w-full pt-4 flex gap-4">
        <Link
          href={`/admin/games/results?year=${start_datetime.getFullYear()}`}
          className="flex-1 px-6 py-3 border border-gray-300 text-gray-600 font-bold rounded-lg hover:bg-gray-50 text-center transition"
        >
          キャンセル
        </Link>
        <button
          type="submit"
          className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
        >
          <Save size={20} />
          保存
        </button>
      </div>
    </form>
  );
}
