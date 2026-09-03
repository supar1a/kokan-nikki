import { notFound } from "next/navigation";
import { requireNotebook } from "@/lib/guards";
import { writePageAction } from "@/app/actions/pages";
import { Masthead } from "@/components/masthead";
import { PaperLink } from "@/components/paper-link";
import { Composer } from "@/components/composer";

export const metadata = { title: "書く — 交換日記" };

export default async function WritePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { notebook, holding } = await requireNotebook(slug);
  // 書けるのは、ノートが手元にあるときだけ
  if (!holding) notFound();

  return (
    <div className="app">
      <Masthead sub={notebook.name}>
        <PaperLink href={`/n/${notebook.slug}`} className="masthead-link">
          やめる
        </PaperLink>
      </Masthead>

      <div className="stage fade-in">
        <Composer
          action={writePageAction}
          hidden={{ notebookId: notebook.id }}
          submitLabel="書きとめる"
          note="渡すまでは、まだ誰にも見えません"
        />
      </div>
    </div>
  );
}
