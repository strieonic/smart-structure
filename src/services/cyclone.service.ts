import { BuildingType } from '@prisma/client';

interface CycloneInput {
  peakGustSpeed: number;
  buildingHeight: number;
  buildingWidth: number;
  buildingDepth: number;
  distanceFromCoast?: number;
}

interface CycloneAnalysis {
  vortexSheddingRisk: string;
  heightToWidthRatio: number;
  pressureZones: any;
  shapeOptimization: string;
  recommendations: string[];
}

export class CycloneService {
  assessVortexSheddingRisk(
    height: number,
    width: number,
    windSpeed: number
  ): string {
    const heightToWidthRatio = height / width;
    
    // Vortex shedding is critical for slender structures
    if (heightToWidthRatio > 6 && windSpeed > 40) {
      return 'HIGH';
    } else if (heightToWidthRatio > 4 && windSpeed > 30) {
      return 'MEDIUM';
    } else {
      return 'LOW';
    }
  }

  calculateHeightToWidthRatio(height: number, width: number): number {
    return parseFloat((height / width).toFixed(2));
  }

  analyzePressureZones(input: CycloneInput): any {
    // Wind pressure zones as per IS 875 Part 3
    const zones = {
      windward: {
        description: 'Maximum positive pressure',
        coefficient: 0.8,
        pressure: 0.8 * 0.6 * Math.pow(input.peakGustSpeed, 2) / 1000,
      },
      leeward: {
        description: 'Negative pressure (suction)',
        coefficient: -0.5,
        pressure: -0.5 * 0.6 * Math.pow(input.peakGustSpeed, 2) / 1000,
      },
      side: {
        description: 'Side wall suction',
        coefficient: -0.7,
        pressure: -0.7 * 0.6 * Math.pow(input.peakGustSpeed, 2) / 1000,
      },
      roof: {
        description: 'Roof suction (critical)',
        coefficient: -0.9,
        pressure: -0.9 * 0.6 * Math.pow(input.peakGustSpeed, 2) / 1000,
      },
    };
    
    return {
      zones,
      criticalZone: 'ROOF',
      recommendation: 'Ensure proper roof anchorage to resist uplift forces',
    };
  }

  recommendShapeOptimization(input: CycloneInput): string {
    const heightToWidthRatio = input.buildingHeight / input.buildingWidth;
    
    if (input.peakGustSpeed > 50) {
      if (heightToWidthRatio > 5) {
        return 'TAPERED_AERODYNAMIC: Taper building towards top to reduce wind load. ' +
               'Consider setbacks every 15-20 floors. ' +
               'Rounded corners to minimize vortex formation.';
      } else {
        return 'STREAMLINED_RECTANGULAR: Use rounded corners with radius ≥ 10% of width. ' +
               'Avoid sharp edges. Consider chamfered corners.';
      }
    } else if (input.peakGustSpeed > 35) {
      return 'MODIFIED_RECTANGULAR: Slight corner modifications sufficient. ' +
             'Ensure proper cladding attachment. ' +
             'Avoid large overhangs.';
    } else {
      return 'STANDARD_RECTANGULAR: Standard rectangular form acceptable. ' +
             'Focus on structural integrity and connection details.';
    }
  }

  generateCycloneRecommendations(
    input: CycloneInput,
    analysis: Partial<CycloneAnalysis>
  ): string[] {
    const recommendations: string[] = [];
    
    // Critical recommendations for high wind zones
    if (input.peakGustSpeed > 50) {
      recommendations.push('CRITICAL: Design for cyclone-prone area as per IS 875 Part 3');
      recommendations.push('Use cyclone-resistant roofing with proper anchorage');
      recommendations.push('Install hurricane straps for roof-to-wall connections');
      recommendations.push('Use impact-resistant glazing or shutters for windows');
    }
    
    // Vortex shedding mitigation
    if (analysis.vortexSheddingRisk === 'HIGH') {
      recommendations.push('Install helical strakes or spoilers to disrupt vortex formation');
      recommendations.push('Consider tuned mass damper for tall slender structures');
      recommendations.push('Conduct wind tunnel testing for final design validation');
    } else if (analysis.vortexSheddingRisk === 'MEDIUM') {
      recommendations.push('Monitor for wind-induced vibrations');
      recommendations.push('Consider aerodynamic modifications if needed');
    }
    
    // Pressure zone recommendations
    recommendations.push('Strengthen roof connections - critical for uplift resistance');
    recommendations.push('Use continuous load path from roof to foundation');
    recommendations.push('Ensure proper anchorage of cladding and non-structural elements');
    
    // Coastal considerations
    if (input.distanceFromCoast && input.distanceFromCoast < 10) {
      recommendations.push('Use corrosion-resistant materials (coastal environment)');
      recommendations.push('Apply protective coatings to steel elements');
      recommendations.push('Regular inspection and maintenance critical');
    }
    
    // Height-specific recommendations
    if (input.buildingHeight > 50) {
      recommendations.push('Install anemometers for wind monitoring');
      recommendations.push('Design for dynamic wind effects');
      recommendations.push('Consider supplemental damping systems');
    }
    
    // General recommendations
    recommendations.push('Ensure all openings are properly sealed and reinforced');
    recommendations.push('Design drainage to handle extreme rainfall during cyclones');
    recommendations.push('Create emergency evacuation plan for occupants');
    
    return recommendations;
  }

  analyzeCycloneRisk(input: CycloneInput): CycloneAnalysis {
    const vortexSheddingRisk = this.assessVortexSheddingRisk(
      input.buildingHeight,
      input.buildingWidth,
      input.peakGustSpeed
    );
    
    const heightToWidthRatio = this.calculateHeightToWidthRatio(
      input.buildingHeight,
      input.buildingWidth
    );
    
    const pressureZones = this.analyzePressureZones(input);
    const shapeOptimization = this.recommendShapeOptimization(input);
    
    const analysis: CycloneAnalysis = {
      vortexSheddingRisk,
      heightToWidthRatio,
      pressureZones,
      shapeOptimization,
      recommendations: [],
    };
    
    analysis.recommendations = this.generateCycloneRecommendations(input, analysis);
    
    return analysis;
  }
}
