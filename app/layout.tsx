import type { Metadata } from "next";
import "./globals.css";
import { SoundProvider } from "@/components/sound-provider";

export const metadata: Metadata = {
  title: "交換日記",
  description: "一冊のノートを、少人数で順番に回す。",
};

export const viewport = {
  themeColor: "#f2eee4",
  width: "device-width",
  initialScale: 1,
};

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
      <body>
        <SoundProvider>{children}</SoundProvider>
      </body>
    </html>
  );
}
