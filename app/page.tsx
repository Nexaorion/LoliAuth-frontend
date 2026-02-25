import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default async function HomePage() {
  const cookieStore = await cookies();
  const tokenKey = process.env.NEXT_PUBLIC_TOKEN_COOKIE_KEY || "auth_token";
  const token = cookieStore.get(tokenKey);
  redirect(token ? "/profile" : "/login");
}