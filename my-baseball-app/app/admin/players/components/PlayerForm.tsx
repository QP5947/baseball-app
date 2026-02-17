"use client";
import Link from "next/link";
import { useState, useActionState, useEffect, useRef } from "react";
import { savePlayer, type ActionResult } from "../actions";
import toast from "react-hot-toast";
import { HelpCircle } from "lucide-react";
import { Save } from "lucide-react";

// 既存データがある場合は initialData として受け取る
export default function PlayerForm({ initialData }: { initialData?: any }) {
  const formRef = useRef<HTMLFormElement>(null);

  const [no, setNo] = useState(initialData?.no || "");
  const [name, setName] = useState(initialData?.name || "");
  const [throwHand, setThrowHand] = useState(initialData?.throw_hand || "");
  const [battingHand, setBattingHand] = useState(
    initialData?.batting_hand || "",
  );
  const [text, setText] = useState(initialData?.position || "");
  const [comment, setComment] = useState(initialData?.comment || "");
  const [showFlg, setShowFlg] = useState(initialData?.show_flg ?? true);
  const [isPlayer, setIsPlayer] = useState(initialData?.is_player ?? true);
  const [isManager, setIsManager] = useState(initialData?.is_manager ?? false);
  const [isAdmin, setIsAdmin] = useState(initialData?.is_admin ?? false);
  const [previewImages, setPreviewImages] = useState<{
    list_image?: string;
    detail_image?: string;
  }>({
    list_image: initialData?.list_image_url,
    detail_image: initialData?.detail_image_url,
  });
  const [state, formAction, isPending] = useActionState<
    ActionResult | undefined,
    FormData
  >(async (_prevState: ActionResult | undefined, formData: FormData) => {
    // FormData から直接値を抽出
    const formValues = {
      no: formData.get("no") as string,
      name: formData.get("name") as string,
      throw_hand: formData.get("throw_hand") as string,
      batting_hand: formData.get("batting_hand") as string,
      position: formData.get("position") as string,
      comment: formData.get("comment") as string,
      show_flg: formData.get("show_flg") === "on",
      is_player: formData.get("is_player") === "on",
      is_manager: formData.get("is_manager") === "on",
      is_admin: formData.get("is_admin") === "on",
    };

    const result = await savePlayer(formData);

    if (!result.success) {
      // エラー時は、FormData から抽出した値を返す
      return {
        success: false,
        message: result.message,
        formData: formValues,
      };
    }

    return result;
  }, undefined);

  useEffect(() => {
    if (state) {
      if (state.success) {
        toast.success(state.message);
      } else {
        // エラー時は formData から值を復元
        toast.error(state.message);

        if (state.formData) {
          // クライアント側の state に値を設定
          setNo(state.formData.no ?? "");
          setName(state.formData.name ?? "");
          setThrowHand(state.formData.throw_hand ?? "");
          setBattingHand(state.formData.batting_hand ?? "");
          setText(state.formData.position ?? "");
          setComment(state.formData.comment ?? "");
          setShowFlg(Boolean(state.formData.show_flg));
          setIsPlayer(Boolean(state.formData.is_player));
          setIsManager(Boolean(state.formData.is_manager));
          setIsAdmin(Boolean(state.formData.is_admin));

          // DOM 要素に直接値を設定（念の為）
          if (formRef.current) {
            const inputs = formRef.current.querySelectorAll("[name]");
            inputs.forEach((input: any) => {
              const fieldName = input.name;
              const fieldValue =
                state.formData?.[fieldName as keyof typeof state.formData];

              if (input.type === "checkbox") {
                input.checked = Boolean(fieldValue);
              } else if (input.tagName === "SELECT") {
                input.value = fieldValue ?? "";
              }
            });
          }
        }
      }
    }
  }, [state]);
  const suggestions = [
    "投",
    "捕",
    "一",
    "二",
    "三",
    "遊",
    "左",
    "中",
    "右",
    "DH",
  ];

  const addSuggestion = (suggestion: string) => {
    // 現在の入力をトリミング
    const currentText = text.trim();

    if (currentText === "") {
      setText(suggestion);
    } else {
      // すでに同じ単語が含まれていないかチェック
      const items = currentText.split(",").map((s: string) => s.trim());
      if (!items.includes(suggestion)) {
        setText(`${currentText}, ${suggestion}`);
      }
    }
  };

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldName: "list_image" | "detail_image",
  ) => {
    formAction;
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(
          `ファイルサイズが大きすぎます。${MAX_FILE_SIZE / 1024 / 1024}MB以下のファイルをアップロードしてください。`,
        );
        e.target.value = "";
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImages((prev) => ({
          ...prev,
          [fieldName]: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <form
      ref={formRef}
      action={formAction}
      encType="multipart/form-data"
      className="space-y-6"
    >
      {/* 選手ID */}
      {initialData?.id && (
        <input type="hidden" name="id" value={initialData.id} />
      )}

      {/* 背番号 */}
      <div>
        <label className="block font-medium text-gray-700 mb-1">背番号</label>
        <input
          name="no"
          className="w-1/3 p-3 border rounded-lg focus:ring-2 border-gray-400 focus:ring-blue-500 outline-none text-gray-800 placeholder-gray-400"
          placeholder="00"
          value={no}
          onChange={(e) => setNo(e.target.value)}
        />
      </div>

      {/* 選手名 */}
      <div>
        <label className="block font-medium text-gray-700 mb-1">選手名</label>
        <input
          name="name"
          type="text"
          required
          className="w-full p-3 border rounded-lg focus:ring-2 border-gray-400 focus:ring-blue-500 outline-none transition text-gray-800 placeholder-gray-400"
          placeholder="例：山田 太郎"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* 投 */}
        <div>
          <label className="block font-medium text-gray-700 mb-1">投</label>
          <select
            name="throw_hand"
            className="w-full p-3 border rounded-lg border-gray-400 text-gray-800"
            value={throwHand}
            onChange={(e) => setThrowHand(e.target.value)}
          >
            <option value=""></option>
            <option value="R">右投げ</option>
            <option value="L">左投げ</option>
            <option value="S">両投げ</option>
          </select>
        </div>

        {/* 打 */}
        <div>
          <label className="block font-medium text-gray-700 mb-1">打</label>
          <select
            name="batting_hand"
            className="w-full p-3 border rounded-lg border-gray-400 text-gray-800"
            value={battingHand}
            onChange={(e) => setBattingHand(e.target.value)}
          >
            <option value=""></option>
            <option value="R">右打ち</option>
            <option value="L">左打ち</option>
            <option value="S">両打ち</option>
          </select>
        </div>
      </div>

      <div className="space-y-3">
        <label className="block font-medium text-gray-700">守備位置</label>

        {/* 守備位置 */}
        <input
          type="text"
          name="position"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder="自由に入力、または下のボタンで追加"
        />

        {/* 候補リスト（チップ形式） */}
        <div className="flex flex-wrap gap-2">
          {suggestions.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => addSuggestion(item)}
              className="px-2 py-1 text-xs bg-gray-100 hover:bg-blue-100 text-gray-700 rounded border border-gray-200 transition cursor-pointer"
            >
              + {item}
            </button>
          ))}
        </div>
      </div>

      {/* コメント */}
      <div>
        <label className="block font-medium text-gray-700 mb-1">コメント</label>
        <textarea
          name="comment"
          className="w-full h-30 p-3 border rounded-lg focus:ring-2 border-gray-400 focus:ring-blue-500 outline-none transition text-gray-800 placeholder-gray-400"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </div>

      {/* 写真（選手一覧用） */}
      <div>
        <label className="block font-medium text-gray-700 mb-1">
          写真（選手一覧に表示）
        </label>
        {previewImages.list_image && (
          <div className="mb-3">
            <img
              src={previewImages.list_image}
              alt="選手一覧用写真プレビュー"
              className="max-h-56 max-w-full object-cover rounded-lg border"
            />
          </div>
        )}
        <input
          type="file"
          name="list_image_file"
          accept="image/*"
          onChange={(e) => handleFileChange(e, "list_image")}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>

      {/* 写真（選手詳細用） */}
      <div>
        <label className="block font-medium text-gray-700 mb-1">
          写真（選手詳細に表示）
        </label>
        {previewImages.detail_image && (
          <div className="mb-3">
            <img
              src={previewImages.detail_image}
              alt="選手詳細用写真プレビュー"
              className="max-h-56 max-w-full object-cover rounded-lg border"
            />
          </div>
        )}
        <input
          type="file"
          name="detail_image_file"
          accept="image/*"
          onChange={(e) => handleFileChange(e, "detail_image")}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>

      {/* 表示 */}
      <div className="flex items-center gap-1 mb-1">
        <label className="block font-medium text-gray-700">
          選手一覧、チーム成績に表示
        </label>
      </div>
      <div className="flex items-center gap-1 mb-6">
        <label className="font-medium text-blue-900">
          <input
            type="checkbox"
            name="show_flg"
            id="show_flg"
            className=" text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            checked={showFlg}
            onChange={(e) => setShowFlg(e.target.checked)}
          />
          表示する
        </label>
      </div>

      {/* 権限 */}
      <div className="flex items-center gap-1 mb-1">
        <label className="block font-medium text-gray-700">権限</label>
      </div>
      <div className="grid grid-cols-1 gap-3">
        <div className="flex items-center gap-1">
          <label className="font-medium text-blue-900">
            <input
              type="checkbox"
              name="is_player"
              id="is_player"
              className="text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              checked={isPlayer}
              onChange={(e) => setIsPlayer(e.target.checked)}
            />
            選手権限
          </label>
          <div className="relative group mr-5">
            <HelpCircle size={14} className="text-gray-400 cursor-help" />
            <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block w-50 text-[12px] p-2 bg-gray-900 text-white rounded-md shadow-xl z-20">
              選手画面のログインが可能です
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <label className="font-medium text-blue-900">
            <input
              type="checkbox"
              name="is_manager"
              id="is_manager"
              className=" text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              checked={isManager}
              onChange={(e) => setIsManager(e.target.checked)}
            />
            マネージャー権限
          </label>
          <div className="relative group mr-5">
            <HelpCircle size={14} className="text-gray-400 cursor-help" />
            <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block w-50 text-[12px] p-2 bg-gray-900 text-white rounded-md shadow-xl z-20">
              管理画面のログインが可能です。
              <br />
              試合登録など一部メニューが利用可能です。
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <label className="font-medium text-blue-900">
            <input
              type="checkbox"
              name="is_admin"
              id="is_admin"
              className=" text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              checked={isAdmin}
              onChange={(e) => setIsAdmin(e.target.checked)}
            />
            管理者権限
          </label>
          <div className="relative group mr-5">
            <HelpCircle size={14} className="text-gray-400 cursor-help" />
            <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block w-50 text-[12px] p-2 bg-gray-900 text-white rounded-md shadow-xl z-20">
              管理画面のログインが可能です。
              <br />
              全てのメニューが利用可能です。
            </div>
          </div>
        </div>
      </div>

      {/* ボタン類 */}
      <div className="pt-4 flex gap-4">
        <Link
          href="/admin/players"
          className="flex-1 px-6 py-3 border border-gray-300 text-gray-600 font-bold rounded-lg hover:bg-gray-50 text-center transition cursor-pointer"
        >
          キャンセル
        </Link>
        <button
          type="submit"
          className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <Save size={20} />
          保存
        </button>
      </div>
    </form>
  );
}
