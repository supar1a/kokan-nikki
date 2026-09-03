"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { useSound } from "./sound-provider";
import type { Voice } from "@/lib/sound";

type Props = ComponentProps<typeof Link> & { voice?: Voice };

/** 移動のたびに、紙を繰る音がする。 */
export function PaperLink({ voice = "turn", onClick, ...props }: Props) {
  const { play } = useSound();

  return (
    <Link
      {...props}
      onClick={(event) => {
        play(voice);
        onClick?.(event);
      }}
    />
  );
}
