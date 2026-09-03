import { redirect } from "next/navigation";
import { googleEnabled, mailEnabled } from "@/auth";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import {
  debugSignInAction,
  googleSignInAction,
  mailSignInAction,
  startWithNameAction,
} from "@/app/actions/auth";
import { DebugGate, GoogleGate, MailGate, StartGate } from "@/components/gate-forms";
import { GateMark } from "@/components/gate-mark";

export const metadata = { title: "はじめる — 短冊" };

const isDev = process.env.NODE_ENV !== "production";

/** Auth.js などから戻ってくる合図を、こちらの言葉に置き換える */
function troubleOf(code: string | undefined) {
  switch (code) {
    case undefined:
      return null;
    case "Modoriguchi":
      return "その戻り口は見つかりませんでした。URL を確かめてください。";
    case "Verification":
      return "そのリンクは期限が切れているか、もう使われています。もう一度どうぞ。";
    case "OAuthAccountNotLinked":
      return "そのメールアドレスは、別のやり方ですでに使われています。前と同じやり方でお入りください。";
    case "AccessDenied":
      return "入れませんでした。";
    case "Configuration":
      return "こちらの設定に不備があります。しばらくしてから、もう一度。";
    default:
      return "うまくいきませんでした。もう一度どうぞ。";
  }
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await getCurrentUser()) redirect("/");

  const { error } = await searchParams;
  const trouble = troubleOf(error);
  const hasOtherDoors = googleEnabled || mailEnabled;

  const people = isDev
    ? await prisma.user.findMany({
        orderBy: { createdAt: "asc" },
        take: 8,
        select: { id: true, name: true, email: true },
      })
    : [];

  return (
    <main className="gate">
      <div className="gate-inner fade-in">
        <GateMark />
        <div className="gate-form">
          <p className="gate-heading">はじめる</p>

          {trouble ? <p className="notice">{trouble}</p> : null}

          <StartGate action={startWithNameAction} />

          <p className="leaf-lede">
            名前だけで始められます。
            <br />
            前に来たことがある方は、そのとき控えた「戻り口」の URL からどうぞ。
          </p>

          {hasOtherDoors ? (
            <>
              <p className="gate-divider">ほかの入り方</p>
              {googleEnabled ? <GoogleGate action={googleSignInAction} /> : null}
              {mailEnabled ? <MailGate action={mailSignInAction} showDivider={false} /> : null}
            </>
          ) : null}

          {isDev ? <DebugGate people={people} action={debugSignInAction} /> : null}
        </div>
      </div>
    </main>
  );
}
