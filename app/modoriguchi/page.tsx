import { headers } from "next/headers";
import { requireUser } from "@/lib/auth";
import { PaperLink } from "@/components/paper-link";
import { GateMark } from "@/components/gate-mark";
import { ReturnLink } from "@/components/return-link";

export const metadata = { title: "戻り口 — 短冊" };

export default async function ReturnGatePage({
  searchParams,
}: {
  searchParams: Promise<{ hajimete?: string }>;
}) {
  const user = await requireUser();
  const { hajimete } = await searchParams;
  const first = hajimete === "1";

  const head = await headers();
  const proto = head.get("x-forwarded-proto") ?? "http";
  const host = head.get("host") ?? "localhost:3000";
  const url = user.passKey ? `${proto}://${host}/modoru/${user.passKey}` : null;

  return (
    <main className="gate">
      <div className="gate-inner fade-in">
        <GateMark />
        <div className="gate-form">
          <p className="gate-heading">{first ? "ようこそ、" + user.name + "さん" : "戻り口"}</p>

          {url ? (
            <>
              <p className="leaf-lede">
                次にここへ来るときは、この URL をひらいてください。
                <br />
                <strong>いま控えておかないと、この名乗りには戻れなくなります。</strong>
              </p>

              <ReturnLink url={url} />

              <p className="caption">
                この URL を知っている人は、あなたとして入れます。人に見せないでください。
                <br />
                うっかり見られたときは「作り直す」を押すと、前の URL は使えなくなります。
              </p>
            </>
          ) : (
            <p className="leaf-lede">
              あなたは{user.email ? "メール" : "外の名乗り"}で入っているので、戻り口は要りません。
              いつもの入口からどうぞ。
            </p>
          )}

          <div className="gate-actions">
            <PaperLink href="/" className="btn" voice="turn">
              ノートへ
            </PaperLink>
          </div>
        </div>
      </div>
    </main>
  );
}
