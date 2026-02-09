"use client";

import {
  BarChart3,
  CalendarCheck,
  Home,
  Menu,
  Target,
  X,
  LogOut,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { logout } from "../login/actions";

export default function PlayerMenu({
  no,
  name,
  children,
}: {
  no: string | null;
  name: string | null;
  children: React.ReactNode;
}) {
  const navItems = [
    { name: "ダッシュボード", icon: Home, href: "/player/dashboard" },
    {
      name: "スケジュール・出欠",
      icon: CalendarCheck,
      href: "/player/schedule",
    },
    { name: "個人目標", icon: Target, href: "/player/goal" },
    { name: "個人成績分析", icon: BarChart3, href: "/player/stats" },
  ];
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* --- 左サイドメニュー (PCは常時 / スマホは左からスライド) --- */}
      <aside
        className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-400 flex-col p-6 transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0 md:flex
        ${isMenuOpen ? "translate-x-0" : "-translate-x-full"}
      `}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/player/dashboard">
              <div className="mb-3 text-xl font-bold tracking-tight text-blue-600">
                DashBase
                <span className="text-gray-400 text-xs italic">Player</span>
              </div>
            </Link>
          </div>
          {/* スマホ用：ドロワーを閉じるボタン（ドロワー内） */}
          <button
            onClick={() => setIsMenuOpen(false)}
            className="md:hidden p-2 -mr-2 text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        <div className="pt-6 flex items-center gap-3 mt-auto mb-5">
          <div className="font-bold text-blue-800"># {no ?? ""}</div>
          <div className="font-bold text-gray-800">{name ?? ""}</div>
        </div>

        <nav className="space-y-1 flex-1">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
                pathname === item.href || pathname.startsWith(`${item.href}/`)
                  ? "bg-blue-50 text-blue-600 shadow-sm"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
              }`}
            >
              <item.icon size={18} strokeWidth={2.5} />
              {item.name}
            </Link>
          ))}

          <Link
            href=""
            onClick={logout}
            className="flex items-center gap-4 p-3 hover:bg-red-900/30 rounded-lg transition overflow-hidden whitespace-nowrap font-bold text-red-500"
            title="ログアウト"
          >
            <span className="shrink-0">
              <LogOut />
            </span>
            ログアウト
          </Link>
        </nav>
      </aside>

      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
      {/* --- メインコンテンツ --- */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* スマホ用トップバー（右上にハンバーガー） */}
        <header className="md:hidden bg-white border-b border-gray-200 p-4 flex justify-between items-center sticky top-0 z-30">
          <div className="text-xl font-bold tracking-tight text-blue-600">
            DashBase
            <span className="text-gray-400 text-xs italic">Player</span>
          </div>
          {/* 右上のハンバーガーメニューボタン */}
          <button
            onClick={() => setIsMenuOpen(true)}
            className="p-2 -mr-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <Menu size={24} />
          </button>
        </header>

        <main className="p-4 md:p-10 max-w-5xl mx-auto w-full">{children}</main>
      </div>
    </>
  );
}
