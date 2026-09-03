"use client";

import { useActionState } from "react";
import { useSound } from "./sound-provider";
import type { FormState } from "@/app/actions/notebooks";

type Action = (prev: FormState, formData: FormData) => Promise<FormState>;

export function CreateNotebookForm({ action }: { action: Action }) {
  const [state, formAction, pending] = useActionState(action, null);
  const { play } = useSound();

  return (
    <form action={formAction} className="leaf-section">
      <label className="field">
        <span className="field-label">ノートの名前</span>
        <input
          name="name"
          className="input"
          maxLength={32}
          required
          placeholder="たとえば「三人のノート」"
        />
      </label>

      <label className="field">
        <span className="field-label">ひとこと（任意）</span>
        <input
          name="description"
          className="input"
          maxLength={120}
          placeholder="このノートで書くこと"
        />
      </label>

      {state?.error ? <p className="notice">{state.error}</p> : null}

      <div className="row">
        <button
          type="submit"
          className="btn btn-ink"
          disabled={pending}
          onClick={() => play("ink")}
        >
          ノートをつくる
        </button>
        <span className="leaf-lede">つくった人が、最初にノートを持ちます。</span>
      </div>
    </form>
  );
}

export function JoinNotebookForm({ action }: { action: Action }) {
  const [state, formAction, pending] = useActionState(action, null);
  const { play } = useSound();

  return (
    <form action={formAction} className="leaf-section">
      <label className="field">
        <span className="field-label">招待コード</span>
        <input
          name="code"
          className="input"
          required
          spellCheck={false}
          autoCapitalize="none"
          placeholder="kmp4-t7xz"
        />
      </label>

      {state?.error ? <p className="notice">{state.error}</p> : null}

      <div className="row">
        <button
          type="submit"
          className="btn"
          disabled={pending}
          onClick={() => play("turn")}
        >
          入る
        </button>
        <span className="leaf-lede">
          回る順のいちばん後ろに入ります。中身は、ノートが回ってきたときに読めます。
        </span>
      </div>
    </form>
  );
}
