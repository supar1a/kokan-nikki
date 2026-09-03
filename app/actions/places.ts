"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";

import { normalizePassphrase, shortId } from "@/lib/ids";

export type FormState = { error?: string } | null;

export async function createPlaceAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const passphrase = normalizePassphrase(String(formData.get("passphrase") ?? ""));

  if (name.length < 1 || name.length > 32) {
    return { error: "グループ名は1〜32字で入れてください。" };
  }
  if (passphrase.length < 2 || passphrase.length > 32) {
    return { error: "合言葉は2〜32字で決めてください。" };
  }

  const taken = await prisma.place.findUnique({ where: { passphrase } });
  if (taken) {
    return { error: "その合言葉はもう使われています。別のものにしてください。" };
  }

  const place = await prisma.place.create({
    data: {
      name,
      description: description || null,
      slug: shortId(10),
      passphrase,
      memberships: { create: { userId: user.id, role: "owner" } },
    },
  });

  revalidatePath("/");
  redirect(`/b/${place.slug}`);
}

/**
 * 「ここから未読」の目印のために、見た時刻だけを控える。
 * 誰が読んだかは相手に見せないし、数えもしない。
 */
export async function markAsReadAction(placeId: string) {
  const user = await requireUser();
  await prisma.membership.updateMany({
    where: { userId: user.id, placeId },
    data: { lastReadAt: new Date() },
  });
}

async function requireOwner(placeId: string) {
  const user = await requireUser();
  const membership = await prisma.membership.findUnique({
    where: { userId_placeId: { userId: user.id, placeId } },
  });
  if (!membership || membership.role !== "owner") {
    throw new Error("このグループを管理する権限がありません。");
  }
  return user;
}

/** 合言葉を付け替える。前の合言葉ではもう入れなくなる。 */
export async function changePassphraseAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const placeId = String(formData.get("placeId") ?? "");
  await requireOwner(placeId);

  const passphrase = normalizePassphrase(String(formData.get("passphrase") ?? ""));
  if (passphrase.length < 2 || passphrase.length > 32) {
    return { error: "合言葉は2〜32字で決めてください。" };
  }

  const taken = await prisma.place.findUnique({ where: { passphrase } });
  if (taken && taken.id !== placeId) {
    return { error: "その合言葉はもう使われています。別のものにしてください。" };
  }

  const place = await prisma.place.update({ where: { id: placeId }, data: { passphrase } });
  revalidatePath(`/b/${place.slug}/members`);
  return null;
}

export async function removeMemberAction(formData: FormData) {
  const placeId = String(formData.get("placeId") ?? "");
  const userId = String(formData.get("userId") ?? "");
  await requireOwner(placeId);

  const target = await prisma.membership.findUnique({
    where: { userId_placeId: { userId, placeId } },
    include: { place: true },
  });
  if (!target || target.role === "owner") return;

  await prisma.membership.delete({ where: { id: target.id } });
  revalidatePath(`/b/${target.place.slug}/members`);
}

export async function leavePlaceAction(formData: FormData) {
  const user = await requireUser();
  const placeId = String(formData.get("placeId") ?? "");

  const membership = await prisma.membership.findUnique({
    where: { userId_placeId: { userId: user.id, placeId } },
  });
  if (!membership || membership.role === "owner") redirect("/");

  await prisma.membership.delete({ where: { id: membership.id } });
  revalidatePath("/");
  redirect("/");
}
