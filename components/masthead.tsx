import { PaperLink } from "./paper-link";
import { SoundToggle } from "./sound-toggle";

export function Masthead({
  sub,
  children,
}: {
  sub?: string;
  children?: React.ReactNode;
}) {
  return (
    <>
      <header className="masthead">
        <PaperLink href="/" className="masthead-title">
          短冊
        </PaperLink>
        {sub ? <span className="masthead-sub">{sub}</span> : null}
        <nav className="masthead-nav">
          {children}
          <SoundToggle />
        </nav>
      </header>
      <div className="masthead-rule" />
    </>
  );
}
