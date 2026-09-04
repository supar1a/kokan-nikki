"use client";

import { useEffect } from "react";

/**
 * 巻物をひらいたら、いつも左端（いちばん新しいところ）に立つ。
 *
 * スマホでもPCでも、開く場所がいつも同じであってほしいので、
 * 読みかけの位置ではなく、常にここに合わせる。
 *
 * 縦組みの巻きでは scrollLeft の符号が環境で割れるので、位置を測って差分で動かす。
 * 写真が遅れて入ると幅が変わるため、寸法の変化を少しのあいだ見張って合わせ直す
 * （window の load は、この時点でもう終わっていることがあるので当てにしない）。
 * ただし、その前に自分で動かした人には触らない。
 */
export function OpenAtLatest({ scrollerId }: { scrollerId: string }) {
  useEffect(() => {
    const scroller = document.getElementById(scrollerId);
    if (!scroller) return;

    let touched = false;
    const mark = () => {
      touched = true;
    };

    const align = () => {
      if (touched) return;
      const last = scroller.querySelector<HTMLElement>("[data-stream] > :last-child");
      if (!last) return;
      const view = scroller.getBoundingClientRect();
      const box = last.getBoundingClientRect();
      const shift = box.left - (view.left + 24);
      if (Math.abs(shift) < 1) return;
      scroller.scrollLeft += shift;
    };

    align();
    const frame = requestAnimationFrame(align);

    // 写真が入って幅が変わるあいだだけ、寸法を見張る
    const stream = scroller.querySelector<HTMLElement>("[data-stream]");
    const watcher = new ResizeObserver(align);
    if (stream) watcher.observe(stream);
    const stopWatching = window.setTimeout(() => watcher.disconnect(), 6000);

    const events = ["wheel", "touchstart", "pointerdown"] as const;
    events.forEach((name) => scroller.addEventListener(name, mark, { passive: true }));
    window.addEventListener("keydown", mark);

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(stopWatching);
      watcher.disconnect();
      events.forEach((name) => scroller.removeEventListener(name, mark));
      window.removeEventListener("keydown", mark);
    };
  }, [scrollerId]);

  return null;
}
