type Primitive = string | number | boolean | null;

type MatchCondition = {
  column: string;
  value: Primitive;
};

type MutatePayload = {
  action: "insert" | "upsert" | "update" | "delete" | "ensureUndecidedTeam";
  table?: string;
  rows?: Record<string, Primitive>[];
  values?: Record<string, Primitive>;
  onConflict?: string;
  match?: MatchCondition[];
  returning?: string[];
  single?: boolean;
};

type ApiError = {
  message?: string;
};

type MutateResponse<T> = {
  ok: boolean;
  data: T;
};

const parseErrorMessage = async (response: Response) => {
  let payload: ApiError | null = null;

  try {
    payload = (await response.json()) as ApiError;
  } catch {
    payload = null;
  }

  if (payload?.message) {
    return payload.message;
  }

  return `HTTP ${response.status}`;
};

export const penpenAdminMutate = async <T = unknown>(
  payload: MutatePayload,
) => {
  const response = await fetch("/penpen_league/admin/api/mutate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  return (await response.json()) as MutateResponse<T>;
};

export const penpenAdminUploadImage = async (file: File, directory: string) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("directory", directory);

  const response = await fetch("/penpen_league/admin/api/storage", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  return (await response.json()) as MutateResponse<{
    path: string;
    publicUrl: string;
  }>;
};

export const penpenAdminRemoveImage = async (
  path: string | null | undefined,
) => {
  const response = await fetch("/penpen_league/admin/api/storage", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ path: path ?? "" }),
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }
};
