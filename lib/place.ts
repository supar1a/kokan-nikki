import type { Slip } from "@prisma/client";

/**
 * 場の約束ごと。
 *
 * ・手番はない。誰でも、いつでも書ける。
 * ・宛先はない。誰かに返事をする必要もない。
 * ・書いたらそのまま場に出る。あとから引っこめることはできる。
 * ・いいね・既読・閲覧数は持たない。数えないことが、この場の性格そのもの。
 */

/**
 * 「前に来たあと」の目印を挟む位置。短冊は新しい順に並んでいる前提。
 *
 * 新しく書かれた分がなければ -1（目印を出さない）。
 * はじめて来た人にも出さない。全部が新しいときに境目を引いても意味がないので。
 */
export function markerAt(
  slips: Pick<Slip, "createdAt">[],
  lastReadAt: Date | null,
) {
  if (!lastReadAt || slips.length === 0) return -1;
  const boundary = slips.findIndex((slip) => slip.createdAt <= lastReadAt);
  return boundary > 0 ? boundary : -1;
}
