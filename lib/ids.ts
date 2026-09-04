import { randomBytes } from "node:crypto";

// 紛らわしい文字（0/O, 1/I/l）を除いた読み上げやすい字種
const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

/**
 * 招待 URL の中身。
 *
 * グループに入るための鍵はこれ一本きりなので、当てられない長さにしてある
 * （31 種 × 14 字 ≒ 2^69 通り）。打ち込むものではなく、渡すものなので長くてよい。
 */
export function shortId(length = 14) {
  const bytes = randomBytes(length);
  let out = "";
  for (const b of bytes) out += ALPHABET[b % ALPHABET.length];
  return out;
}
