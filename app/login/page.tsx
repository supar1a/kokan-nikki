import { redirect } from "next/navigation";
import { googleEnabled } from "@/auth";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { debugSignInAction, googleSignInAction, mailSignInAction } from "@/app/actions/auth";
import { DebugGate, GoogleGate, MailGate } from "@/components/gate-forms";
import { GateMark } from "@/components/gate-mark";

export const metadata = { title: "ひらく — 交換日記" };

const isDev = process.env.NODE_ENV !== "production";

/** Auth.js から戻ってくる合図を、こちらの言葉に置き換える */
function troubleOf(code: string | undefined) {
  switch (code) {
    case undefined:
      return null;
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
          <p className="gate-heading">戸を叩く</p>

          {trouble ? <p className="notice">{trouble}</p> : null}

          {googleEnabled ? <GoogleGate action={googleSignInAction} /> : null}
          <MailGate action={mailSignInAction} showDivider={googleEnabled} />

          <p className="leaf-lede">はじめての人も、この戸から入れます。</p>

          {isDev ? <DebugGate people={people} action={debugSignInAction} /> : null}
        </div>
      </div>
    </main>
  );
}
