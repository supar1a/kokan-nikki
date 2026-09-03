import { requireUser } from "@/lib/auth";
import { createNotebookAction, joinNotebookAction } from "@/app/actions/notebooks";
import { Masthead } from "@/components/masthead";
import { PaperLink } from "@/components/paper-link";
import { CreateNotebookForm, JoinNotebookForm } from "@/components/notebook-forms";

export const metadata = { title: "ノートをつくる — 交換日記" };

export default async function NewNotebookPage() {
  await requireUser();

  return (
    <>
      <Masthead>
        <PaperLink href="/" className="masthead-link">
          ノート一覧
        </PaperLink>
      </Masthead>

      <main className="leaf fade-in">
        <section className="leaf-section">
          <h1 className="leaf-heading">ノートをつくる</h1>
          <p className="leaf-lede">
            一冊のノートを、仲間うちで順番に回します。ノートはいつも誰か一人の手元にあり、
            持っている人だけが書けます。書いた頁は、次の人に渡したときに封じられ、そこではじめて皆が読めます。
          </p>
          <CreateNotebookForm action={createNotebookAction} />
        </section>

        <section className="leaf-section">
          <h1 className="leaf-heading">招待コードで入る</h1>
          <JoinNotebookForm action={joinNotebookAction} />
        </section>
      </main>
    </>
  );
}
