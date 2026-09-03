"use client";

import { useState } from "react";
import { useSound } from "./sound-provider";
import { renewPassKeyAction } from "@/app/actions/auth";

export function ReturnLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  const { play } = useSound();

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      play("tick");
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // クリップボードが使えない環境では、目で読んで写してもらう
    }
  }

  return (
    <div className="gate-block">
      <p className="returnlink-url">{url}</p>

      <div className="row">
        <button type="button" className="btn btn-ink" onClick={copy}>
          {copied ? "写しました" : "この URL を写す"}
        </button>

        <form
          action={renewPassKeyAction}
          onSubmit={(event) => {
            if (!window.confirm("いまの戻り口は使えなくなります。よろしいですか。")) {
              event.preventDefault();
              return;
            }
            play("rustle");
          }}
        >
          <button type="submit" className="btn btn-quiet" style={{ fontSize: "0.74rem" }}>
            作り直す
          </button>
        </form>
      </div>
    </div>
  );
}
