import { Metadata } from "next";

export const metadata: Metadata = {
  title: "테스트 케이스 생성기 - AI 기반 자동화 QA 도구",
  description: "PRD, GitHub PR, Figma 디자인을 분석하여 포괄적인 테스트 케이스를 자동 생성합니다. Functional, Edge Case, Regression, Integration 테스트를 지원.",
  keywords: ["테스트 케이스", "QA", "자동화 테스트", "테스트 설계", "품질 보증", "AI 테스트"],
  openGraph: {
    title: "테스트 케이스 생성기 - AI QA 도구",
    description: "PRD와 PR을 분석하여 자동으로 테스트 케이스 생성",
    type: "website",
  },
};

export default function TestCasesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
