import { randomBytes } from "node:crypto";

// 紛らわしい文字（0/O, 1/I/l）を除いた読み上げやすい字種
const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

export function shortId(length = 10) {
  const bytes = randomBytes(length);
  let out = "";
  for (const b of bytes) out += ALPHABET[b % ALPHABET.length];
  return out;
}

// 合言葉の下敷き。口に出して言える、覚えていられる言葉であること。
const FIRST = [
  "あかい", "あおい", "しろい", "くろい", "みどりの", "きいろい",
  "ちいさな", "おおきな", "しずかな", "あたたかい", "つめたい", "とおい",
  "あさの", "よるの", "ゆうがたの", "まふゆの", "まなつの", "あめの",
];
const SECOND = [
  "とり", "つき", "かわ", "もり", "うみ", "やま",
  "ねこ", "こま", "かさ", "ふね", "まど", "こえ",
  "たより", "みち", "ひかり", "かぜ", "ゆき", "はな",
];

/** 「あかいとり」のような、言って渡せる合言葉をひとつ見繕う。 */
export function suggestPassphrase() {
  const pick = <T,>(list: T[]) => list[randomBytes(1)[0] % list.length];
  return `${pick(FIRST)}${pick(SECOND)}`;
}

/** 合言葉の照合は、英字の大小だけ吸収する。 */
export function normalizePassphrase(value: string) {
  return value.trim().toLowerCase();
}
