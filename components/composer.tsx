"use client";

import { useActionState, useRef, useState } from "react";
import { useSound } from "./sound-provider";
import type { FormState } from "@/app/actions/pages";

type Props = {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  hidden: Record<string, string>;
  defaultBody?: string;
  submitLabel: string;
  note: string;
  cancel?: React.ReactNode;
};

export function Composer({
  action,
  hidden,
  defaultBody = "",
  submitLabel,
  note,
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
          className="btn btn-ink"
          disabled={pending}
          onClick={() => play("ink")}
        >
          {submitLabel}
        </button>

        {cancel}

        <span className="compose-note">{note}</span>
        <span className="compose-count">{count > 0 ? `${count}字` : "　"}</span>
      </div>
    </form>
  );
}

function countChars(value: string) {
  return [...value.replace(/\s/g, "")].length;
}
