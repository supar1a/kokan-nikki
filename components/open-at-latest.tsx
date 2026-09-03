"use client";

import { useEffect } from "react";

/**
 * ノートをひらいたとき、いちばん新しいところが目の前に来るようにする。
 * 栞があれば、そこを右端に寄せて「ここから新しい」を最初に見せる。
 *
 * 縦組みの巻きでは scrollLeft の符号が環境で割れるので、
 * 位置を測って差分で動かす。
 */
export function OpenAtLatest({
  scrollerId,
  shioriId,
}: {
  scrollerId: string;
  shioriId?: string;
}) {
  useEffect(() => {
    const scroller = document.getElementById(scrollerId);
    if (!scroller) return;

    const view = scroller.getBoundingClientRect();
    const margin = 24;

    const shiori = shioriId ? document.getElementById(shioriId) : null;
    if (shiori) {
      const box = shiori.getBoundingClientRect();
      scroller.scrollLeft += box.right - (view.right - margin);
      return;
    }

    const last = scroller.querySelector<HTMLElement>("[data-stream] > :last-child");
    if (!last) return;
    const box = last.getBoundingClientRect();
    scroller.scrollLeft += box.left - (view.left + margin);
  }, [scrollerId, shioriId]);

  return null;
}
