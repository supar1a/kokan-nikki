"use client";

import { useSound } from "./sound-provider";

export function SoundToggle() {
  const { muted, toggle } = useSound();

  return (
    <button
      type="button"
      onClick={toggle}
      className="btn btn-quiet"
      style={{ fontSize: "0.72rem", letterSpacing: "0.2em" }}
      aria-pressed={!muted}
      title={muted ? "紙の音を鳴らす" : "紙の音を止める"}
    >
      {muted ? "音 —" : "音 ●"}
    </button>
  );
}
