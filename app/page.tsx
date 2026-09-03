import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { kanjiDateShort, kanjiNumber } from "@/lib/kanji";
import { Masthead } from "@/components/masthead";
import { PaperLink } from "@/components/paper-link";
import { signOutAction } from "@/app/actions/auth";

export const metadata = { title: "ノート — 交換日記" };

export default async function NotebooksPage() {
  const user = await requireUser();

  const notebooks = await prisma.notebook.findMany({
    where: { memberships: { some: { userId: user.id } } },
    include: {
      holder: { select: { id: true, name: true } },
      _count: { select: { memberships: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  // 封じられた頁の数と、最後に封じられた日を一度に数える
  const tallies = notebooks.length
    ? await prisma.page.groupBy({
        by: ["notebookId"],
        where: { notebookId: { in: notebooks.map((n) => n.id) }, sealedAt: { not: null } },
        _count: { _all: true },
        _max: { sealedAt: true },
      })
    : [];
  const tallyOf = new Map(tallies.map((t) => [t.notebookId, t]));

  // 手元にあるものが先。いま動かせるものから目に入るように。
  const ordered = [...notebooks].sort((a, b) => {
    const mine = (n: (typeof notebooks)[number]) => (n.holderId === user.id ? 0 : 1);
    return mine(a) - mine(b) || a.createdAt.getTime() - b.createdAt.getTime();
  });

  return (
    <div className="app">
      <Masthead sub={`${user.name} さん`}>
        <PaperLink href="/new" className="masthead-link" voice="rustle">
          つくる・入る
        </PaperLink>
        {user.passKey ? (
          <PaperLink href="/modoriguchi" className="masthead-link" voice="rustle">
            戻り口
          </PaperLink>
        ) : null}
        <form action={signOutAction}>
          <button type="submit" className="btn btn-quiet" style={{ fontSize: "0.72rem" }}>
            出る
          </button>
        </form>
      </Masthead>

      <div className="stage">
        <div className="scroll-tate">
          {ordered.length === 0 ? (
            <div className="hollow tate fade-in">
              <p>まだノートがありません。</p>
              <PaperLink href="/new" className="btn" voice="rustle">
                ノートをつくる
              </PaperLink>
            </div>
          ) : (
            <div className="stream tate fade-in">
              {ordered.map((notebook) => {
                const tally = tallyOf.get(notebook.id);
                const written = tally?._count._all ?? 0;
                const last = tally?._max.sealedAt ?? null;
                const holding = notebook.holderId === user.id;

                return (
                  <PaperLink key={notebook.id} href={`/n/${notebook.slug}`} className="book">
                    <div className="page-head">
                      <h2 className="book-name">{notebook.name}</h2>
                      <div className="page-meta">
                        <span className={holding ? "seal" : "seal seal-quiet"}>
                          {holding
                            ? "手元にある"
                            : notebook.holder
                              ? `${notebook.holder.name}さんが持っている`
                              : "誰も持っていない"}
                        </span>
                        <span>仲間{kanjiNumber(notebook._count.memberships)}人</span>
                        <span>{written > 0 ? `${kanjiNumber(written)}頁` : "まだ白紙"}</span>
                        {last ? <span>{kanjiDateShort(last)}</span> : null}
                      </div>
                    </div>
                    {notebook.description ? (
                      <p className="book-note">{notebook.description}</p>
                    ) : null}
                  </PaperLink>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
