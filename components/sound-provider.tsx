"use client";

import { createContext, useCallback, useContext, useEffect, useSyncExternalStore } from "react";
import {
  getMuted,
  getMutedOnServer,
  playVoice,
  setMuted,
  subscribeMuted,
  unlockAudio,
  type Voice,
} from "@/lib/sound";

type SoundApi = {
  muted: boolean;
  toggle: () => void;
  play: (voice: Voice) => void;
};

const SoundContext = createContext<SoundApi>({
  muted: false,
  toggle: () => {},
  play: () => {},
});

export function useSound() {
  return useContext(SoundContext);
}

export function SoundProvider({ children }: { children: React.ReactNode }) {
  const muted = useSyncExternalStore(subscribeMuted, getMuted, getMutedOnServer);

  // 自動再生の制限があるので、最初の接触で AudioContext を起こす
  useEffect(() => {
    const wake = () => unlockAudio();
    window.addEventListener("pointerdown", wake, { once: true });
    window.addEventListener("keydown", wake, { once: true });
    return () => {
      window.removeEventListener("pointerdown", wake);
      window.removeEventListener("keydown", wake);
    };
  }, []);

  const play = useCallback(
    (voice: Voice) => {
      if (muted) return;
      playVoice(voice);
    },
    [muted],
  );

  const toggle = useCallback(() => {
    const next = !getMuted();
    setMuted(next);
    if (!next) playVoice("tick");
  }, []);

  return (
    <SoundContext.Provider value={{ muted, toggle, play }}>{children}</SoundContext.Provider>
  );
}
