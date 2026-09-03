"use client";

import { useActionState } from "react";
import { useSound } from "./sound-provider";
import type { FormState } from "@/app/actions/places";

type Action = (prev: FormState, formData: FormData) => Promise<FormState>;

export function CreatePlaceForm({
  action,
  suggestion,
}: {
  action: Action;
  suggestion: string;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const { play } = useSound();

  return (
    <form action={formAction} className="leaf-section">
      <label className="field">
        <span className="field-label">グループ名</span>
        <input
          name="name"
          className="input"
          maxLength={32}
          required
          placeholder="たとえば「三人のところ」"
        />
      </label>

      <label className="field">
        <span className="field-label">ひとこと（任意）</span>
        <input
          name="description"
          className="input"
          maxLength={120}
          placeholder="このグループについて"
        />
      </label>

      <label className="field">
        <span className="field-label">合言葉</span>
        <input
          name="passphrase"
          className="input"
          maxLength={32}
          required
          defaultValue={suggestion}
          spellCheck={false}
          autoCapitalize="none"
        />
        <span className="field-note">
          これを伝えた人だけが入れます。口で言える言葉にしておくと渡しやすい。
        </span>
      </label>

      {state?.error ? <p className="notice">{state.error}</p> : null}

      <div className="row">
        <button
          type="submit"
          className="btn btn-ink"
          disabled={pending}
          onClick={() => play("ink")}
        >
          作成する
        </button>
      </div>
    </form>
  );
}

export function JoinPlaceForm({ action }: { action: Action }) {
  const [state, formAction, pending] = useActionState(action, null);
  const { play } = useSound();

  return (
    <form action={formAction} className="leaf-section">
      <label className="field">
        <span className="field-label">合言葉</span>
        <input
          name="passphrase"
          className="input"
          required
          spellCheck={false}
          autoCapitalize="none"
          placeholder="あかいとり"
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
          参加する
        </button>
      </div>
    </form>
  );
}
