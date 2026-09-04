/**
 * 写真は一枚だけ。貼り付けでしか入らない。
 *
 * 実体は Postgres に入れる。Vercel はディスクに書けないし、
 * 外の置き場を足すと環境変数が増えるので、この規模なら表に持つのが早い。
 * そのかわり、貼る前にブラウザ側で必ず縮める（下の上限はその保険）。
 */

export const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
export const MAX_BYTES = 3 * 1024 * 1024;

export type IncomingPhoto = {
  // TypeScript 5.7 以降、Uint8Array は元になる領域で型が分かれる。Prisma が求める形に合わせる。
  data: Uint8Array<ArrayBuffer>;
  mimeType: string;
  width: number;
  height: number;
};

function side(value: FormDataEntryValue | null) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  // 縦横比を組みに使うだけなので、おかしな値は丸めてしまう
  return Math.min(10000, Math.max(1, Math.round(n)));
}

/** 送られてきた一枚を受け取る。無ければ null。 */
export async function readPhoto(formData: FormData): Promise<IncomingPhoto | null> {
  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) return null;

  if (!ALLOWED.has(file.type)) {
    throw new Error("その形式の画像は貼れません。");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("画像が大きすぎます。");
  }

  return {
    data: new Uint8Array(await file.arrayBuffer()),
    mimeType: file.type,
    width: side(formData.get("photoWidth")),
    height: side(formData.get("photoHeight")),
  };
}
