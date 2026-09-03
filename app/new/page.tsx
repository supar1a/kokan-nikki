import { requireUser } from "@/lib/auth";
import { suggestPassphrase } from "@/lib/ids";
import { createPlaceAction, joinPlaceAction } from "@/app/actions/places";
import { Masthead } from "@/components/masthead";
import { PaperLink } from "@/components/paper-link";
import { CreatePlaceForm, JoinPlaceForm } from "@/components/place-forms";

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
            合言葉を知っている人だけが入れます。中に書いたものは、そのメンバーだけが読みます。
          </p>
          <CreatePlaceForm action={createPlaceAction} suggestion={suggestPassphrase()} />
        </section>

        <section className="leaf-section">
          <h1 className="leaf-heading">合言葉で参加する</h1>
          <JoinPlaceForm action={joinPlaceAction} />
        </section>
      </main>
    </>
  );
}
