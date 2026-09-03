import { randomBytes } from "node:crypto";

// 紛らわしい文字（0/O, 1/I/l）を除いた読み上げやすい字種
const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

export function shortId(length = 10) {
  const bytes = randomBytes(length);
  let out = "";
  for (const b of bytes) out += ALPHABET[b % ALPHABET.length];
  return out;
}

/** 招待コード（口頭でも渡せる形）: kmp4-t7xz */
export function inviteCode() {
  return `${shortId(4)}-${shortId(4)}`;
}
