import { requireUser } from "@/lib/auth";
import { suggestPassphrase } from "@/lib/ids";
import { createPlaceAction } from "@/app/actions/places";
import { Masthead } from "@/components/masthead";
import { PaperLink } from "@/components/paper-link";
import { CreatePlaceForm } from "@/components/place-forms";

export const metadata = { title: "グループを作る — 短冊" };

export default async function NewPlacePage() {
  await requireUser();

  return (
    <>
      <Masthead>
        <PaperLink href="/" className="masthead-link">
          グループ
        </PaperLink>
      </Masthead>

      <main className="leaf fade-in">
        <section className="leaf-section">
          <h1 className="leaf-heading">グループを作る</h1>
          <p className="leaf-lede">
            作ると招待用の URL ができます。それを渡した人だけが入れます。
            中に書いたものは、そのメンバーだけが読みます。
          </p>
          <CreatePlaceForm action={createPlaceAction} suggestion={suggestPassphrase()} />
        </section>
      </main>
    </>
  );
}
