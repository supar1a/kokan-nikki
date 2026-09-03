"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { inviteCode, shortId } from "@/lib/ids";

export type FormState = { error?: string } | null;

export async function createNotebookAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (name.length < 1 || name.length > 32) {
    return { error: "ノートの名前は1〜32字で入れてください。" };
  }

  // つくった人が、最初にノートを持つ
  const notebook = await prisma.notebook.create({
    data: {
      name,
      description: description || null,
      slug: shortId(10),
      inviteCode: inviteCode(),
      holderId: user.id,
      memberships: { create: { userId: user.id, role: "owner", order: 0 } },
    },
  });

  revalidatePath("/");
  redirect(`/n/${notebook.slug}`);
}

export async function joinNotebookAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const code = String(formData.get("code") ?? "").trim().toLowerCase();
  if (!code) return { error: "招待コードを入れてください。" };

  const notebook = await prisma.notebook.findUnique({ where: { inviteCode: code } });
  if (!notebook) return { error: "そのコードのノートは見つかりませんでした。" };

  const already = await prisma.membership.findUnique({
    where: { userId_notebookId: { userId: user.id, notebookId: notebook.id } },
  });

  if (!already) {
    const last = await prisma.membership.findFirst({
      where: { notebookId: notebook.id },
      orderBy: { order: "desc" },
      select: { order: true },
    });
    // 回る順のいちばん後ろに入る。heldUntil は null のまま＝まだ何も読めない。
    await prisma.membership.create({
      data: { userId: user.id, notebookId: notebook.id, order: (last?.order ?? -1) + 1 },
    });
  }

  revalidatePath("/");
  redirect(`/n/${notebook.slug}`);
}

/**
 * 渡す。この一手で「公開」が起きる。
 * 書きかけの頁がすべて封じられ、次の人の手にノートが移る。
 */
export async function handOverAction(formData: FormData) {
  const user = await requireUser();
  const notebookId = String(formData.get("notebookId") ?? "");
  const toUserId = String(formData.get("toUserId") ?? "");

  const notebook = await prisma.notebook.findUnique({ where: { id: notebookId } });
  if (!notebook) return;
  if (notebook.holderId !== user.id) {
    throw new Error("いまノートを持っているのはあなたではありません。");
  }
  if (toUserId === user.id) return;

  const to = await prisma.membership.findUnique({
    where: { userId_notebookId: { userId: toUserId, notebookId } },
  });
  if (!to) throw new Error("その人はこのノートの仲間ではありません。");

  const now = new Date();
  await prisma.$transaction([
    // 書きかけの頁を封じる（封じられていない頁は、いまの持ち主のものだけ）
    prisma.page.updateMany({
      where: { notebookId, sealedAt: null },
      data: { sealedAt: now },
    }),
    // 「ここまで見た」を刻んでから手放す
    prisma.membership.update({
      where: { userId_notebookId: { userId: user.id, notebookId } },
      data: { heldUntil: now },
    }),
    prisma.notebook.update({ where: { id: notebookId }, data: { holderId: toUserId } }),
  ]);

  revalidatePath("/");
  revalidatePath(`/n/${notebook.slug}`);
  redirect(`/n/${notebook.slug}`);
}

async function requireOwner(notebookId: string) {
  const user = await requireUser();
  const membership = await prisma.membership.findUnique({
    where: { userId_notebookId: { userId: user.id, notebookId } },
  });
  if (!membership || membership.role !== "owner") {
    throw new Error("このノートを差配する権限がありません。");
  }
  return user;
}

export async function regenerateInviteAction(formData: FormData) {
  const notebookId = String(formData.get("notebookId") ?? "");
  await requireOwner(notebookId);
  const notebook = await prisma.notebook.update({
    where: { id: notebookId },
    data: { inviteCode: inviteCode() },
  });
  revalidatePath(`/n/${notebook.slug}/nakama`);
}

export async function removeMemberAction(formData: FormData) {
  const notebookId = String(formData.get("notebookId") ?? "");
  const userId = String(formData.get("userId") ?? "");
  await requireOwner(notebookId);

  const target = await prisma.membership.findUnique({
    where: { userId_notebookId: { userId, notebookId } },
    include: { notebook: true },
  });
  if (!target || target.role === "owner") return;
  // ノートを持ったまま出ていかれると、回りが止まる
  if (target.notebook.holderId === userId) {
    throw new Error("いまノートを持っている人は外せません。先に渡してもらってください。");
  }

  await prisma.membership.delete({ where: { id: target.id } });
  revalidatePath(`/n/${target.notebook.slug}/nakama`);
}

export async function leaveNotebookAction(formData: FormData) {
  const user = await requireUser();
  const notebookId = String(formData.get("notebookId") ?? "");

  const membership = await prisma.membership.findUnique({
    where: { userId_notebookId: { userId: user.id, notebookId } },
    include: { notebook: true },
  });
  if (!membership) redirect("/");
  if (membership.role === "owner") redirect("/");
  if (membership.notebook.holderId === user.id) {
    throw new Error("ノートを持ったままでは抜けられません。先に誰かに渡してください。");
  }

  await prisma.membership.delete({ where: { id: membership.id } });
  revalidatePath("/");
  redirect("/");
}
