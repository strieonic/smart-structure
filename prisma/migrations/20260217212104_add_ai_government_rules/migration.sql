-- CreateEnum
CREATE TYPE "ZoneType" AS ENUM ('RURAL', 'URBAN', 'SEMI_URBAN', 'INDUSTRIAL', 'AGRICULTURAL');

-- CreateEnum
CREATE TYPE "RuleCategory" AS ENUM ('FSI', 'HEIGHT_LIMIT', 'SETBACK', 'BUILDING_SPACING', 'FOUNDATION_DEPTH', 'PARKING', 'FIRE_SAFETY', 'VENTILATION', 'SANITATION', 'ACCESSIBILITY');

-- CreateEnum
CREATE TYPE "RuleStatus" AS ENUM ('ACTIVE', 'DEPRECATED', 'PROPOSED');

-- CreateTable
CREATE TABLE "government_rules" (
    "id" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'India',
    "state" TEXT NOT NULL,
    "city" TEXT,
    "zoneType" "ZoneType" NOT NULL,
    "ruleCategory" "RuleCategory" NOT NULL,
    "ruleCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "conditions" JSONB NOT NULL,
    "minValue" DOUBLE PRECISION,
    "maxValue" DOUBLE PRECISION,
    "unit" TEXT,
    "formula" TEXT,
    "source" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "status" "RuleStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "government_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "location_data" (
    "id" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "country" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "district" TEXT,
    "pincode" TEXT,
    "locality" TEXT,
    "zoneType" "ZoneType" NOT NULL,
    "isMetro" BOOLEAN NOT NULL DEFAULT false,
    "municipalWard" TEXT,
    "taluka" TEXT,
    "formattedAddress" TEXT NOT NULL,
    "geocodedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "location_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "building_projects" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "buildingInputId" TEXT,
    "projectName" TEXT NOT NULL,
    "projectType" "BuildingType" NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "aiAnalysisRequested" BOOLEAN NOT NULL DEFAULT false,
    "aiAnalysisCompleted" BOOLEAN NOT NULL DEFAULT false,
    "aiAnalysisResult" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "building_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compliance_checks" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "isCompliant" BOOLEAN NOT NULL,
    "actualValue" DOUBLE PRECISION,
    "requiredValue" DOUBLE PRECISION,
    "deviation" DOUBLE PRECISION,
    "checkDetails" JSONB NOT NULL,
    "severity" TEXT NOT NULL,
    "recommendation" TEXT NOT NULL,
    "aiExplanation" TEXT,
    "aiSuggestions" JSONB,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "compliance_checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_sessions" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionTitle" TEXT NOT NULL DEFAULT 'New Consultation',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "conversationContext" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "tokens" INTEGER,
    "model" TEXT,
    "contextData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "government_rules_state_city_zoneType_ruleCategory_idx" ON "government_rules"("state", "city", "zoneType", "ruleCategory");

-- CreateIndex
CREATE INDEX "government_rules_status_effectiveFrom_idx" ON "government_rules"("status", "effectiveFrom");

-- CreateIndex
CREATE INDEX "location_data_state_city_zoneType_idx" ON "location_data"("state", "city", "zoneType");

-- CreateIndex
CREATE INDEX "location_data_latitude_longitude_idx" ON "location_data"("latitude", "longitude");

-- CreateIndex
CREATE UNIQUE INDEX "building_projects_buildingInputId_key" ON "building_projects"("buildingInputId");

-- CreateIndex
CREATE INDEX "building_projects_userId_status_idx" ON "building_projects"("userId", "status");

-- CreateIndex
CREATE INDEX "building_projects_locationId_idx" ON "building_projects"("locationId");

-- CreateIndex
CREATE INDEX "compliance_checks_projectId_isCompliant_idx" ON "compliance_checks"("projectId", "isCompliant");

-- CreateIndex
CREATE INDEX "compliance_checks_ruleId_idx" ON "compliance_checks"("ruleId");

-- CreateIndex
CREATE INDEX "chat_sessions_projectId_userId_idx" ON "chat_sessions"("projectId", "userId");

-- CreateIndex
CREATE INDEX "chat_sessions_isActive_updatedAt_idx" ON "chat_sessions"("isActive", "updatedAt");

-- CreateIndex
CREATE INDEX "chat_messages_sessionId_createdAt_idx" ON "chat_messages"("sessionId", "createdAt");

-- AddForeignKey
ALTER TABLE "building_projects" ADD CONSTRAINT "building_projects_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "location_data"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "building_projects" ADD CONSTRAINT "building_projects_buildingInputId_fkey" FOREIGN KEY ("buildingInputId") REFERENCES "building_inputs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_checks" ADD CONSTRAINT "compliance_checks_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "building_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_checks" ADD CONSTRAINT "compliance_checks_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "government_rules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "building_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "chat_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
