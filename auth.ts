import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
import { mailLink } from "@/lib/mail";

/** Google の鍵が入っていないうちは、その釦を出さない。 */
export const googleEnabled = Boolean(
  process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET,
);

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  // セッションは DB の表で持つ（メールのリンクを使うので、これが要る）
  session: { strategy: "database" },
  pages: {
    signIn: "/login",
    verifyRequest: "/login/todoita",
    error: "/login",
  },
  providers: googleEnabled ? [mailLink, Google] : [mailLink],
  callbacks: {
    session({ session, user }) {
      session.user.id = user.id;
      return session;
    },
  },
});
