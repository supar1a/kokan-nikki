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

/**
 * 写真を置く場所の印。
 *
 * 本文のただの文字として持つ。そうすれば、書いたあとで位置を動かすのも
 * 切り貼りでできるし、書きかけの見た目のまま扱える。
 */
export const PHOTO_MARK = "［写真］";
const PHOTO_MARK_RE = /［写真］|\[写真\]/;

export function hasPhotoMark(body: string) {
  return PHOTO_MARK_RE.test(body);
}

/**
 * 印のあるところで本文を二つに割る。
 * 印が無ければ、写真は本文より前に置く（印を持たない古い短冊のため）。
 */
export function splitAroundPhoto(body: string) {
  const found = PHOTO_MARK_RE.exec(body);
  if (!found) return { before: "", after: body };

  const strip = (text: string) => text.replace(new RegExp(PHOTO_MARK_RE, "g"), "");
  return {
    before: strip(body.slice(0, found.index)).trimEnd(),
    after: strip(body.slice(found.index + found[0].length)).trimStart(),
  };
}

/** 前・写真・後ろ を、一本の本文に戻す。 */
export function composeBody(before: string, after: string, withPhoto: boolean) {
  const parts = withPhoto ? [before, PHOTO_MARK, after] : [before, after];
  return parts
    .map((part) => part.trim())
    .filter(Boolean)
    .join("\n\n");
}
