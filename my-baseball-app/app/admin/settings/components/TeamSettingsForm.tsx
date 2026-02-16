"use client";

import { useState, useEffect } from "react";
import { Save, X } from "lucide-react";
import { LoadingIndicator } from "@/components/LoadingSkeleton";
import { Database } from "@/types/supabase";
import { fetchTeamSettings, updateTeamSettings } from "../actions";

type MyTeam = Database["public"]["Tables"]["myteams"]["Row"];

export default function TeamSettingsForm() {
  const [team, setTeam] = useState<MyTeam | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [deletedImages, setDeletedImages] = useState<Set<string>>(new Set());
  const [previewImages, setPreviewImages] = useState<{
    team_logo?: string;
    top_image?: string;
    team_icon?: string;
  }>({});

  useEffect(() => {
    loadTeamSettings();
  }, []);

  const loadTeamSettings = async () => {
    try {
      setLoading(true);
      const result = await fetchTeamSettings();
      if (result.success) {
        setTeam(result.data);
        // 画像URL をプレビューに設定
        if (result.imageUrls) {
          setPreviewImages(result.imageUrls);
        }
      } else {
        setMessage(result.error || "チーム設定の取得に失敗しました");
      }
    } catch (error) {
      console.error("Error loading team settings:", error);
      setMessage("チーム設定の読み込みに失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldName: "team_logo" | "top_image" | "team_icon",
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      // ローカルプレビューを表示
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImages((prev) => ({
          ...prev,
          [fieldName]: reader.result as string,
        }));
        // ファイルが選択されたら、削除フラグから除外
        setDeletedImages((prev) => {
          const newSet = new Set(prev);
          newSet.delete(fieldName);
          return newSet;
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteImage = (
    fieldName: "team_logo" | "top_image" | "team_icon",
  ) => {
    // プレビューから削除
    setPreviewImages((prev) => {
      const newPreview = { ...prev };
      delete newPreview[fieldName];
      return newPreview;
    });
    // 削除フラグに追加
    setDeletedImages((prev) => new Set([...prev, fieldName]));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!team) return;

    try {
      setSaving(true);
      setMessage("");

      const formData = new FormData(e.currentTarget);
      // 削除する画像をフォームデータに追加
      deletedImages.forEach((fieldName) => {
        formData.append(`delete_${fieldName}`, "true");
      });

      const result = await updateTeamSettings(formData);

      if (result.success) {
        // 削除フラグをリセット
        setDeletedImages(new Set());
        // Load updated team settings
        await loadTeamSettings();
        setMessage(result.message || "設定を保存しました");
      } else {
        setMessage(result.error || "設定の保存に失敗しました");
      }
    } catch (error: any) {
      console.error("Error saving settings:", error);
      setMessage(error?.message || "設定の保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingIndicator />;
  }

  if (!team) {
    return <div className="text-center py-8">チーム情報が見つかりません</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.includes("失敗")
              ? "bg-red-100 text-red-700"
              : "bg-green-100 text-green-700"
          }`}
        >
          {message}
        </div>
      )}

      {/* チーム名 */}
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700"
        >
          チーム名
        </label>
        <input
          type="text"
          id="name"
          name="name"
          defaultValue={team.name || ""}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          required
        />
      </div>

      {/* チーム名1文字 */}
      <div>
        <label
          htmlFor="one_name"
          className="block text-sm font-medium text-gray-700"
        >
          チーム名1文字
        </label>
        <input
          type="text"
          id="one_name"
          name="one_name"
          defaultValue={team.one_name || ""}
          maxLength={1}
          className="mt-1 block w-20 rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 text-center text-2xl font-bold"
          placeholder=""
        />
      </div>

      {/* パスフレーズ */}
      <div>
        <label
          htmlFor="passphrase"
          className="block text-sm font-medium text-gray-700"
        >
          パスフレーズ
        </label>
        <input
          type="text"
          id="passphrase"
          name="passphrase"
          defaultValue={team.passphrase || ""}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          placeholder="チームメンバーを招待する際のパスフレーズ"
        />
      </div>

      {/* チームカラー */}
      <div>
        <label
          htmlFor="team_color"
          className="block text-sm font-medium text-gray-700"
        >
          チームカラー
        </label>
        <div className="mt-1 flex items-center gap-4">
          <input
            type="color"
            id="team_color"
            name="team_color"
            defaultValue={team.team_color || "#1e40af"}
            className="h-12 w-20 rounded-lg border border-gray-300 cursor-pointer"
          />
          <span className="text-sm text-gray-500">
            {team.team_color || "#1e40af"}
          </span>
        </div>
      </div>

      {/* チームロゴ */}
      <div>
        <label
          htmlFor="team_logo"
          className="block text-sm font-medium text-gray-700"
        >
          チームロゴ
        </label>
        <div className="mt-1">
          {previewImages.team_logo && (
            <div className="mb-3 relative inline-block group">
              <img
                src={previewImages.team_logo}
                alt="チームロゴ プレビュー"
                className="max-h-80 max-w-full object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={() => handleDeleteImage("team_logo")}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 opacity-100 pointer-fine:opacity-0 pointer-fine:group-hover:opacity-100 transition-opacity"
              >
                <X size={16} />
              </button>
            </div>
          )}
          <input
            type="file"
            id="team_logo"
            name="team_logo"
            accept="image/*"
            onChange={(e) => handleFileChange(e, "team_logo")}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>
      </div>

      {/* TOP画像 */}
      <div>
        <label
          htmlFor="top_image"
          className="block text-sm font-medium text-gray-700"
        >
          TOP画像
        </label>
        <div className="mt-1">
          {previewImages.top_image && (
            <div className="mb-3 relative inline-block w-full group">
              <img
                src={previewImages.top_image}
                alt="TOP画像 プレビュー"
                className="max-w-full w-full object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={() => handleDeleteImage("top_image")}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 opacity-100 pointer-fine:opacity-0 pointer-fine:group-hover:opacity-100 transition-opacity"
              >
                <X size={16} />
              </button>
            </div>
          )}
          <input
            type="file"
            id="top_image"
            name="top_image"
            accept="image/*"
            onChange={(e) => handleFileChange(e, "top_image")}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>
      </div>

      {/* チームアイコン */}
      <div>
        <label
          htmlFor="team_icon"
          className="block text-sm font-medium text-gray-700"
        >
          チームアイコン
        </label>
        <div className="mt-1">
          {previewImages.team_icon && (
            <div className="mb-3 relative inline-block group">
              <img
                src={previewImages.team_icon}
                alt="チームアイコン プレビュー"
                className="h-32 w-32 object-cover"
              />
              <button
                type="button"
                onClick={() => handleDeleteImage("team_icon")}
                className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 opacity-100 pointer-fine:opacity-0 pointer-fine:group-hover:opacity-100 transition-opacity"
              >
                <X size={16} />
              </button>
            </div>
          )}
          <input
            type="file"
            id="team_icon"
            name="team_icon"
            accept="image/*"
            onChange={(e) => handleFileChange(e, "team_icon")}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>
      </div>

      {/* 保存ボタン */}
      <div className="pt-4 flex gap-4">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <Save size={20} />
          {saving ? "保存中..." : "設定を保存"}
        </button>
      </div>
    </form>
  );
}
