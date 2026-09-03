import { prisma } from "@/lib/db";
import { requireNotebook, readablePages } from "@/lib/guards";
import { nextInTurn, shioriAt } from "@/lib/notebook";
import { kanjiDateShort, kanjiNumber } from "@/lib/kanji";
import { excerpt } from "@/lib/text";
import { Masthead } from "@/components/masthead";
import { PaperLink } from "@/components/paper-link";
import { HandOver } from "@/components/hand-over";
import { OpenAtLatest } from "@/components/open-at-latest";

const SCROLLER = "notebook-scroll";
const SHIORI = "shiori";

export default async function NotebookPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { user, notebook, membership, holding } = await requireNotebook(slug);

  const pages = await readablePages(notebook.id, membership, holding);
  const memberships = await prisma.membership.findMany({
    where: { notebookId: notebook.id },
    include: { user: { select: { id: true, name: true } } },
    orderBy: { order: "asc" },
  });

  const next = nextInTurn(memberships, notebook.holderId);
  const others = memberships.filter((m) => m.userId !== user.id);

  // 栞は、手元にあるときだけ意味を持つ（手元にないなら、新しい頁は見えていない）
  const shiori = holding ? shioriAt(pages, membership.heldUntil) : -1;
  const before = shiori < 0 ? pages : pages.slice(0, shiori);
  const after = shiori < 0 ? [] : pages.slice(shiori);

  const holderName = notebook.holder?.name ?? "誰か";

  return (
    <div className="app">
      <Masthead sub={notebook.name}>
        <PaperLink href={`/n/${notebook.slug}/nakama`} className="masthead-link" voice="rustle">
          仲間
        </PaperLink>
        <PaperLink href="/" className="masthead-link">
          ノート一覧
        </PaperLink>
      </Masthead>

      {/* このノートが、いまどういう状態にあるか */}
      <div className="stateline">
        <span className={holding ? "stateline-mark stateline-mark-here" : "stateline-mark"} />
        <span className="stateline-text">
          {holding ? "いま、あなたの手元にあります" : `${holderName}さんが持っています`}
        </span>
        <span className="stateline-hint">
          {holding
            ? "書いたら、次の人に渡します"
            : membership.heldUntil
              ? "回ってきたら、続きが読めます"
              : "まだ一度も回ってきていません"}
        </span>
      </div>

      <div className="stage">
        <div className="scroll-tate" id={SCROLLER}>
          <div className="stream tate fade-in" data-stream>
            {/* 表紙 */}
            <div className="cover">
              <h1 className="cover-name">{notebook.name}</h1>
              {notebook.description ? (
                <p className="cover-note">{notebook.description}</p>
              ) : null}
              <p className="cover-people">
                {memberships.map((m) => m.user.name ?? "名もなき人").join("・")}
                <br />
                {kanjiDateShort(notebook.createdAt)}から
              </p>
            </div>

            {before.map((page) => (
              <PageColumn key={page.id} page={page} meId={user.id} />
            ))}

            {shiori >= 0 ? (
              <div className="shiori" id={SHIORI}>
                <span className="shiori-label">ここから、新しく書かれた分</span>
              </div>
            ) : null}

            {after.map((page) => (
              <PageColumn key={page.id} page={page} meId={user.id} />
            ))}

            {/* 末尾 — 手元にあるなら、白紙と、次に渡す相手 */}
            {holding ? (
              <div className="tail">
                <PaperLink
                  href={`/n/${notebook.slug}/kaku`}
                  className="blankpage"
                  voice="rustle"
                >
                  <span className="blankpage-lede">新しい頁に書く</span>
                  <span className="blankpage-hint">
                    渡すまでは、
                    <br />
                    まだ誰にも見えません。
                  </span>
                </PaperLink>

                {others.length > 0 ? (
                  <div className="handoff">
                    <p className="handoff-title">
                      渡す{next ? `　次は${next.user.name}さん` : ""}
                    </p>
                    <div className="handoff-people">
                      {others.map((m) => (
                        <HandOver
                          key={m.id}
                          notebookId={notebook.id}
                          toUserId={m.userId}
                          name={m.user.name ?? "名もなき人"}
                          isNext={m.userId === next?.userId}
                          vertical
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="waiting">
                    まだ仲間がいません。
                    <br />
                    「仲間」から招待コードを渡してください。
                  </p>
                )}
              </div>
            ) : (
              <div className="tail">
                <p className="waiting">
                  {holderName}さんが書いています。
                  <br />
                  {membership.heldUntil
                    ? `ここまでの${kanjiNumber(pages.length)}頁が読めます。`
                    : "このノートは、まだ一度もあなたのところに来ていません。"}
                </p>
              </div>
            )}
          </div>
        </div>

        <OpenAtLatest scrollerId={SCROLLER} shioriId={shiori >= 0 ? SHIORI : undefined} />
      </div>
    </div>
  );
}

type PageRow = {
  id: string;
  body: string;
  sealedAt: Date | null;
  createdAt: Date;
  author: { id: string; name: string | null };
};

function PageColumn({ page, meId }: { page: PageRow; meId: string }) {
  return (
    <PaperLink href={`/p/${page.id}`} className="page">
      <div className="page-head">
        <h2 className="page-date">{kanjiDateShort(page.createdAt)}</h2>
        <div className="page-meta">
          {!page.sealedAt ? <span className="seal">まだ渡していない</span> : null}
          <span>{page.author.id === meId ? "じぶん" : (page.author.name ?? "名もなき人")}</span>
        </div>
      </div>
      <p className="page-body">{excerpt(page.body)}</p>
    </PaperLink>
  );
}
