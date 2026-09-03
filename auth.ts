import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
import { mailLink } from "@/lib/mail";

/** Google の鍵が入っていないうちは、その釦を出さない。 */
export const googleEnabled = Boolean(
  process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET,
);

/**
 * メールで入る道を出してよいか。
 * 本番で送る手立て（RESEND_API_KEY）が無いのに出すと、送ったつもりで
 * 誰も入れない行き止まりになる。開発中はリンクが端末に出るので、常に出す。
 */
export const mailEnabled =
  process.env.NODE_ENV !== "production" || Boolean(process.env.RESEND_API_KEY);

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  // セッションは DB の表で持つ（メールのリンクを使うので、これが要る）
  session: { strategy: "database" },
  pages: {
    signIn: "/login",
    verifyRequest: "/login/todoita",
    error: "/login",
  },
  providers: googleEnabled
    ? [
        mailLink,
        Google({
          // 同じメールアドレスなら、メールのリンクで作った名乗りに結びつける。
          // これを入れないと、先にメールで入った人が Google で入り直せない。
          // 結びつける以上、下の signIn で「Google 側で確認済みのアドレスか」を
          // 必ず見る（未確認のまま通すと、他人の名乗りに入り込めてしまう）。
          allowDangerousEmailAccountLinking: true,
        }),
      ]
    : [mailLink],
  callbacks: {
    signIn({ account, profile }) {
      if (account?.provider === "google") {
        return profile?.email_verified === true;
      }
      return true;
    },
    session({ session, user }) {
      session.user.id = user.id;
      return session;
    },
  },
});
