import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "온길 | 덜 붐비는 여행, 더 넓은 발견",
  description:
    "온길은 혼잡도 예측과 접근성 필터로 지역과 여행자가 함께 만드는 여유로운 여행을 제시합니다.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
