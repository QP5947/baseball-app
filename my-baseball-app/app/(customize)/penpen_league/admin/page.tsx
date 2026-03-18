import type { Metadata } from "next";
import Link from "next/link";
import OneDayResultForm from "./components/OneDayResultForm";
import AdminLogoutButton from "./components/AdminLogoutButton";
import {
  CalendarPlus,
  ClipboardCheck,
  Trophy,
  GitBranch,
  FileText,
  Users,
  MapPin,
  Settings,
} from "lucide-react";

const menuItems = [
  {
    title: "試合日程入力",
    href: "/penpen_league/admin/schedule",
    icon: CalendarPlus,
  },
  {
    title: "試合結果入力",
    href: "/penpen_league/admin/results",
    icon: ClipboardCheck,
  },
  { title: "大会管理", href: "/penpen_league/admin/leagues", icon: Trophy },
  {
    title: "トーナメント管理",
    href: "/penpen_league/admin/tournaments",
    icon: GitBranch,
  },
  { title: "大会規定管理", href: "/penpen_league/admin/rules", icon: FileText },
  { title: "チーム管理", href: "/penpen_league/admin/teams", icon: Users },
  { title: "球場管理", href: "/penpen_league/admin/grounds", icon: MapPin },
  {
    title: "システム管理",
    href: "/penpen_league/admin/system",
    icon: Settings,
  },
];

export const metadata: Metadata = { title: "管理画面" };

export default function PenpenAdminHomePage() {
  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl md:text-3xl font-black text-gray-900">
            管理画面ホーム
          </h1>
          <p className="text-gray-600 mt-2">
            メニューから入力対象を選択してください。
          </p>
        </header>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 space-y-4">
          <h2 className="text-xl font-black text-gray-900">
            直近の試合結果入力
          </h2>
          <OneDayResultForm />
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {menuItems.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="w-full bg-white border border-gray-300 rounded-xl p-5 text-left font-bold text-gray-800 hover:bg-blue-50 hover:border-blue-300 transition-colors cursor-pointer block"
            >
              <span className="flex items-center gap-3">
                <item.icon size={20} className="text-blue-600 shrink-0" />
                <span>{item.title}</span>
              </span>
            </Link>
          ))}
        </section>

        <div>
          <AdminLogoutButton />
        </div>
      </div>
    </main>
  );
}
