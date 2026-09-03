import { redirect } from "next/navigation";
import { requireSignedIn } from "@/lib/auth";
import { setNameAction } from "@/app/actions/auth";
import { NameGate } from "@/components/gate-forms";
import { GateMark } from "@/components/gate-mark";

export const metadata = { title: "名を決める — 交換日記" };

export default async function NamePage() {
  const user = await requireSignedIn();
  if (user.name) redirect("/");

  return (
    <main className="gate">
      <div className="gate-inner fade-in">
        <GateMark />
        <NameGate action={setNameAction} />
      </div>
    </main>
  );
}
