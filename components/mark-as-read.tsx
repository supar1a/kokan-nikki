"use client";

import { useEffect } from "react";
import { markAsReadAction } from "@/app/actions/places";

/**
 * 「ここから未読」の目印のために、見た時刻だけを控える。
 * 通りすがりで消えないよう、少し置いてから。
 * 誰が読んだかは、相手には見せない。数えもしない。
 */
export function MarkAsRead({ placeId }: { placeId: string }) {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void markAsReadAction(placeId);
    }, 2500);
    return () => window.clearTimeout(timer);
  }, [placeId]);

  return null;
}
