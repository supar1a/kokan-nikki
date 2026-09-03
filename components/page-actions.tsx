"use client";

import { useSound } from "./sound-provider";
import { deletePageAction } from "@/app/actions/pages";

export function DeletePage({ pageId }: { pageId: string }) {
  const { play } = useSound();

  return (
    <form
      action={deletePageAction}
      onSubmit={(event) => {
        if (!window.confirm("この頁を消します。もとには戻りません。")) {
          event.preventDefault();
          return;
        }
        play("turn");
      }}
    >
      <input type="hidden" name="pageId" value={pageId} />
      <button type="submit" className="btn btn-quiet" style={{ color: "var(--sumi-ghost)" }}>
        消す
      </button>
    </form>
  );
}
