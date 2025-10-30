import { Metadata } from "next";

export const metadata: Metadata = {
  title: "PRD 생성기 - AI로 자동화된 요구사항 문서 작성",
  description: "Gemini AI를 활용하여 체계적이고 완성도 높은 PRD(Product Requirements Document)를 자동으로 생성하세요. 대화형 수정 기능과 버전 히스토리 제공.",
  keywords: ["PRD", "요구사항 문서", "프로덕트 매니저", "PM 도구", "문서 자동화", "AI 생성"],
  openGraph: {
    title: "PRD 생성기 - AI 자동화 도구",
    description: "Gemini AI로 체계적인 PRD를 자동 생성하세요",
    type: "website",
  },
};

export default function PRDLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
