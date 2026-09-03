import { PaperLink } from "@/components/paper-link";
import { GateMark } from "@/components/gate-mark";

export const metadata = { title: "文を送りました — 交換日記" };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function MailSentPage({
  searchParams,
}: {
  searchParams: Promise<{ to?: string }>;
}) {
  const { to } = await searchParams;
  const sentTo = to && to.length <= 254 && EMAIL_RE.test(to) ? to : null;

  return (
    <main className="gate">
      <div className="gate-inner fade-in">
        <GateMark />
        <div className="gate-form">
          <p className="gate-heading">文を送りました</p>
          {sentTo ? <p className="gate-sentto">{sentTo}</p> : null}
          <p className="leaf-lede">
            届いたメールのリンクをひらくと、そのまま入れます。
            <br />
            リンクは十五分で切れます。
          </p>

          {process.env.NODE_ENV !== "production" ? (
            <p className="caption">
              開発中は、リンクを端末（<code className="code">npm run dev</code> を動かしている画面）と
              <code className="code">.mail/log.txt</code> にも出しています。
            </p>
          ) : null}

          <div className="gate-actions">
            <PaperLink href="/login" className="gate-alt" voice="rustle">
              送り直す
            </PaperLink>
          </div>
        </div>
      </div>
    </main>
  );
}
