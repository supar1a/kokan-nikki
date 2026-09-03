import { Fragment } from "react";
import { requirePlace, readableSlips } from "@/lib/guards";
import { markerAt } from "@/lib/place";
import { Masthead } from "@/components/masthead";
import { PaperLink } from "@/components/paper-link";
import { SlipColumn } from "@/components/slip-column";
import { MarkAsRead } from "@/components/mark-as-read";

export default async function PlacePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { user, place, membership } = await requirePlace(slug);

  const slips = await readableSlips(place.id, user.id);
  const marker = markerAt(slips, membership.lastReadAt);

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
        <div className="scroll-tate">
          <div className="stream tate fade-in">
            {/* 右端がいちばん新しい。ひらいたら、まず白紙が目の前にある。 */}
            <PaperLink href={`/b/${slug}/write`} className="blankpage" voice="rustle">
              <span className="blankpage-lede">書く</span>
              <span className="blankpage-hint">
                なんでもいい。
                <br />
                整っていなくていい。
              </span>
            </PaperLink>

            {slips.length === 0 ? (
              <p className="waiting">
                まだ何もありません。
                <br />
                いちばん最初の一枚をどうぞ。
              </p>
            ) : null}

            {slips.map((slip, index) => (
              <Fragment key={slip.id}>
                {index === marker ? (
                  <div className="unread-mark">
                    <span className="unread-mark-label">未読はここまで</span>
                  </div>
                ) : null}
                <SlipColumn slip={slip} slug={slug} />
              </Fragment>
            ))}

            {slips.length > 0 ? (
              <p className="stream-end">ここが、はじまり</p>
            ) : null}
          </div>
        </div>
      </div>

      <MarkAsRead placeId={place.id} />
    </div>
  );
}
