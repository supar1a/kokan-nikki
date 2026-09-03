import { notFound } from "next/navigation";
import { requireReadablePage } from "@/lib/guards";
import { savePageAction } from "@/app/actions/pages";
import { Masthead } from "@/components/masthead";
import { PaperLink } from "@/components/paper-link";
import { Composer } from "@/components/composer";

export const metadata = { title: "直す — 交換日記" };

export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { page, canEdit } = await requireReadablePage(id);
  // 封じられた頁は、もう直せない
  if (!canEdit) notFound();

  return (
    <div className="app">
      <Masthead sub={page.notebook.name}>
        <PaperLink href={`/p/${page.id}`} className="masthead-link">
          やめる
        </PaperLink>
      </Masthead>

      <div className="stage fade-in">
        <Composer
          action={savePageAction}
          hidden={{ pageId: page.id }}
          defaultBody={page.body}
          submitLabel="直す"
          note="渡すまでは、何度でも直せます"
        />
      </div>
    </div>
  );
}
