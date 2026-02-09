import { createClient } from "@/lib/supabase/server";
import { Clock, MapPin, ChevronRight, CalendarCheck } from "lucide-react";
import Link from "next/link";
import PlayerMenu from "../components/PlayerMenu";
import { redirect } from "next/navigation";

type ScheduleStatus = "going" | "not_going" | "pending" | "unanswered";

const normalizeStatus = (row: any): ScheduleStatus => {
  const raw = row?.attendance_no;

  if (!raw || raw === "") {
    return "unanswered";
  }

  if (raw === 1) return "going";
  if (raw === 2) return "not_going";
  if (raw === 3) return "pending";
  return "unanswered";
};

const formatDay = (date: Date) =>
  new Intl.DateTimeFormat("ja-JP", { weekday: "short" })
    .format(date)
    .replace("曜", "");

const formatDate = (date: Date) =>
  date.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

const formatTime = (date: Date) =>
  date.toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  });

export default async function AttendancePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/player/login");
  }

  const { data: player } = await supabase
    .from("players")
    .select("id,name,no")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!player) {
    redirect("/player/login");
  }

  const { data: myTeamId } = await supabase.rpc("get_my_team_id");

  const nowIso = new Date().toISOString();

  const { data: games } = await supabase
    .from("games")
    .select("*,leagues(name),grounds(name),vsteams(name)")
    .eq("team_id", myTeamId)
    .is("status", null)
    .gte("start_datetime", nowIso)
    .order("start_datetime", { ascending: true });

  const gameIds = (games || []).map((game) => game.id);

  const scheduleRows = gameIds.length
    ? (await supabase.from("attendance").select("*").in("game_id", gameIds))
        .data
    : [];

  const { data: attendanceStats } = await supabase
    .from("mv_player_yearly_stats")
    .select("attendance_pct")
    .eq("player_id", player.id)
    .eq("team_id", myTeamId)
    .eq("season_year", new Date().getFullYear())
    .maybeSingle();

  const attendanceRateRaw = attendanceStats?.attendance_pct ?? 0;
  const attendanceRate =
    attendanceRateRaw <= 1 ? attendanceRateRaw * 100 : attendanceRateRaw;

  const summary = {
    going: 0,
    not_going: 0,
    pending: 0,
    unanswered: 0,
  } as Record<ScheduleStatus, number>;

  const schedules = games?.map((game) => {
    const eventDate = new Date(game.start_datetime);
    const eventSchedules = (scheduleRows || []).filter(
      (row: any) => row.game_id === game.id,
    );
    const mySchedule = eventSchedules.find(
      (row: any) => row.player_id === player.id,
    );
    const status = normalizeStatus(mySchedule);

    summary[status] += 1;

    const counts = {
      going: 0,
      not_going: 0,
      pending: 0,
      unanswered: 0,
    } as Record<ScheduleStatus, number>;

    eventSchedules.forEach((row: any) => {
      const normalized = normalizeStatus(row);
      counts[normalized] += 1;
    });

    return {
      id: game.id,
      date: formatDate(eventDate),
      day: formatDay(eventDate),
      time: formatTime(eventDate),
      title: game.leagues.name || game.remarks || "練習",
      vsteam: game.vsteams.name || "未定",
      location: game.grounds.name || "会場未定",
      status,
      counts,
    };
  });
  // ステータスバッジ
  const getStatusBadge = (status: string) => {
    const styles = {
      going: "bg-blue-50 text-blue-700 border-blue-200",
      not_going: "bg-slate-50 text-slate-500 border-slate-200",
      pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
      unanswered: "bg-orange-50 text-orange-700 border-orange-200",
    };
    const labels = {
      going: "出席",
      not_going: "欠席",
      pending: "未定",
      unanswered: "未回答",
    };

    return (
      <span
        className={`px-3 py-1 md:px-4 md:py-1.5 rounded-full text-base font-bold border whitespace-nowrap ${styles[status as keyof typeof styles] || styles.unanswered}`}
      >
        {labels[status as keyof typeof labels] || "未回答"}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-900">
      <PlayerMenu no={player.no ?? ""} name={player.name ?? ""}>
        <header className=" justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CalendarCheck size={28} className="text-blue-600" />
            スケジュール
          </h1>
          <p className="text-gray-500 flex">予定の確認と回答</p>
        </header>

        {/* 出欠サマリー：スマホでは2列/3列を自動調整 */}
        <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-slate-200 flex justify-between md:justify-around items-center gap-2">
          <div className="text-center flex-1">
            <p className="text-sm md:text-base text-slate-500 font-medium">
              未回答
            </p>
            <p className="text-2xl md:text-3xl font-black text-orange-600">
              {summary.unanswered}
            </p>
          </div>
          <div className="w-px h-8 bg-slate-100"></div>
          <div className="text-center flex-1">
            <p className="text-sm md:text-base text-slate-500 font-medium">
              出席予定
            </p>
            <p className="text-2xl md:text-3xl font-black text-blue-600">
              {summary.going}
            </p>
          </div>
          <div className="w-px h-8 bg-slate-100"></div>
          <div className="text-center flex-1">
            <p className="text-sm md:text-base text-slate-500 font-medium">
              出席率
            </p>
            <p className="text-2xl md:text-3xl font-black text-slate-800">
              {Math.round(attendanceRate)}%
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg md:text-xl font-bold text-slate-800 flex items-center gap-2 ml-1 mt-3">
            <div className="w-1.5 h-5 bg-blue-600 rounded-full"></div>
            今後の予定
          </h2>

          <div className="space-y-4">
            {(schedules?.length === 0 || !schedules) && (
              <div className="bg-white rounded-2xl p-6 text-center text-slate-500 border border-slate-200">
                今後の予定がありません
              </div>
            )}
            {schedules?.map((event) => {
              const [_, month, day] = event.date.split("/");
              const isSaturday = event.day === "土";
              const isSunday = event.day === "日";

              return (
                <Link
                  href={`/player/schedule/${event.id}`}
                  key={event.id}
                  className="block group"
                >
                  <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-all hover:border-blue-400 relative">
                    <div className="flex items-stretch">
                      {/* 左側：日付 */}
                      <div
                        className={`min-w-25 md:min-w-35 flex flex-col items-center justify-center py-4 border-r border-slate-300 ${isSaturday ? "bg-slate-50" : "bg-white"}`}
                      >
                        {/* 出席バッジ */}
                        <div className="mt-3 scale-90 md:scale-100 mb-2">
                          {getStatusBadge(event.status)}
                        </div>

                        <p className="text-2xl font-bold text-slate-400 leading-none">
                          {month}/{day}
                        </p>
                        <p
                          className={`text-2xl font-black mt-1 ${isSunday ? "text-red-600" : isSaturday ? "text-blue-600" : "text-slate-700"}`}
                        >
                          ({event.day})
                        </p>
                      </div>

                      {/* 右側：メイン情報 */}
                      <div className="flex-1 p-4 md:p-6 flex flex-col justify-center min-w-0 pr-10 md:pr-12">
                        <div className="space-y-1">
                          <h3 className="text-lg md:text-xl font-bold text-slate-500 leading-tight">
                            {event.title}
                          </h3>

                          {event.vsteam && (
                            <p className="text-xl font-black text-blue-600 leading-tight wrap-break-word truncate">
                              <span className="text-lg md:text-xl font-bold text-blue-400 mr-2 italic">
                                vs
                              </span>
                              {event.vsteam}
                            </p>
                          )}
                        </div>

                        {/* 日時・場所 */}
                        <div className="flex flex-wrap gap-x-6 gap-y-1 mt-4 text-slate-600 border-t border-slate-300 pt-3">
                          <div className="flex items-center gap-1.5 text-lg md:text-xl font-medium">
                            <Clock
                              size={22}
                              className="text-slate-400 shrink-0"
                            />
                            {event.time}〜
                          </div>
                          <div className="flex items-center gap-1.5 text-lg md:text-xl font-medium">
                            <MapPin
                              size={22}
                              className="text-slate-400 shrink-0"
                            />
                            {event.location}
                          </div>
                        </div>
                      </div>

                      {/* 矢印 */}
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 group-hover:text-blue-500 transition-colors">
                        <ChevronRight size={32} strokeWidth={3} />
                      </div>
                    </div>

                    {/* 動員状況 */}
                    <div className="bg-slate-50/50 px-5 py-3 border-t border-slate-300 flex flex-wrap gap-x-6 gap-y-1 text-base md:text-lg text-slate-500 font-semibold">
                      <div className="flex gap-2">
                        参加{" "}
                        <span className="text-slate-800 font-black">
                          {event.counts.going}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        欠席{" "}
                        <span className="text-slate-400 font-black">
                          {event.counts.not_going}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        未定{" "}
                        <span className="text-slate-400 font-black">
                          {event.counts.pending}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        未回答{" "}
                        <span className="text-orange-600 font-black">
                          {event.counts.unanswered}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </PlayerMenu>
    </div>
  );
}
