import { Fragment } from "react";
import { prisma } from "@/lib/db";
import { openPlace, readableSlips } from "@/lib/guards";
import { readingMark } from "@/lib/place";
import { joinAction } from "@/app/actions/identity";
import { Masthead } from "@/components/masthead";
import { PaperLink } from "@/components/paper-link";
import { SlipColumn } from "@/components/slip-column";
import { MarkAsRead } from "@/components/mark-as-read";
import { OpenWhereLeftOff } from "@/components/open-where-left-off";
import { GateMark } from "@/components/gate-mark";
import { JoinAsMe, PickMe, StartForm } from "@/components/identity-forms";

const SCROLLER = "scroller";
const MARK = "unread-mark";

export default async function PlacePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { user, place, membership } = await openPlace(slug);

  // ── この URL が招待状。まだ中にいない人には、まず名乗ってもらう。 ──
  if (!membership) {
    const members = await prisma.membership.findMany({
      where: { placeId: place.id },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { joinedAt: "asc" },
    });

    return (
      <main className="gate">
        <div className="gate-inner fade-in">
          <GateMark />
          <div className="gate-form">
            <p className="gate-heading">{place.name}</p>
            {place.description ? <p className="leaf-lede">{place.description}</p> : null}

            {user ? (
              <JoinAsMe action={joinAction} slug={slug} name={user.name} />
            ) : (
              <>
                <p className="leaf-lede">
                  このグループに招待されています。
                  <br />
                  呼ばれたい名前をひとつ、決めてください。
                </p>
                <StartForm
                  action={joinAction}
                  label="参加する"
                  hidden={{ slug }}
                />
                <PickMe
                  slug={slug}
                  people={members.map((m) => ({ id: m.user.id, name: m.user.name }))}
                />
              </>
            )}
          </div>
        </div>
      </main>
    );
  }

  // 古い順。縦組みでは、右から左へ流れる向きになる。
  const slips = await readableSlips(place.id, user!.id);
  const mark = readingMark(slips, membership.lastReadAt);

  return (
    <div className="app">
      <Masthead sub={place.name}>
        <PaperLink href={`/b/${slug}/write`} className="masthead-link" voice="rustle">
          書く
        </PaperLink>
        <PaperLink href={`/b/${slug}/members`} className="masthead-link" voice="rustle">
          メンバー
        </PaperLink>
        <PaperLink href="/" className="masthead-link">
          グループ
        </PaperLink>
      </Masthead>

      <div className="stage">
        <div className="scroll-tate" id={SCROLLER}>
          <div className="stream tate fade-in" data-stream>
            {slips.length === 0 ? (
              <p className="waiting">
                まだ何もありません。
                <br />
                いちばん最初の一枚をどうぞ。
              </p>
            ) : (
              <p className="stream-end">ここが、はじまり</p>
            )}

            {slips.map((slip, index) => (
              <Fragment key={slip.id}>
                {index === mark.at ? (
                  <div className="unread-mark" id={MARK}>
                    <span className="unread-mark-label">ここから未読</span>
                  </div>
                ) : null}
                <SlipColumn slip={slip} slug={slug} />
              </Fragment>
            ))}

            {/* 巻物の左端。次の一枚が書かれる場所。 */}
            <PaperLink href={`/b/${slug}/write`} className="blankpage" voice="rustle">
              <span className="blankpage-lede">書く</span>
              <span className="blankpage-hint">
                なんでもいい。
                <br />
                整っていなくていい。
              </span>
            </PaperLink>
          </div>
        </div>

        <OpenWhereLeftOff scrollerId={SCROLLER} markId={MARK} landing={mark.land} />
      </div>

      <MarkAsRead placeId={place.id} />
    </div>
  );
}
