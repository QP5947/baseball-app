"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function saveScheduleAttendance({
  gameId,
  playerId,
  status,
  helperCount,
  comment,
}: {
  gameId: string;
  playerId: string;
  status: "attending" | "absent" | "pending";
  helperCount: number;
  comment: string;
}) {
  const supabase = await createClient();

  const { data: player, error: playerError } = await supabase
    .from("players")
    .select("team_id")
    .eq("id", playerId)
    .maybeSingle();

  if (playerError) throw new Error(playerError.message);
  if (!player) throw new Error("player not found");

  const attendanceNo = status === "attending" ? 1 : status === "absent" ? 2 : 3;

  const { error } = await supabase.from("attendance" as any).upsert({
    team_id: player.team_id,
    game_id: gameId,
    player_id: playerId,
    attendance_no: attendanceNo,
    helper_count: helperCount,
    comment: comment,
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/player/schedule/${gameId}`);
  revalidatePath("/player/schedule");
}
