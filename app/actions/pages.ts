"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export type FormState = { error?: string } | null;

/** 書けるのは、いまノートを持っている人だけ。 */
async function requireHolder(notebookId: string) {
  const user = await requireUser();
  const notebook = await prisma.notebook.findUnique({ where: { id: notebookId } });
  if (!notebook) throw new Error("そのノートはありません。");
  if (notebook.holderId !== user.id) {
    throw new Error("いまノートはあなたの手元にありません。");
  }
  return { user, notebook };
}

export async function writePageAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const notebookId = String(formData.get("notebookId") ?? "");
  const { user, notebook } = await requireHolder(notebookId);

  const body = String(formData.get("body") ?? "").trim();
  if (!body) return { error: "まだ何も書かれていません。" };

  await prisma.page.create({ data: { notebookId, authorId: user.id, body } });

  revalidatePath(`/n/${notebook.slug}`);
  redirect(`/n/${notebook.slug}`);
}

/** 直せるのは、まだ封じられていない自分の頁だけ。 */
async function requireOwnUnsealed(pageId: string) {
  const user = await requireUser();
  const page = await prisma.page.findUnique({
    where: { id: pageId },
    include: { notebook: true },
  });
  if (!page) throw new Error("その頁はありません。");
  if (page.authorId !== user.id) throw new Error("その頁はあなたのものではありません。");
  if (page.sealedAt) throw new Error("渡したあとの頁は、もう直せません。");
  if (page.notebook.holderId !== user.id) {
    throw new Error("いまノートはあなたの手元にありません。");
  }
  return { user, page };
}

export async function savePageAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const pageId = String(formData.get("pageId") ?? "");
  const { page } = await requireOwnUnsealed(pageId);

  const body = String(formData.get("body") ?? "").trim();
  if (!body) return { error: "まだ何も書かれていません。" };

  await prisma.page.update({ where: { id: pageId }, data: { body } });

  revalidatePath(`/n/${page.notebook.slug}`);
  revalidatePath(`/p/${pageId}`);
  redirect(`/p/${pageId}`);
}

export async function deletePageAction(formData: FormData) {
  const pageId = String(formData.get("pageId") ?? "");
  const { page } = await requireOwnUnsealed(pageId);

  await prisma.page.delete({ where: { id: pageId } });

  revalidatePath(`/n/${page.notebook.slug}`);
  redirect(`/n/${page.notebook.slug}`);
}
