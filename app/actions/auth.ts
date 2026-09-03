"use server";

import { randomUUID } from "node:crypto";
import { AuthError } from "next-auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/db";
import { requireSignedIn } from "@/lib/auth";

export type FormState = { error?: string } | null;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function googleSignInAction() {
  await signIn("google", { redirectTo: "/" });
}

export async function mailSignInAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return { error: "メールの宛先を確かめてください。" };
  }

  // redirect: false にして、Auth.js の /api/auth/verify-request を経由させない。
  // 経由すると Server Action からの遷移で、その API の道筋が住所欄に残ってしまう。
  try {
    await signIn("mail", { email, redirect: false, redirectTo: "/" });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "うまく送れませんでした。少し置いて、もう一度。" };
    }
    throw error;
  }

  redirect(`/login/todoita?to=${encodeURIComponent(email)}`);
}

export async function signOutAction() {
  await signOut({ redirectTo: "/login" });
}

/** 最初に一度だけ、綴じのなかで呼ばれる名を決める。 */
export async function setNameAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireSignedIn();
  const name = String(formData.get("name") ?? "").trim();

  if (name.length < 1 || name.length > 24) {
    return { error: "名前は1〜24字で入れてください。" };
  }

  await prisma.user.update({ where: { id: user.id }, data: { name } });
  redirect("/");
}

/**
 * 開発用の抜け道。メールのリンクを踏まずに、その人としてそのまま入る。
 *
 * Auth.js の database 方式に合わせて、Session の行を立てて同じ名前のクッキーを置くだけ。
 * 本番では画面にも出さないし、呼ばれても弾く。
 */
export async function debugSignInAction(formData: FormData) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("この抜け道は開発中しか使えません。");
  }

  const userId = String(formData.get("userId") ?? "");
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("その人はいません。");

  const sessionToken = randomUUID();
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await prisma.session.create({ data: { sessionToken, userId: user.id, expires } });

  const store = await cookies();
  // 本番は __Secure- が付くが、ここは開発中しか通らない
  store.set("authjs.session-token", sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires,
  });

  redirect(user.name ? "/" : "/namae");
}
