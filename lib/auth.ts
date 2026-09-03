import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { prisma } from "./db";

/**
 * アカウントはない。クッキーが、そのまま「その人」を指す。
 *
 * 照合するものが何もないので、なりすましは原理的に防げない。
 * グループの URL を知っている人しか中に入れない、というところだけで守っている。
 */

const COOKIE = "tanzaku";
const SECURE = process.env.NODE_ENV === "production";
// 唯一の身元なので、ブラウザが許す上限いっぱい持たせる
const DAYS = 400;

/** いまのブラウザが名乗っている人。まだ名乗っていなければ null。 */
export const currentUser = cache(async () => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });
  if (!session) return null;
  if (session.expires.getTime() < Date.now()) {
    await prisma.session.deleteMany({ where: { token } });
    return null;
  }
  return session.user;
});

/** 名乗りが要る画面で使う。まだなら、名前をきく入口へ返す。 */
export async function requireUser() {
  const user = await currentUser();
  if (!user) redirect("/");
  return user;
}

/** このブラウザを、その人ということにする。 */
export async function becomeUser(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + DAYS * 24 * 60 * 60 * 1000);

  await prisma.session.create({ data: { token, userId, expires } });
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: SECURE,
    path: "/",
    expires,
  });
}

/** 名前をつけて、はじめる。 */
export async function createAndBecome(name: string) {
  const user = await prisma.user.create({ data: { name } });
  await becomeUser(user.id);
  return user;
}

/** このブラウザの名乗りを外す。 */
export async function forget() {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { token } });
    store.delete(COOKIE);
  }
}
