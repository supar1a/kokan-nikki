import { notFound } from "next/navigation";
import { prisma } from "./db";
import { requireUser } from "./auth";

const AUTHOR = { select: { id: true, name: true } } as const;

/** グループはメンバーだけのもの。外の人には、あることすら伏せる。 */
export async function requirePlace(slug: string) {
  const user = await requireUser();

  const place = await prisma.place.findUnique({ where: { slug } });
  if (!place) notFound();

  const membership = await prisma.membership.findUnique({
    where: { userId_placeId: { userId: user.id, placeId: place.id } },
  });
  if (!membership) notFound();

  return { user, place, membership };
}

/**
 * 読める短冊を、古い順に（縦組みでは右から左へ流れる向き）。
 * 下書きは、書いた本人にだけ見える。
 */
export async function readableSlips(
  placeId: string,
  userId: string,
  options: { authorId?: string } = {},
) {
  return prisma.slip.findMany({
    where: {
      placeId,
      ...(options.authorId ? { authorId: options.authorId } : {}),
      OR: [{ published: true }, { authorId: userId }],
    },
    include: { author: AUTHOR },
    orderBy: { createdAt: "asc" },
  });
}

export async function requireReadableSlip(slipId: string) {
  const user = await requireUser();

  const slip = await prisma.slip.findUnique({
    where: { id: slipId },
    include: { author: AUTHOR, place: true },
  });
  if (!slip) notFound();

  const membership = await prisma.membership.findUnique({
    where: { userId_placeId: { userId: user.id, placeId: slip.placeId } },
  });
  if (!membership) notFound();

  const isAuthor = slip.authorId === user.id;
  if (!slip.published && !isAuthor) notFound();

  return { user, slip, membership, isAuthor };
}
