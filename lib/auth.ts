import { redirect } from "next/navigation";
import { cache } from "react";
import { auth } from "@/auth";
import { prisma } from "./db";

/** いま名乗っている人。名をまだ決めていなくても返す。 */
export const getCurrentUser = cache(async () => {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;
  return prisma.user.findUnique({ where: { id } });
});

/** 戸を通っただけの人。名を決める画面だけがこれを使う。 */
export async function requireSignedIn() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** 名乗りを求める。メールのリンクで来た人は名がまだないので、先に決めてもらう。 */
export async function requireUser() {
  const user = await requireSignedIn();
  const { name } = user;
  if (!name) redirect("/namae");
  return { ...user, name };
}
