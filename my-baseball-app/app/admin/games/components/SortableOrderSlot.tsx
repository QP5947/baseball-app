import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";
import Select from "react-select";

// ポジションマスタ
const POSITIONS = [
  { value: "1", label: "投" },
  { value: "2", label: "捕" },
  { value: "3", label: "一" },
  { value: "4", label: "二" },
  { value: "5", label: "三" },
  { value: "6", label: "遊" },
  { value: "7", label: "左" },
  { value: "8", label: "中" },
  { value: "9", label: "右" },
  { value: "10", label: "DH" },
];

// 打ち手の記号
const handMap: Record<string, string> = {
  L: "△",
  R: "",
  S: "□",
};

const customFilter = (option: any, inputValue: string) => {
  if (!inputValue) return true;
  const label = (option.data.no + option.data.name).toLowerCase();
  return label.includes(inputValue.toLowerCase());
};

// --- 個別の打順アイテム（Sortable） ---
export default function SortableOrderSlot({
  slot,
  index,
  playerData,
  onUpdate,
  onRemove,
}: any) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: slot.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  // 打ち手
  const battingHand = playerData.find(
    (p: any) => p.id === slot.playerId,
  )?.batting_hand;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white p-4 mb-4 rounded-2xl shadow-md border-2 border-gray-100 flex flex-col gap-3 ${battingHand === "L" ? "border-l-blue-800 border-l-5" : ""} ${battingHand === "S" ? "border-l-amber-600 border-l-5" : ""}`}
    >
      {/* 上段：ドラッグハンドル、打順、選手検索 */}
      <div className="flex items-center gap-3">
        <button
          {...attributes}
          {...listeners}
          className="p-2 text-gray-400 touch-none shrink-0"
        >
          <GripVertical
            size={28}
            className="cursor-grab active:cursor-grabbing"
          />
        </button>

        <div className="text-Black w-10 h-10 rounded-full flex items-center justify-center font-black text-xl shrink-0">
          {index + 1}.
        </div>

        <div className="flex-1">
          <Select
            options={playerData}
            getOptionValue={(opt) => opt.id}
            getOptionLabel={(opt) => `#${opt.no} ${opt.name}`}
            value={playerData.find((p: any) => p.id === slot.playerId)}
            onChange={(opt: any) => onUpdate(slot.id, "playerId", opt?.id)}
            filterOption={customFilter}
            placeholder="選手を検索..."
            className="text-xl"
            styles={{
              control: (base) => ({
                ...base,
                borderRadius: "12px",
                minHeight: "56px",
              }),
              menu: (base) => ({ ...base, zIndex: 9999 }),
            }}
            formatOptionLabel={(option: any, { context }) =>
              context === "menu"
                ? `#${option.no}: ${option.batting_hand ? handMap[option.batting_hand] : ""}${option.name}`
                : option.name
            }
          />
        </div>
      </div>

      {/* 下段：守備位置と削除ボタン */}
      <div className="flex items-center gap-4 pl-12">
        <div className="flex-1 flex items-center gap-3">
          <span className="text-gray-500 font-bold text-lg shrink-0">
            守備:
          </span>
          <select
            value={slot.position}
            onChange={(e) => onUpdate(slot.id, "position", e.target.value)}
            className="flex-1 bg-gray-50 border-2 border-gray-200 rounded-xl p-3 text-xl font-bold appearance-none"
          >
            <option value="">未定</option>
            {POSITIONS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        {/* 削除ボタン */}
        {index >= 9 && (
          <button
            onClick={() => onRemove(slot.id)}
            className="p-3 bg-red-50 text-red-500 rounded-xl flex items-center gap-1 font-bold"
          >
            <Trash2 size={20} />
            <span className="text-sm">削除</span>
          </button>
        )}
      </div>
    </div>
  );
}
