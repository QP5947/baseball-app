import Link from "next/link";

export default function FrontMenu({ teamName }: { teamName: string }) {
  const menuItems = [
    {
      title: "チーム紹介",
      href: "/teamProfile",
    },
    {
      title: "試合結果",
      href: "/games",
    },
    { title: "選手紹介", href: "/players" },
    {
      title: "個人成績",
      href: "/stats",
    },
  ];

  return (
    <header className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-6xl mx-auto w-full">
        {/* 1段目：チーム名 */}
        <div className="flex items-center justify-center py-4 border-b border-gray-50">
          <Link href="/">
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 leading-tight tracking-tighter text-center px-4">
              {teamName}
            </h1>
          </Link>
        </div>
        {/* 2段目：メニュー */}
        <nav className="flex items-center justify-center gap-4 md:gap-12 py-3 px-4 overflow-x-auto whitespace-nowrap scrollbar-hide">
          {menuItems.map((menu) => (
            <a
              key={menu.href}
              href={menu.href}
              className="text-lg md:text-2xl font-black tracking-tighter text-slate-400 hover:text-(--team-color) transition-all"
            >
              {menu.title}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
