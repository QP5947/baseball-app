import React from "react";
import FrontMenu from "../components/FrontMenu";
import Footer from "../components/Footer";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ToastRedirect from "@/components/ToastRedirect";

interface Props {
  params: Promise<{
    teamId: string;
  }>;
}

export default async function PlayersPage({ params }: Props) {
  const { teamId } = await params;
  const supabase = await createClient();

  const { data: team } = await supabase
    .from("myteams")
    .select("id, name, team_color, team_logo")
    .eq("id", teamId)
    .single();

  if (!team) {
    return <ToastRedirect message="チームが見つかりません" redirectPath="/" />;
  }

  const { data: players } = await supabase
    .from("players")
    .select("id, no, name, position, list_image")
    .eq("team_id", teamId)
    .eq("show_flg", true)
    .order("sort", { ascending: true, nullsFirst: false })
    .order("no", { ascending: true, nullsFirst: false });

  const getStorageUrl = (
    path: string | null,
    bucket: string = "team_assets",
  ) => {
    if (!path) return null;
    if (path.startsWith("http://") || path.startsWith("https://")) {
      return path;
    }
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
  };

  const teamLogoUrl = getStorageUrl(team.team_logo);

  const darkenHexColor = (hexColor: string, ratio: number = 0.35) => {
    const hex = hexColor.replace("#", "");
    if (!/^[0-9A-Fa-f]{6}$/.test(hex)) {
      return "#1e293b";
    }

    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);

    const toDark = (value: number) =>
      Math.max(0, Math.round(value * (1 - ratio)))
        .toString(16)
        .padStart(2, "0");

    return `#${toDark(r)}${toDark(g)}${toDark(b)}`;
  };

  const teamColor = team.team_color || "#3b82f6";
  const teamColorDark = darkenHexColor(teamColor);

  const playersForView = (players || []).map((player) => ({
    ...player,
    listImageUrl: getStorageUrl(player.list_image, "player_images"),
    role: player.position?.trim() || "-",
  }));

  const themeStyle = {
    "--team-color": teamColor,
    "--team-color-dark": teamColorDark,
  } as React.CSSProperties;

  return (
    <div className="min-h-screen bg-gray-50 text-slate-800" style={themeStyle}>
      <FrontMenu
        teamName={team.name}
        teamColor={teamColor}
        teamId={teamId}
        teamLogo={teamLogoUrl}
      />

      <main className="pt-40 md:pt-48 max-w-6xl mx-auto px-6 pb-20">
        <div className="flex items-center gap-4">
          <span className="w-2 h-10 bg-(--team-color) rounded-full"></span>
          <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-slate-900">
            選手一覧
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-10 mt-5">
          {playersForView.map((player) => (
            <Link
              href={`/${teamId}/players/${player.id}`}
              key={player.id}
              className="group relative bg-white rounded-[2.5rem] overflow-hidden border-2 border-slate-100 shadow-sm hover:border-(--team-color) hover:shadow-2xl transition-all duration-300"
            >
              {/* 背景の大きな背番号 */}
              <div className="absolute top-4 left-6 z-20 pointer-events-none">
                <span className="text-4xl md:text-5xl font-black italic text-white group-hover:text-(--team-color) transition-colors duration-300 [-webkit-text-stroke-width:2px] [-webkit-text-stroke-color:rgba(100,116,139,0.9)] group-hover:[-webkit-text-stroke-color:var(--team-color-dark)] [text-shadow:0_2px_6px_rgba(2,6,23,0.45)]">
                  {player.no || "-"}
                </span>
              </div>

              {/* 選手画像エリア */}
              <div className="relative aspect-square flex items-center justify-center p-8 overflow-hidden">
                {player.listImageUrl ? (
                  <img
                    src={player.listImageUrl}
                    alt={player.name}
                    className="relative z-10 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="relative z-10 w-full h-full rounded-3xl bg-linear-to-br from-(--team-color) to-slate-500 flex items-center justify-center">
                    <span className="text-6xl md:text-7xl font-black italic text-white drop-shadow-sm leading-none">
                      {player.name?.trim()?.charAt(0) || "?"}
                    </span>
                  </div>
                )}
              </div>

              {/* 氏名・詳細エリア */}
              <div className="p-6 text-center bg-white relative z-10">
                <div className="flex flex-col items-center justify-center gap-1">
                  <span className="text-sm font-black text-(--team-color) italic tracking-widest">
                    {player.role}
                  </span>
                  <h4 className="text-xl md:text-2xl font-black text-slate-900 mt-1">
                    {player.name}
                  </h4>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
