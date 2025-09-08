export interface PRDInput {
  title: string
  objectives: string
  features: string[]
  targetAudience: string
  constraints?: string
}

export interface PRDOutput {
  id: string
  title: string
  content: string
  version: number
  status: 'draft' | 'in_review' | 'completed'
  createdAt: Date
  updatedAt: Date
}

export interface GitHubPRData {
  url: string
  owner: string
  repo: string
  prNumber: number
  title: string
  description: string
  diff: string
  commits: Array<{
    sha: string
    message: string
    author: string
  }>
}

export interface TestCase {
  id: string
  title: string
  description: string
  type: 'functional' | 'edge_case' | 'regression' | 'integration' | 'performance'
  steps: Array<{
    action: string
    expectedResult: string
  }>
  expectedResult: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp?: Date
}

export interface PromptTemplate {
  id: string
  name: string
  type: 'prd_generation' | 'test_case_generation' | 'chat_refinement'
  content: string
  description?: string
  isActive: boolean
  version: number
}