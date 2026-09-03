"use client";

import { useActionState } from "react";
import { useSound } from "./sound-provider";
import type { FormState } from "@/app/actions/auth";

/** Google の公式マーク（小さく、印のように置く） */
function GoogleMark() {
  return (
    <svg viewBox="0 0 18 18" width="15" height="15" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"
      />
      <path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33z" />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.9 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"
      />
    </svg>
  );
}

export function GoogleGate({ action }: { action: () => Promise<void> }) {
  const { play } = useSound();

  return (
    <form action={action}>
      <button type="submit" className="btn gate-wide" onClick={() => play("turn")}>
        <GoogleMark />
        Google ではじめる
      </button>
    </form>
  );
}

export function MailGate({
  action,
  showDivider,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  showDivider: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const { play } = useSound();

  return (
    <form action={formAction} className="gate-block">
      {showDivider ? <p className="gate-divider">または</p> : null}

      <label className="field">
        <span className="field-label">メールアドレス</span>
        <input
          name="email"
          type="email"
          className="input"
          required
          autoComplete="email"
          spellCheck={false}
          autoCapitalize="none"
          placeholder="you@example.com"
        />
      </label>

      {state?.error ? <p className="notice">{state.error}</p> : null}

      <button
        type="submit"
        className="btn btn-ink gate-wide"
        disabled={pending}
        onClick={() => play("rustle")}
      >
        {pending ? "送っています…" : "ログイン用のリンクを送る"}
      </button>
    </form>
  );
}

export function NameGate({
  action,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const { play } = useSound();

  return (
    <form action={formAction} className="gate-form">
      <p className="gate-heading">名を決める</p>
      <p className="leaf-lede">綴じのなかで、こう呼ばれます。あとからは変えられません。</p>

      <label className="field">
        <span className="field-label">名前</span>
        <input
          name="name"
          className="input"
          maxLength={24}
          required
          autoFocus
          autoComplete="nickname"
          placeholder="はなこ"
        />
      </label>

      {state?.error ? <p className="notice">{state.error}</p> : null}

      <div className="gate-actions">
        <button
          type="submit"
          className="btn btn-ink"
          disabled={pending}
          onClick={() => play("ink")}
        >
          これでいく
        </button>
      </div>
    </form>
  );
}

type Person = { id: string; name: string | null; email: string | null };

/** 開発中だけ出る抜け道。designed to look like it does not belong. */
export function DebugGate({
  people,
  action,
}: {
  people: Person[];
  action: (formData: FormData) => Promise<void>;
}) {
  const { play } = useSound();

  return (
    <div className="debug">
      <p className="debug-label">開発用</p>
      <p className="debug-note">
        メールのリンクを踏まずに、その人としてそのまま入ります。本番では出ません。
      </p>

      {people.length === 0 ? (
        <p className="debug-note">
          まだ誰もいません。<code className="code">npm run seed</code> で種を蒔いてください。
        </p>
      ) : (
        <div className="debug-people">
          {people.map((person) => (
            <form key={person.id} action={action}>
              <input type="hidden" name="userId" value={person.id} />
              <button type="submit" className="btn debug-btn" onClick={() => play("tick")}>
                {person.name ?? person.email ?? "名なし"} で入る
              </button>
            </form>
          ))}
        </div>
      )}
    </div>
  );
}
