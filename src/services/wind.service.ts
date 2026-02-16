import { Orientation } from '@prisma/client';

interface WindCalculationInput {
  averageWindSpeed: number;
  peakGustSpeed: number;
  terrainRoughness: string;
  buildingHeight: number;
  buildingWidth: number;
  buildingDepth: number;
}

interface WindAnalysisResult {
  windPressure: number;
  windLoad: number;
  optimalOrientation: Orientation;
  aerodynamicForm: string;
  ventilationStrategy: any;
}

export class WindService {
  // IS 875 Part 3 - Wind Load Calculation
  calculateWindPressure(input: WindCalculationInput): number {
    const { averageWindSpeed, buildingHeight, terrainRoughness } = input;
    
    // Terrain factor based on IS 875
    const terrainFactors: Record<string, number> = {
      CATEGORY_1: 1.05, // Open terrain
      CATEGORY_2: 1.00, // Urban/suburban
      CATEGORY_3: 0.91, // Dense urban
      CATEGORY_4: 0.80, // Very dense urban
    };
    
    const k2 = terrainFactors[terrainRoughness] || 1.0;
    
    // Height factor (simplified)
    const k3 = buildingHeight <= 10 ? 1.0 : 1.0 + 0.01 * (buildingHeight - 10);
    
    // Design wind speed
    const Vz = averageWindSpeed * k2 * k3;
    
    // Wind pressure: pz = 0.6 * Vz²
    const windPressure = 0.6 * Math.pow(Vz, 2) / 1000; // kN/m²
    
    return parseFloat(windPressure.toFixed(3));
  }

  calculateWindLoad(input: WindCalculationInput): number {
    const windPressure = this.calculateWindPressure(input);
    const exposedArea = input.buildingHeight * input.buildingWidth;
    
    // Force coefficient (simplified for rectangular buildings)
    const Cf = 1.2;
    
    const windLoad = windPressure * exposedArea * Cf;
    return parseFloat(windLoad.toFixed(2));
  }

  determineOptimalOrientation(
    windDirection: number,
    currentOrientation: Orientation
  ): Orientation {
    // Optimal orientation is perpendicular to prevailing wind
    const optimalAngle = (windDirection + 90) % 360;
    
    const orientationAngles: Record<Orientation, number> = {
      NORTH: 0,
      NORTH_EAST: 45,
      EAST: 90,
      SOUTH_EAST: 135,
      SOUTH: 180,
      SOUTH_WEST: 225,
      WEST: 270,
      NORTH_WEST: 315,
    };
    
    let closestOrientation: Orientation = 'NORTH';
    let minDiff = 360;
    
    for (const [orientation, angle] of Object.entries(orientationAngles)) {
      const diff = Math.abs(optimalAngle - angle);
      if (diff < minDiff) {
        minDiff = diff;
        closestOrientation = orientation as Orientation;
      }
    }
    
    return closestOrientation;
  }

  recommendAerodynamicForm(
    heightToWidthRatio: number,
    windSpeed: number
  ): string {
    if (heightToWidthRatio > 5) {
      if (windSpeed > 40) {
        return 'TAPERED_STREAMLINED';
      }
      return 'STEPPED_SETBACK';
    } else if (heightToWidthRatio > 3) {
      return 'ROUNDED_CORNERS';
    }
    return 'RECTANGULAR_OPTIMIZED';
  }

  generateVentilationStrategy(
    windDirection: number,
    buildingOrientation: Orientation,
    floorCount: number
  ): any {
    return {
      primaryVentilation: {
        direction: windDirection,
        openingPlacement: 'WINDWARD_LEEWARD',
        crossVentilationFeasible: true,
      },
      floorWiseStrategy: floorCount > 10 
        ? 'MECHANICAL_ASSISTED' 
        : 'NATURAL_CROSS_VENTILATION',
      recommendations: [
        'Place primary openings on windward side',
        'Secondary openings on leeward side for cross-ventilation',
        'Avoid openings on high-pressure zones',
        floorCount > 5 ? 'Consider wind catchers for upper floors' : null,
      ].filter(Boolean),
    };
  }

  analyzeWindData(input: WindCalculationInput, orientation: Orientation): WindAnalysisResult {
    const windPressure = this.calculateWindPressure(input);
    const windLoad = this.calculateWindLoad(input);
    const optimalOrientation = this.determineOptimalOrientation(
      input.averageWindSpeed,
      orientation
    );
    
    const heightToWidthRatio = input.buildingHeight / input.buildingWidth;
    const aerodynamicForm = this.recommendAerodynamicForm(
      heightToWidthRatio,
      input.averageWindSpeed
    );
    
    const ventilationStrategy = this.generateVentilationStrategy(
      input.averageWindSpeed,
      orientation,
      Math.floor(input.buildingHeight / 3)
    );
    
    return {
      windPressure,
      windLoad,
      optimalOrientation,
      aerodynamicForm,
      ventilationStrategy,
    };
  }
}
