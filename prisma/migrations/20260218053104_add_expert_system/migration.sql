-- CreateEnum
CREATE TYPE "ExpertType" AS ENUM ('STRUCTURAL_ENGINEER', 'ARCHITECT', 'CIVIL_ENGINEER', 'GEOTECHNICAL_ENGINEER');

-- CreateEnum
CREATE TYPE "ExpertStatus" AS ENUM ('PENDING', 'VERIFIED', 'SUSPENDED');

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'EXPERT';

-- CreateTable
CREATE TABLE "expert_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expertType" "ExpertType" NOT NULL,
    "licenseNumber" TEXT NOT NULL,
    "experience" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "specializations" JSONB NOT NULL,
    "summary" TEXT,
    "status" "ExpertStatus" NOT NULL DEFAULT 'PENDING',
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "portfolioData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expert_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expert_queries" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expertId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "projectId" TEXT,
    "attachments" JSONB,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "expertResponse" TEXT,
    "responseAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expert_queries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "expert_profiles_userId_key" ON "expert_profiles"("userId");

-- CreateIndex
CREATE INDEX "expert_profiles_status_expertType_idx" ON "expert_profiles"("status", "expertType");

-- CreateIndex
CREATE INDEX "expert_profiles_location_expertType_idx" ON "expert_profiles"("location", "expertType");

-- CreateIndex
CREATE INDEX "expert_queries_status_category_idx" ON "expert_queries"("status", "category");

-- CreateIndex
CREATE INDEX "expert_queries_expertId_status_idx" ON "expert_queries"("expertId", "status");

-- CreateIndex
CREATE INDEX "expert_queries_userId_idx" ON "expert_queries"("userId");

-- AddForeignKey
ALTER TABLE "expert_profiles" ADD CONSTRAINT "expert_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expert_queries" ADD CONSTRAINT "expert_queries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expert_queries" ADD CONSTRAINT "expert_queries_expertId_fkey" FOREIGN KEY ("expertId") REFERENCES "expert_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
