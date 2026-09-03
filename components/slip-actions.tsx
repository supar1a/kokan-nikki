"use client";

import { useSound } from "./sound-provider";
import { deleteSlipAction, setPublishedAction } from "@/app/actions/slips";

export function PublishToggle({ slipId, published }: { slipId: string; published: boolean }) {
  const { play } = useSound();

  return (
    <form action={setPublishedAction}>
      <input type="hidden" name="slipId" value={slipId} />
      <input type="hidden" name="published" value={published ? "false" : "true"} />
      <button
        type="submit"
        className={published ? "btn btn-quiet" : "btn btn-ink"}
        onClick={() => play(published ? "rustle" : "ink")}
      >
        {published ? "下書きに戻す" : "公開する"}
      </button>
    </form>
  );
}

export function DeleteSlip({ slipId }: { slipId: string }) {
  const { play } = useSound();

  return (
    <form
      action={deleteSlipAction}
      onSubmit={(event) => {
        if (!window.confirm("この短冊を削除します。もとには戻せません。")) {
          event.preventDefault();
          return;
        }
        play("turn");
      }}
    >
      <input type="hidden" name="slipId" value={slipId} />
      <button type="submit" className="btn btn-quiet" style={{ color: "var(--sumi-ghost)" }}>
        削除
      </button>
    </form>
  );
}
