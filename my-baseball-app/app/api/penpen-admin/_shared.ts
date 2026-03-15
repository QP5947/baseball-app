import { compare, hash } from "bcryptjs";
import { NextRequest } from "next/server";

export const PENPEN_ADMIN_COOKIE = "penpen_admin_session";

const BCRYPT_HASH_PATTERN = /^\$2[aby]\$\d{2}\$/;

export const getPenpenAdminCookieOptions = (maxAge: number) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/penpen_league/admin",
  maxAge,
});

export const hasPenpenAdminSession = (request: NextRequest) => {
  return request.cookies.get(PENPEN_ADMIN_COOKIE)?.value === "1";
};

export const isPenpenPasswordHash = (password: string) => {
  return BCRYPT_HASH_PATTERN.test(password);
};

export const hashPenpenPassword = async (password: string) => {
  return hash(password, 12);
};

export const verifyPenpenPassword = async (
  inputPassword: string,
  savedPassword: string,
) => {
  if (!savedPassword) {
    return true;
  }

  if (isPenpenPasswordHash(savedPassword)) {
    return compare(inputPassword, savedPassword);
  }

  return inputPassword === savedPassword;
};
