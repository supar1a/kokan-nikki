import { kanjiDateShort } from "@/lib/kanji";
import { paragraphs } from "@/lib/text";
import { PaperLink } from "./paper-link";

export type SlipRow = {
  id: string;
  body: string;
  published: boolean;
  createdAt: Date;
  author: { id: string; name: string };
  photo: { id: string; width: number; height: number } | null;
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
          {slip.author.name}
        </PaperLink>

        <div className="slip-meta">
          {!slip.published ? <span className="seal">下書き</span> : null}
          <PaperLink href={`/s/${slip.id}`} className="slip-when">
            {kanjiDateShort(slip.createdAt)}
          </PaperLink>
        </div>
      </header>

      {slip.photo ? <SlipPhoto photo={slip.photo} /> : null}

      <div className="slip-body">
        {paragraphs(slip.body).map((block, index) => (
          <p key={index}>{block}</p>
        ))}
      </div>
    </article>
  );
}

/** 貼られた一枚。行の高さに収まるところまで縮めて、紙に置いたように見せる。 */
export function SlipPhoto({
  photo,
  className = "slip-photo",
}: {
  photo: { id: string; width: number; height: number };
  className?: string;
}) {
  return (
    <div className={className}>
      {/* next/image は縦組みの中で扱いにくいので、素の img で置く */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/i/${photo.id}`}
        alt=""
        width={photo.width}
        height={photo.height}
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}
