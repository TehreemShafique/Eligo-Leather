import Cookies from "js-cookie";
import { api, getApiErrorMessage } from "@/lib/api-client";
import { AUTH_COOKIE_MAX_AGE, COOKIE_KEYS } from "@/lib/constants";
import type { components } from "@/types/api-types";

type Token = components["schemas"]["Token"];
type UserOut = components["schemas"]["User_out"];
type LoginRequest = components["schemas"]["LoginRequest"];
type UserCreate = components["schemas"]["UserCreate"];

const COOKIE = COOKIE_KEYS.auth;
const COOKIE_OPTIONS: Cookies.CookieAttributes = {
  expires: AUTH_COOKIE_MAX_AGE / (60 * 60 * 24),
  path: "/",
  sameSite: "lax",
};

export const authStorage = {
  getToken(): string | null {
    if (typeof window === "undefined") return null;
    return Cookies.get(COOKIE) ?? null;
  },
  setToken(token: string) {
    if (typeof window === "undefined") return;
    Cookies.set(COOKIE, token, COOKIE_OPTIONS);
  },
  clear() {
    if (typeof window === "undefined") return;
    Cookies.remove(COOKIE, { path: "/" });
  },
};

export const authApi = {
  async login(input: LoginRequest): Promise<Token> {
    const token = await api.post<Token, LoginRequest>("/auth/login", input, { auth: false });
    authStorage.setToken(token.access_token);
    return token;
  },

  async register(input: UserCreate): Promise<UserOut> {
    return api.post<UserOut, UserCreate>("/auth/register", input, { auth: false });
  },

  async me(): Promise<UserOut> {
    return api.get<UserOut>("/auth/me");
  },

  logout() {
    authStorage.clear();
  },
};

export function getAuthErrorMessage(error: unknown): string {
  return getApiErrorMessage(error);
}
