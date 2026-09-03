import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";
import type { EmailConfig } from "next-auth/providers/email";

/**
 * ログイン用のリンクの届け方。
 *
 * RESEND_API_KEY を入れれば実際に送る。入っていなければ、端末（`npm run dev` を
 * 動かしている画面）と .mail/log.txt に出すだけ。本番でも鍵が無ければ後者になり、
 * リンクはサーバーのログにしか出ないので、他の人はメールでは入れない。
 *
 * SMTP を使いたいときは `npm i nodemailer` して、下の mailLink を
 * next-auth/providers/nodemailer の Nodemailer({ server, from }) に置き換える。
 */

const MAILBOX = path.join(process.cwd(), ".mail");
const FROM = process.env.MAIL_FROM ?? "交換日記 <onboarding@resend.dev>";
const LINK_MINUTES = 15;

async function deliver(to: string, url: string, expires: Date) {
  if (process.env.RESEND_API_KEY) {
    await sendWithResend(to, url);
    return;
  }
  await writeToTerminal(to, url, expires);
}

async function sendWithResend(to: string, url: string) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM,
      to,
      subject: "交換日記にログイン",
      text: [
        "下のリンクをひらくと、そのまま入れます。",
        "",
        url,
        "",
        `このリンクは${LINK_MINUTES}分で切れ、一度使うと消えます。`,
        "心当たりがなければ、この文は捨ててください。",
      ].join("\n"),
    }),
  });

  if (!response.ok) {
    throw new Error(`メールを送れませんでした（${response.status}）: ${await response.text()}`);
  }
}

async function writeToTerminal(to: string, url: string, expires: Date) {
  const until = expires.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });

  console.log(
    [
      "",
      "  ┌─ 交換日記 ── ログイン用のリンク ────────────────",
      `  │ 宛先　${to}`,
      `  │ 期限　${until} まで（${LINK_MINUTES}分）`,
      "  │",
      `  │ ${url}`,
      "  └────────────────────────────────────────────────",
      "",
    ].join("\n"),
  );

  try {
    await mkdir(MAILBOX, { recursive: true });
    await appendFile(
      path.join(MAILBOX, "log.txt"),
      `${new Date().toISOString()}\t${to}\t${url}\n`,
      "utf8",
    );
  } catch {
    // 書けなくても、端末には出ている
  }
}

export const mailLink: EmailConfig = {
  id: "mail",
  type: "email",
  name: "メール",
  from: FROM,
  maxAge: LINK_MINUTES * 60,
  options: {},
  async sendVerificationRequest({ identifier, url, expires }) {
    await deliver(identifier, url, expires);
  },
};
