import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import Header from "@/components/header";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "PRD & Test Case Generator - AI 기반 개발 도구",
    template: "%s | PRD & Test Case Generator",
  },
  description: "AI를 활용한 자동화된 PRD 작성 및 테스트 케이스 생성으로 개발 효율성을 극대화하세요. Gemini AI를 활용한 문서 자동화 도구.",
  keywords: ["PRD 생성", "테스트 케이스 생성", "AI 도구", "개발 도구", "문서 자동화", "Gemini AI", "QA 자동화"],
  authors: [{ name: "PRD Generator Team" }],
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: "PRD & Test Case Generator",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={cn(inter.className, "min-h-screen bg-background antialiased")} suppressHydrationWarning>
        <Providers>
          <div className="relative flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
