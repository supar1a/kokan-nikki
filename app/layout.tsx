import type { CSSProperties } from "react";
import type { Metadata } from "next";
import "./globals.css";
import { SoundProvider } from "@/components/sound-provider";

export const metadata: Metadata = {
  title: "短冊",
  description: "仲間うちだけの、縦書きの書き散らし。",
};

export const viewport = {
  themeColor: "#f2eee4",
  width: "device-width",
  initialScale: 1,
};

/**
 * 紙の地は、開くたびに違う種から漉く。
 * feTurbulence の seed を変えるだけなので、絵を持たずに済む。
 */
function noise(seed: number, frequency: string, octaves: number, size: number) {
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'>` +
    `<filter id='n'><feTurbulence type='fractalNoise' baseFrequency='${frequency}'` +
    ` numOctaves='${octaves}' seed='${seed}' stitchTiles='stitch'/>` +
    `<feColorMatrix type='saturate' values='0'/></filter>` +
    `<rect width='${size}' height='${size}' filter='url(%23n)'/></svg>`;
  return `url("data:image/svg+xml,${svg.replace(/</g, "%3C").replace(/>/g, "%3E").replace(/#/g, "%23")}")`;
}

function paper(): CSSProperties {
  const seed = () => Math.floor(Math.random() * 9999);
  return {
    "--paper-grain": noise(seed(), "0.85", 4, 260),
    "--paper-mottle": noise(seed(), "0.045", 2, 600),
  } as CSSProperties;
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* App Router には当たらない規則（pages/_document 向け）なので外す */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Shippori+Mincho+B1:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={paper()}>
        <SoundProvider>{children}</SoundProvider>
      </body>
    </html>
  );
}
