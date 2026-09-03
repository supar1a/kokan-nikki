import { prisma } from "@/lib/db";
import { requireNotebook } from "@/lib/guards";
import { nextInTurn } from "@/lib/notebook";
import { kanjiDateShort } from "@/lib/kanji";
import { Masthead } from "@/components/masthead";
import { PaperLink } from "@/components/paper-link";
import { HandOver } from "@/components/hand-over";
import { InviteCode, LeaveNotebook, RemoveMember } from "@/components/notebook-admin";

export default async function MembersPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { user, notebook, membership, holding } = await requireNotebook(slug);
  const isOwner = membership.role === "owner";

  const memberships = await prisma.membership.findMany({
    where: { notebookId: notebook.id },
    include: { user: { select: { id: true, name: true } } },
    orderBy: { order: "asc" },
  });
  const next = nextInTurn(memberships, notebook.holderId);

  return (
    <div className="app">
      <Masthead sub={notebook.name}>
        <PaperLink href={`/n/${notebook.slug}`} className="masthead-link">
          ノートへ戻る
        </PaperLink>
      </Masthead>

      <div className="stage">
        <div className="scroll-tate">
          <div className="roster tate fade-in">
            <section className="panel">
              <h1 className="panel-title">招待コード</h1>
              <InviteCode
                notebookId={notebook.id}
                code={notebook.inviteCode}
                canRegenerate={isOwner}
              />
              <p className="caption">
                このコードを渡した人だけが、
                <br />
                このノートに入れます。
                <br />
                入った人は、回る順の
                <br />
                いちばん後ろにつきます。
              </p>
              {!isOwner ? <LeaveNotebook notebookId={notebook.id} /> : null}
            </section>

            {memberships.map((member) => {
              const isMe = member.userId === user.id;
              const hasIt = notebook.holderId === member.userId;

              return (
                <div key={member.id} className="person">
                  <span className="person-name">
                    {member.user.name ?? "名もなき人"}
                    {isMe ? "（じぶん）" : ""}
                  </span>

                  {hasIt ? <span className="person-here">いま持っている</span> : null}
                  {!hasIt && member.userId === next?.userId ? (
                    <span className="person-turn">次の番</span>
                  ) : null}

                  <span className="person-role">
                    {member.role === "owner" ? "つくった人" : "仲間"}
                  </span>
                  <span className="person-role">
                    {kanjiDateShort(member.joinedAt)}から
                  </span>

                  {/* ノートが手元にあるなら、この人に渡せる */}
                  {holding && !isMe ? (
                    <HandOver
                      notebookId={notebook.id}
                      toUserId={member.userId}
                      name={member.user.name ?? "名もなき人"}
                      isNext={member.userId === next?.userId}
                      vertical
                    />
                  ) : null}

                  {isOwner && !isMe && member.role !== "owner" && !hasIt ? (
                    <RemoveMember
                      notebookId={notebook.id}
                      userId={member.userId}
                      name={member.user.name ?? "名もなき人"}
                    />
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
