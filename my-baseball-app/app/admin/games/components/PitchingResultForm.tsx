import { Database } from "@/types/supabase";
import { PlusCircle, Trash2 } from "lucide-react";
import React, { useState } from "react";
import Select, { FilterOptionOption, StylesConfig } from "react-select";

type PlayerRow = Pick<
  Database["public"]["Tables"]["players"]["Row"],
  "id" | "no" | "name"
>;

// 投球結果
export default function PitchingResultForm({
  playerData,
  pitchingResult,
}: {
  playerData: PlayerRow[];
  pitchingResult: Database["public"]["Tables"]["pitching_results"]["Row"][];
}) {
  // 選手行の追加
  const addPlayerRow = (index: number) => {
    setPlayers((prev) => {
      const newPlayer = createPlayer(prev[index - 1].pitchingOrder + 1);
      return [...prev.slice(0, index + 1), newPlayer, ...prev.slice(index + 1)];
    });
    updatePitchingOrder();
  };

  const createPlayer = (order: number) => ({
    id: crypto.randomUUID(),
    playerId: "",
    pitchingOrder: order,
    innings: 0,
    outs: 0,
    runs: 0,
    strikeout: 0,
    walks: 0,
    hbp: 0,
    hits: 0,
    homeruns: 0,
    win_lose: false,
    hold: false,
    save: false,
  });

  // 選手行の削除
  const removePlayerRow = (index: number) => {
    setPlayers(players.filter((_, i) => i !== index));
    updatePitchingOrder();
  };

  // 投球順振り直し
  const updatePitchingOrder = () => {
    setPlayers((prev) => {
      return prev.map((player, i) => {
        return { ...player, pitchingOrder: i + 1 };
      });
    });
  };

  // 選手管理
  const [players, setPlayers] = useState(() => {
    if (pitchingResult.length > 0) {
      return Array.from({ length: pitchingResult.length }, (_, i) => {
        return {
          id: crypto.randomUUID(),
          playerId: pitchingResult[i].player_id,
          pitchingOrder: pitchingResult[i].pitching_order,
          innings: pitchingResult[i].innings || 0,
          outs: pitchingResult[i].outs || 0,
          runs: pitchingResult[i].runs || 0,
          strikeout: pitchingResult[i].strikeout || 0,
          walks: pitchingResult[i].walks || 0,
          hbp: pitchingResult[i].hbp || 0,
          hits: pitchingResult[i].hits || 0,
          homeruns: pitchingResult[i].homeruns || 0,
          win_lose: pitchingResult[i].is_win_lose || false,
          hold: pitchingResult[i].is_hold || false,
          save: pitchingResult[i].is_save || false,
        };
      });
    }
    return Array.from({ length: 1 }, (_, i) => createPlayer(i + 1));
  });

  // 値更新
  const updateValue = (pIdx: number, field: string, val: any) => {
    setPlayers((prev) =>
      prev.map((player, i) => {
        if (i !== pIdx) return player;
        return { ...player, [field]: val };
      }),
    );
  };

  // 氏名のフィルター定義
  const customFilter = (
    option: FilterOptionOption<PlayerRow>,
    inputValue: string,
  ): boolean => {
    // 入力が空なら全て表示
    if (!inputValue) return true;

    // labelに対してのみ検索をかける
    const label = (option.data.no + option.data.name).toLowerCase();
    const search = inputValue.toLowerCase();

    return label.includes(search);
  };

  //氏名のスタイル適用
  const getNameStyle = (): StylesConfig<any, false> => {
    return {
      option: (base, state) => ({
        ...base,
        color: state.isSelected ? "white" : "#334155",
        backgroundColor: state.isSelected
          ? "#3b82f6"
          : state.isFocused
            ? "#f1f5f9"
            : "white",
      }),
      control: (base) => ({
        ...base,
        minHeight: "30px",
        marginRight: "0px",
        boxShadow: "none",
        backgroundColor: "white",
      }),
      valueContainer: (provided: any) => ({
        ...provided,
        paddingLeft: "2px",
        paddingRight: "0px",
        maxWidth: "200px",
      }),
      menuPortal: (base) => ({ ...base, zIndex: 9999 }),
    };
  };

  return (
    <div className="overflow-x-auto overflow-y-hidden pb-10 max-w-200">
      <label className="block font-bold text-gray-700">投手成績</label>

      <table className="min-w-full mb-2 border-separate border-spacing-0 border border-slate-300 rounded-lg bg-white text-gray-600">
        <thead className="bg-slate-800 text-white">
          <tr>
            <th className="border-b border-r border-slate-600 p-2 w-10 text-center">
              削除
            </th>
            <th className="border-b border-r border-slate-600 p-2 pl-4 pr-4 w-15 min-w-15 text-center">
              投球順
            </th>
            <th className="border-b border-r border-slate-600 p-2 w-50 min-w-56">
              氏名
            </th>
            <th className="border-b border-r border-slate-600 p-2 w-10">
              投球回
            </th>
            <th className="border-b border-r border-slate-600 p-2 whitespace-nowrap">
              アウト
            </th>
            <th className="border-b border-r border-slate-600 p-2 w-10">
              失点
            </th>
            <th className="border-b border-r border-slate-600 p-2 w-10">
              三振
            </th>
            <th className="border-b border-r border-slate-600 p-2 w-10">
              四球
            </th>
            <th className="border-b border-r border-slate-600 p-2 w-10">
              死球
            </th>
            <th className="border-b border-r border-slate-600 p-2 w-10">
              安打
            </th>
            <th className="border-b border-r border-slate-600 p-2 w-10">
              本塁打
            </th>
            <th className="border-b border-r border-slate-600 p-2 w-10">
              勝／敗
            </th>
            <th className="border-b border-r border-slate-600 p-2 w-10">H</th>
            <th className="border-b border-r border-slate-600 p-2 w-10">
              セーブ
            </th>
          </tr>
        </thead>
        <tbody>
          {players.map((player, pIdx) => {
            const playerKey = `player-row-group-${player.id}`;

            return (
              <React.Fragment key={playerKey}>
                <tr className="group transition-colors hover:bg-slate-200">
                  {/* 行削除 */}
                  <td className="border-b border-r border-slate-200 p-1">
                    {pIdx !== 0 && (
                      <button
                        type="button"
                        onClick={() => removePlayerRow(pIdx)}
                        className="text-slate-300 hover:text-red-500 transition-colors w-full"
                      >
                        <Trash2 size={14} className="mx-auto" />
                      </button>
                    )}
                  </td>

                  {/* 投球順 */}
                  <td className="border-b border-r border-slate-200 p-1 text-center font-bold text-slate-500 bg-slate-50/50">
                    {player.pitchingOrder}
                    <input
                      type="hidden"
                      name={`pitching_order[${player.id}]`}
                      value={player.pitchingOrder}
                    />
                    <input
                      type="hidden"
                      name="pitcher_uuid"
                      value={player.id}
                    />
                  </td>

                  {/* 氏名 */}
                  <td className="border-b border-r border-slate-200 p-1">
                    <Select
                      instanceId={`player-select-${player.playerId}`}
                      options={playerData}
                      // 現在の選択値を特定（playerIdを元にマスタから検索）
                      getOptionValue={(option) => option.id}
                      name={`pitcher_id[${player.id}]`}
                      value={
                        playerData.find((opt) => opt.id === player.playerId) ||
                        null
                      }
                      filterOption={customFilter}
                      placeholder="選手を選択..."
                      isClearable // ×ボタンで消せるようにする
                      isSearchable // 検索可能にする
                      menuPortalTarget={
                        typeof window !== "undefined" ? document.body : null
                      }
                      // スタイル調整（Tailwindに馴染ませる）
                      styles={getNameStyle()}
                      onChange={(selectedOption) => {
                        // 名前(label)とID(value)を同時に更新
                        updateValue(
                          pIdx,
                          "name",
                          selectedOption ? selectedOption.name : "",
                        );
                        updateValue(
                          pIdx,
                          "playerId",
                          selectedOption ? selectedOption.id : "",
                        );
                      }}
                      // リストにない値の入力を防ぐ
                      noOptionsMessage={() => "選手が見つかりません"}
                      // 表示するラベルを指定
                      formatOptionLabel={(option: any, { context }) => {
                        if (context === "menu") {
                          return `#${option.no}: ${option.name}`;
                        }
                        return option.name;
                      }}
                    />
                  </td>

                  {/* イニング数 */}
                  <td className="border-b border-r border-slate-200 p-1 w-12">
                    <input
                      type="number"
                      className="w-full min-w-9 border text-center bg-slate-50/50 rounded"
                      min="0"
                      max="99"
                      placeholder="0"
                      name={`pitcher_innings[${player.id}]`}
                      defaultValue={player.innings}
                      onBlur={(e) => {
                        const changeValue = e.target.value || 0;
                        if (player.innings !== changeValue) {
                          // 値が変わっている時だけ更新
                          updateValue(
                            pIdx,
                            "innings",
                            parseInt(e.target.value) || 0,
                          );
                        }
                      }}
                    />
                  </td>

                  {/* アウト数 */}
                  <td className="border-b border-r border-slate-200 p-1 w-12 whitespace-nowrap">
                    <input
                      type="number"
                      className="w-1/2 min-w-9 border text-center bg-slate-50/50 rounded"
                      min="0"
                      max="2"
                      placeholder="0"
                      name={`pitcher_outs[${player.id}]`}
                      defaultValue={player.outs}
                      onBlur={(e) => {
                        const changeValue = e.target.value || 0;
                        if (player.innings !== changeValue) {
                          // 値が変わっている時だけ更新
                          updateValue(
                            pIdx,
                            "innings",
                            parseInt(e.target.value) || 0,
                          );
                        }
                      }}
                    />{" "}
                    / 3
                  </td>

                  {/* 失点 */}
                  <td className="border-b border-r border-slate-200 p-1">
                    <input
                      type="number"
                      className="w-full min-w-9 border text-center bg-slate-50/50 rounded"
                      min="0"
                      max="99"
                      placeholder="0"
                      name={`pitcher_runs[${player.id}]`}
                      defaultValue={player.runs}
                      onBlur={(e) => {
                        const changeValue = e.target.value || 0;
                        if (player.runs !== changeValue) {
                          // 値が変わっている時だけ更新
                          updateValue(
                            pIdx,
                            "runs",
                            parseInt(e.target.value) || 0,
                          );
                        }
                      }}
                    />
                  </td>

                  {/* 三振 */}
                  <td className="border-b border-r border-slate-200 p-1">
                    <input
                      type="number"
                      className="w-full min-w-9 border text-center bg-slate-50/50 rounded"
                      min="0"
                      max="99"
                      placeholder="0"
                      name={`pitcher_strikeout[${player.id}]`}
                      defaultValue={player.strikeout}
                      onBlur={(e) => {
                        const changeValue = e.target.value || 0;
                        if (player.strikeout !== changeValue) {
                          // 値が変わっている時だけ更新
                          updateValue(
                            pIdx,
                            "strikeout",
                            parseInt(e.target.value) || 0,
                          );
                        }
                      }}
                    />
                  </td>

                  {/* 四球 */}
                  <td className="border-b border-r border-slate-200 p-1">
                    <input
                      type="number"
                      className="w-full min-w-9 border text-center bg-slate-50/50 rounded"
                      min="0"
                      max="99"
                      placeholder="0"
                      name={`pitcher_walks[${player.id}]`}
                      defaultValue={player.walks}
                      onBlur={(e) => {
                        const changeValue = e.target.value || 0;
                        if (player.walks !== changeValue) {
                          // 値が変わっている時だけ更新
                          updateValue(
                            pIdx,
                            "walks",
                            parseInt(e.target.value) || 0,
                          );
                        }
                      }}
                    />
                  </td>

                  {/* 死球 */}
                  <td className="border-b border-r border-slate-200 p-1">
                    <input
                      type="number"
                      className="w-full min-w-9 border text-center bg-slate-50/50 rounded"
                      min="0"
                      max="99"
                      placeholder="0"
                      defaultValue={player.hbp}
                      name={`pitcher_hbp[${player.id}]`}
                      onBlur={(e) => {
                        const changeValue = e.target.value || 0;
                        if (player.hbp !== changeValue) {
                          // 値が変わっている時だけ更新
                          updateValue(
                            pIdx,
                            "hbp",
                            parseInt(e.target.value) || 0,
                          );
                        }
                      }}
                    />
                  </td>

                  {/* 被安打 */}
                  <td className="border-b border-r border-slate-200 p-1">
                    <input
                      type="number"
                      className="w-full min-w-9 border text-center bg-slate-50/50 rounded"
                      min="0"
                      max="99"
                      placeholder="0"
                      name={`pitcher_hits[${player.id}]`}
                      defaultValue={player.hits}
                      onBlur={(e) => {
                        const changeValue = e.target.value || 0;
                        if (player.hits !== changeValue) {
                          // 値が変わっている時だけ更新
                          updateValue(
                            pIdx,
                            "hits",
                            parseInt(e.target.value) || 0,
                          );
                        }
                      }}
                    />
                  </td>

                  {/* 被本塁打 */}
                  <td className="border-b border-r border-slate-200 p-1">
                    <input
                      type="number"
                      className="w-full min-w-9 border text-center bg-slate-50/50 rounded"
                      min="0"
                      max="99"
                      placeholder="0"
                      name={`pitcher_homeruns[${player.id}]`}
                      defaultValue={player.homeruns}
                      onBlur={(e) => {
                        const changeValue = e.target.value || 0;
                        if (player.homeruns !== changeValue) {
                          // 値が変わっている時だけ更新
                          updateValue(
                            pIdx,
                            "homeruns",
                            parseInt(e.target.value) || 0,
                          );
                        }
                      }}
                    />
                  </td>

                  {/* 勝・負 */}
                  <td className="border-b border-r border-slate-200 p-1 text-center">
                    <input
                      type="radio"
                      name="pitcher_win_lose"
                      value={player.id}
                      defaultChecked={player.win_lose}
                    />
                  </td>

                  {/* ホールド */}
                  <td className="border-b border-r border-slate-200 p-1 text-center">
                    <input
                      type="checkbox"
                      name={`pitcher_hold[${player.id}]`}
                      defaultChecked={player.hold}
                    />
                  </td>

                  {/* セーブ */}
                  <td className="border-b border-r border-slate-200 p-1 text-center">
                    <input
                      type="radio"
                      name="pitcher_save"
                      value={player.id}
                      defaultChecked={player.save}
                    />
                  </td>
                </tr>

                {/* --- 行追加ボタン --- */}
                <tr className="h-0">
                  <td colSpan={100} className="relative p-0 border-none">
                    <div className="absolute -top-3 left-0 right-0 flex items-center justify-start group/add opacity-0 hover:opacity-100 pointer-coarse:opacity-100 transition-opacity z-20 h-6">
                      <button
                        type="button"
                        onClick={() => addPlayerRow(pIdx + 1)}
                        className="ml-2 bg-blue-500 text-white rounded-full p-0.5 shadow-md transform hover:scale-125 pointer-coarse:scale-125 transition-all flex items-center justify-center border-2 border-white cursor-pointer"
                      >
                        <PlusCircle size={14} />
                      </button>

                      <div
                        className="h-0.5 bg-blue-400 grow ml-2 rounded-full shadow-sm opacity-100 pointer-coarse:hidden cursor-pointer"
                        onClick={() => addPlayerRow(pIdx + 1)}
                      ></div>
                    </div>
                  </td>
                </tr>
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
      <div className="text-right mt-2">
        <label className="text-gray-600 pr-2">
          <input type="radio" name="pitcher_win_lose" value="" />
          勝敗なし
        </label>
        <label className="text-gray-600 pr-2">
          <input type="radio" name="pitcher_save" value="" />
          セーブなし
        </label>
      </div>
    </div>
  );
}
