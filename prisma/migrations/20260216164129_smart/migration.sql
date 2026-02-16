-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ENGINEER', 'ADMIN');

-- CreateEnum
CREATE TYPE "SoilType" AS ENUM ('CLAY', 'BLACK_COTTON', 'LATERITE', 'SANDY', 'ROCKY', 'ALLUVIAL');

-- CreateEnum
CREATE TYPE "SeismicZone" AS ENUM ('ZONE_II', 'ZONE_III', 'ZONE_IV', 'ZONE_V');

-- CreateEnum
CREATE TYPE "FloodRisk" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH');

-- CreateEnum
CREATE TYPE "BuildingType" AS ENUM ('RESIDENTIAL', 'COMMERCIAL', 'HOSPITAL', 'SCHOOL', 'INDUSTRIAL', 'MIXED_USE');

-- CreateEnum
CREATE TYPE "StructuralSystem" AS ENUM ('RCC', 'STEEL', 'COMPOSITE', 'LOAD_BEARING');

-- CreateEnum
CREATE TYPE "Orientation" AS ENUM ('NORTH', 'NORTH_EAST', 'EAST', 'SOUTH_EAST', 'SOUTH', 'SOUTH_WEST', 'WEST', 'NORTH_WEST');

-- CreateEnum
CREATE TYPE "FoundationType" AS ENUM ('SHALLOW', 'DEEP_PILE', 'RAFT', 'COMBINED');

-- CreateEnum
CREATE TYPE "HeightCategory" AS ENUM ('LOW_RISE', 'MID_RISE', 'HIGH_RISE', 'SUPER_HIGH_RISE');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "details" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "land_surveys" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "plotArea" DOUBLE PRECISION NOT NULL,
    "soilType" "SoilType" NOT NULL,
    "slope" DOUBLE PRECISION NOT NULL,
    "elevation" DOUBLE PRECISION NOT NULL,
    "waterTableDepth" DOUBLE PRECISION NOT NULL,
    "seismicZone" "SeismicZone" NOT NULL,
    "floodRisk" "FloodRisk" NOT NULL,
    "nearbyWaterBodies" BOOLEAN NOT NULL DEFAULT false,
    "waterBodyDistance" DOUBLE PRECISION,
    "historicalDisasters" JSONB,
    "averageRainfall" DOUBLE PRECISION,
    "maxTemperature" DOUBLE PRECISION,
    "minTemperature" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "land_surveys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "building_inputs" (
    "id" TEXT NOT NULL,
    "landSurveyId" TEXT NOT NULL,
    "buildingType" "BuildingType" NOT NULL,
    "totalFloors" INTEGER NOT NULL,
    "floorHeight" DOUBLE PRECISION NOT NULL,
    "totalHeight" DOUBLE PRECISION NOT NULL,
    "builtUpArea" DOUBLE PRECISION NOT NULL,
    "orientation" "Orientation" NOT NULL,
    "structuralSystem" "StructuralSystem" NOT NULL,
    "basementFloors" INTEGER NOT NULL DEFAULT 0,
    "parkingFloors" INTEGER NOT NULL DEFAULT 0,
    "expectedOccupancy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "building_inputs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wind_data" (
    "id" TEXT NOT NULL,
    "buildingInputId" TEXT NOT NULL,
    "windDirection" DOUBLE PRECISION NOT NULL,
    "averageWindSpeed" DOUBLE PRECISION NOT NULL,
    "peakGustSpeed" DOUBLE PRECISION NOT NULL,
    "terrainRoughness" TEXT NOT NULL,
    "windPressure" DOUBLE PRECISION NOT NULL,
    "windLoad" DOUBLE PRECISION NOT NULL,
    "optimalOrientation" "Orientation" NOT NULL,
    "aerodynamicForm" TEXT NOT NULL,
    "ventilationStrategy" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wind_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disaster_analysis" (
    "id" TEXT NOT NULL,
    "buildingInputId" TEXT NOT NULL,
    "deadLoad" DOUBLE PRECISION NOT NULL,
    "liveLoad" DOUBLE PRECISION NOT NULL,
    "windLoad" DOUBLE PRECISION NOT NULL,
    "seismicLoad" DOUBLE PRECISION NOT NULL,
    "totalLoad" DOUBLE PRECISION NOT NULL,
    "heightCategory" "HeightCategory" NOT NULL,
    "recommendedFoundation" "FoundationType" NOT NULL,
    "foundationDepth" DOUBLE PRECISION NOT NULL,
    "columnSpacing" DOUBLE PRECISION NOT NULL,
    "beamSizing" TEXT NOT NULL,
    "shearWallRequired" BOOLEAN NOT NULL,
    "earthquakeSafetyScore" DOUBLE PRECISION NOT NULL,
    "baseShear" DOUBLE PRECISION NOT NULL,
    "softStoryDetected" BOOLEAN NOT NULL,
    "shearWallPlacement" JSONB NOT NULL,
    "minimumPlinthHeight" DOUBLE PRECISION NOT NULL,
    "drainageSlope" DOUBLE PRECISION NOT NULL,
    "basementFeasible" BOOLEAN NOT NULL,
    "waterResistantMaterials" JSONB NOT NULL,
    "vortexSheddingRisk" TEXT NOT NULL,
    "heightToWidthRatio" DOUBLE PRECISION NOT NULL,
    "pressureZones" JSONB NOT NULL,
    "shapeOptimization" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "disaster_analysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vastu_reports" (
    "id" TEXT NOT NULL,
    "buildingInputId" TEXT NOT NULL,
    "plotShape" TEXT NOT NULL,
    "entranceDirection" "Orientation" NOT NULL,
    "vastuComplianceScore" DOUBLE PRECISION NOT NULL,
    "overallCompliance" TEXT NOT NULL,
    "entranceSuitability" TEXT NOT NULL,
    "kitchenZoneCompliance" BOOLEAN NOT NULL,
    "bedroomZoneCompliance" BOOLEAN NOT NULL,
    "staircaseCompliance" BOOLEAN NOT NULL,
    "waterTankDirection" TEXT NOT NULL,
    "borewellDirection" TEXT NOT NULL,
    "violations" JSONB NOT NULL,
    "corrections" JSONB NOT NULL,
    "windVastuCompatibility" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vastu_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "final_reports" (
    "id" TEXT NOT NULL,
    "buildingInputId" TEXT NOT NULL,
    "overallSafetyScore" DOUBLE PRECISION NOT NULL,
    "costEfficiencyScore" DOUBLE PRECISION NOT NULL,
    "sustainabilityScore" DOUBLE PRECISION NOT NULL,
    "vastuScore" DOUBLE PRECISION NOT NULL,
    "surveySummary" JSONB NOT NULL,
    "riskAnalysis" JSONB NOT NULL,
    "structuralLogic" JSONB NOT NULL,
    "vastuSummary" JSONB NOT NULL,
    "finalRecommendations" JSONB NOT NULL,
    "reportStatus" TEXT NOT NULL DEFAULT 'GENERATED',
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "final_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "audit_logs_userId_createdAt_idx" ON "audit_logs"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "land_surveys_userId_idx" ON "land_surveys"("userId");

-- CreateIndex
CREATE INDEX "land_surveys_seismicZone_floodRisk_idx" ON "land_surveys"("seismicZone", "floodRisk");

-- CreateIndex
CREATE INDEX "building_inputs_landSurveyId_idx" ON "building_inputs"("landSurveyId");

-- CreateIndex
CREATE UNIQUE INDEX "wind_data_buildingInputId_key" ON "wind_data"("buildingInputId");

-- CreateIndex
CREATE UNIQUE INDEX "disaster_analysis_buildingInputId_key" ON "disaster_analysis"("buildingInputId");

-- CreateIndex
CREATE UNIQUE INDEX "vastu_reports_buildingInputId_key" ON "vastu_reports"("buildingInputId");

-- CreateIndex
CREATE UNIQUE INDEX "final_reports_buildingInputId_key" ON "final_reports"("buildingInputId");

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "land_surveys" ADD CONSTRAINT "land_surveys_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "building_inputs" ADD CONSTRAINT "building_inputs_landSurveyId_fkey" FOREIGN KEY ("landSurveyId") REFERENCES "land_surveys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wind_data" ADD CONSTRAINT "wind_data_buildingInputId_fkey" FOREIGN KEY ("buildingInputId") REFERENCES "building_inputs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disaster_analysis" ADD CONSTRAINT "disaster_analysis_buildingInputId_fkey" FOREIGN KEY ("buildingInputId") REFERENCES "building_inputs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vastu_reports" ADD CONSTRAINT "vastu_reports_buildingInputId_fkey" FOREIGN KEY ("buildingInputId") REFERENCES "building_inputs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "final_reports" ADD CONSTRAINT "final_reports_buildingInputId_fkey" FOREIGN KEY ("buildingInputId") REFERENCES "building_inputs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
