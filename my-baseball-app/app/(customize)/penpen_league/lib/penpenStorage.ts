import type { SupabaseClient } from "@supabase/supabase-js";

export const PENPEN_STORAGE_BUCKET = "penpen-assets";
export const PENPEN_DEFAULT_HEADER_IMAGE = "/league.jpg";

const hasExternalPrefix = (value: string) =>
  value.startsWith("http://") ||
  value.startsWith("https://") ||
  value.startsWith("data:") ||
  value.startsWith("blob:") ||
  value.startsWith("/");

export const isPenpenStoragePath = (value: string | null | undefined) => {
  const trimmed = value?.trim();
  if (!trimmed) return false;
  return !hasExternalPrefix(trimmed);
};

export const resolvePenpenImageUrl = (
  supabase: SupabaseClient,
  rawPathOrUrl: string | null | undefined,
  fallback = "",
) => {
  const value = rawPathOrUrl?.trim() ?? "";
  if (!value) {
    return fallback;
  }

  if (!isPenpenStoragePath(value)) {
    return value;
  }

  const { data } = supabase.storage
    .from(PENPEN_STORAGE_BUCKET)
    .getPublicUrl(value);
  return data.publicUrl || fallback;
};

const sanitizeFileName = (fileName: string) =>
  fileName.replace(/[^a-zA-Z0-9._-]/g, "_");

const createStoragePath = (directory: string, fileName: string) => {
  const now = Date.now();
  const random =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);

  return `${directory}/${now}-${random}-${sanitizeFileName(fileName)}`;
};

export const uploadPenpenImage = async (
  supabase: SupabaseClient,
  file: File,
  directory: string,
) => {
  const path = createStoragePath(directory, file.name || "image");

  const { error } = await supabase.storage
    .from(PENPEN_STORAGE_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: true,
      contentType: file.type || undefined,
    });

  if (error) {
    throw error;
  }

  const publicUrl = resolvePenpenImageUrl(supabase, path);
  return { path, publicUrl };
};

export const removePenpenImageIfStored = async (
  supabase: SupabaseClient,
  pathOrUrl: string | null | undefined,
) => {
  if (!isPenpenStoragePath(pathOrUrl)) {
    return;
  }

  const targetPath = pathOrUrl?.trim();
  if (!targetPath) {
    return;
  }

  await supabase.storage.from(PENPEN_STORAGE_BUCKET).remove([targetPath]);
};

export const fetchPenpenHeaderImageUrl = async (supabase: SupabaseClient) => {
  const { data, error } = await supabase
    .schema("penpen")
    .from("settings")
    .select("header_image_url")
    .eq("id", true)
    .maybeSingle();

  if (error) {
    return PENPEN_DEFAULT_HEADER_IMAGE;
  }

  return resolvePenpenImageUrl(
    supabase,
    data?.header_image_url,
    PENPEN_DEFAULT_HEADER_IMAGE,
  );
};
