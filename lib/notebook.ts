import type { Membership, Page } from "@prisma/client";

/**
 * 一冊のノートを回す、という約束ごと。
 *
 * ・ノートは常に一人の手元にしかない。持っている人だけが書ける。
 * ・渡すと、それまでに書いた頁が封じられる。封じられた頁はもう直せない。
 * ・読めるのは「自分に回ってきたときに見えていたところまで」。
 *   手元にあるあいだは、全部読める。
 */

/** 手元にあるか */
export function isHolder(notebook: { holderId: string | null }, userId: string) {
  return notebook.holderId === userId;
}

/**
 * 手元にないときに読んでよい頁の条件。
 * 一度も回ってきていない人には、まだ何も見えない。
 */
export function sealedUpTo(membership: Pick<Membership, "heldUntil">) {
  return membership.heldUntil;
}

/** 回る順で、いまの持ち主の次にあたる人 */
export function nextInTurn<T extends Pick<Membership, "userId" | "order">>(
  memberships: T[],
  holderId: string | null,
): T | null {
  if (memberships.length === 0) return null;
  const ring = [...memberships].sort((a, b) => a.order - b.order);
  const here = ring.findIndex((m) => m.userId === holderId);
  if (here < 0) return ring[0];
  return ring[(here + 1) % ring.length];
}

/**
 * 栞を挟む位置。前に手放して以降に書かれた頁の、いちばん最初。
 * 新しく回ってきた分がなければ -1。
 */
export function shioriAt(
  pages: Pick<Page, "sealedAt">[],
  heldUntil: Date | null,
) {
  if (pages.length === 0) return -1;
  if (!heldUntil) return 0; // はじめて回ってきた。全部が新しい。
  return pages.findIndex((page) => !page.sealedAt || page.sealedAt > heldUntil);
}
