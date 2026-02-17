import React from "react";
import FrontMenu from "../components/FrontMenu";
import Footer from "../components/Footer";
import { createClient } from "@/lib/supabase/server";
import ToastRedirect from "@/components/ToastRedirect";

interface Props {
  params: Promise<{
    teamId: string;
  }>;
}

export default async function TeamProfilePage({ params }: Props) {
  const { teamId } = await params;
  const supabase = await createClient();

  const { data: team } = await supabase
    .from("myteams")
    .select("id,name,team_color,team_logo")
    .eq("id", teamId)
    .single();

  if (!team) {
    return <ToastRedirect message="チームが見つかりません" redirectPath="/" />;
  }

  const { data: teamProfiles } = await supabase
    .from("team_profiles")
    .select("no,q,a")
    .eq("team_id", teamId)
    .order("no");

  const aboutRow = teamProfiles?.find((row) => row.no === 0);
  const detailRows = (teamProfiles ?? []).filter(
    (row) => row.no !== 0 && (row.q || row.a),
  );

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
  const primaryColor = team.team_color || "#3b82f6";

  const themeStyle = {
    "--team-color": primaryColor,
    "--victory-color": "#ef4444",
  } as React.CSSProperties;

  const renderTextWithLinks = (text: string) => {
    const markdownLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
    const urlRegex = /(https?:\/\/[^\s]+)/g;

    const renderPlainText = (plain: string, keyPrefix: string) => {
      return plain.split(urlRegex).map((part, index) => {
        const isUrl = part.startsWith("http://") || part.startsWith("https://");
        if (isUrl) {
          return (
            <a
              key={`${keyPrefix}-url-${index}`}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="text-(--team-color) underline underline-offset-4 break-all"
            >
              {part}
            </a>
          );
        }

        return <span key={`${keyPrefix}-text-${index}`}>{part}</span>;
      });
    };

    const nodes: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = markdownLinkRegex.exec(text)) !== null) {
      const [fullMatch, label, url] = match;
      const matchIndex = match.index;

      if (matchIndex > lastIndex) {
        nodes.push(
          <React.Fragment key={`plain-${matchIndex}`}>
            {renderPlainText(text.slice(lastIndex, matchIndex), "plain")}
          </React.Fragment>,
        );
      }

      nodes.push(
        <a
          key={`md-${matchIndex}`}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-(--team-color) underline underline-offset-4 break-all"
        >
          {label}
        </a>,
      );

      lastIndex = matchIndex + fullMatch.length;
    }

    if (lastIndex < text.length) {
      nodes.push(
        <React.Fragment key={`tail-${lastIndex}`}>
          {renderPlainText(text.slice(lastIndex), "tail")}
        </React.Fragment>,
      );
    }

    return nodes.length > 0 ? nodes : renderPlainText(text, "full");
  };

  return (
    <div
      className="min-h-screen bg-gray-50 text-slate-800 font-sans"
      style={themeStyle}
    >
      <FrontMenu
        teamName={team.name}
        teamColor={primaryColor}
        teamId={teamId}
        teamLogo={teamLogoUrl}
      />

      <main className="pt-40 md:pt-48">
        <div className="max-w-4xl mx-auto px-6 space-y-20 pb-20">
          <section className="space-y-8">
            <div className="flex items-center gap-4">
              <span className="w-2 h-10 bg-(--team-color) rounded-full"></span>
              <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-slate-900">
                チームについて
              </h2>
            </div>

            <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-xl shadow-slate-200/50 border border-white">
              <p className="text-xl md:text-2xl font-bold leading-relaxed text-slate-700 whitespace-pre-wrap">
                {renderTextWithLinks(
                  aboutRow?.a || "チームプロフィールがまだ登録されていません。",
                )}
              </p>
            </div>
          </section>

          <section className="grid md:grid-cols-2 gap-8">
            {detailRows.length > 0 ? (
              detailRows.map((row) => (
                <div
                  key={`${row.no}-${row.q}`}
                  className="bg-white rounded-4xl p-10 shadow-lg border border-slate-50"
                >
                  <h3 className="text-xl font-black text-slate-400 mb-4 tracking-widest">
                    {row.q || "項目"}
                  </h3>
                  <p className="text-2xl font-black text-slate-900 whitespace-pre-wrap">
                    {renderTextWithLinks(row.a || "")}
                  </p>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-4xl p-10 shadow-lg border border-slate-50 md:col-span-2">
                <p className="text-lg font-bold text-slate-400">
                  追加のプロフィール項目はまだ登録されていません。
                </p>
              </div>
            )}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
