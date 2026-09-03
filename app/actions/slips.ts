"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export type FormState = { error?: string } | null;

async function requireMember(placeId: string) {
  const user = await requireUser();
  const membership = await prisma.membership.findUnique({
    where: { userId_placeId: { userId: user.id, placeId } },
  });
  if (!membership) throw new Error("このグループのメンバーではありません。");
  return user;
}

/** 自分の短冊は、いつでも編集・削除できる。 */
async function requireOwnSlip(slipId: string) {
  const user = await requireUser();
  const slip = await prisma.slip.findUnique({
    where: { id: slipId },
    include: { place: true },
  });
  if (!slip) throw new Error("その短冊はありません。");
  if (slip.authorId !== user.id) throw new Error("その短冊はあなたのものではありません。");
  return { user, slip };
}

export async function writeSlipAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const placeId = String(formData.get("placeId") ?? "");
  const user = await requireMember(placeId);

  const body = String(formData.get("body") ?? "").trim();
  if (!body) return { error: "まだ何も書かれていません。" };

  const place = await prisma.place.findUnique({ where: { id: placeId } });
  if (!place) throw new Error("そのグループはありません。");

  const published = formData.get("intent") !== "draft";
  const slip = await prisma.slip.create({
    data: { placeId, authorId: user.id, body, published },
  });

  revalidatePath(`/b/${place.slug}`);
  redirect(published ? `/b/${place.slug}` : `/s/${slip.id}`);
}

export async function saveSlipAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const slipId = String(formData.get("slipId") ?? "");
  const { slip } = await requireOwnSlip(slipId);

  const body = String(formData.get("body") ?? "").trim();
  if (!body) return { error: "まだ何も書かれていません。" };

  const published = formData.get("intent") === "draft" ? false : slip.published;
  await prisma.slip.update({ where: { id: slipId }, data: { body, published } });

  revalidatePath(`/b/${slip.place.slug}`);
  revalidatePath(`/s/${slipId}`);
  redirect(`/s/${slipId}`);
}

/** 公開する／下書きに戻す。 */
export async function setPublishedAction(formData: FormData) {
  const slipId = String(formData.get("slipId") ?? "");
  const published = formData.get("published") === "true";
  const { slip } = await requireOwnSlip(slipId);

  await prisma.slip.update({ where: { id: slipId }, data: { published } });

  revalidatePath(`/b/${slip.place.slug}`);
  revalidatePath(`/s/${slipId}`);
}

export async function deleteSlipAction(formData: FormData) {
  const slipId = String(formData.get("slipId") ?? "");
  const { slip } = await requireOwnSlip(slipId);

  await prisma.slip.delete({ where: { id: slipId } });

  revalidatePath(`/b/${slip.place.slug}`);
  redirect(`/b/${slip.place.slug}`);
}
