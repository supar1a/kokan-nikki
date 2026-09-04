"use client";

import { useEffect } from "react";

/**
 * 巻物をひらいたら、いつも左端（いちばん新しいところ）に立つ。
 *
 * スマホでもPCでも、開く場所がいつも同じであってほしいので、
 * 読みかけの位置ではなく、常にここに合わせる。
 *
 * 縦組みの巻きでは scrollLeft の符号が環境で割れるので、位置を測って差分で動かす。
 * 写真が遅れて入ると幅が変わるので、読み込み後にもう一度だけ合わせ直す
 * （ただし、その前に自分で動かした人には触らない）。
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
      scroller.scrollLeft += box.left - (view.left + 24);
    };

    align();
    const frame = requestAnimationFrame(align);

    scroller.addEventListener("wheel", mark, { passive: true });
    scroller.addEventListener("touchstart", mark, { passive: true });
    scroller.addEventListener("pointerdown", mark, { passive: true });
    window.addEventListener("keydown", mark);
    // 写真が入って幅が変わったぶんを、最後にもう一度そろえる
    window.addEventListener("load", align);

    return () => {
      cancelAnimationFrame(frame);
      scroller.removeEventListener("wheel", mark);
      scroller.removeEventListener("touchstart", mark);
      scroller.removeEventListener("pointerdown", mark);
      window.removeEventListener("keydown", mark);
      window.removeEventListener("load", align);
    };
  }, [scrollerId]);

  return null;
}
