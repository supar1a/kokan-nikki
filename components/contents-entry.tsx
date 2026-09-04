"use client";

import { kanjiDateShort } from "@/lib/kanji";
import { headingOf } from "@/lib/text";
import { useSound } from "./sound-provider";
import { PaperLink } from "./paper-link";
import { SlipText } from "./slip-column";
import type { SlipRow } from "./slip-column";

/**
 * 目次の一行。
 *
 * 縦組みでは、ひとつの塊がそのまま一行（一列）になる。
 * 題が上、書いた人と日付が下に落ちる。小説の目次と同じ組み方。
 *
 * 押すと、別の画面へ飛ばずにその場で開く。縦組みなので、開いた分だけ左へ伸びる。
 * 状態は details に持たせているので、こちらで抱えるものは何も無い。
 */
export function ContentsEntry({
  slip,
  mine = false,
}: {
  slip: SlipRow;
  mine?: boolean;
}) {
  const { play } = useSound();
  // 題が無いものは、見出しに本文の一行目を借りている。
  // 開いたらそこは本文が引き受けるので、二度読ませない。
  const borrowed = !slip.title?.trim();

  return (
    <details
      className="entry"
      onToggle={(event) => play(event.currentTarget.open ? "turn" : "rustle")}
    >
      <summary className="entry-summary">
        <span className={borrowed ? "entry-title entry-title-borrowed" : "entry-title"}>
          {headingOf(slip)}
        </span>

        <span className="entry-meta">
          {!slip.published ? <span className="seal">下書き</span> : null}
          {mine ? <span className="slip-mine">じぶん</span> : null}
          {slip.photo ? <span className="entry-mark">写</span> : null}
          <span>{slip.author.name}</span>
          {/* 日付はその一篇の頁への戸口。折り畳みは動かさない。 */}
          <PaperLink
            href={`/s/${slip.id}`}
            className="slip-when"
            onClick={(event) => event.stopPropagation()}
          >
            {kanjiDateShort(slip.createdAt)}
          </PaperLink>
        </span>
      </summary>

      <div className="entry-open">
        <SlipText
          body={slip.body}
          photo={slip.photo}
          bodyClassName="slip-body"
          photoClassName="slip-photo"
        />
      </div>
    </details>
  );
}
