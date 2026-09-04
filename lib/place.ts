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
 * ひらいたときは、いつも左端（いちばん新しいところ）に立つ。
 */

/**
 * 「ここから未読」の目印を挟む位置。短冊は古い順に並んでいる前提。
 *
 * 新しく書かれた分がなければ -1（目印を出さない）。
 * はじめて来た人にも出さない。全部が新しいときに境目を引いても意味がないので。
 */
export function unreadMarkAt(
  slips: Pick<Slip, "createdAt">[],
  lastReadAt: Date | null,
) {
  if (!lastReadAt || slips.length === 0) return -1;
  const boundary = slips.findIndex((slip) => slip.createdAt > lastReadAt);
  return boundary > 0 ? boundary : -1;
}
