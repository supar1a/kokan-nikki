"use client";

import { useState } from "react";
import { useSound } from "./sound-provider";
import {
  leaveNotebookAction,
  regenerateInviteAction,
  removeMemberAction,
} from "@/app/actions/notebooks";

export function InviteCode({
  notebookId,
  code,
  canRegenerate,
}: {
  notebookId: string;
  code: string;
  canRegenerate: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const { play } = useSound();

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      play("tick");
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // クリップボードが使えない環境では、目で読んで写してもらう
    }
  }

  return (
    <div className="invite">
      <code className="code">{code}</code>
      <div className="invite-actions">
        <button type="button" className="btn" onClick={copy}>
          {copied ? "写した" : "写す"}
        </button>
        {canRegenerate ? (
          <form action={regenerateInviteAction}>
            <input type="hidden" name="notebookId" value={notebookId} />
            <button type="submit" className="btn" onClick={() => play("rustle")}>
              作り直す
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
}

export function RemoveMember({
  notebookId,
  userId,
  name,
}: {
  notebookId: string;
  userId: string;
  name: string;
}) {
  const { play } = useSound();

  return (
    <form
      action={removeMemberAction}
      onSubmit={(event) => {
        if (!window.confirm(`${name}さんをこのノートから外します。`)) {
          event.preventDefault();
          return;
        }
        play("rustle");
      }}
    >
      <input type="hidden" name="notebookId" value={notebookId} />
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

export function LeaveNotebook({ notebookId }: { notebookId: string }) {
  const { play } = useSound();

  return (
    <form
      action={leaveNotebookAction}
      onSubmit={(event) => {
        if (!window.confirm("このノートから抜けます。書いたものは残ります。")) {
          event.preventDefault();
          return;
        }
        play("turn");
      }}
    >
      <input type="hidden" name="notebookId" value={notebookId} />
      <button
        type="submit"
        className="btn btn-quiet"
        style={{ fontSize: "0.72rem", color: "var(--sumi-ghost)" }}
      >
        このノートから抜ける
      </button>
    </form>
  );
}
