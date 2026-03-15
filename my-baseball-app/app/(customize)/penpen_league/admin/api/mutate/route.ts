export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getErrorMessage, requirePenpenAdminSession } from "../_shared";

type Primitive = string | number | boolean | null;
type MatchCondition = {
  column: string;
  value: Primitive;
};

type MutateBody = {
  action: "insert" | "upsert" | "update" | "delete" | "ensureUndecidedTeam";
  table?: string;
  rows?: Record<string, Primitive>[];
  values?: Record<string, Primitive>;
  onConflict?: string;
  match?: MatchCondition[];
  returning?: string[];
  single?: boolean;
};

const ALLOWED_TABLES = new Set([
  "leagues",
  "teams",
  "stadiums",
  "rule_blocks",
  "tournaments",
  "settings",
  "schedule_days",
  "scheduled_games",
  "schedule_day_rest_teams",
]);

const COLUMN_NAME_PATTERN = /^[a-z_][a-z0-9_]*$/;

const isPrimitive = (value: unknown): value is Primitive => {
  return (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  );
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
};

const isValidColumnName = (value: string) => COLUMN_NAME_PATTERN.test(value);

const parseMatch = (value: unknown): MatchCondition[] | null => {
  if (!Array.isArray(value)) {
    return null;
  }

  const parsed = value.map((item) => {
    if (!isRecord(item)) {
      return null;
    }

    const column = typeof item.column === "string" ? item.column.trim() : "";
    if (!column || !isValidColumnName(column)) {
      return null;
    }

    const cellValue = item.value;
    if (!isPrimitive(cellValue)) {
      return null;
    }

    return { column, value: cellValue };
  });

  if (parsed.some((item) => item === null)) {
    return null;
  }

  return parsed.filter((item): item is MatchCondition => item !== null);
};

const parseRows = (value: unknown): Record<string, Primitive>[] | null => {
  if (!Array.isArray(value) || value.length === 0) {
    return null;
  }

  const rows = value.map((item) => {
    if (!isRecord(item)) {
      return null;
    }

    const entries = Object.entries(item);
    if (entries.length === 0) {
      return null;
    }

    for (const [key, cellValue] of entries) {
      if (!isValidColumnName(key) || !isPrimitive(cellValue)) {
        return null;
      }
    }

    return Object.fromEntries(entries) as Record<string, Primitive>;
  });

  if (rows.some((row) => row === null)) {
    return null;
  }

  return rows.filter((row): row is Record<string, Primitive> => row !== null);
};

const parseValues = (value: unknown): Record<string, Primitive> | null => {
  if (!isRecord(value)) {
    return null;
  }

  const entries = Object.entries(value);
  if (entries.length === 0) {
    return null;
  }

  for (const [key, cellValue] of entries) {
    if (!isValidColumnName(key) || !isPrimitive(cellValue)) {
      return null;
    }
  }

  return Object.fromEntries(entries) as Record<string, Primitive>;
};

const parseReturning = (value: unknown) => {
  if (value === undefined) {
    return [] as string[];
  }
  if (!Array.isArray(value)) {
    return null;
  }

  const columns = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

  if (columns.length !== value.length) {
    return null;
  }

  if (columns.some((column) => !isValidColumnName(column))) {
    return null;
  }

  return columns;
};

const parseBody = (value: unknown): MutateBody | null => {
  if (!isRecord(value)) {
    return null;
  }

  const action =
    value.action === "insert" ||
    value.action === "upsert" ||
    value.action === "update" ||
    value.action === "delete" ||
    value.action === "ensureUndecidedTeam"
      ? value.action
      : null;

  if (!action) {
    return null;
  }

  if (action === "ensureUndecidedTeam") {
    return { action };
  }

  const table = typeof value.table === "string" ? value.table.trim() : "";
  if (!table || !ALLOWED_TABLES.has(table)) {
    return null;
  }

  const returning = parseReturning(value.returning);
  if (returning === null) {
    return null;
  }

  const single = value.single === true;

  if (action === "insert" || action === "upsert") {
    const rows = parseRows(value.rows);
    if (!rows) {
      return null;
    }

    const onConflict =
      typeof value.onConflict === "string" && value.onConflict.trim().length > 0
        ? value.onConflict.trim()
        : undefined;

    if (onConflict && !isValidColumnName(onConflict)) {
      return null;
    }

    return {
      action,
      table,
      rows,
      onConflict,
      returning,
      single,
    };
  }

  if (action === "update") {
    const values = parseValues(value.values);
    const match = parseMatch(value.match);
    if (!values || !match || match.length === 0) {
      return null;
    }

    return {
      action,
      table,
      values,
      match,
      returning,
      single,
    };
  }

  const match = parseMatch(value.match);
  if (!match || match.length === 0) {
    return null;
  }

  return {
    action,
    table,
    match,
    returning,
    single,
  };
};

const applyMatch = (
  query: ReturnType<ReturnType<typeof createServiceClient>["schema"]>["from"],
  match: MatchCondition[],
) => {
  let next = query;
  for (const condition of match) {
    next = next.eq(condition.column, condition.value);
  }
  return next;
};

const maybeSelect = (
  query: ReturnType<ReturnType<typeof createServiceClient>["schema"]>["from"],
  returning: string[],
) => {
  if (returning.length === 0) {
    return query;
  }

  return query.select(returning.join(","));
};

const ensureUndecidedTeam = async () => {
  const supabase = createServiceClient();
  const penpen = supabase.schema("penpen");

  const { data: existing, error: fetchError } = await penpen
    .from("teams")
    .select("id")
    .eq("name", "未定")
    .maybeSingle();

  if (fetchError) {
    throw fetchError;
  }
  if (existing?.id) {
    return existing.id;
  }

  const { data: created, error: createError } = await penpen
    .from("teams")
    .insert({
      name: "未定",
      is_enabled: false,
      sort_order: 9999,
    })
    .select("id")
    .single();

  if (!createError && created?.id) {
    return created.id;
  }

  const { data: retry, error: retryError } = await penpen
    .from("teams")
    .select("id")
    .eq("name", "未定")
    .maybeSingle();

  if (retryError || !retry?.id) {
    throw (
      createError ?? retryError ?? new Error("未定チームの作成に失敗しました")
    );
  }

  return retry.id;
};

export async function POST(request: NextRequest) {
  const unauthorized = requirePenpenAdminSession(request);
  if (unauthorized) {
    return unauthorized;
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json(
      { message: "不正なリクエストです。" },
      { status: 400 },
    );
  }

  const body = parseBody(rawBody);
  if (!body) {
    return NextResponse.json(
      { message: "送信データが不正です。" },
      { status: 400 },
    );
  }

  try {
    if (body.action === "ensureUndecidedTeam") {
      const teamId = await ensureUndecidedTeam();
      return NextResponse.json({ ok: true, data: { teamId } });
    }

    const supabase = createServiceClient();
    const table = supabase.schema("penpen").from(body.table);

    if (body.action === "insert") {
      const inserting = table.insert(body.rows);
      const selected = maybeSelect(inserting, body.returning ?? []);
      const { data, error } = body.single
        ? await selected.single()
        : await selected;
      if (error) {
        throw error;
      }
      return NextResponse.json({ ok: true, data: data ?? null });
    }

    if (body.action === "upsert") {
      const upserting = table.upsert(body.rows, {
        onConflict: body.onConflict,
      });
      const selected = maybeSelect(upserting, body.returning ?? []);
      const { data, error } = body.single
        ? await selected.single()
        : await selected;
      if (error) {
        throw error;
      }
      return NextResponse.json({ ok: true, data: data ?? null });
    }

    if (body.action === "update") {
      const updating = applyMatch(table.update(body.values), body.match ?? []);
      const selected = maybeSelect(updating, body.returning ?? []);
      const { data, error } = body.single
        ? await selected.single()
        : await selected;
      if (error) {
        throw error;
      }
      return NextResponse.json({ ok: true, data: data ?? null });
    }

    const deleting = applyMatch(table.delete(), body.match ?? []);
    const selected = maybeSelect(deleting, body.returning ?? []);
    const { data, error } = body.single
      ? await selected.single()
      : await selected;
    if (error) {
      throw error;
    }

    return NextResponse.json({ ok: true, data: data ?? null });
  } catch (error) {
    console.error("[penpen admin mutate]", error);
    return NextResponse.json(
      { message: getErrorMessage(error) },
      { status: 500 },
    );
  }
}
