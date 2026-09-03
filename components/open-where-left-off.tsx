"use client";

import { useEffect } from "react";
import type { Landing } from "@/lib/place";

/**
 * 巻物をひらいたとき、前に読んだ続きから立てるようにする。
 *
 * 並びは古い順なので、既定では右端（はじまり）に立つ。
 * 前に見たあとに書かれた分があれば、その目印を右端に寄せる。
 * 新しい分がなければ、いちばん新しいところ（左端）へ。
 *
 * 縦組みの巻きでは scrollLeft の符号が環境で割れるので、位置を測って差分で動かす。
 */
export function OpenWhereLeftOff({
  scrollerId,
  markId,
  landing,
}: {
  scrollerId: string;
  markId: string;
  landing: Landing["land"];
}) {
  useEffect(() => {
    if (landing === "start") return; // 既定の位置でよい

    const scroller = document.getElementById(scrollerId);
    if (!scroller) return;

    const view = scroller.getBoundingClientRect();
    const margin = 24;

    if (landing === "mark") {
      const mark = document.getElementById(markId);
      if (!mark) return;
      const box = mark.getBoundingClientRect();
      scroller.scrollLeft += box.right - (view.right - margin);
      return;
    }

    const last = scroller.querySelector<HTMLElement>("[data-stream] > :last-child");
    if (!last) return;
    const box = last.getBoundingClientRect();
    scroller.scrollLeft += box.left - (view.left + margin);
  }, [scrollerId, markId, landing]);

  return null;
}
