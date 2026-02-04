import { Database } from "@/types/supabase";
import { Plus, PlusCircle, Trash2 } from "lucide-react";
import { memo } from "react";
import Select, { FilterOptionOption, StylesConfig } from "react-select";

type PlayerRow = Pick<
  Database["public"]["Tables"]["players"]["Row"],
  "id" | "no" | "name"
>;

// Propsの型定義
interface PlayerRowProps {
  player: PlayerProps;
  pIdx: number;
  atBatResult: any[] | null;
  playerData: any[];
  updateValue: (
    pIdx: number,
    field: string,
    val: any,
    rIdx?: number,
    subField?: string,
  ) => void;
  addPlayerRow: (pIdx: number) => void;
  removePlayerRow: (playerRowId: string) => void;
  removePosition: (pIdx: number, posIdx: number) => void;
  addPosition: (pIdx: number) => void;
  addInning: () => void;
}

// Playerの型定義
export interface PlayerProps {
  id: string;
  playerId: string;
  battingOrder: number;
  isSub: boolean;
  name: string;
  positions: string[];
  results: {
    result: string;
    direction: string;
    rbi: string | number;
  }[];
  run: number;
  steal: number;
  steal_miss: number;
  df_error: number;
}

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
const getNameStyle = (isSub: boolean): StylesConfig<any, false> => {
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
      backgroundColor: isSub ? "transparent" : "white",
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

const POSITIONS = [
  { value: 1, label: "投" },
  { value: 2, label: "捕" },
  { value: 3, label: "一" },
  { value: 4, label: "二" },
  { value: 5, label: "三" },
  { value: 6, label: "遊" },
  { value: 7, label: "左" },
  { value: 8, label: "中" },
  { value: 9, label: "右" },
  { value: 10, label: "DH" },
  { value: 11, label: "打" },
  { value: 12, label: "走" },
];
const DIRECTIONS = [
  { value: 1, label: "投" },
  { value: 2, label: "捕" },
  { value: 3, label: "一" },
  { value: 4, label: "二" },
  { value: 5, label: "三" },
  { value: 6, label: "遊" },
  { value: 7, label: "左" },
  { value: 8, label: "中" },
  { value: 9, label: "右" },
];

const BattingResultFormRow = memo(
  ({
    player,
    pIdx,
    atBatResult,
    playerData,
    updateValue,
    removePlayerRow,
    removePosition,
    addPosition,
    addInning,
    addPlayerRow,
  }: PlayerRowProps) => {
    return (
      <>
        <tr
          className={`group transition-colors ${
            player.isSub
              ? "bg-amber-100/50 hover:bg-amber-200/50"
              : "hover:bg-slate-200"
          }`}
        >
          {/* 行削除 */}
          <td className="border-b border-r border-slate-200 p-1">
            {player.isSub && (
              <button
                type="button"
                onClick={() => removePlayerRow(player.id)}
                className="text-slate-300 hover:text-red-500 transition-colors w-full"
              >
                <Trash2 size={14} className="mx-auto" />
              </button>
            )}
          </td>

          {/* 打順 */}
          <td className="border-b border-r border-slate-200 p-1 text-center font-bold text-slate-500 bg-slate-50/50">
            {
              /* 9番以降で追加された人は打順を可変にする */
              player.battingOrder >= 9 && player.isSub ? (
                <input
                  type="number"
                  min="9"
                  className="pl-2 w-full border pr-1 rounded bg-white"
                  name={`batting_order[${player.id}]`}
                  defaultValue={player.battingOrder}
                  onBlur={(e) => {
                    const val = parseInt(e.target.value);
                    if (val !== player.battingOrder) {
                      updateValue(pIdx, "battingOrder", val);
                    }
                  }}
                />
              ) : (
                <span>
                  {player.battingOrder}
                  <input
                    type="hidden"
                    name={`batting_order[${player.id}]`}
                    value={String(player.battingOrder)}
                  />
                </span>
              )
            }
            <input type="hidden" name="player_uuid" value={player.id} />
          </td>

          {/* 氏名 */}
          <td className="border-b border-r border-slate-200 p-1">
            <Select
              instanceId={`player-select-${player.playerId}`}
              options={playerData}
              getOptionValue={(option) => option.id}
              name={`player_id[${player.id}]`}
              // 現在の選択値を特定（playerIdを元にマスタから検索）
              value={
                playerData.find((opt) => opt.id === player.playerId) || null
              }
              filterOption={customFilter} // 絞り込み設定
              placeholder="選手を選択..."
              isClearable // ×ボタン表示
              isSearchable // 検索可能
              menuPortalTarget={
                typeof window !== "undefined" ? document.body : null
              }
              // スタイル調整（Tailwindに馴染ませる）
              styles={getNameStyle(player.isSub)}
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

          {/* 守備位置 */}
          <td className="border-b border-r border-slate-200 p-1">
            <div className="flex flex-col gap-1">
              {player.positions.map((pos, posIdx) => (
                <div
                  key={`pos-wrapper-${player.id}-${posIdx}`}
                  className="flex items-center gap-1"
                >
                  {/* 2つ目以降は→を付与する */}
                  <div className="w-6 shrink-0 flex justify-center text-slate-400">
                    {posIdx > 0 && <span className="text-slate-600">→</span>}
                  </div>

                  {/* 守備位置 */}
                  <select
                    className="border rounded p-0.5 bg-white"
                    name={`positions[${player.id}]`}
                    defaultValue={pos}
                    onBlur={(e) => {
                      const changeValue = e.target.value || "";
                      if (pos !== changeValue) {
                        // 値が変わっている時だけ更新
                        updateValue(pIdx, "positions", e.target.value, posIdx);
                      }
                    }}
                  >
                    <option value=""></option>
                    {POSITIONS.map((p) => (
                      <option key={p.label} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                  {/* ×ボタン */}
                  {player.positions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePosition(pIdx, posIdx)}
                      className="text-slate-400 hover:text-red-500 ml-0.5 leading-none"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}

              {/* ＋ボタン */}
              <div className="flex items-center">
                <div className="ml-0.5 mr-0.5 w-5 shrink-0 text-slate-400 flex justify-center">
                  →
                </div>
                <button
                  type="button"
                  onClick={() => addPosition(pIdx)}
                  className="flex ml-3.5 items-center gap-1 px-1.5 py-0.5 rounded border border-dashed border-blue-400 bg-white text-blue-300 hover:bg-blue-300 hover:text-gray-50 transition-colors"
                >
                  <Plus size="14" />
                </button>
              </div>
            </div>
          </td>

          {/* 打席結果 */}
          {player.results.map((res, rIdx) => (
            <td
              key={`${player.id}-res-${rIdx}`}
              className="border-b border-r border-slate-200 p-1 w-14"
            >
              <div className="flex flex-col gap-1">
                {/* 打席結果 */}
                <select
                  className="w-full border border-gray-800 rounded bg-white"
                  name={`at_bat_result_no[${player.id}]`}
                  defaultValue={res.result}
                  onBlur={(e) => {
                    const changeValue = e.target.value || "";
                    if (res.result !== changeValue) {
                      // 値が変わっている時だけ更新
                      updateValue(
                        pIdx,
                        "results",
                        e.target.value,
                        rIdx,
                        "result",
                      );
                    }
                  }}
                >
                  <option value="">
                    {pIdx === 0 && rIdx === 0 ? "結果" : ""}
                  </option>
                  {atBatResult?.map((r?: any) => (
                    <option
                      key={r.no}
                      value={r.no}
                      className="text-slate-900 bg-white"
                    >
                      {r.short_name}
                    </option>
                  ))}
                </select>

                {/* 打球方向 */}
                <select
                  className="w-full border rounded border-gray-800 bg-white"
                  name={`direction_no[${player.id}]`}
                  defaultValue={res.direction}
                  onBlur={(e) => {
                    const changeValue = e.target.value || "";
                    if (res.direction !== changeValue) {
                      // 値が変わっている時だけ更新
                      updateValue(
                        pIdx,
                        "results",
                        e.target.value,
                        rIdx,
                        "direction",
                      );
                    }
                  }}
                >
                  <option value="">{`${
                    pIdx === 0 && rIdx === 0 ? "方向" : ""
                  }`}</option>
                  {DIRECTIONS.map((d) => (
                    <option
                      key={d.label}
                      value={d.value}
                      className="text-slate-900 bg-white"
                    >
                      {d.label}
                    </option>
                  ))}
                </select>

                {/* 打点 */}
                <input
                  type="number"
                  className="pl-2 w-full border pr-1 rounded bg-white"
                  min="0"
                  max="4"
                  placeholder={`${pIdx === 0 && rIdx === 0 ? "打点" : "0"}`}
                  name={`rbi[${player.id}]`}
                  defaultValue={res.rbi}
                  onBlur={(e) => {
                    const changeValue = e.target.value || "";
                    if (res.rbi !== changeValue) {
                      // 値が変わっている時だけ更新
                      updateValue(pIdx, "results", e.target.value, rIdx, "rbi");
                    }
                  }}
                />
              </div>
            </td>
          ))}

          {/* イニング追加 */}
          <td
            className="border-b border-r border-slate-200 bg-slate-50 cursor-pointer"
            onClick={addInning}
          ></td>

          {/* 得点 */}
          <td className="border-b border-r border-slate-200 p-1 w-12">
            <input
              type="number"
              className="w-full border text-center bg-slate-50/50 rounded"
              min="0"
              max="99"
              placeholder="0"
              name={`run[${player.id}]`}
              defaultValue={player.run}
              onBlur={(e) => {
                const changeValue = e.target.value || 0;
                if (player.run !== changeValue) {
                  // 値が変わっている時だけ更新
                  updateValue(pIdx, "run", parseInt(e.target.value) || 0);
                }
              }}
            />
          </td>

          {/* 盗塁成功 */}
          <td className="border-b border-r border-slate-200 p-1 w-12">
            <input
              type="number"
              className="w-full border text-center bg-slate-50/50 rounded"
              min="0"
              placeholder="0"
              name={`steal[${player.id}]`}
              defaultValue={player.steal}
              onBlur={(e) => {
                const changeValue = e.target.value || 0;
                if (player.steal !== changeValue) {
                  // 値が変わっている時だけ更新
                  updateValue(pIdx, "steal", parseInt(e.target.value) || 0);
                }
              }}
            />
          </td>

          {/* 盗塁失敗 */}
          <td className="border-b border-r border-slate-200 p-1 w-12">
            <input
              type="number"
              className="w-full border text-center bg-slate-50/50 rounded"
              min="0"
              placeholder="0"
              name={`steal_miss[${player.id}]`}
              defaultValue={player.steal_miss}
              onBlur={(e) => {
                const changeValue = e.target.value || 0;
                if (player.steal_miss !== changeValue) {
                  // 値が変わっている時だけ更新
                  updateValue(
                    pIdx,
                    "steal_miss",
                    parseInt(e.target.value) || 0,
                  );
                }
              }}
            />
          </td>

          {/* エラー */}
          <td className="border-b border-slate-200 p-1 w-12">
            <input
              type="number"
              className="w-full border text-center bg-slate-50/50 rounded"
              min="0"
              placeholder="0"
              name={`df_error[${player.id}]`}
              defaultValue={player.df_error}
              onBlur={(e) => {
                const changeValue = e.target.value || 0;
                if (player.df_error !== changeValue) {
                  // 値が変わっている時だけ更新
                  updateValue(pIdx, "df_error", parseInt(e.target.value) || 0);
                }
              }}
            />
          </td>
        </tr>
        {/* --- 行追加ボタン --- */}
        <tr className="h-0">
          <td colSpan={100} className="relative p-0 border-none">
            <div className="absolute -top-3 left-0 right-0 flex items-center justify-start group/add opacity-0 hover:opacity-100 pointer-coarse:opacity-100 transition-opacity z-20 h-6">
              <button
                type="button"
                onClick={() => addPlayerRow(pIdx)}
                className="ml-2 bg-blue-500 text-white rounded-full p-0.5 shadow-md transform hover:scale-125 pointer-coarse:scale-125 transition-all flex items-center justify-center border-2 border-white cursor-pointer"
              >
                <PlusCircle size={14} />
              </button>

              <div
                className="h-0.5 bg-blue-400 grow ml-2 rounded-full shadow-sm opacity-100 pointer-coarse:hidden cursor-pointer"
                onClick={() => addPlayerRow(pIdx)}
              ></div>
            </div>
          </td>
        </tr>
      </>
    );
  },
  (prevProps, nextProps) => {
    // ここで「再描画すべきか」を判定
    // playerデータが変わっていない、かつイニング数などが変わっていなければ false を返す
    return (
      prevProps.player === nextProps.player &&
      prevProps.atBatResult === nextProps.atBatResult &&
      prevProps.pIdx === nextProps.pIdx
    );
  },
);

export default BattingResultFormRow;
