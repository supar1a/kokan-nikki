"use client";

import { useActionState, useRef, useState } from "react";
import { useSound } from "./sound-provider";
import type { FormState } from "@/app/actions/slips";

type Props = {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  hidden: Record<string, string>;
  defaultBody?: string;
  /** すでに公開しているものを編集しているとき */
  published?: boolean;
  cancel?: React.ReactNode;
};

export function Composer({
  action,
  hidden,
  defaultBody = "",
  published = false,
  cancel,
}: Props) {
  const [state, formAction, pending] = useActionState(action, null);
  const [count, setCount] = useState(() => countChars(defaultBody));
  const { play } = useSound();
  const lastStroke = useRef(0);

  // 打鍵のたびに筆の音。連打で音が濁らないよう、間隔を空ける。
  function onKeyDown(event: React.KeyboardEvent) {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    if (event.key.length !== 1 && event.key !== "Enter" && event.key !== "Backspace") return;
    const now = performance.now();
    if (now - lastStroke.current < 42) return;
    lastStroke.current = now;
    play("stroke");
  }

  return (
    <form action={formAction} className="compose">
      {Object.entries(hidden).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}

      <div className="compose-shell">
        <textarea
          name="body"
          className="compose-body"
          placeholder="ここから、書く。"
          defaultValue={defaultBody}
          autoFocus
          spellCheck={false}
          onKeyDown={onKeyDown}
          onChange={(event) => setCount(countChars(event.target.value))}
        />
      </div>

      {state?.error ? <p className="notice">{state.error}</p> : null}

      <div className="compose-foot">
        <button
          type="submit"
          name="intent"
          value="publish"
          className="btn btn-ink"
          disabled={pending}
          onClick={() => play("ink")}
        >
          {published ? "保存する" : "投稿する"}
        </button>

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

        <span className="compose-count">{count > 0 ? `${count}字` : "　"}</span>
      </div>
    </form>
  );
}

function countChars(value: string) {
  return [...value.replace(/\s/g, "")].length;
}
