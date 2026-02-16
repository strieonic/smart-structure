import { FloodRisk, SoilType } from '@prisma/client';

interface FloodInput {
  floodRisk: FloodRisk;
  elevation: number;
  waterTableDepth: number;
  nearbyWaterBodies: boolean;
  waterBodyDistance?: number;
  soilType: SoilType;
  averageRainfall?: number;
  slope: number;
}

interface FloodAnalysis {
  minimumPlinthHeight: number;
  drainageSlope: number;
  basementFeasible: boolean;
  waterResistantMaterials: string[];
  recommendations: string[];
}

export class FloodService {
  calculateMinimumPlinthHeight(input: FloodInput): number {
    let baseHeight = 0.45; // Minimum as per NBC
    
    // Adjust based on flood risk
    const riskAdjustment: Record<FloodRisk, number> = {
      LOW: 0.15,
      MEDIUM: 0.45,
      HIGH: 0.90,
      VERY_HIGH: 1.50,
    };
    baseHeight += riskAdjustment[input.floodRisk];
    
    // Adjust for nearby water bodies
    if (input.nearbyWaterBodies && input.waterBodyDistance) {
      if (input.waterBodyDistance < 100) baseHeight += 0.60;
      else if (input.waterBodyDistance < 500) baseHeight += 0.30;
    }
    
    // Adjust for high rainfall areas
    if (input.averageRainfall && input.averageRainfall > 2000) {
      baseHeight += 0.30;
    }
    
    return parseFloat(baseHeight.toFixed(2));
  }

  calculateDrainageSlope(input: FloodInput): number {
    // Minimum slope for effective drainage
    let slope = 2.0; // 2% minimum
    
    if (input.floodRisk === 'HIGH' || input.floodRisk === 'VERY_HIGH') {
      slope = 3.0;
    }
    
    // Adjust for soil permeability
    if (input.soilType === 'CLAY' || input.soilType === 'BLACK_COTTON') {
      slope += 0.5; // Less permeable soils need steeper slopes
    }
    
    return parseFloat(slope.toFixed(1));
  }

  assessBasementFeasibility(input: FloodInput): boolean {
    // Basement not feasible if:
    // 1. High flood risk
    // 2. High water table
    // 3. Very close to water bodies
    
    if (input.floodRisk === 'HIGH' || input.floodRisk === 'VERY_HIGH') {
      return false;
    }
    
    if (input.waterTableDepth < 3.0) {
      return false;
    }
    
    if (input.nearbyWaterBodies && input.waterBodyDistance && input.waterBodyDistance < 200) {
      return false;
    }
    
    return true;
  }

  recommendWaterResistantMaterials(input: FloodInput): string[] {
    const materials: string[] = [];
    
    // Foundation materials
    materials.push('PCC (Plain Cement Concrete) for foundation');
    materials.push('Waterproof cement for below-ground construction');
    
    if (input.floodRisk === 'HIGH' || input.floodRisk === 'VERY_HIGH') {
      materials.push('Polymer-modified waterproofing membrane');
      materials.push('Crystalline waterproofing admixture in concrete');
      materials.push('HDPE waterproofing sheet for basement (if applicable)');
    }
    
    // Wall materials
    materials.push('Burnt clay bricks or concrete blocks');
    materials.push('Cement plaster with waterproofing compound');
    
    // Flooring
    if (input.floodRisk !== 'LOW') {
      materials.push('Vitrified tiles or ceramic tiles (water-resistant)');
      materials.push('Avoid wood flooring at ground level');
    }
    
    // Additional protection
    if (input.nearbyWaterBodies) {
      materials.push('Epoxy coating for external walls');
      materials.push('Bituminous coating for foundation');
    }
    
    return materials;
  }

  generateRecommendations(input: FloodInput, analysis: Partial<FloodAnalysis>): string[] {
    const recommendations: string[] = [];
    
    recommendations.push(`Maintain minimum plinth height of ${analysis.minimumPlinthHeight}m`);
    recommendations.push(`Ensure site drainage slope of ${analysis.drainageSlope}%`);
    
    if (!analysis.basementFeasible) {
      recommendations.push('CRITICAL: Basement construction not recommended due to flood risk');
    } else {
      recommendations.push('Basement feasible with proper waterproofing');
    }
    
    if (input.floodRisk === 'HIGH' || input.floodRisk === 'VERY_HIGH') {
      recommendations.push('Install sump pump with backup power');
      recommendations.push('Elevate electrical panels above flood level');
      recommendations.push('Use flood-resistant doors and windows');
      recommendations.push('Create emergency drainage channels');
    }
    
    if (input.nearbyWaterBodies) {
      recommendations.push('Construct retaining wall if site is lower than water body');
      recommendations.push('Install French drains around perimeter');
    }
    
    if (input.soilType === 'CLAY' || input.soilType === 'BLACK_COTTON') {
      recommendations.push('Improve soil drainage with sand cushion layer');
      recommendations.push('Use geotextile fabric to prevent soil erosion');
    }
    
    recommendations.push('Regular maintenance of drainage system mandatory');
    recommendations.push('Install rainwater harvesting to reduce surface runoff');
    
    return recommendations;
  }

  analyzeFloodRisk(input: FloodInput): FloodAnalysis {
    const minimumPlinthHeight = this.calculateMinimumPlinthHeight(input);
    const drainageSlope = this.calculateDrainageSlope(input);
    const basementFeasible = this.assessBasementFeasibility(input);
    const waterResistantMaterials = this.recommendWaterResistantMaterials(input);
    
    const analysis: FloodAnalysis = {
      minimumPlinthHeight,
      drainageSlope,
      basementFeasible,
      waterResistantMaterials,
      recommendations: [],
    };
    
    analysis.recommendations = this.generateRecommendations(input, analysis);
    
    return analysis;
  }
}
