"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";

export default function FrontMenu({
  teamName,
  teamColor,
  teamId,
  teamLogo,
}: {
  teamName: string;
  teamColor?: string;
  teamId?: string;
  teamLogo?: string | null;
}) {
  const params = useParams<{ teamId?: string }>();
  const pathname = usePathname();
  const resolvedTeamId = teamId || params?.teamId || "";

  const menuItems = [
    {
      title: "チーム紹介",
      href: `/${resolvedTeamId}/teamProfile`,
    },
    {
      title: "試合結果",
      href: `/${resolvedTeamId}/games`,
    },
    { title: "選手紹介", href: `/${resolvedTeamId}/players` },
    {
      title: "成績データ",
      href: `/${resolvedTeamId}/stats`,
    },
  ];

  return (
    <header
      className="fixed top-0 w-full z-50 backdrop-blur-md border-b shadow-sm"
      style={{
        backgroundColor: teamColor
          ? `${teamColor}15`
          : "rgba(255, 255, 255, 0.9)",
        borderBottomColor: teamColor ? `${teamColor}20` : "#e5e7eb",
      }}
    >
      <div className="max-w-6xl mx-auto w-full">
        {/* 1段目：チーム名/ログ */}
        <div
          className="flex items-center justify-center py-4 border-b"
          style={{
            borderBottomColor: teamColor ? `${teamColor}20` : "#f3f4f6",
          }}
        >
          <Link href={`/${resolvedTeamId}`}>
            {teamLogo ? (
              <img
                src={teamLogo}
                alt={teamName}
                className="h-16 md:h-20 object-contain"
              />
            ) : (
              <h1
                className="text-3xl md:text-5xl font-black leading-tight tracking-tighter text-center px-4"
                style={{ color: teamColor || "#1e293b" }}
              >
                {teamName}
              </h1>
            )}
          </Link>
        </div>
        {/* 2段目：メニュー */}
        <nav className="flex items-center justify-center gap-4 md:gap-12 py-3 px-4 overflow-x-auto whitespace-nowrap scrollbar-hide">
          {menuItems.map((menu) => {
            const isActive = pathname?.startsWith(menu.href);
            return (
              <Link
                key={menu.href}
                href={menu.href}
                className={`text-lg md:text-2xl font-black tracking-tighter transition-all ${
                  isActive
                    ? "text-(--team-color)"
                    : "text-slate-400 hover:text-(--team-color)"
                }`}
              >
                {menu.title}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
