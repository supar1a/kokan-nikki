/** 一覧に出す抜粋。改行は「一字あけ」に潰して縦の列を整える。 */
export function excerpt(body: string, max = 110) {
  const flat = body.replace(/\s*\n+\s*/g, "　").trim();
  return flat.length > max ? flat.slice(0, max) + "…" : flat;
}

/** 本文の段落分け（空行区切り） */
export function paragraphs(body: string) {
  return body
    .split(/\n{2,}/)
    .map((p) => p.replace(/\n/g, "\n").trim())
    .filter(Boolean);
}

export function countChars(body: string) {
  return [...body.replace(/\s/g, "")].length;
}
