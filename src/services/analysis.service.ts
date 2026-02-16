import prisma from '../config/database';
import { WindService } from './wind.service';
import { EarthquakeService } from './earthquake.service';
import { FloodService } from './flood.service';
import { CycloneService } from './cyclone.service';
import { LoadAnalysisService } from './loadAnalysis.service';
import { VastuService } from './vastu.service';
import { AppError } from '../middleware/error.middleware';

export class AnalysisService {
  private windService = new WindService();
  private earthquakeService = new EarthquakeService();
  private floodService = new FloodService();
  private cycloneService = new CycloneService();
  private loadAnalysisService = new LoadAnalysisService();
  private vastuService = new VastuService();

  async performCompleteAnalysis(buildingInputId: string) {
    const buildingInput = await prisma.buildingInput.findUnique({
      where: { id: buildingInputId },
      include: {
        landSurvey: true,
        windData: true,
      },
    });

    if (!buildingInput) {
      throw new AppError('Building input not found', 404);
    }

    const { landSurvey } = buildingInput;

    // 1. Load Analysis
    const loadAnalysis = this.loadAnalysisService.analyzeLoads(
      {
        buildingType: buildingInput.buildingType,
        totalFloors: buildingInput.totalFloors,
        floorHeight: buildingInput.floorHeight,
        totalHeight: buildingInput.totalHeight,
        builtUpArea: buildingInput.builtUpArea,
        structuralSystem: buildingInput.structuralSystem,
      },
      landSurvey.soilType,
      landSurvey.seismicZone
    );

    // 2. Wind Analysis (if wind data exists)
    let windLoad = 0;
    if (buildingInput.windData) {
      const windAnalysis = this.windService.analyzeWindData(
        {
          averageWindSpeed: buildingInput.windData.averageWindSpeed,
          peakGustSpeed: buildingInput.windData.peakGustSpeed,
          terrainRoughness: buildingInput.windData.terrainRoughness,
          buildingHeight: buildingInput.totalHeight,
          buildingWidth: Math.sqrt(buildingInput.builtUpArea),
          buildingDepth: Math.sqrt(buildingInput.builtUpArea),
        },
        buildingInput.orientation
      );
      windLoad = windAnalysis.windLoad;
    }

    // 3. Earthquake Analysis
    const earthquakeAnalysis = this.earthquakeService.analyzeEarthquakeRisk({
      seismicZone: landSurvey.seismicZone,
      buildingHeight: buildingInput.totalHeight,
      totalWeight: loadAnalysis.totalLoad,
      structuralSystem: buildingInput.structuralSystem,
      soilType: landSurvey.soilType,
      totalFloors: buildingInput.totalFloors,
      builtUpArea: buildingInput.builtUpArea,
    });

    // 4. Flood Analysis
    const floodAnalysis = this.floodService.analyzeFloodRisk({
      floodRisk: landSurvey.floodRisk,
      elevation: landSurvey.elevation,
      waterTableDepth: landSurvey.waterTableDepth,
      nearbyWaterBodies: landSurvey.nearbyWaterBodies,
      waterBodyDistance: landSurvey.waterBodyDistance || undefined,
      soilType: landSurvey.soilType,
      averageRainfall: landSurvey.averageRainfall || undefined,
      slope: landSurvey.slope,
    });

    // 5. Cyclone Analysis (if wind data exists)
    let cycloneAnalysis = null;
    if (buildingInput.windData) {
      cycloneAnalysis = this.cycloneService.analyzeCycloneRisk({
        peakGustSpeed: buildingInput.windData.peakGustSpeed,
        buildingHeight: buildingInput.totalHeight,
        buildingWidth: Math.sqrt(buildingInput.builtUpArea),
        buildingDepth: Math.sqrt(buildingInput.builtUpArea),
      });
    }

    // 6. Store Disaster Analysis
    const disasterAnalysis = await prisma.disasterAnalysis.create({
      data: {
        buildingInputId: buildingInput.id,
        deadLoad: loadAnalysis.deadLoad,
        liveLoad: loadAnalysis.liveLoad,
        windLoad: windLoad,
        seismicLoad: earthquakeAnalysis.baseShear,
        totalLoad: loadAnalysis.totalLoad + windLoad + earthquakeAnalysis.baseShear,
        heightCategory: loadAnalysis.heightCategory,
        recommendedFoundation: loadAnalysis.recommendedFoundation,
        foundationDepth: loadAnalysis.foundationDepth,
        columnSpacing: loadAnalysis.columnSpacing,
        beamSizing: loadAnalysis.beamSizing,
        shearWallRequired: loadAnalysis.shearWallRequired,
        earthquakeSafetyScore: earthquakeAnalysis.earthquakeSafetyScore,
        baseShear: earthquakeAnalysis.baseShear,
        softStoryDetected: earthquakeAnalysis.softStoryDetected,
        shearWallPlacement: earthquakeAnalysis.shearWallPlacement,
        minimumPlinthHeight: floodAnalysis.minimumPlinthHeight,
        drainageSlope: floodAnalysis.drainageSlope,
        basementFeasible: floodAnalysis.basementFeasible,
        waterResistantMaterials: floodAnalysis.waterResistantMaterials,
        vortexSheddingRisk: cycloneAnalysis?.vortexSheddingRisk || 'LOW',
        heightToWidthRatio: cycloneAnalysis?.heightToWidthRatio || 0,
        pressureZones: cycloneAnalysis?.pressureZones || {},
        shapeOptimization: cycloneAnalysis?.shapeOptimization || 'STANDARD',
      },
    });

    return disasterAnalysis;
  }

  async performVastuAnalysis(buildingInputId: string) {
    const buildingInput = await prisma.buildingInput.findUnique({
      where: { id: buildingInputId },
      include: {
        landSurvey: true,
        windData: true,
      },
    });

    if (!buildingInput) {
      throw new AppError('Building input not found', 404);
    }

    const vastuAnalysis = this.vastuService.analyzeVastu({
      plotShape: 'RECTANGULAR', // Can be made dynamic
      orientation: buildingInput.orientation,
      entranceDirection: buildingInput.orientation,
      totalFloors: buildingInput.totalFloors,
      buildingHeight: buildingInput.totalHeight,
      windDirection: buildingInput.windData?.windDirection,
    });

    const vastuReport = await prisma.vastuReport.create({
      data: {
        buildingInputId: buildingInput.id,
        plotShape: 'RECTANGULAR',
        entranceDirection: buildingInput.orientation,
        vastuComplianceScore: vastuAnalysis.vastuComplianceScore,
        overallCompliance: vastuAnalysis.overallCompliance,
        entranceSuitability: vastuAnalysis.entranceSuitability,
        kitchenZoneCompliance: vastuAnalysis.kitchenZoneCompliance,
        bedroomZoneCompliance: vastuAnalysis.bedroomZoneCompliance,
        staircaseCompliance: vastuAnalysis.staircaseCompliance,
        waterTankDirection: vastuAnalysis.waterTankDirection,
        borewellDirection: vastuAnalysis.borewellDirection,
        windVastuCompatibility: vastuAnalysis.windVastuCompatibility,
        violations: vastuAnalysis.violations as any,
        corrections: vastuAnalysis.corrections as any,



      },
    });

    return vastuReport;
  }

  async generateFinalReport(buildingInputId: string) {
    const buildingInput = await prisma.buildingInput.findUnique({
      where: { id: buildingInputId },
      include: {
        landSurvey: true,
        windData: true,
        disasterAnalysis: true,
        vastuReport: true,
      },
    });

    if (!buildingInput) {
      throw new AppError('Building input not found', 404);
    }

    if (!buildingInput.disasterAnalysis) {
      throw new AppError('Disaster analysis not completed', 400);
    }

    if (!buildingInput.vastuReport) {
      throw new AppError('Vastu analysis not completed', 400);
    }

    const { landSurvey, disasterAnalysis, vastuReport } = buildingInput;

    // Calculate composite scores
    const overallSafetyScore = this.calculateSafetyScore(disasterAnalysis, landSurvey);
    const costEfficiencyScore = this.calculateCostEfficiency(buildingInput, disasterAnalysis);
    const sustainabilityScore = this.calculateSustainability(buildingInput, landSurvey);

    // Generate report sections
    const surveySummary = {
      location: { lat: landSurvey.latitude, lng: landSurvey.longitude },
      plotArea: landSurvey.plotArea,
      soilType: landSurvey.soilType,
      seismicZone: landSurvey.seismicZone,
      floodRisk: landSurvey.floodRisk,
    };

    const riskAnalysis = {
      earthquakeRisk: {
        zone: landSurvey.seismicZone,
        safetyScore: disasterAnalysis.earthquakeSafetyScore,
        baseShear: disasterAnalysis.baseShear,
      },
      floodRisk: {
        level: landSurvey.floodRisk,
        plinthHeight: disasterAnalysis.minimumPlinthHeight,
        basementFeasible: disasterAnalysis.basementFeasible,
      },
      windRisk: {
        vortexShedding: disasterAnalysis.vortexSheddingRisk,
        heightToWidthRatio: disasterAnalysis.heightToWidthRatio,
      },
    };

    const structuralLogic = {
      loadAnalysis: {
        deadLoad: disasterAnalysis.deadLoad,
        liveLoad: disasterAnalysis.liveLoad,
        totalLoad: disasterAnalysis.totalLoad,
      },
      foundation: {
        type: disasterAnalysis.recommendedFoundation,
        depth: disasterAnalysis.foundationDepth,
      },
      structural: {
        columnSpacing: disasterAnalysis.columnSpacing,
        beamSizing: disasterAnalysis.beamSizing,
        shearWallRequired: disasterAnalysis.shearWallRequired,
      },
    };

    const vastuSummary = {
      complianceScore: vastuReport.vastuComplianceScore,
      overallCompliance: vastuReport.overallCompliance,
      entranceSuitability: vastuReport.entranceSuitability,
      violations: vastuReport.violations,
      corrections: vastuReport.corrections,
    };

    const finalRecommendations = this.generateRecommendations(
      buildingInput,
      disasterAnalysis,
      vastuReport,
      landSurvey
    );

    const finalReport = await prisma.finalReport.create({
      data: {
        buildingInputId: buildingInput.id,
        overallSafetyScore,
        costEfficiencyScore,
        sustainabilityScore,
        vastuScore: vastuReport.vastuComplianceScore,
        surveySummary,
        riskAnalysis,
        structuralLogic,
        vastuSummary,
        finalRecommendations,
      },
    });

    return finalReport;
  }

  private calculateSafetyScore(disasterAnalysis: any, landSurvey: any): number {
    let score = disasterAnalysis.earthquakeSafetyScore * 0.4;
    
    // Flood safety component
    const floodScore = landSurvey.floodRisk === 'LOW' ? 90 : 
                       landSurvey.floodRisk === 'MEDIUM' ? 70 : 
                       landSurvey.floodRisk === 'HIGH' ? 50 : 30;
    score += floodScore * 0.3;
    
    // Wind safety component
    const windScore = disasterAnalysis.vortexSheddingRisk === 'LOW' ? 90 : 
                      disasterAnalysis.vortexSheddingRisk === 'MEDIUM' ? 70 : 50;
    score += windScore * 0.3;
    
    return parseFloat(score.toFixed(2));
  }

  private calculateCostEfficiency(buildingInput: any, disasterAnalysis: any): number {
    let score = 70; // Base score
    
    // Structural system efficiency
    if (buildingInput.structuralSystem === 'STEEL') score += 10;
    if (buildingInput.structuralSystem === 'COMPOSITE') score += 5;
    
    // Foundation efficiency
    if (disasterAnalysis.recommendedFoundation === 'SHALLOW') score += 15;
    else if (disasterAnalysis.recommendedFoundation === 'RAFT') score += 5;
    else score -= 10;
    
    // Height efficiency
    if (disasterAnalysis.heightCategory === 'LOW_RISE') score += 10;
    else if (disasterAnalysis.heightCategory === 'MID_RISE') score += 5;
    
    return Math.min(100, score);
  }

  private calculateSustainability(buildingInput: any, landSurvey: any): number {
    let score = 60; // Base score
    
    // Orientation bonus
    if (['NORTH', 'NORTH_EAST', 'EAST'].includes(buildingInput.orientation)) {
      score += 15;
    }
    
    // Soil suitability
    if (landSurvey.soilType === 'ROCKY' || landSurvey.soilType === 'SANDY') {
      score += 10;
    }
    
    // Low disaster risk bonus
    if (landSurvey.floodRisk === 'LOW' && landSurvey.seismicZone === 'ZONE_II') {
      score += 15;
    }
    
    return Math.min(100, score);
  }

  private generateRecommendations(
    buildingInput: any,
    disasterAnalysis: any,
    vastuReport: any,
    landSurvey: any
  ): any {
    return {
      structural: [
        `Use ${disasterAnalysis.recommendedFoundation} foundation at ${disasterAnalysis.foundationDepth}m depth`,
        `Column spacing: ${disasterAnalysis.columnSpacing}m`,
        disasterAnalysis.beamSizing,
        disasterAnalysis.shearWallRequired ? 'Shear walls required for lateral stability' : null,
      ].filter(Boolean),
      disaster: [
        `Design for base shear: ${disasterAnalysis.baseShear} kN`,
        `Minimum plinth height: ${disasterAnalysis.minimumPlinthHeight}m`,
        `Drainage slope: ${disasterAnalysis.drainageSlope}%`,
        disasterAnalysis.softStoryDetected ? 'CRITICAL: Address soft story issue' : null,
      ].filter(Boolean),
      vastu: vastuReport.corrections.map((c: any) => c.solution),
      general: [
        'Conduct detailed soil investigation before construction',
        'Engage structural engineer for detailed design',
        'Obtain all necessary approvals and permits',
        'Regular structural health monitoring recommended',
      ],
    };
  }
}
