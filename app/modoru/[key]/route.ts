import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { issueSession } from "@/lib/auth";

/**
 * 戻り口。名前だけで始めた人が、次に来るときの入口。
 * この URL を知っていること自体が名乗りになるので、人に見せないこと。
 */
export async function GET(request: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;

  const user = await prisma.user.findUnique({ where: { passKey: key } });
  if (!user) {
    return NextResponse.redirect(new URL("/login?error=Modoriguchi", request.url));
  }

  const cookie = await issueSession(user.id);
  const response = NextResponse.redirect(new URL("/", request.url));
  response.cookies.set(cookie.name, cookie.value, cookie.options);
  return response;
}
