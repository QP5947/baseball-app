import { PlusCircle } from "lucide-react";
import { useState } from "react";

// スコアボード
export default function ScoreBoardForm({
  is_batting_first,
  top_points,
  bottom_points,
}: {
  is_batting_first: boolean | null;
  top_points: number[];
  bottom_points: number[];
}) {
  // イニングの得点状態（初期は7イニング分）
  const [topInnings, setTopInnings] = useState<(number | string)[]>(
    top_points?.length > 0 ? top_points : Array(7).fill("")
  );
  const [bottomInnings, setBottomInnings] = useState<(number | string)[]>(
    bottom_points?.length > 0 ? bottom_points : Array(7).fill("")
  );

  // 合計点を計算する関数
  const calculateTotal = (innings: (number | string)[]) => {
    return innings.reduce<number>(
      (sum, score) => sum + (Number(score) || 0),
      0
    );
  };

  // 得点入力時のハンドラ
  const handleScoreChange = (
    index: number,
    value: string,
    type: "top" | "bottom"
  ) => {
    const isTop = type === "top";
    const newInnings = isTop ? [...topInnings] : [...bottomInnings];
    const num = parseInt(value, 10);
    newInnings[index] = isNaN(num) ? "" : Math.max(0, num);
    isTop ? setTopInnings(newInnings) : setBottomInnings(newInnings);
  };

  // イニング列追加
  const addInning = () => {
    setTopInnings([...topInnings, ""]);
    setBottomInnings([...bottomInnings, ""]);
  };

  // イニング列削除
  const removeInning = (index: number) => {
    // 1イニングしかない場合は削除させない
    if (topInnings.length <= 1) return;

    setTopInnings(topInnings.filter((_, i) => i !== index));
    setBottomInnings(bottomInnings.filter((_, i) => i !== index));
  };

  // ＋列の状態管理
  const [isPlusHovered, setIsPlusHovered] = useState(false);

  // 行の定義
  const rows = [
    { radionvalue: "on", type: "top" as const, data: topInnings },
    { radionvalue: "off", type: "bottom" as const, data: bottomInnings },
  ];

  return (
    <div className="overflow-x-auto">
      <label className="block text-sm font-bold text-gray-700 mb-2">
        スコア
      </label>
      <table className="w-2xl max-w-full table-fixed md:table-auto text-left border-collapse bg-green-800">
        <thead className="border-b border-white text-center">
          <tr className="text-gray-100">
            <th className="border p-2 w-15 whitespace-nowrap">先/後</th>
            {topInnings.map((_, i) => (
              <th key={i} className="border p-2 w-12 relative group">
                {/* イニング削除ボタン */}
                {topInnings.length - 1 === i && topInnings.length !== 1 && (
                  <button
                    type="button"
                    onClick={() => removeInning(i)}
                    className={`absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] opacity-100 pointer-coarse:opacity-100 pointer-coarse:scale-125  transition-opacity cursor-pointer `}
                  >
                    ✕
                  </button>
                )}
                {i + 1}
              </th>
            ))}
            <th
              className={`border p-2 w-12 cursor-pointer transition-colors ${
                isPlusHovered ? "bg-green-500" : "bg-green-600"
              }`}
              onClick={addInning}
              onMouseEnter={() => setIsPlusHovered(true)}
              onMouseLeave={() => setIsPlusHovered(false)}
            >
              <PlusCircle size={16} className="mx-auto" />
            </th>
            <th className="border p-2 w-16 bg-green-800">計</th>
          </tr>
        </thead>
        <tbody className="text-center">
          {rows.map((row) => (
            <tr key={row.type}>
              {/* ラジオボタン */}
              <td className="border p-2">
                <input
                  type="radio"
                  name="is_batting_first"
                  value={row.radionvalue}
                  defaultChecked={
                    is_batting_first !== null &&
                    (is_batting_first ? "on" : "off") === row.radionvalue
                  }
                />
              </td>
              {/* 得点入力欄 */}
              {row.data.map((score, i) => (
                <td key={i} className="border p-1">
                  <input
                    type="number"
                    min="0"
                    max="999"
                    placeholder="0"
                    className="w-10 text-center border-none bg-green-100 text-gray-600 focus:ring-1 focus:ring-blue-500"
                    name={`${row.type}_points`}
                    value={score}
                    onChange={(e) =>
                      handleScoreChange(i, e.target.value, row.type)
                    }
                  />
                </td>
              ))}
              {/* イニング追加 */}
              <td
                className={`border p-2 cursor-pointer transition-colors ${
                  isPlusHovered ? "bg-green-500" : "bg-green-600"
                }`}
                onClick={addInning}
                onMouseEnter={() => setIsPlusHovered(true)}
                onMouseLeave={() => setIsPlusHovered(false)}
              ></td>
              {/* 合計 */}
              <td className="border p-2 font-bold bg-green-800">
                {calculateTotal(row.data)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-sm text-gray-500">
        ※先/後 は自チームの先攻/後攻を選択してください
      </p>
      <p className="text-sm text-gray-500">※最終回裏のXは自動で付与されます</p>
    </div>
  );
}
