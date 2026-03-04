"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";

type SystemSettings = {
  title: string;
  subtitle: string;
  headerImageDataUrl: string;
};

const SYSTEM_SETTINGS_STORAGE_KEY = "penpen_league_system_settings_v1";
const ADMIN_PASSWORD_STORAGE_KEY = "penpen_league_admin_password_v1";

const defaultSettings: SystemSettings = {
  title: "PENPEN LEAGUE",
  subtitle: "草野球リーグ公式サイト",
  headerImageDataUrl: "",
};

export default function PenpenAdminSystemPage() {
  const [title, setTitle] = useState(defaultSettings.title);
  const [subtitle, setSubtitle] = useState(defaultSettings.subtitle);
  const [headerImageDataUrl, setHeaderImageDataUrl] = useState(
    defaultSettings.headerImageDataUrl,
  );
  const [settingsMessage, setSettingsMessage] = useState("");

  const [savedPassword, setSavedPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");

  useEffect(() => {
    const rawSettings = localStorage.getItem(SYSTEM_SETTINGS_STORAGE_KEY);
    if (rawSettings) {
      try {
        const parsed = JSON.parse(rawSettings) as Partial<SystemSettings>;
        setTitle(parsed.title ?? defaultSettings.title);
        setSubtitle(parsed.subtitle ?? defaultSettings.subtitle);
        setHeaderImageDataUrl(parsed.headerImageDataUrl ?? "");
      } catch {
        setTitle(defaultSettings.title);
        setSubtitle(defaultSettings.subtitle);
        setHeaderImageDataUrl(defaultSettings.headerImageDataUrl);
      }
    }

    const rawPassword = localStorage.getItem(ADMIN_PASSWORD_STORAGE_KEY) ?? "";
    setSavedPassword(rawPassword);
  }, []);

  const handleSettingsSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload: SystemSettings = {
      title: title.trim(),
      subtitle: subtitle.trim(),
      headerImageDataUrl,
    };

    localStorage.setItem(SYSTEM_SETTINGS_STORAGE_KEY, JSON.stringify(payload));
    setSettingsMessage("HP設定を保存しました。");
  };

  const handleHeaderImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setHeaderImageDataUrl(reader.result);
        setSettingsMessage(
          "ヘッダー画像を読み込みました。保存で確定されます。",
        );
      }
    };
    reader.readAsDataURL(file);
  };

  const removeHeaderImage = () => {
    setHeaderImageDataUrl("");
    setSettingsMessage("ヘッダー画像を削除しました。保存で確定されます。");
  };

  const handlePasswordChange = (event: FormEvent<HTMLFormElement>) => {
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

    localStorage.setItem(ADMIN_PASSWORD_STORAGE_KEY, newPassword);
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

            {headerImageDataUrl ? (
              <div className="space-y-3">
                <img
                  src={headerImageDataUrl}
                  alt="ヘッダー画像プレビュー"
                  className="w-full max-h-56 object-cover rounded-lg border border-gray-300"
                />
                <button
                  type="button"
                  onClick={removeHeaderImage}
                  className="rounded-lg border border-red-300 text-red-700 font-bold px-4 py-2 hover:bg-red-50 transition-colors"
                >
                  画像を削除
                </button>
              </div>
            ) : null}

            <button
              type="submit"
              className="bg-blue-600 text-white font-black px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors"
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
              className="bg-blue-600 text-white font-black px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors"
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
