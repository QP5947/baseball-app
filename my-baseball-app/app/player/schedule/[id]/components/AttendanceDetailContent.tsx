"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { LoadingIndicator } from "@/components/LoadingSkeleton";
import { createClient } from "@/lib/supabase/client";
import AttendanceDetailClient from "./AttendanceDetailClient";
import toast from "react-hot-toast";

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

interface MemberComment {
  name: string;
  status: "attending" | "absent" | "pending";
  text: string;
  helperCount: number;
  time: string;
}

interface PlayerInfo {
  id: string;
  name: string;
  no: string;
  helperCount: number;
  comment: string;
}

export default function AttendanceDetailContent({
  gameId,
}: {
  gameId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [playerId, setPlayerId] = useState<string>("");
  const [playerNo, setPlayerNo] = useState<string>("");
  const [playerName, setPlayerName] = useState<string>("");
  const [myStatus, setMyStatus] = useState<
    "attending" | "absent" | "pending" | null
  >(null);
  const [myHelpers, setMyHelpers] = useState(0);
  const [myComment, setMyComment] = useState("");
  const [attendedPlayers, setAttendedPlayers] = useState<PlayerInfo[]>([]);
  const [absentPlayers, setAbsentPlayers] = useState<
    { id: string; name: string }[]
  >([]);
  const [pendingPlayers, setPendingPlayers] = useState<
    { id: string; name: string }[]
  >([]);
  const [unansweredPlayers, setUnansweredPlayers] = useState<
    { id: string; name: string }[]
  >([]);
  const [helperTotal, setHelperTotal] = useState(0);
  const [memberComments, setMemberComments] = useState<MemberComment[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/player/login");
        return;
      }

      const { data: player } = await supabase
        .from("players")
        .select("id,name,no,team_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!player) {
        router.push("/player/login");
        return;
      }

      setPlayerId(player.id);
      setPlayerNo(player.no ?? "");
      setPlayerName(player.name ?? "");

      // 試合情報を取得
      const { data: game } = await supabase
        .from("games")
        .select("*,leagues(name),grounds(name),vsteams(name)")
        .eq("team_id", player.team_id)
        .eq("id", gameId)
        .maybeSingle();

      if (!game) {
        setLoading(false);
        setPlayerId(""); // これで下の描画でToastRedirectを返す
        return;
      }

      // 出欠情報を取得
      const { data: schedules } = await supabase
        .from("attendance")
        .select("*")
        .eq("team_id", player.team_id)
        .eq("game_id", gameId);

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
      const helperTotalCount = (schedules || []).reduce(
        (sum: number, s: any) => sum + (s.helper_count || 0),
        0,
      );
      setHelperTotal(helperTotalCount);

      const mySchedule = (schedules || []).find(
        (s: any) => s.player_id === player.id,
      );

      if (mySchedule) {
        setMyStatus(normalizeStatus(mySchedule));
        setMyHelpers(mySchedule.helper_count || 0);
        setMyComment(mySchedule.comment || "");
      }

      // コメント取得（コメントがあるか、助っ人数が1以上の場合）
      const scheduleWithComments = (schedules || []).filter(
        (s: any) => s.comment && s.comment.trim(),
      );
      const comments = scheduleWithComments.map((s: any) => {
        const p = (allPlayers || []).find((pl: any) => pl.id === s.player_id);
        return {
          name: p?.name || "不明",
          status: normalizeStatus(s),
          text: s.comment,
          helperCount: s.helper_count || 0,
          time: getRelativeTime(new Date(s.created_at)),
        };
      });
      setMemberComments(comments);

      // プレイヤー分類
      const scheduleByPlayer = new Map(
        (schedules || []).map((s: any) => [s.player_id, s]),
      );

      const attended = (allPlayers || [])
        .filter((p: any) => {
          const s = scheduleByPlayer.get(p.id);
          return s && normalizeStatus(s) === "attending";
        })
        .map((p: any) => {
          const s = scheduleByPlayer.get(p.id);
          return {
            id: p.id,
            name: p.name,
            no: p.no,
            helperCount: s?.helper_count || 0,
            comment: s?.comment || "",
          };
        });
      setAttendedPlayers(attended);

      const absent_list = (allPlayers || [])
        .filter((p: any) => {
          const s = scheduleByPlayer.get(p.id);
          return s && normalizeStatus(s) === "absent";
        })
        .map((p: any) => ({ id: p.id, name: p.name }));
      setAbsentPlayers(absent_list);

      const pending_list = (allPlayers || [])
        .filter((p: any) => {
          const s = scheduleByPlayer.get(p.id);
          return s && normalizeStatus(s) === "pending";
        })
        .map((p: any) => ({ id: p.id, name: p.name }));
      setPendingPlayers(pending_list);

      const unanswered = (allPlayers || [])
        .filter((p: any) => !scheduleByPlayer.has(p.id))
        .map((p: any) => ({ id: p.id, name: p.name }));
      setUnansweredPlayers(unanswered);
    } catch (error) {
      console.error("Error loading attendance data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div>
        <header className="flex items-center gap-4 mb-4">
          <Link href="/player/schedule/" className="text-gray-600 p-1">
            <ChevronLeft size={24} />
          </Link>
          <h1 className="font-black text-2xl text-gray-900">出欠回答</h1>
        </header>
        <LoadingIndicator />
      </div>
    );
  }

  // 試合が見つからなかった場合
  if (!playerId) {
    const ToastRedirect = require("@/components/ToastRedirect").default;
    return (
      <ToastRedirect
        message="試合が見つかりません"
        redirectPath="/player/schedule"
      />
    );
  }

  return (
    <div>
      <header className="flex items-center gap-4 mb-4">
        <Link href="/player/schedule/" className="text-gray-600 p-1">
          <ChevronLeft size={24} />
        </Link>
        <h1 className="font-black text-2xl text-gray-900">出欠回答</h1>
      </header>

      <main className="max-w-5xl mx-auto space-y-6">
        {/* すべてのロジックとUIをClient側に集約 */}
        <AttendanceDetailClient
          gameId={gameId}
          playerId={playerId}
          initialStatus={myStatus}
          initialHelpers={myHelpers}
          initialComment={myComment}
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
                      <span className="font-black text-gray-800">{c.name}</span>
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
    </div>
  );
}
