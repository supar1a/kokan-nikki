"use client";

import { useSound } from "./sound-provider";
import { handOverAction } from "@/app/actions/notebooks";

type Props = {
  notebookId: string;
  toUserId: string;
  name: string;
  isNext: boolean;
  /** ノートの中では縦組み、仲間の画面では横組み */
  vertical?: boolean;
};

export function HandOver({ notebookId, toUserId, name, isNext, vertical = false }: Props) {
  const { play } = useSound();

  return (
    <form
      action={handOverAction}
      onSubmit={(event) => {
        const asked = window.confirm(
          `${name}さんに渡します。\n書いた頁はこのとき封じられ、もう直せなくなります。`,
        );
        if (!asked) {
          event.preventDefault();
          return;
        }
        play("close");
      }}
    >
      <input type="hidden" name="notebookId" value={notebookId} />
      <input type="hidden" name="toUserId" value={toUserId} />
      <button
        type="submit"
        className={[
          "btn",
          vertical ? "handoff-btn" : "",
          isNext ? "handoff-next" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {name}さんに渡す
      </button>
    </form>
  );
}
