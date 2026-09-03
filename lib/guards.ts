import { notFound } from "next/navigation";
import { prisma } from "./db";
import { requireUser } from "./auth";

const AUTHOR = { select: { id: true, name: true } } as const;

/** ノートは仲間だけのもの。外の人には、あることすら伏せる。 */
export async function requireNotebook(slug: string) {
  const user = await requireUser();

  const notebook = await prisma.notebook.findUnique({
    where: { slug },
    include: { holder: { select: { id: true, name: true } } },
  });
  if (!notebook) notFound();

  const membership = await prisma.membership.findUnique({
    where: { userId_notebookId: { userId: user.id, notebookId: notebook.id } },
  });
  if (!membership) notFound();

  return { user, notebook, membership, holding: notebook.holderId === user.id };
}

/**
 * 読んでよい頁を、書かれた順に（古いほうが先）。
 * 手元にあるなら全部。無いなら、最後に手放したときまでに封じられた分だけ。
 */
export async function readablePages(
  notebookId: string,
  membership: { heldUntil: Date | null },
  holding: boolean,
) {
  if (holding) {
    return prisma.page.findMany({
      where: { notebookId },
      include: { author: AUTHOR },
      orderBy: { createdAt: "asc" },
    });
  }
  if (!membership.heldUntil) return [];

  return prisma.page.findMany({
    // 封じられていない頁（＝いま持っている人の書きかけ）は、ここに入らない
    where: { notebookId, sealedAt: { lte: membership.heldUntil } },
    include: { author: AUTHOR },
    orderBy: { createdAt: "asc" },
  });
}

export async function requireReadablePage(pageId: string) {
  const user = await requireUser();

  const page = await prisma.page.findUnique({
    where: { id: pageId },
    include: {
      author: AUTHOR,
      notebook: { include: { holder: { select: { id: true, name: true } } } },
    },
  });
  if (!page) notFound();

  const membership = await prisma.membership.findUnique({
    where: { userId_notebookId: { userId: user.id, notebookId: page.notebookId } },
  });
  if (!membership) notFound();

  const holding = page.notebook.holderId === user.id;
  const readable = holding
    ? true
    : Boolean(page.sealedAt && membership.heldUntil && page.sealedAt <= membership.heldUntil);
  if (!readable) notFound();

  const isAuthor = page.authorId === user.id;

  return {
    user,
    page,
    membership,
    holding,
    isAuthor,
    // 封じられる前の、自分の頁だけが直せる
    canEdit: isAuthor && !page.sealedAt && holding,
  };
}
