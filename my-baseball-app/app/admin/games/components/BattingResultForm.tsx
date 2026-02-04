import { Database } from "@/types/supabase";
import { PlusCircle } from "lucide-react";
import React, { useState, useCallback } from "react";
import BattingResultFormRow from "./BattingResultFormRow";

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

// 打席結果
export default function BattingResultForm({
  inningData,
  playerData,
  atBatResult,
  battingResult,
}: {
  inningData: number[];
  playerData: PlayerRow[];
  atBatResult: AtBatResultRow[];
  battingResult: BattingRelustRow[];
}) {
  // イニング追加
  const addInning = () => {
    const nextInning = innings[innings.length - 1] + 1;
    setInnings([...innings, nextInning]);
    setPlayers(
      players.map((p) => ({
        ...p,
        results: [...p.results, { result: "", direction: "", rbi: "" }],
      })),
    );
  };

  // イニング更新
  const updateInningLabel = (index: number, value: string) => {
    setInnings((prev) => {
      const newInnings = [...prev];
      const startValue = parseInt(value) || 1;

      // 変更した位置から最後までを「+1ずつ」でループ更新
      for (let i = index; i < newInnings.length; i++) {
        newInnings[i] = startValue + (i - index);
      }

      return newInnings;
    });
  };

  // イニング削除
  const removeInning = (index: number) => {
    // 1イニングしかない場合は削除しない
    if (innings.length <= 1) return;

    // データが入力されている場合は確認する
    if (hasData()) {
      const isConfirmed = window.confirm(
        `データが入力されています。本当に削除しますか？`,
      );
      if (!isConfirmed) return;
    }

    // 削除処理
    setInnings(innings.filter((_, i) => i !== index));
    setPlayers(
      players.map((p) => ({
        ...p,
        results: p.results.slice(0, -1),
      })),
    );
  };

  // イニング管理
  const [innings, setInnings] = useState<number[]>(
    inningData?.length > 0 ? inningData : [1, 2, 3, 4, 5, 6, 7],
  );

  //最後の列にデータが入っているかチェック
  const hasData = () => {
    const lastIndex = innings.length - 1;
    return players.some((p) => {
      const res = p.results[lastIndex];
      // 結果、方向、打点のいずれかが空でない場合に「データあり」とみなす
      return res.result !== "" || res.direction !== "" || res.rbi !== "";
    });
  };

  // 守備位置を追加する
  const addPosition = (pIdx: number) => {
    setPlayers((prevPlayers) => {
      const newPlayers = [...prevPlayers];
      newPlayers[pIdx] = {
        ...newPlayers[pIdx],
        positions: [...newPlayers[pIdx].positions, ""],
      };
      return newPlayers;
    });
  };

  // --- 守備位置を削除する ---
  const removePosition = (pIdx: number, posIdx: number) => {
    setPlayers((prevPlayers) => {
      const newPlayers = [...prevPlayers];
      // 1つ以上ある場合のみ削除
      if (newPlayers[pIdx].positions.length > 1) {
        const newPositions = [...newPlayers[pIdx].positions];
        newPositions.splice(posIdx, 1);

        newPlayers[pIdx] = {
          ...newPlayers[pIdx],
          positions: newPositions,
        };
      }
      return newPlayers;
    });
  };

  // 選手行の追加
  const addPlayerRow = (index: number) => {
    setPlayers((prev) => {
      const newPlayer = createPlayer(
        prev[index].battingOrder,
        innings.length,
        true,
      );
      return [...prev.slice(0, index + 1), newPlayer, ...prev.slice(index + 1)];
    });
  };

  const createPlayer = (
    order: number,
    inningsLength: number,
    isSub: boolean = false,
  ) => ({
    id: crypto.randomUUID(),
    playerId: "",
    battingOrder: order,
    isSub: isSub,
    name: "",
    positions: [""],
    results: Array.from({ length: inningsLength }, () => ({
      result: "",
      direction: "",
      rbi: "",
    })),
    run: 0,
    steal: 0,
    steal_miss: 0,
    df_error: 0,
  });

  // 選手行の削除
  const removePlayerRow = (playerRowId: string) => {
    const target = players.find((p) => p.id === playerRowId);
    if (!target?.isSub) return;
    setPlayers((prev) => prev.filter((p) => p.id !== playerRowId));
  };

  // 選手管理
  const [players, setPlayers] = useState(() => {
    // 選手のループ回数を決める
    // 追加行の数を算出
    let isSubIndex = 0;
    battingResult.map((result, idx) => {
      if (
        (result.batting_order <= 9 &&
          result.batting_order === battingResult[idx - 1]?.batting_order) ||
        result.batting_order > 9
      ) {
        isSubIndex++;
      }
    });

    // 9 + 追加行、batting_indexの最大値の一番大きい数字を採用
    const loopLength = battingResult?.length
      ? Math.max(
          ...battingResult.map((p) => p.batting_index + 1),
          isSubIndex + 9,
        )
      : 9;

    // 打順
    let battingOrder = 0;

    return Array.from({ length: loopLength }, (_, i) => {
      // データがあれば、DBの値をフロント用の型にマッピング
      const result = battingResult?.find((p) => p.batting_index === i);
      if (result) {
        // 打席結果をイニング数分を確保し、既存データがあればセットする
        const inningResult = Array.from(
          { length: innings.length },
          (_, inningIdx) => {
            const detail = result.batting_result_details?.find(
              (d) => d.inning_index === inningIdx,
            );
            return {
              result: detail?.at_bat_result_no?.toString() || "",
              direction: detail?.direction_no?.toString() || "",
              rbi: detail?.rbi?.toString() || "",
            };
          },
        );

        // 追加した行かどうか（前の打者と同じ打順 or 10番以降）
        const isSub =
          result.batting_order === battingOrder || result.batting_order > 9;

        battingOrder = result.batting_order;

        return {
          id: crypto.randomUUID(),
          playerId: result.player_id,
          battingOrder: result.batting_order,
          isSub: isSub,
          name: "",
          positions: result.positions?.map(String) || [""],
          results: inningResult || [""],
          run: result.run || 0,
          steal: result.steal || 0,
          steal_miss: result.steal_miss || 0,
          df_error: result.df_error || 0,
        };
      } else {
        // データがなければ、新規作成
        battingOrder++;
        return createPlayer(battingOrder, innings.length, battingOrder > 9);
      }
    });
  });

  // 値更新
  const updateValue = useCallback(
    (
      pIdx: number,
      field: string,
      val: any,
      rIdx?: number,
      subField?: string,
    ) => {
      setPlayers((prev) =>
        prev.map((player, i) => {
          if (i !== pIdx) return player;

          // 対象の選手だけ、新しいオブジェクトを作る
          if (field === "positions" && rIdx !== undefined) {
            const newPositions = [...player.positions];
            newPositions[rIdx] = val;
            return { ...player, positions: newPositions };
          }

          if (
            field === "results" &&
            rIdx !== undefined &&
            subField !== undefined
          ) {
            const newResults = [...player.results];
            newResults[rIdx] = { ...newResults[rIdx], [subField]: val };
            return { ...player, results: newResults };
          }
          return { ...player, [field]: val };
        }),
      );
    },
    [],
  );

  return (
    <div className="overflow-x-auto overflow-y-hidden pb-5 max-w-400">
      <label className="block font-bold text-gray-700">打撃成績</label>

      <table className="min-w-full border-separate border-spacing-0 border border-slate-300 rounded-lg bg-white text-gray-600">
        <thead className="bg-slate-800 text-white">
          <tr>
            {/* 削除、打順、氏名、守備 */}
            <th className="border-b border-r border-slate-600 p-2 w-10 text-center">
              削除
            </th>
            <th className="border-b border-r border-slate-600 p-2 w-15 min-w-15 text-center">
              打順
            </th>
            <th className="border-b border-r border-slate-600 p-2 min-w-56">
              氏名
            </th>
            <th className="border-b border-r border-slate-600 p-2 w-15 min-w-15">
              守備
            </th>

            {/* イニングヘッダー */}
            {innings.map((val, i) => (
              <th
                key={`inning-input-${i}-${val}`}
                className="border-b border-r border-slate-600 p-1 w-24 relative group"
              >
                {/* イニング削除ボタン */}
                {innings.length - 1 === i && innings.length !== 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      removeInning(i);
                    }}
                    className={`absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] opacity-100 pointer-coarse:opacity-100 pointer-coarse:scale-125  transition-opacity cursor-pointer `}
                  >
                    ✕
                  </button>
                )}

                <div className="flex items-center justify-center gap-1">
                  <input
                    type="number"
                    className="w-15 min-w-10 bg-slate-700 text-white text-center border border-slate-500 rounded focus:bg-slate-600 outline-none"
                    min="1"
                    name="innings"
                    defaultValue={val}
                    onBlur={(e) => {
                      const changeValue = parseInt(e.target.value) || 0;
                      if (val !== changeValue) {
                        // 値が変わっている時だけ更新
                        updateInningLabel(i, e.target.value);
                      }
                    }}
                  />
                </div>
              </th>
            ))}

            {/* イニング追加 */}
            <th
              className="border-b border-r border-slate-600 p-2 w-10 bg-slate-700 cursor-pointer hover:bg-slate-600"
              onClick={addInning}
            >
              <PlusCircle size={16} className="mx-auto" />
            </th>

            {/* 得点、盗塁成功、盗塁失敗、エラー */}
            <th className="border-b border-r border-slate-600 p-2 min-w-12">
              得点
            </th>
            <th className="border-b border-r border-slate-600 p-2 min-w-12">
              盗成
            </th>
            <th className="border-b border-r border-slate-600 p-2 min-w-12">
              盗失
            </th>
            <th className="border-b border-slate-600 p-2 min-w-12">失策</th>
          </tr>
        </thead>
        <tbody>
          {players.map((player, pIdx) => {
            return (
              <React.Fragment key={`player-row-group-${player.id}`}>
                <BattingResultFormRow
                  player={player}
                  pIdx={pIdx}
                  atBatResult={atBatResult}
                  playerData={playerData}
                  updateValue={updateValue}
                  addPlayerRow={addPlayerRow}
                  removePlayerRow={removePlayerRow}
                  removePosition={removePosition}
                  addPosition={addPosition}
                  addInning={addInning}
                />
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
