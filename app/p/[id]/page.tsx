import { requireReadablePage } from "@/lib/guards";
import { kanjiDate, kanjiTime } from "@/lib/kanji";
import { paragraphs } from "@/lib/text";
import { Masthead } from "@/components/masthead";
import { PaperLink } from "@/components/paper-link";
import { DeletePage } from "@/components/page-actions";

export default async function PageDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { page, canEdit } = await requireReadablePage(id);

  return (
    <div className="app">
      <Masthead sub={page.notebook.name}>
        {canEdit ? (
          <>
            <PaperLink href={`/p/${page.id}/naosu`} className="masthead-link" voice="rustle">
              直す
            </PaperLink>
            <DeletePage pageId={page.id} />
          </>
        ) : null}
        <PaperLink href={`/n/${page.notebook.slug}`} className="masthead-link">
          ノートへ戻る
        </PaperLink>
      </Masthead>

      <div className="stage">
        <div className="scroll-tate">
          <article className="sheet tate fade-in">
            <header className="sheet-head">
              <h1 className="sheet-title">{kanjiDate(page.createdAt)}</h1>
              <div className="sheet-byline">
                {!page.sealedAt ? <span className="seal">まだ渡していない</span> : null}
                <span>{page.author.name ?? "名もなき人"}</span>
                <span>{kanjiTime(page.createdAt)}</span>
              </div>
            </header>

            <div className="sheet-body">
              {paragraphs(page.body).map((block, index) => (
                <p key={index}>{block}</p>
              ))}
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}
