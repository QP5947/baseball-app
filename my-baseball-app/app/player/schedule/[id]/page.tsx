import { createClient } from "@/lib/supabase/server";
import { UserPlus, ChevronLeft, MessageCircle } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import PlayerMenu from "../../components/PlayerMenu";
import AttendanceDetailClient from "./components/AttendanceDetailClient";

const normalizeStatus = (row: any): "attending" | "absent" | "pending" => {
  const raw = row?.attendance_no ?? row?.status ?? null;
  if (raw === 1) return "attending";
  if (raw === 2) return "absent";
  return "pending";
};

const getRelativeTime = (date: Date) => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "たった今";
  if (diffMins < 60) return `${diffMins}分前`;
  if (diffHours < 24) return `${diffHours}時間前`;
  if (diffDays < 7) return `${diffDays}日前`;
  return date.toLocaleDateString("ja-JP");
};

export default async function AttendanceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/player/login");
  }

  const { data: player } = await supabase
    .from("players")
    .select("id,name,no,team_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!player) {
    redirect("/player/login");
  }

  // 試合情報を取得
  const { data: game } = await supabase
    .from("games")
    .select("*,leagues(name),grounds(name),vsteams(name)")
    .eq("id", id)
    .maybeSingle();

  if (!game) {
    redirect("/player/schedule");
  }

  // 出欠情報を取得
  const { data: schedules } = await supabase
    .from("attendance")
    .select("*")
    .eq("game_id", id);

  // プレイヤー一覧を取得（is_player or is_manager = true）
  const { data: allPlayers } = await supabase
    .from("players")
    .select("id,name,no")
    .eq("team_id", player.team_id)
    .or("is_player.eq.true,is_manager.eq.true");

  // 統計情報
  const attending = (schedules || []).filter(
    (s: any) => normalizeStatus(s) === "attending",
  ).length;
  const absent = (schedules || []).filter(
    (s: any) => normalizeStatus(s) === "absent",
  ).length;
  const pending = (schedules || []).filter(
    (s: any) => normalizeStatus(s) === "pending",
  ).length;

  // 助っ人の合計数
  const helperTotal = (schedules || []).reduce(
    (sum: number, s: any) => sum + (s.helper_count || 0),
    0,
  );

  const mySchedule = (schedules || []).find(
    (s: any) => s.player_id === player.id,
  );

  // コメント取得（コメントがあるか、助っ人数が1以上の場合）
  const scheduleWithComments = (schedules || []).filter(
    (s: any) => s.comment && s.comment.trim(),
  );
  const memberComments = scheduleWithComments.map((s: any) => {
    const p = (allPlayers || []).find((pl: any) => pl.id === s.player_id);
    return {
      name: p?.name || "不明",
      status: normalizeStatus(s),
      text: s.comment,
      helperCount: s.helper_count || 0,
      time: getRelativeTime(new Date(s.created_at)),
    };
  });

  // 未回答者（scheduleに登録がない & is_player or is_manager = true）
  const schedulePlayerIds = (schedules || []).map((s: any) => s.player_id);
  const pendingUsers = (allPlayers || [])
    .filter((p: any) => !schedulePlayerIds.includes(p.id))
    .map((p: any) => p.name);

  const scheduleByPlayer = new Map(
    (schedules || []).map((s: any) => [s.player_id, s]),
  );

  const attendedPlayers = (allPlayers || [])
    .filter((p: any) => {
      const s = scheduleByPlayer.get(p.id);
      return s && normalizeStatus(s) === "attending";
    })
    .map((p: any) => {
      const s = scheduleByPlayer.get(p.id);
      return {
        id: p.id,
        name: p.name,
        helperCount: s?.helper_count || 0,
        comment: s?.comment || "",
      };
    });

  const absentPlayers = (allPlayers || [])
    .filter((p: any) => {
      const s = scheduleByPlayer.get(p.id);
      return s && normalizeStatus(s) === "absent";
    })
    .map((p: any) => ({ id: p.id, name: p.name }));

  const pendingPlayers = (allPlayers || [])
    .filter((p: any) => {
      const s = scheduleByPlayer.get(p.id);
      return s && normalizeStatus(s) === "pending";
    })
    .map((p: any) => ({ id: p.id, name: p.name }));

  const unansweredPlayers = (allPlayers || [])
    .filter((p: any) => !scheduleByPlayer.has(p.id))
    .map((p: any) => ({ id: p.id, name: p.name }));

  return (
    <div className="min-h-screen bg-gray-50/50 flex text-gray-800 relative">
      <PlayerMenu no={player.no ?? ""} name={player.name ?? ""}>
        <header className="flex items-center gap-4 mb-4">
          <Link href="/player/schedule/" className="text-gray-600 p-1">
            <ChevronLeft size={24} />
          </Link>
          <h1 className="font-black text-2xl text-gray-900">出欠回答</h1>
        </header>

        <main className="max-w-5xl mx-auto space-y-6">
          {/* すべてのロジックとUIをClient側に集約 */}
          <AttendanceDetailClient
            gameId={id}
            playerId={player.id}
            initialStatus={mySchedule ? normalizeStatus(mySchedule) : null}
            initialHelpers={mySchedule?.helper_count ?? 0}
            initialComment={mySchedule?.comment ?? ""}
            attendedPlayers={attendedPlayers}
            absentPlayers={absentPlayers}
            pendingPlayers={pendingPlayers}
            unansweredPlayers={unansweredPlayers}
            helperTotal={helperTotal}
          />

          {/* みんなのコメント */}
          <section className="space-y-3">
            <h3 className="text-xl font-black text-gray-900 flex items-center gap-2 px-1">
              <MessageCircle className="text-blue-600" size={24} />
              コメント
            </h3>
            <div className="space-y-2">
              {memberComments.length === 0 ? (
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-3">
                  <p className="text-gray-400">コメントはまだありません</p>
                </div>
              ) : (
                memberComments.map((c, i) => (
                  <div
                    key={i}
                    className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-3"
                  >
                    <div
                      className={`w-1 h-full rounded-full ${
                        c.status === "attending"
                          ? "bg-emerald-400"
                          : "bg-orange-400"
                      }`}
                    />
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-black text-gray-800">
                          {c.name}
                        </span>
                        <span className="text-gray-400">{c.time}</span>
                      </div>
                      {c.text && (
                        <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                          {c.text}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </main>
      </PlayerMenu>
    </div>
  );
}
