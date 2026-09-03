import { prisma } from "@/lib/db";
import { requirePlace } from "@/lib/guards";
import { kanjiDateShort } from "@/lib/kanji";
import { Masthead } from "@/components/masthead";
import { PaperLink } from "@/components/paper-link";
import { LeavePlace, Passphrase, RemoveMember } from "@/components/place-admin";

export default async function MembersPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { user, place, membership } = await requirePlace(slug);
  const isOwner = membership.role === "owner";

  const members = await prisma.membership.findMany({
    where: { placeId: place.id },
    include: { user: { select: { id: true, name: true } } },
    orderBy: { joinedAt: "asc" },
  });

  return (
    <div className="app">
      <Masthead sub={place.name}>
        <PaperLink href={`/b/${slug}`} className="masthead-link">
          グループへ戻る
        </PaperLink>
      </Masthead>

      <div className="stage">
        <div className="scroll-tate">
          <div className="roster tate fade-in">
            <section className="panel">
              <h1 className="panel-title">合言葉</h1>
              <Passphrase
                placeId={place.id}
                passphrase={place.passphrase}
                canChange={isOwner}
              />
              <p className="caption">
                これを伝えた人だけが、
                <br />
                このグループに入れます。
              </p>
              {!isOwner ? <LeavePlace placeId={place.id} /> : null}
            </section>

            {members.map((member) => {
              const isMe = member.userId === user.id;
              const name = member.user.name ?? "名もなき人";

              return (
                <div key={member.id} className="person">
                  <PaperLink
                    href={`/b/${slug}/by/${member.userId}`}
                    className="person-name slip-who"
                    voice="rustle"
                  >
                    {name}
                    {isMe ? "（自分）" : ""}
                  </PaperLink>

                  <span className="person-role">
                    {member.role === "owner" ? "作成者" : "メンバー"}
                  </span>
                  <span className="person-role">
                    {kanjiDateShort(member.joinedAt)}から
                  </span>

                  {isOwner && !isMe && member.role !== "owner" ? (
                    <RemoveMember placeId={place.id} userId={member.userId} name={name} />
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
