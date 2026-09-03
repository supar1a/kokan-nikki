import { kanjiDateShort } from "@/lib/kanji";
import { paragraphs } from "@/lib/text";
import { PaperLink } from "./paper-link";

export type SlipRow = {
  id: string;
  body: string;
  published: boolean;
  createdAt: Date;
  author: { id: string; name: string | null };
};

/**
 * 巻物のなかの一枚。全文を出す。
 * 名前と日付だけがリンクで、本文はただの文字。走り読みさせず、読ませるため。
 */
export function SlipColumn({ slip, slug }: { slip: SlipRow; slug: string }) {
  return (
    <article className="slip">
      <header className="slip-head">
        <PaperLink
          href={`/b/${slug}/by/${slip.author.id}`}
          className="slip-who"
          voice="rustle"
        >
          {slip.author.name ?? "名もなき人"}
        </PaperLink>

        <div className="slip-meta">
          {!slip.published ? <span className="seal">下書き</span> : null}
          <PaperLink href={`/s/${slip.id}`} className="slip-when">
            {kanjiDateShort(slip.createdAt)}
          </PaperLink>
        </div>
      </header>

      <div className="slip-body">
        {paragraphs(slip.body).map((block, index) => (
          <p key={index}>{block}</p>
        ))}
      </div>
    </article>
  );
}
