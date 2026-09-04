"use client";

import { useActionState, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useSound } from "./sound-provider";
import { PHOTO_MARK, hasPhotoMark } from "@/lib/text";
import type { FormState } from "@/app/actions/slips";

type Photo = { url: string; width: number; height: number; local: boolean };

type Props = {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  hidden: Record<string, string>;
  defaultBody?: string;
  /** すでに貼ってある一枚（書き直しのとき） */
  defaultPhoto?: { id: string; width: number; height: number } | null;
  /** すでに公開しているものを編集しているとき */
  published?: boolean;
  cancel?: React.ReactNode;
};

// 貼った写真は、送る前にここまで縮める
const MAX_SIDE = 1600;
const QUALITY = 0.82;

export function Composer({
  action,
  hidden,
  defaultBody = "",
  defaultPhoto = null,
  published = false,
  cancel,
}: Props) {
  const [state, formAction, pending] = useActionState(action, null);
  const [count, setCount] = useState(() => countChars(defaultBody));
  const [photo, setPhoto] = useState<Photo | null>(
    defaultPhoto
      ? { url: `/i/${defaultPhoto.id}`, width: defaultPhoto.width, height: defaultPhoto.height, local: false }
      : null,
  );
  const [trouble, setTrouble] = useState<string | null>(null);
  const { play } = useSound();
  const lastStroke = useRef(0);
  const formRef = useRef<HTMLFormElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const submitRef = useRef<HTMLButtonElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const isMac = useSyncExternalStore(subscribeNothing, readIsMac, () => false);

  // 見せている間だけの URL なので、置き換わったら手放す
  useEffect(() => {
    return () => {
      if (photo?.local) URL.revokeObjectURL(photo.url);
    };
  }, [photo]);

  function onKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    // ⌘/Ctrl + Enter で送る。
    // 変換の確定にも Enter を使うので、変換中は決して送らない。
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      if (event.nativeEvent.isComposing) return;
      event.preventDefault();
      play("ink");
      formRef.current?.requestSubmit(submitRef.current ?? undefined);
      return;
    }

    // 打鍵のたびに筆の音。連打で音が濁らないよう、間隔を空ける。
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    if (event.key.length !== 1 && event.key !== "Enter" && event.key !== "Backspace") return;
    const now = performance.now();
    if (now - lastStroke.current < 42) return;
    lastStroke.current = now;
    play("stroke");
  }

  /** 写真は貼り付けでだけ入る。文字の貼り付けは邪魔しない。 */
  async function onPaste(event: React.ClipboardEvent) {
    const item = [...event.clipboardData.items].find((i) => i.type.startsWith("image/"));
    if (!item) return;

    event.preventDefault();
    const file = item.getAsFile();
    if (!file) return;

    setTrouble(null);
    try {
      const shrunk = await shrink(file);
      const input = fileRef.current;
      if (!input) return;

      const carrier = new DataTransfer();
      carrier.items.add(new File([shrunk.blob], "photo.jpg", { type: "image/jpeg" }));
      input.files = carrier.files;

      // いま書いている場所に印を置く。写真はそこに入る。
      putMark();

      if (photo?.local) URL.revokeObjectURL(photo.url);
      setPhoto({
        url: URL.createObjectURL(shrunk.blob),
        width: shrunk.width,
        height: shrunk.height,
        local: true,
      });
      play("rustle");
    } catch {
      setTrouble("その画像は貼れませんでした。別の形式で試してみてください。");
    }
  }

  /** カーソルのところに印を置く。すでに置いてあれば動かさない。 */
  function putMark() {
    const el = bodyRef.current;
    if (!el || hasPhotoMark(el.value)) return;

    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? start;
    const before = el.value.slice(0, start);
    const after = el.value.slice(end);

    // 文の途中に割り込んだときは、前後を改行で空ける
    const lead = before && !before.endsWith("\n") ? "\n" : "";
    const tail = after && !after.startsWith("\n") ? "\n" : "";
    const inserted = lead + PHOTO_MARK + tail;

    el.value = before + inserted + after;
    const caret = start + inserted.length;
    el.setSelectionRange(caret, caret);
    el.focus();
    setCount(countChars(el.value));
  }

  function takeMark() {
    const el = bodyRef.current;
    if (!el) return;
    el.value = el.value
      .replace(/[\n]?(［写真］|\[写真\])[\n]?/g, "\n")
      .replace(/\n{3,}/g, "\n\n");
    setCount(countChars(el.value));
  }

  function detach() {
    if (fileRef.current) fileRef.current.value = "";
    if (photo?.local) URL.revokeObjectURL(photo.url);
    setPhoto(null);
    takeMark();
    play("turn");
  }

  return (
    <form ref={formRef} action={formAction} className="compose">
      {Object.entries(hidden).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <input ref={fileRef} type="file" name="photo" accept="image/*" hidden />
      <input type="hidden" name="photoWidth" value={photo?.width ?? ""} />
      <input type="hidden" name="photoHeight" value={photo?.height ?? ""} />
      <input type="hidden" name="photoRemove" value={!photo && defaultPhoto ? "1" : ""} />

      <div className="compose-shell">
        <textarea
          ref={bodyRef}
          name="body"
          className="compose-body"
          placeholder="ここから、書く。"
          defaultValue={defaultBody}
          autoFocus
          spellCheck={false}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
          onChange={(event) => setCount(countChars(event.target.value))}
        />
      </div>

      {state?.error ? <p className="notice">{state.error}</p> : null}
      {trouble ? <p className="notice">{trouble}</p> : null}

      <div className="compose-foot">
        <button
          ref={submitRef}
          type="submit"
          name="intent"
          value="publish"
          className="btn btn-ink"
          disabled={pending}
          onClick={() => play("ink")}
        >
          {published ? "保存する" : "投稿する"}
        </button>

        <span className="compose-shortcut">{isMac ? "⌘" : "Ctrl"} + Enter</span>

        <button
          type="submit"
          name="intent"
          value="draft"
          className="btn"
          disabled={pending}
          onClick={() => play("rustle")}
        >
          下書きに保存
        </button>

        {cancel}

        {photo ? (
          <span className="compose-photo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo.url} alt="" width={photo.width} height={photo.height} />
            <button type="button" className="btn btn-quiet" onClick={detach}>
              外す
            </button>
          </span>
        ) : (
          <span className="compose-photo-hint">写真は、貼り付けたところに入ります</span>
        )}

        <span className="compose-count">{count > 0 ? `${count}字` : "　"}</span>
      </div>
    </form>
  );
}

/** 送る前に縮める。スマホの一枚をそのまま送ると、上限にも回線にも重い。 */
async function shrink(file: File) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("描けませんでした");
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", QUALITY),
  );
  if (!blob) throw new Error("書き出せませんでした");

  return { blob, width, height };
}

function countChars(value: string) {
  return [...value.replace(/\s/g, "")].length;
}

// 打ち手の環境でしか分からないので、描き直しの合図は要らない
function subscribeNothing() {
  return () => {};
}

function readIsMac() {
  return /Mac|iPhone|iPad/i.test(navigator.userAgent);
}
