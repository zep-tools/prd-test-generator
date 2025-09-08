// 프롬프트 관리 유틸리티

export const PROMPT_STORAGE_KEY = "prd_generator_prompts";

export interface StoredPrompt {
  id: string;
  name: string;
  type: string;
  content: string;
  description: string;
  isActive: boolean;
  version: number;
}

// 기본 PRD 생성 프롬프트 (전문가 수준)
export const DEFAULT_PRD_PROMPT = `당신은 구글, 아마존, 메타에서 15년 이상 경력을 가진 시니어 프로덕트 매니저입니다. 
세계적 수준의 PRD(Product Requirements Document)를 작성해주세요.

제목: {title}
목표: {objectives}
주요 기능: {features}
타겟 사용자: {targetAudience}
제약사항: {constraints}

다음 형식으로 매우 상세하고 전문적인 PRD를 작성해주세요:

# 제품 요구사항 문서 (PRD)

## Executive Summary
- 한 문단으로 이 제품의 핵심 가치와 비즈니스 임팩트를 요약
- 경영진이 읽고 즉시 이해할 수 있는 수준

## 1. 제품 개요 (Product Overview)

### 1.1 제품 비전 (Product Vision)
- 3-5년 후 이 제품이 달성하고자 하는 궁극적인 목표
- 시장에서의 포지셔닝과 차별화 요소
- 회사의 전체 전략과의 연계성

### 1.2 제품 미션 (Product Mission)
- 사용자에게 제공하는 핵심 가치
- 해결하고자 하는 구체적인 문제
- 제품의 존재 이유

### 1.3 핵심 가치 제안 (Value Proposition)
- 경쟁 제품 대비 10배 더 나은 가치
- 사용자가 얻게 될 구체적인 이익
- 측정 가능한 개선 지표

## 2. 시장 분석 (Market Analysis)

### 2.1 시장 규모와 기회 (Market Size & Opportunity)
- TAM (Total Addressable Market)
- SAM (Serviceable Available Market)
- SOM (Serviceable Obtainable Market)
- 성장률과 트렌드 분석

### 2.2 경쟁 분석 (Competitive Analysis)
- 주요 경쟁사와 제품 비교 매트릭스
- SWOT 분석
- 경쟁 우위 확보 전략
- 진입 장벽과 방어 전략

### 2.3 시장 진입 전략 (Go-to-Market Strategy)
- 초기 타겟 세그먼트
- 채널 전략
- 가격 전략
- 파트너십 전략

## 3. 사용자 연구 (User Research)

### 3.1 사용자 페르소나 (User Personas)
- Primary Persona: 상세한 인구통계, 행동 패턴, 니즈, 페인 포인트
- Secondary Personas: 2-3개의 부가 페르소나
- Anti-Persona: 타겟이 아닌 사용자

### 3.2 사용자 여정 맵 (User Journey Map)
- 현재 상태 (As-Is) 여정
- 미래 상태 (To-Be) 여정
- 터치포인트와 감정 곡선
- 기회 영역 식별

### 3.3 Jobs-to-be-Done (JTBD)
- 기능적 작업 (Functional Jobs)
- 감정적 작업 (Emotional Jobs)
- 사회적 작업 (Social Jobs)

## 4. 제품 전략 (Product Strategy)

### 4.1 제품 원칙 (Product Principles)
- 의사결정 가이드라인
- 트레이드오프 우선순위
- 품질 기준

### 4.2 제품 로드맵 (Product Roadmap)
- Now (0-3개월): MVP 기능
- Next (3-6개월): 핵심 기능 확장
- Later (6-12개월): 차별화 기능
- Vision (12개월+): 장기 비전

### 4.3 성공 지표 (Success Metrics)
- 북극성 지표 (North Star Metric)
- 선행 지표 (Leading Indicators)
- 후행 지표 (Lagging Indicators)
- OKRs 설정

## 5. 기능 요구사항 (Functional Requirements)

### 5.1 MVP 기능 (P0 - Must Have)
각 기능별로:
- 사용자 스토리: "As a [user], I want to [action], so that [benefit]"
- 수용 기준 (Acceptance Criteria)
- 기술적 고려사항
- 의존성

### 5.2 핵심 기능 (P1 - Should Have)
- 상세한 기능 명세
- 우선순위 근거
- 예상 개발 공수

### 5.3 부가 기능 (P2 - Nice to Have)
- 향후 고려 기능
- 실험적 기능
- 사용자 요청 기능

## 6. 비기능 요구사항 (Non-Functional Requirements)

### 6.1 성능 요구사항 (Performance)
- 응답 시간: 95 percentile < 200ms
- 처리량: 초당 10,000 요청 처리
- 동시 사용자: 100,000명 이상
- 가용성: 99.99% SLA

### 6.2 보안 요구사항 (Security)
- 인증/인가 체계
- 데이터 암호화 (전송/저장)
- GDPR/CCPA 컴플라이언스
- 보안 감사 로깅
- 취약점 스캔 및 침투 테스트

### 6.3 확장성 요구사항 (Scalability)
- 수평적 확장 전략
- 데이터베이스 샤딩
- 캐싱 전략
- CDN 활용

### 6.4 사용성 요구사항 (Usability)
- 접근성 표준 (WCAG 2.1 Level AA)
- 다국어 지원 (i18n)
- 반응형 디자인
- 오프라인 지원

## 7. 기술 아키텍처 (Technical Architecture)

### 7.1 시스템 아키텍처
- 고수준 아키텍처 다이어그램
- 마이크로서비스 vs 모놀리식
- API 설계 원칙
- 데이터 플로우

### 7.2 기술 스택
- 프론트엔드 기술
- 백엔드 기술
- 데이터베이스 및 저장소
- 인프라 및 DevOps 도구

### 7.3 통합 요구사항
- 외부 시스템 연동
- API 통합
- 데이터 마이그레이션

## 8. 출시 계획 (Launch Plan)

### 8.1 출시 전략
- Soft Launch (베타 테스트)
- Phased Rollout
- Feature Flags
- A/B 테스트 계획

### 8.2 마케팅 및 커뮤니케이션
- 프레스 릴리즈
- 사용자 교육 자료
- 내부 교육 계획
- 커뮤니티 구축

### 8.3 지원 계획
- 고객 지원 체계
- 문서화 (사용자/개발자)
- FAQ 및 트러블슈팅 가이드
- 피드백 수집 채널

## 9. 리스크 관리 (Risk Management)

### 9.1 기술적 리스크
- 리스크 식별 및 평가
- 완화 전략
- 대응 계획

### 9.2 비즈니스 리스크
- 시장 리스크
- 경쟁 리스크
- 규제 리스크

### 9.3 컨틴전시 플랜
- 롤백 전략
- 위기 관리 프로토콜
- 비즈니스 연속성 계획

## 10. 예산 및 리소스 (Budget & Resources)

### 10.1 개발 리소스
- 엔지니어링 팀 구성
- 예상 개발 기간
- 외부 리소스 필요성

### 10.2 예산 계획
- 개발 비용
- 인프라 비용
- 마케팅 비용
- 운영 비용

### 10.3 ROI 분석
- 예상 수익
- 손익분기점
- 5년 재무 전망

## 11. 부록 (Appendices)

### 11.1 용어집 (Glossary)
- 기술 용어 정의
- 비즈니스 용어 정의

### 11.2 참고 자료 (References)
- 시장 조사 보고서
- 기술 문서
- 경쟁사 분석 자료

### 11.3 와이어프레임/목업
- 주요 화면 디자인
- 사용자 플로우
- 프로토타입 링크`

// 기본 테스트 케이스 생성 프롬프트 (전문가 수준)
export const DEFAULT_TEST_CASE_PROMPT = `당신은 Google, Microsoft, Amazon에서 15년 이상 근무한 수석 QA 아키텍트이자 테스트 자동화 전문가입니다.
ISTQB 최고 레벨 자격증을 보유하고 있으며, 대규모 분산 시스템의 테스트 전략을 수립한 경험이 있습니다.

다음 정보를 바탕으로 완벽하고 포괄적인 테스트 케이스를 생성해주세요:

{context}

요청된 테스트 유형: {testTypes}

각 테스트 케이스는 다음과 같이 매우 상세하게 작성해주세요:

테스트 케이스 [번호]:
제목: [명확하고 구체적인 테스트 제목 - GIVEN/WHEN/THEN 형식 권장]
ID: [TC-YYYY-MM-DD-XXX 형식]
유형: [functional/edge_case/regression/integration/performance/security/usability/compatibility]
우선순위: [P0-Critical/P1-High/P2-Medium/P3-Low]
설명: [테스트의 목적, 범위, 비즈니스 가치를 포함한 상세 설명]

사전 조건 (Preconditions):
- [테스트 실행 전 필요한 환경 설정]
- [필요한 테스트 데이터]
- [시스템 상태]
- [권한 및 인증 요구사항]

테스트 데이터 (Test Data):
- 입력 데이터: [구체적인 테스트 데이터 값]
- 경계값: [최소값, 최대값, 임계값]
- 특수 케이스: [NULL, 빈 문자열, 특수문자 등]

테스트 단계:
1. [동작]: [매우 구체적이고 재현 가능한 동작 설명] | [예상 결과]: [측정 가능하고 검증 가능한 결과]
2. [동작]: [사용자 관점의 액션] | [예상 결과]: [시스템 응답 및 UI 변화]
3. [동작]: [데이터 입력 또는 조작] | [예상 결과]: [데이터 검증 및 상태 변화]
...

검증 포인트 (Verification Points):
- [ ] UI/UX 검증: [화면 요소, 레이아웃, 반응성]
- [ ] 기능 검증: [비즈니스 로직, 계산, 처리]
- [ ] 데이터 검증: [데이터베이스 상태, 일관성]
- [ ] 성능 검증: [응답 시간, 리소스 사용량]
- [ ] 보안 검증: [권한, 데이터 보호]

최종 예상 결과: [전체 테스트의 최종 상태 및 성공 기준]

사후 조건 (Postconditions):
- [테스트 완료 후 시스템 상태]
- [정리 작업 필요 사항]

자동화 가능성:
- 자동화 우선순위: [High/Medium/Low]
- 자동화 도구: [Selenium/Cypress/Jest/Pytest 등]
- 예상 자동화 코드 스니펫

관련 요구사항:
- 요구사항 ID: [REQ-XXX]
- 사용자 스토리: [US-XXX]
- 결함 추적: [BUG-XXX]

---

테스트 전략에 다음 내용을 포함하세요:

## 1. 테스트 커버리지 매트릭스
- 기능 커버리지
- 코드 커버리지 목표 (80% 이상)
- 리스크 기반 테스트 우선순위

## 2. 테스트 유형별 시나리오

### 2.1 기능 테스트 (Functional Testing)
- Happy Path 시나리오
- Alternative Path 시나리오
- Exception Path 시나리오

### 2.2 경계값 테스트 (Boundary Value Testing)
- 최소/최대 입력값
- 임계값 근처 테스트
- 오버플로우/언더플로우 케이스

### 2.3 부정 테스트 (Negative Testing)
- 잘못된 입력 처리
- 권한 없는 접근 시도
- 시스템 리소스 고갈 시나리오

### 2.4 성능 테스트 (Performance Testing)
- 부하 테스트 (Load Testing)
- 스트레스 테스트 (Stress Testing)
- 스파이크 테스트 (Spike Testing)
- 내구성 테스트 (Endurance Testing)

### 2.5 보안 테스트 (Security Testing)
- 인증/인가 테스트
- SQL Injection, XSS, CSRF 방어
- 데이터 암호화 검증
- 세션 관리 테스트

### 2.6 사용성 테스트 (Usability Testing)
- 직관성 평가
- 접근성 테스트 (WCAG 준수)
- 크로스 브라우저 호환성
- 모바일 반응형 테스트

### 2.7 회귀 테스트 (Regression Testing)
- 핵심 기능 회귀 세트
- 자동화된 회귀 스위트
- 영향도 분석 기반 테스트

## 3. 테스트 환경 요구사항
- 개발 환경
- 스테이징 환경
- 프로덕션 유사 환경
- 테스트 데이터 관리

## 4. 리스크 및 완화 전략
- 높은 리스크 영역 식별
- 리스크별 테스트 전략
- 대응 계획

## 5. 테스트 메트릭스
- 테스트 케이스 실행률
- 결함 발견률 (Defect Detection Rate)
- 결함 제거 효율성 (Defect Removal Efficiency)
- 테스트 커버리지
- 평균 결함 해결 시간`

// 기본 GitHub PR 분석 프롬프트
export const DEFAULT_GITHUB_PROMPT = `당신은 숙련된 시니어 개발자이자 코드 리뷰어입니다. 다음 GitHub PR을 매우 상세하게 분석해주세요:

제목: {title}
설명: {description}

변경된 파일 ({filesCount}개):
{fileChanges}

커밋 메시지들:
{commits}

다음 관점에서 매우 상세하고 깊이있게 분석해주세요:

## 1. 📋 주요 변경사항 요약
- 이 PR의 핵심 목적과 해결하려는 문제
- 구현된 주요 기능이나 수정사항
- 변경사항의 규모와 복잡도 평가

## 2. 🏗️ 아키텍처 및 설계 분석
- 코드 구조와 설계 패턴의 적절성
- SOLID 원칙 준수 여부
- 모듈화와 책임 분리 수준
- 의존성 관리와 결합도

## 3. 🔍 코드 품질 평가
- 코드 가독성과 유지보수성
- 네이밍 컨벤션과 일관성
- 중복 코드 존재 여부
- 복잡도 분석 (순환 복잡도, 인지 복잡도)
- 주석과 문서화 수준

## 4. ⚠️ 잠재적 문제점과 리스크
- 버그 가능성이 있는 코드 패턴
- 성능 병목 지점
- 보안 취약점 (SQL Injection, XSS, CSRF 등)
- 엣지 케이스 처리 누락
- 에러 핸들링 부족

## 5. 🧪 테스트 전략
- 테스트 커버리지 평가
- 필요한 단위 테스트 케이스
- 통합 테스트 시나리오
- E2E 테스트 필요 영역
- 회귀 테스트 고려사항

## 6. 🚀 성능 고려사항
- 시간 복잡도와 공간 복잡도
- 데이터베이스 쿼리 최적화
- 캐싱 전략
- 비동기 처리와 병렬화 기회
- 메모리 사용량과 리소스 관리

## 7. 💡 개선 제안
- 코드 리팩토링 기회
- 더 나은 알고리즘이나 자료구조
- 디자인 패턴 적용 제안
- 라이브러리나 프레임워크 활용
- 성능 최적화 방안

## 8. 📊 영향도 분석
- 영향받는 시스템 컴포넌트
- 하위 호환성 고려사항
- 다른 팀이나 서비스에 미치는 영향
- 배포 시 주의사항
- 롤백 계획 필요성

## 9. 📝 체크리스트
- [ ] 코드 컨벤션 준수
- [ ] 충분한 테스트 작성
- [ ] 문서화 업데이트
- [ ] 성능 영향 검토
- [ ] 보안 검토 완료
- [ ] 에러 처리 적절
- [ ] 로깅 적절
- [ ] 설정 변경사항 확인

## 10. 🎯 최종 평가
- 전체적인 코드 품질 점수 (1-10)
- 머지 준비 상태 평가
- 추가 작업 필요 여부
- 우선순위가 높은 수정사항`;

// localStorage에서 프롬프트 가져오기
export function getStoredPrompts(): StoredPrompt[] {
  if (typeof window === 'undefined') return [];
  
  const stored = localStorage.getItem(PROMPT_STORAGE_KEY);
  if (!stored) return [];
  
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

// localStorage에 프롬프트 저장
export function savePrompts(prompts: StoredPrompt[]): void {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem(PROMPT_STORAGE_KEY, JSON.stringify(prompts));
}

// 특정 타입의 활성 프롬프트 가져오기
export function getActivePrompt(type: string): string | null {
  const prompts = getStoredPrompts();
  const activePrompt = prompts.find(p => p.type === type && p.isActive);
  return activePrompt?.content || null;
}

// GitHub PR 분석 프롬프트 가져오기 (localStorage 우선, 없으면 기본값)
export function getGitHubAnalysisPrompt(): string {
  const storedPrompt = getActivePrompt('github_pr_analysis');
  return storedPrompt || DEFAULT_GITHUB_PROMPT;
}

// PRD 생성 프롬프트 가져오기 (localStorage 우선, 없으면 기본값)
export function getPRDPrompt(): string {
  const storedPrompt = getActivePrompt('prd_generation');
  return storedPrompt || DEFAULT_PRD_PROMPT;
}

// 테스트 케이스 생성 프롬프트 가져오기 (localStorage 우선, 없으면 기본값)
export function getTestCasePrompt(): string {
  const storedPrompt = getActivePrompt('test_case_generation');
  return storedPrompt || DEFAULT_TEST_CASE_PROMPT;
}