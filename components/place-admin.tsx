"use client";

import { useActionState, useState } from "react";
import { useSound } from "./sound-provider";
import {
  changePassphraseAction,
  leavePlaceAction,
  removeMemberAction,
} from "@/app/actions/places";
import type { FormState } from "@/app/actions/places";

export function Passphrase({
  placeId,
  passphrase,
  canChange,
}: {
  placeId: string;
  passphrase: string;
  canChange: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    changePassphraseAction,
    null,
  );
  const { play } = useSound();

  async function copy() {
    try {
      await navigator.clipboard.writeText(passphrase);
      play("tick");
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // クリップボードが使えない環境では、目で読んで写してもらう
    }
  }

  return (
    <div className="invite">
      <code className="code">{passphrase}</code>

      <div className="invite-actions">
        <button type="button" className="btn" onClick={copy}>
          {copied ? "コピーしました" : "コピー"}
        </button>
        {canChange && !editing ? (
          <button type="button" className="btn" onClick={() => setEditing(true)}>
            変更
          </button>
        ) : null}
      </div>

      {canChange && editing ? (
        <form action={formAction} className="invite-edit">
          <input type="hidden" name="placeId" value={placeId} />
          <input
            name="passphrase"
            className="input"
            defaultValue={passphrase}
            maxLength={32}
            required
            autoFocus
            spellCheck={false}
            autoCapitalize="none"
          />
          {state?.error ? <p className="notice">{state.error}</p> : null}
          <div className="invite-actions">
            <button
              type="submit"
              className="btn btn-ink"
              disabled={pending}
              onClick={() => play("rustle")}
            >
              保存
            </button>
            <button type="button" className="btn btn-quiet" onClick={() => setEditing(false)}>
              やめる
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}

export function RemoveMember({
  placeId,
  userId,
  name,
}: {
  placeId: string;
  userId: string;
  name: string;
}) {
  const { play } = useSound();

  return (
    <form
      action={removeMemberAction}
      onSubmit={(event) => {
        if (!window.confirm(`${name}さんをこのグループから外します。`)) {
          event.preventDefault();
          return;
        }
        play("rustle");
      }}
    >
      <input type="hidden" name="placeId" value={placeId} />
      <input type="hidden" name="userId" value={userId} />
      <button
        type="submit"
        className="btn btn-quiet"
        style={{ fontSize: "0.7rem", color: "var(--sumi-ghost)" }}
      >
        外す
      </button>
    </form>
  );
}

export function LeavePlace({ placeId }: { placeId: string }) {
  const { play } = useSound();

  return (
    <form
      action={leavePlaceAction}
      onSubmit={(event) => {
        if (!window.confirm("このグループを抜けます。書いた短冊は残ります。")) {
          event.preventDefault();
          return;
        }
        play("turn");
      }}
    >
      <input type="hidden" name="placeId" value={placeId} />
      <button
        type="submit"
        className="btn btn-quiet"
        style={{ fontSize: "0.72rem", color: "var(--sumi-ghost)" }}
      >
        グループを抜ける
      </button>
    </form>
  );
}
