import type { Slip } from "@prisma/client";

/**
 * 場の約束ごと。
 *
 * ・手番はない。誰でも、いつでも書ける。
 * ・宛先はない。誰かに返事をする必要もない。
 * ・いいね・既読・閲覧数は持たない。数えないことが、この場の性格そのもの。
 *
 * 並びは古いものから新しいものへ。縦組みでは、それが右から左へ流れることになる。
 * 一枚の中で後の文字ほど左にあるのと、向きが揃う。巻物も右端から書き始める。
 * 「開いてすぐ新着に届く」ほうは、並びではなく着地点で引き受ける。
 */

export type Landing =
  /** はじめから（右端）。既定なので、何もしなくてよい */
  | { at: -1; land: "start" }
  /** いちばん新しいところ（左端）。新しく書かれた分がないとき */
  | { at: -1; land: "end" }
  /** 前に見たところ。ここから左が、まだ読んでいない分 */
  | { at: number; land: "mark" };

/**
 * 目印を挟む位置と、開いたときに立つ場所。短冊は古い順に並んでいる前提。
 */
export function readingMark(
  slips: Pick<Slip, "createdAt">[],
  lastReadAt: Date | null,
): Landing {
  if (slips.length === 0) return { at: -1, land: "start" };
  // はじめて来た人は、はじめから読む
  if (!lastReadAt) return { at: -1, land: "start" };

  const boundary = slips.findIndex((slip) => slip.createdAt > lastReadAt);
  // 新しく書かれた分がない
  if (boundary < 0) return { at: -1, land: "end" };
  // 全部が新しい。境目を引く先がないので、はじめから
  if (boundary === 0) return { at: -1, land: "start" };

  return { at: boundary, land: "mark" };
}
