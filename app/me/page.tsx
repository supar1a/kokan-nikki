import { requireUser } from "@/lib/auth";
import { forgetAction, renameAction } from "@/app/actions/identity";
import { Masthead } from "@/components/masthead";
import { PaperLink } from "@/components/paper-link";
import { RenameForm, Forget } from "@/components/identity-forms";

export const metadata = { title: "名前 — 短冊" };

export default async function MePage() {
  const user = await requireUser();

  return (
    <>
      <Masthead>
        <PaperLink href="/" className="masthead-link">
          グループ
        </PaperLink>
      </Masthead>

      <main className="leaf fade-in">
        <section className="leaf-section">
          <h1 className="leaf-heading">名前</h1>
          <p className="leaf-lede">
            グループの中で、こう呼ばれます。いつでも変えられます。
          </p>
          <RenameForm action={renameAction} current={user.name} />
        </section>

        <section className="leaf-section">
          <h1 className="leaf-heading">このブラウザから消す</h1>
          <p className="leaf-lede">
            この名前は、このブラウザにだけ残っています。消すと、
            グループの URL をひらいて名前を選び直すまで戻れません。
            書いたものはそのまま残ります。
          </p>
          <Forget action={forgetAction} />
        </section>
      </main>
    </>
  );
}
