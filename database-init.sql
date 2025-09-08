-- Enum Types
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');
CREATE TYPE "PRDStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'COMPLETED');
CREATE TYPE "TestType" AS ENUM ('FUNCTIONAL', 'EDGE_CASE', 'REGRESSION', 'INTEGRATION', 'PERFORMANCE');
CREATE TYPE "PromptType" AS ENUM ('PRD_GENERATION', 'TEST_CASE_GENERATION', 'CHAT_REFINEMENT', 'GITHUB_PR_ANALYSIS');

-- User table
CREATE TABLE "User" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- PRD table
CREATE TABLE "PRD" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "userInput" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" "PRDStatus" NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    
    CONSTRAINT "PRD_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "PRD_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ChatMessage table
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "prdId" TEXT NOT NULL,
    
    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ChatMessage_prdId_fkey" FOREIGN KEY ("prdId") REFERENCES "PRD"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- GitHubPR table
CREATE TABLE "GitHubPR" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "url" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "repo" TEXT NOT NULL,
    "prNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "diff" TEXT NOT NULL,
    "commits" JSONB NOT NULL,
    "analyzedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "GitHubPR_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GitHubPR_url_key" ON "GitHubPR"("url");

-- PRAnalysis table
CREATE TABLE "PRAnalysis" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "url" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "prData" JSONB NOT NULL,
    "analysis" TEXT NOT NULL,
    "analyzedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    
    CONSTRAINT "PRAnalysis_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "PRAnalysis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- TestCase table
CREATE TABLE "TestCase" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "testType" "TestType" NOT NULL,
    "steps" JSONB NOT NULL,
    "expectedResult" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "prdId" TEXT,
    "githubPRId" TEXT,
    "prAnalysisId" TEXT,
    "userId" TEXT NOT NULL,
    
    CONSTRAINT "TestCase_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "TestCase_prdId_fkey" FOREIGN KEY ("prdId") REFERENCES "PRD"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TestCase_githubPRId_fkey" FOREIGN KEY ("githubPRId") REFERENCES "GitHubPR"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TestCase_prAnalysisId_fkey" FOREIGN KEY ("prAnalysisId") REFERENCES "PRAnalysis"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TestCase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Prompt table
CREATE TABLE "Prompt" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "type" "PromptType" NOT NULL,
    "content" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    
    CONSTRAINT "Prompt_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Prompt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "Prompt_name_key" ON "Prompt"("name");

-- ApiUsage table
CREATE TABLE "ApiUsage" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "service" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "tokens" INTEGER NOT NULL DEFAULT 0,
    "cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    
    CONSTRAINT "ApiUsage_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ApiUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "ApiUsage_userId_createdAt_idx" ON "ApiUsage"("userId", "createdAt");

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_updated_at BEFORE UPDATE ON "User"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prd_updated_at BEFORE UPDATE ON "PRD"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_testcase_updated_at BEFORE UPDATE ON "TestCase"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prompt_updated_at BEFORE UPDATE ON "Prompt"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();