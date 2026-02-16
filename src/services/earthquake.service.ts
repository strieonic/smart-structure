import { SeismicZone, StructuralSystem, SoilType } from '@prisma/client';

interface EarthquakeInput {
  seismicZone: SeismicZone;
  buildingHeight: number;
  totalWeight: number;
  structuralSystem: StructuralSystem;
  soilType: SoilType;
  totalFloors: number;
  builtUpArea: number;
}

interface EarthquakeAnalysis {
  earthquakeSafetyScore: number;
  baseShear: number;
  softStoryDetected: boolean;
  shearWallPlacement: any;
  recommendations: string[];
}

export class EarthquakeService {
  // IS 1893 - Seismic Zone Factors
  private getZoneFactor(zone: SeismicZone): number {
    const zoneFactors: Record<SeismicZone, number> = {
      ZONE_II: 0.10,
      ZONE_III: 0.16,
      ZONE_IV: 0.24,
      ZONE_V: 0.36,
    };
    return zoneFactors[zone];
  }

  // Importance Factor based on building type
  private getImportanceFactor(buildingType: string): number {
    const factors: Record<string, number> = {
      HOSPITAL: 1.5,
      SCHOOL: 1.5,
      RESIDENTIAL: 1.0,
      COMMERCIAL: 1.2,
      INDUSTRIAL: 1.0,
    };
    return factors[buildingType] || 1.0;
  }

  // Response Reduction Factor
  private getResponseReductionFactor(system: StructuralSystem): number {
    const factors: Record<StructuralSystem, number> = {
      RCC: 5.0,
      STEEL: 5.0,
      COMPOSITE: 4.5,
      LOAD_BEARING: 1.5,
    };
    return factors[system];
  }

  // Soil Type Factor
  private getSoilTypeFactor(soilType: SoilType): number {
    const factors: Record<SoilType, number> = {
      ROCKY: 1.0,
      SANDY: 1.2,
      CLAY: 1.5,
      BLACK_COTTON: 1.8,
      LATERITE: 1.3,
      ALLUVIAL: 1.6,
    };
    return factors[soilType];
  }

  calculateBaseShear(input: EarthquakeInput): number {
    const Z = this.getZoneFactor(input.seismicZone);
    const I = 1.5; // Assuming important structure
    const R = this.getResponseReductionFactor(input.structuralSystem);
    const Sa_g = 2.5; // Average response acceleration (simplified)
    
    // Base Shear: Vb = (Z * I * Sa/g * W) / (2 * R)
    const baseShear = (Z * I * Sa_g * input.totalWeight) / (2 * R);
    
    return parseFloat(baseShear.toFixed(2));
  }

  detectSoftStory(floorHeights: number[], averageHeight: number): boolean {
    // Soft story if any floor height > 1.3 times average
    return floorHeights.some(height => height > 1.3 * averageHeight);
  }

  calculateShearWallPlacement(
    builtUpArea: number,
    totalFloors: number,
    seismicZone: SeismicZone
  ): any {
    const isHighSeismic = seismicZone === 'ZONE_IV' || seismicZone === 'ZONE_V';
    const wallDensity = isHighSeismic ? 0.02 : 0.015; // % of floor area
    
    const requiredWallArea = builtUpArea * wallDensity;
    
    return {
      required: totalFloors > 5 || isHighSeismic,
      minimumWallArea: parseFloat(requiredWallArea.toFixed(2)),
      placement: {
        coreWalls: 'Around lift and staircase cores',
        peripheralWalls: 'At building corners and edges',
        distribution: 'Symmetrically distributed in both directions',
      },
      recommendations: [
        'Place shear walls symmetrically to avoid torsion',
        'Minimum thickness: 150mm for low-rise, 200mm for high-rise',
        'Continuous from foundation to roof',
        isHighSeismic ? 'Use coupled shear walls for better ductility' : null,
      ].filter(Boolean),
    };
  }

  calculateSafetyScore(input: EarthquakeInput): number {
    let score = 100;
    
    // Deduct based on seismic zone
    const zonePenalty: Record<SeismicZone, number> = {
      ZONE_II: 5,
      ZONE_III: 10,
      ZONE_IV: 20,
      ZONE_V: 30,
    };
    score -= zonePenalty[input.seismicZone];
    
    // Deduct based on soil type
    if (input.soilType === 'BLACK_COTTON') score -= 15;
    else if (input.soilType === 'ALLUVIAL') score -= 10;
    else if (input.soilType === 'CLAY') score -= 8;
    
    // Deduct based on structural system
    if (input.structuralSystem === 'LOAD_BEARING') score -= 20;
    
    // Deduct based on height
    if (input.buildingHeight > 50) score -= 15;
    else if (input.buildingHeight > 30) score -= 10;
    
    // Bonus for good structural system in high seismic zones
    if ((input.seismicZone === 'ZONE_IV' || input.seismicZone === 'ZONE_V') &&
        (input.structuralSystem === 'RCC' || input.structuralSystem === 'STEEL')) {
      score += 10;
    }
    
    return Math.max(0, Math.min(100, score));
  }

  analyzeEarthquakeRisk(input: EarthquakeInput): EarthquakeAnalysis {
    const baseShear = this.calculateBaseShear(input);
    const softStoryDetected = this.detectSoftStory(
      Array(input.totalFloors).fill(input.buildingHeight / input.totalFloors),
      input.buildingHeight / input.totalFloors
    );
    const shearWallPlacement = this.calculateShearWallPlacement(
      input.builtUpArea,
      input.totalFloors,
      input.seismicZone
    );
    const earthquakeSafetyScore = this.calculateSafetyScore(input);
    
    const recommendations: string[] = [
      `Design for base shear of ${baseShear} kN`,
      'Use ductile detailing as per IS 13920',
      softStoryDetected ? 'CRITICAL: Soft story detected - strengthen ground floor' : null,
      input.seismicZone === 'ZONE_V' ? 'Use base isolation for critical structures' : null,
      'Ensure proper anchorage of non-structural elements',
      'Regular structural health monitoring recommended',
    ].filter(Boolean) as string[];
    
    return {
      earthquakeSafetyScore,
      baseShear,
      softStoryDetected,
      shearWallPlacement,
      recommendations,
    };
  }
}
