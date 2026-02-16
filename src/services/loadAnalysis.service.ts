import { BuildingType, StructuralSystem, HeightCategory, FoundationType } from '@prisma/client';

interface LoadInput {
  buildingType: BuildingType;
  totalFloors: number;
  floorHeight: number;
  totalHeight: number;
  builtUpArea: number;
  structuralSystem: StructuralSystem;
}

interface LoadAnalysis {
  deadLoad: number;
  liveLoad: number;
  totalLoad: number;
  heightCategory: HeightCategory;
  recommendedFoundation: FoundationType;
  foundationDepth: number;
  columnSpacing: number;
  beamSizing: string;
  shearWallRequired: boolean;
  loadDistributionStrategy: string;
}

export class LoadAnalysisService {
  // IS 875 Part 1 - Dead Load Calculation
  calculateDeadLoad(input: LoadInput): number {
    // Dead load includes: self-weight of structure, walls, floors, finishes
    
    // Structural self-weight (kN/m²)
    const structuralWeight: Record<StructuralSystem, number> = {
      RCC: 5.5,
      STEEL: 3.5,
      COMPOSITE: 4.5,
      LOAD_BEARING: 6.5,
    };
    
    const baseWeight = structuralWeight[input.structuralSystem];
    
    // Wall load (kN/m²)
    const wallLoad = 3.0;
    
    // Floor finish (kN/m²)
    const floorFinish = 1.5;
    
    // Total dead load per floor
    const deadLoadPerFloor = (baseWeight + wallLoad + floorFinish) * input.builtUpArea;
    
    // Total dead load
    const totalDeadLoad = deadLoadPerFloor * input.totalFloors;
    
    return parseFloat(totalDeadLoad.toFixed(2));
  }

  // IS 875 Part 2 - Live Load Calculation
  calculateLiveLoad(input: LoadInput): number {
    // Live load based on building type (kN/m²)
    const liveLoadIntensity: Record<BuildingType, number> = {
      RESIDENTIAL: 2.0,
      COMMERCIAL: 4.0,
      HOSPITAL: 3.0,
      SCHOOL: 3.0,
      INDUSTRIAL: 5.0,
      MIXED_USE: 3.5,
    };
    
    const intensity = liveLoadIntensity[input.buildingType];
    
    // Total live load
    const totalLiveLoad = intensity * input.builtUpArea * input.totalFloors;
    
    return parseFloat(totalLiveLoad.toFixed(2));
  }

  classifyHeight(height: number): HeightCategory {
    if (height <= 15) return 'LOW_RISE';
    if (height <= 30) return 'MID_RISE';
    if (height <= 75) return 'HIGH_RISE';
    return 'SUPER_HIGH_RISE';
  }

  recommendFoundationType(
    totalLoad: number,
    soilType: string,
    heightCategory: HeightCategory
  ): FoundationType {
    if (heightCategory === 'SUPER_HIGH_RISE' || totalLoad > 50000) {
      return 'DEEP_PILE';
    }
    
    if (heightCategory === 'HIGH_RISE' || totalLoad > 20000) {
      return soilType === 'ROCKY' ? 'RAFT' : 'DEEP_PILE';
    }
    
    if (heightCategory === 'MID_RISE') {
      return soilType === 'ROCKY' || soilType === 'SANDY' ? 'SHALLOW' : 'RAFT';
    }
    
    return 'SHALLOW';
  }

  calculateFoundationDepth(
    foundationType: FoundationType,
    totalLoad: number,
    heightCategory: HeightCategory
  ): number {
    let depth: number;
    
    switch (foundationType) {
      case 'SHALLOW':
        depth = 1.5;
        break;
      case 'RAFT':
        depth = 2.5;
        break;
      case 'DEEP_PILE':
        depth = heightCategory === 'SUPER_HIGH_RISE' ? 25 : 15;
        break;
      case 'COMBINED':
        depth = 3.0;
        break;
      default:
        depth = 1.5;
    }
    
    return depth;
  }

  recommendColumnSpacing(
    structuralSystem: StructuralSystem,
    buildingType: BuildingType,
    heightCategory: HeightCategory
  ): number {
    let baseSpacing: number;
    
    // Base spacing based on structural system
    if (structuralSystem === 'STEEL') {
      baseSpacing = 7.5;
    } else if (structuralSystem === 'RCC' || structuralSystem === 'COMPOSITE') {
      baseSpacing = 6.0;
    } else {
      baseSpacing = 4.0;
    }
    
    // Adjust for building type
    if (buildingType === 'COMMERCIAL' || buildingType === 'INDUSTRIAL') {
      baseSpacing += 1.5;
    }
    
    // Adjust for height
    if (heightCategory === 'HIGH_RISE' || heightCategory === 'SUPER_HIGH_RISE') {
      baseSpacing -= 1.0;
    }
    
    return parseFloat(baseSpacing.toFixed(1));
  }

  recommendBeamSizing(
    columnSpacing: number,
    totalLoad: number,
    heightCategory: HeightCategory
  ): string {
    let description: string;
    
    if (heightCategory === 'LOW_RISE') {
      description = `Primary beams: 230mm x 450mm for ${columnSpacing}m span. Secondary beams: 230mm x 300mm`;
    } else if (heightCategory === 'MID_RISE') {
      description = `Primary beams: 300mm x 600mm for ${columnSpacing}m span. Secondary beams: 230mm x 450mm`;
    } else if (heightCategory === 'HIGH_RISE') {
      description = `Primary beams: 400mm x 750mm for ${columnSpacing}m span. Secondary beams: 300mm x 600mm. Consider post-tensioned beams`;
    } else {
      description = `Primary beams: 500mm x 900mm for ${columnSpacing}m span. Post-tensioned or steel composite beams recommended`;
    }
    
    return description;
  }

  determineShearWallRequirement(
    heightCategory: HeightCategory,
    structuralSystem: StructuralSystem,
    seismicZone?: string
  ): boolean {
    if (heightCategory === 'HIGH_RISE' || heightCategory === 'SUPER_HIGH_RISE') {
      return true;
    }
    
    if (heightCategory === 'MID_RISE' && 
        (seismicZone === 'ZONE_IV' || seismicZone === 'ZONE_V')) {
      return true;
    }
    
    if (structuralSystem === 'LOAD_BEARING') {
      return false; // Load bearing doesn't use shear walls
    }
    
    return false;
  }

  generateLoadDistributionStrategy(
    heightCategory: HeightCategory,
    structuralSystem: StructuralSystem,
    columnSpacing: number
  ): string {
    let strategy = '';
    
    if (heightCategory === 'LOW_RISE') {
      strategy = 'Simple beam-column frame with uniform load distribution. ' +
                 'Use one-way or two-way slab system based on aspect ratio.';
    } else if (heightCategory === 'MID_RISE') {
      strategy = 'Moment-resisting frame with regular column grid. ' +
                 'Two-way slab system recommended. ' +
                 'Consider flat slab for commercial spaces.';
    } else if (heightCategory === 'HIGH_RISE') {
      strategy = 'Core and outrigger system or tube structure. ' +
                 'Central core for lifts and stairs acts as primary lateral load resisting system. ' +
                 'Perimeter columns for gravity loads. ' +
                 'Shear walls integrated with core.';
    } else {
      strategy = 'Advanced structural system: Bundled tube, braced tube, or mega-frame. ' +
                 'Multiple outriggers at mechanical floors. ' +
                 'Damping systems for wind and seismic loads. ' +
                 'Foundation: Deep piled raft or compensated foundation.';
    }
    
    if (structuralSystem === 'STEEL') {
      strategy += ' Steel structure allows for longer spans and faster construction.';
    } else if (structuralSystem === 'COMPOSITE') {
      strategy += ' Composite construction combines benefits of steel and concrete.';
    }
    
    return strategy;
  }

  analyzeLoads(input: LoadInput, soilType?: string, seismicZone?: string): LoadAnalysis {
    const deadLoad = this.calculateDeadLoad(input);
    const liveLoad = this.calculateLiveLoad(input);
    const totalLoad = deadLoad + liveLoad;
    
    const heightCategory = this.classifyHeight(input.totalHeight);
    const recommendedFoundation = this.recommendFoundationType(
      totalLoad,
      soilType || 'SANDY',
      heightCategory
    );
    const foundationDepth = this.calculateFoundationDepth(
      recommendedFoundation,
      totalLoad,
      heightCategory
    );
    
    const columnSpacing = this.recommendColumnSpacing(
      input.structuralSystem,
      input.buildingType,
      heightCategory
    );
    
    const beamSizing = this.recommendBeamSizing(
      columnSpacing,
      totalLoad,
      heightCategory
    );
    
    const shearWallRequired = this.determineShearWallRequirement(
      heightCategory,
      input.structuralSystem,
      seismicZone
    );
    
    const loadDistributionStrategy = this.generateLoadDistributionStrategy(
      heightCategory,
      input.structuralSystem,
      columnSpacing
    );
    
    return {
      deadLoad,
      liveLoad,
      totalLoad,
      heightCategory,
      recommendedFoundation,
      foundationDepth,
      columnSpacing,
      beamSizing,
      shearWallRequired,
      loadDistributionStrategy,
    };
  }
}
