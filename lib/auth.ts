import Cookies from "js-cookie";

const TOKEN_KEY = process.env.NEXT_PUBLIC_TOKEN_COOKIE_KEY || "loliauth_token";

export function getToken(): string | undefined {
  return Cookies.get(TOKEN_KEY);
}

export function setToken(token: string, expiresInSeconds?: number): void {
  const options: Cookies.CookieAttributes = {
    path: "/",
    sameSite: "lax",
  };
  if (expiresInSeconds) {
    options.expires = expiresInSeconds / 86400; // js-cookie uses days
  }
  Cookies.set(TOKEN_KEY, token, options);
}

export function removeToken(): void {
  Cookies.remove(TOKEN_KEY, { path: "/" });
}
