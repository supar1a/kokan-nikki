import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { kanjiDateShort, kanjiNumber } from "@/lib/kanji";
import { Masthead } from "@/components/masthead";
import { PaperLink } from "@/components/paper-link";
import { signOutAction } from "@/app/actions/auth";

export const metadata = { title: "グループ — 短冊" };

export default async function PlacesPage() {
  const user = await requireUser();

  const places = await prisma.place.findMany({
    where: { memberships: { some: { userId: user.id } } },
    include: { _count: { select: { memberships: true } } },
    orderBy: { createdAt: "asc" },
  });

  const tallies = places.length
    ? await prisma.slip.groupBy({
        by: ["placeId"],
        where: { placeId: { in: places.map((p) => p.id) }, published: true },
        _count: { _all: true },
        _max: { createdAt: true },
      })
    : [];
  const tallyOf = new Map(tallies.map((t) => [t.placeId, t]));

  return (
    <div className="app">
      <Masthead sub={`${user.name} さん`}>
        <PaperLink href="/new" className="masthead-link" voice="rustle">
          作成・参加
        </PaperLink>
        {user.passKey ? (
          <PaperLink href="/modoriguchi" className="masthead-link" voice="rustle">
            ログイン用URL
          </PaperLink>
        ) : null}
        <form action={signOutAction}>
          <button type="submit" className="btn btn-quiet" style={{ fontSize: "0.72rem" }}>
            ログアウト
          </button>
        </form>
      </Masthead>

      <div className="stage">
        <div className="scroll-tate">
          {places.length === 0 ? (
            <div className="hollow tate fade-in">
              <p>まだグループがありません。</p>
              <PaperLink href="/new" className="btn" voice="rustle">
                作成・参加
              </PaperLink>
            </div>
          ) : (
            <div className="stream tate fade-in">
              {places.map((place) => {
                const tally = tallyOf.get(place.id);
                const written = tally?._count._all ?? 0;
                const last = tally?._max.createdAt ?? null;

                return (
                  <PaperLink key={place.id} href={`/b/${place.slug}`} className="book">
                    <div className="slip-head">
                      <h2 className="book-name">{place.name}</h2>
                      <div className="slip-meta">
                        <span>{kanjiNumber(place._count.memberships)}人</span>
                        <span>
                          {written > 0 ? `${kanjiNumber(written)}枚` : "まだ何もない"}
                        </span>
                        {last ? <span>{kanjiDateShort(last)}</span> : null}
                      </div>
                    </div>
                    {place.description ? (
                      <p className="book-note">{place.description}</p>
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
