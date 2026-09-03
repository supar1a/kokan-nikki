import { randomBytes, randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { auth } from "@/auth";
import { prisma } from "./db";

const SECURE = process.env.NODE_ENV === "production";

/** Auth.js が見にいくクッキー。https のときは接頭辞が付く。 */
export const SESSION_COOKIE = SECURE
  ? "__Secure-authjs.session-token"
  : "authjs.session-token";

const SESSION_DAYS = 30;

/**
 * Auth.js の database 方式に合わせて、セッションを一つ立てる。
 * クッキーの中身だけ返すので、呼ぶ側が応答に載せる。
 */
export async function issueSession(userId: string) {
  const sessionToken = randomUUID();
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await prisma.session.create({ data: { sessionToken, userId, expires } });

  return {
    name: SESSION_COOKIE,
    value: sessionToken,
    options: {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: SECURE,
      path: "/",
      expires,
    },
  };
}

/** server action の中から、そのまま入ってもらう */
export async function startSession(userId: string) {
  const cookie = await issueSession(userId);
  (await cookies()).set(cookie.name, cookie.value, cookie.options);
}

/** 戻り口の合鍵。長くて当てられない文字列。 */
export function newPassKey() {
  return randomBytes(24).toString("base64url");
}

/** いま名乗っている人。名をまだ決めていなくても返す。 */
export const getCurrentUser = cache(async () => {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;
  return prisma.user.findUnique({ where: { id } });
});

/** 戸を通っただけの人。名を決める画面だけがこれを使う。 */
export async function requireSignedIn() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** 名乗りを求める。メールのリンクで来た人は名がまだないので、先に決めてもらう。 */
export async function requireUser() {
  const user = await requireSignedIn();
  const { name } = user;
  if (!name) redirect("/namae");
  return { ...user, name };
}
