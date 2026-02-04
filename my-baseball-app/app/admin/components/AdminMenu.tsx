"use client";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Flag,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  ReceiptText,
  Swords,
  Trophy,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { logout } from "../login/actions";
import { usePathname } from "next/navigation";

export default function AdminMenu({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false); // 初期状態を「閉じる」に設定

  // 画面幅を監視して、スマホサイズになったら自動で閉じる
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        // 768px(md) 未満の場合
        setIsOpen(false);
      } else {
        setIsOpen(true); // PCサイズに戻ったら開く（お好みで）
      }
    };

    // 初回実行（リロード時など）
    handleResize();

    // リサイズイベントを登録
    window.addEventListener("resize", handleResize);

    // クリーンアップ（メモリリーク防止）
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const menuItems = [
    {
      title: "ダッシュボード",
      href: "/admin/dashboard",
      icon: <LayoutDashboard size={20} />,
    },
    {
      title: "チームメイト登録",
      href: "/admin/players",
      icon: <UserPlus size={20} />,
    },
    {
      title: "過去選手編集",
      href: "/admin/pastPlayers",
      icon: <Users size={20} />,
    },
    { title: "試合登録", href: "/admin/games/", icon: <Calendar size={20} /> },
    {
      title: "試合結果登録",
      href: "/admin/games/results",
      icon: <Swords size={20} />,
    },
    {
      title: "チームプロフィール編集",
      href: "/admin/teamProfiles",
      icon: <ReceiptText size={20} />,
    },
    {
      title: "リーグ管理",
      href: "/admin/leagues",
      icon: <Trophy size={20} />,
    },
    {
      title: "球場管理",
      href: "/admin/grounds",
      icon: <MapPin size={20} />,
    },
    {
      title: "対戦相手管理",
      href: "/admin/vsteams",
      icon: <Flag size={20} />,
    },
    /*    {
      title: "システム設定",
      href: "/admin/settings",
      icon: <Settings size={20} />,
    },
    */
  ];
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* --- サイドバー --- */}
      <aside
        className={`
            fixed inset-y-0 left-0 z-50 bg-blue-900 text-white transition-all duration-300 ease-in-out
            
            /* PC(md以上)の時だけ、isOpenに合わせて幅を上書きする */
            md:${isOpen ? "w-64" : "w-20"} 

            /* スマホでの表示・非表示（translate） */
            ${isOpen ? "translate-x-0" : "-translate-x-full"}

            /* PCでは画面外に出ないように固定 */
            md:translate-x-0
          `}
      >
        <div className="p-4 flex items-center justify-between">
          {isOpen ? (
            <Link href="/admin/dashboard">
              <h1 className="text-xl font-bold truncate">
                DashBase
                <span className="text-gray-400 text-xs italic">Manager</span>
              </h1>
            </Link>
          ) : (
            <div className="w-0 overflow-hidden" />
          )}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`p-2 hover:bg-blue-800 rounded-lg ${
              !isOpen && "mx-auto"
            }`}
          >
            {isOpen ? <ChevronLeft size={24} /> : <ChevronRight size={24} />}
          </button>
        </div>

        <nav className="mt-4 px-3 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-4 p-3  rounded-lg transition overflow-hidden whitespace-nowrap ${
                pathname === item.href || pathname.startsWith(`${item.href}/`)
                  ? "bg-blue-50 text-blue-600 shadow-sm"
                  : "hover:bg-blue-800"
              }`}
              title={item.title}
            >
              <span className="shrink-0">{item.icon}</span>
              <span className={`${!isOpen && "hidden"} transition-opacity`}>
                {item.title}
              </span>
            </Link>
          ))}

          <Link
            href=""
            onClick={logout}
            className="flex items-center gap-4 p-3 hover:bg-red-900/30 rounded-lg transition overflow-hidden whitespace-nowrap text-red-300"
            title="ログアウト"
          >
            <span className="shrink-0">
              <LogOut />
            </span>
            <span className={`${!isOpen && "hidden"} transition-opacity`}>
              ログアウト
            </span>
          </Link>
        </nav>
      </aside>

      {/* --- メインコンテンツ --- */}
      <div
        className={`
        flex-1 flex flex-col transition-all duration-300 min-w-0
        ${isOpen ? "md:ml-64" : "md:ml-20"}
        ml-0
      `}
      >
        {/* スマホ用ヘッダー（スマホ時のみ表示） */}
        <header className="md:hidden flex items-center justify-between bg-blue-900 text-white p-4">
          <span className="font-bold">
            DashBase
            <span className="text-gray-400 text-xs italic">Manager</span>
          </span>
          <button onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X /> : <Menu />}
          </button>
        </header>

        <main className="p-4 md:p-8 max-w-full overflow-hidden">
          {children}
        </main>
      </div>

      {/* スマホ用オーバーレイ（メニューが開いているときに背景を暗くする） */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
