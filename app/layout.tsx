import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "天気予報アプリ",
  description: "OpenWeatherMap と連携した天気予報 Web アプリ。都市検索・現在地・週間予報・カレンダー対応。",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
