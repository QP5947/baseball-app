"use client";

import Link from "next/link";
import Image from "next/image";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  PENPEN_DEFAULT_HEADER_IMAGE,
  removePenpenImageIfStored,
  resolvePenpenImageUrl,
  uploadPenpenImage,
} from "../../lib/penpenStorage";

type SystemSettings = {
  title: string;
  subtitle: string;
  headerImagePath: string;
  adminPasswordHash: string;
};

const defaultSettings: SystemSettings = {
  title: "PENPEN LEAGUE",
  subtitle: "草野球リーグ公式サイト",
  headerImagePath: "",
  adminPasswordHash: "",
};

export default function PenpenAdminSystemPage() {
  const supabase = createClient();

  const [title, setTitle] = useState(defaultSettings.title);
  const [subtitle, setSubtitle] = useState(defaultSettings.subtitle);
  const [headerImagePath, setHeaderImagePath] = useState(
    defaultSettings.headerImagePath,
  );
  const [headerImagePreviewUrl, setHeaderImagePreviewUrl] = useState(
    PENPEN_DEFAULT_HEADER_IMAGE,
  );
  const [selectedHeaderImageFile, setSelectedHeaderImageFile] =
    useState<File | null>(null);
  const [settingsMessage, setSettingsMessage] = useState("");

  const [savedPassword, setSavedPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .schema("penpen")
        .from("settings")
        .select(
          "site_title, site_subtitle, header_image_url, admin_password_hash",
        )
        .eq("id", true)
        .single();

      if (error) {
        setSettingsMessage(`設定読み込みに失敗しました: ${error.message}`);
        return;
      }

      setTitle(data.site_title ?? defaultSettings.title);
      setSubtitle(data.site_subtitle ?? defaultSettings.subtitle);
      const loadedPath = data.header_image_url ?? "";
      setHeaderImagePath(loadedPath);
      setHeaderImagePreviewUrl(
        resolvePenpenImageUrl(
          supabase,
          loadedPath,
          PENPEN_DEFAULT_HEADER_IMAGE,
        ),
      );
      setSavedPassword(data.admin_password_hash ?? "");
    };

    void load();
  }, [supabase]);

  const saveSettings = async (
    next: Pick<SystemSettings, "title" | "subtitle" | "headerImagePath">,
  ) => {
    const { error } = await supabase
      .schema("penpen")
      .from("settings")
      .upsert({
        id: true,
        site_title: next.title,
        site_subtitle: next.subtitle,
        header_image_url: next.headerImagePath || null,
        admin_password_hash: savedPassword || null,
      });

    if (error) {
      setSettingsMessage(`HP設定の保存に失敗しました: ${error.message}`);
      return false;
    }

    setSettingsMessage("HP設定を保存しました。");
    return true;
  };

  const handleSettingsSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const previousHeaderImagePath = headerImagePath;
    let nextHeaderImagePath = headerImagePath;

    if (selectedHeaderImageFile) {
      try {
        const uploaded = await uploadPenpenImage(
          supabase,
          selectedHeaderImageFile,
          "header-images",
        );
        nextHeaderImagePath = uploaded.path;
        setHeaderImagePreviewUrl(
          uploaded.publicUrl || PENPEN_DEFAULT_HEADER_IMAGE,
        );
      } catch (error) {
        setSettingsMessage(
          `ヘッダー画像のアップロードに失敗しました: ${error instanceof Error ? error.message : "unknown"}`,
        );
        return;
      }
    }

    const payload = {
      title: title.trim(),
      subtitle: subtitle.trim(),
      headerImagePath: nextHeaderImagePath,
    };

    const saved = await saveSettings(payload);
    if (!saved) {
      return;
    }

    if (previousHeaderImagePath !== nextHeaderImagePath) {
      await removePenpenImageIfStored(supabase, previousHeaderImagePath);
    }

    setHeaderImagePath(nextHeaderImagePath);
    setSelectedHeaderImageFile(null);
  };

  const handleHeaderImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setSelectedHeaderImageFile(file);
    setHeaderImagePreviewUrl(previewUrl);
    setSettingsMessage("ヘッダー画像を選択しました。保存で確定されます。");
  };

  const removeHeaderImage = () => {
    setSelectedHeaderImageFile(null);
    setHeaderImagePath("");
    setHeaderImagePreviewUrl(PENPEN_DEFAULT_HEADER_IMAGE);
    setSettingsMessage("ヘッダー画像を削除しました。保存で確定されます。");
  };

  const handlePasswordChange = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!newPassword || !confirmPassword) {
      setPasswordMessage("新しいパスワードを入力してください。");
      return;
    }

    if (savedPassword && currentPassword !== savedPassword) {
      setPasswordMessage("現在のパスワードが一致しません。");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage("新しいパスワード（確認）が一致しません。");
      return;
    }

    const { error } = await supabase
      .schema("penpen")
      .from("settings")
      .upsert({
        id: true,
        site_title: title.trim(),
        site_subtitle: subtitle.trim(),
        header_image_url: headerImagePath || null,
        admin_password_hash: newPassword,
      });

    if (error) {
      setPasswordMessage(`パスワード変更に失敗しました: ${error.message}`);
      return;
    }

    setSavedPassword(newPassword);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordMessage("パスワードを変更しました。");
  };

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl md:text-3xl font-black text-gray-900">
            システム管理
          </h1>
          <p className="text-base text-gray-600 mt-2">
            HPタイトル、HPサブタイトル、ヘッダー画像、管理者パスワードを設定できます。
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
          <h2 className="text-xl font-black text-gray-900">HP設定</h2>

          <form onSubmit={handleSettingsSave} className="mt-4 space-y-4">
            <label className="space-y-2 block">
              <span className="text-base font-bold text-gray-700">
                HPタイトル
              </span>
              <input
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white"
                placeholder="サイトのタイトルを入力"
              />
            </label>

            <label className="space-y-2 block">
              <span className="text-base font-bold text-gray-700">
                HPサブタイトル
              </span>
              <input
                type="text"
                value={subtitle}
                onChange={(event) => setSubtitle(event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white"
                placeholder="サイトのサブタイトルを入力"
              />
            </label>

            <label className="space-y-2 block">
              <span className="text-base font-bold text-gray-700">
                ヘッダー画像
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleHeaderImageChange}
                className="block w-full text-base"
              />
            </label>

            {headerImagePreviewUrl ? (
              <div className="space-y-3">
                <Image
                  src={headerImagePreviewUrl}
                  alt="ヘッダー画像プレビュー"
                  width={1200}
                  height={420}
                  unoptimized
                  className="w-full max-h-56 object-cover rounded-lg border border-gray-300"
                />
                {headerImagePath || selectedHeaderImageFile ? (
                  <button
                    type="button"
                    onClick={removeHeaderImage}
                    className="rounded-lg border border-red-300 text-red-700 font-bold px-4 py-2 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    画像を削除
                  </button>
                ) : null}
              </div>
            ) : null}

            <button
              type="submit"
              className="bg-blue-600 text-white font-black px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
            >
              HP設定を保存
            </button>

            {settingsMessage ? (
              <p className="text-base font-bold text-green-700">
                {settingsMessage}
              </p>
            ) : null}
          </form>
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 md:p-6">
          <h2 className="text-xl font-black text-gray-900">パスワード変更</h2>
          <p className="text-base text-gray-600 mt-2">
            {savedPassword
              ? "現在のパスワードを入力して変更してください。"
              : "まだパスワード未設定です。新しいパスワードを設定してください。"}
          </p>

          <form onSubmit={handlePasswordChange} className="mt-4 space-y-4">
            <label className="space-y-2 block">
              <span className="text-base font-bold text-gray-700">
                現在のパスワード
              </span>
              <input
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white"
                placeholder="現在のパスワード"
              />
            </label>

            <label className="space-y-2 block">
              <span className="text-base font-bold text-gray-700">
                新しいパスワード
              </span>
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white"
                placeholder="新しいパスワード"
              />
            </label>

            <label className="space-y-2 block">
              <span className="text-base font-bold text-gray-700">
                新しいパスワード（確認）
              </span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white"
                placeholder="新しいパスワード（確認）"
              />
            </label>

            <button
              type="submit"
              className="bg-blue-600 text-white font-black px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
            >
              パスワードを変更
            </button>

            {passwordMessage ? (
              <p className="text-base font-bold text-green-700">
                {passwordMessage}
              </p>
            ) : null}
          </form>
        </section>
      </div>
    </main>
  );
}
