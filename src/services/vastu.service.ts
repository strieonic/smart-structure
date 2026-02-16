import { Orientation } from '@prisma/client';

interface VastuInput {
  plotShape: string;
  orientation: Orientation;
  entranceDirection: Orientation;
  totalFloors: number;
  buildingHeight: number;
  windDirection?: number;
}

interface VastuViolation {
  category: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  impact: string;
}

interface VastuCorrection {
  violation: string;
  solution: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

interface VastuAnalysis {
  vastuComplianceScore: number;
  overallCompliance: string;
  entranceSuitability: string;
  kitchenZoneCompliance: boolean;
  bedroomZoneCompliance: boolean;
  staircaseCompliance: boolean;
  waterTankDirection: string;
  borewellDirection: string;
  windVastuCompatibility: string;
  violations: VastuViolation[];
  corrections: VastuCorrection[];
}

export class VastuService {
  // Vastu-compliant entrance directions
  private readonly AUSPICIOUS_ENTRANCES: Orientation[] = [
    'NORTH',
    'NORTH_EAST',
    'EAST',
  ];

  private readonly MODERATE_ENTRANCES: Orientation[] = [
    'WEST',
    'NORTH_WEST',
  ];

  private readonly INAUSPICIOUS_ENTRANCES: Orientation[] = [
    'SOUTH',
    'SOUTH_EAST',
    'SOUTH_WEST',
  ];

  evaluateEntranceSuitability(entrance: Orientation): string {
    if (this.AUSPICIOUS_ENTRANCES.includes(entrance)) {
      return 'EXCELLENT - Highly auspicious as per Vastu';
    } else if (this.MODERATE_ENTRANCES.includes(entrance)) {
      return 'MODERATE - Acceptable with remedies';
    } else {
      return 'POOR - Not recommended, consider corrections';
    }
  }

  evaluateKitchenZone(orientation: Orientation): boolean {
    // Kitchen should be in South-East (Agni corner) or North-West
    return orientation === 'SOUTH_EAST' || orientation === 'NORTH_WEST';
  }

  evaluateBedroomZone(orientation: Orientation): boolean {
    // Master bedroom in South-West is ideal
    // Other bedrooms in South, West, or North-West
    return ['SOUTH_WEST', 'SOUTH', 'WEST', 'NORTH_WEST'].includes(orientation);
  }

  evaluateStaircaseCompliance(orientation: Orientation): boolean {
    // Staircase should be in South, West, or South-West
    // Should NOT be in North-East (Brahmasthan)
    return ['SOUTH', 'WEST', 'SOUTH_WEST', 'SOUTH_EAST'].includes(orientation);
  }

  recommendWaterTankDirection(): string {
    // Water tank should be in North, North-East, or East
    return 'NORTH_EAST (most auspicious) or NORTH or EAST';
  }

  recommendBorewellDirection(): string {
    // Borewell in North-East is most auspicious
    return 'NORTH_EAST (highly recommended) or NORTH';
  }

  checkHeightBalance(buildingHeight: number, orientation: Orientation): VastuViolation | null {
    // North-East should be lower than South-West
    // This is a general principle - in practice, check actual heights
    
    if (buildingHeight > 30 && (orientation === 'NORTH_EAST' || orientation === 'EAST')) {
      return {
        category: 'HEIGHT_IMBALANCE',
        severity: 'MEDIUM',
        description: 'High-rise in North-East direction',
        impact: 'May block positive energy flow',
      };
    }
    
    return null;
  }

  analyzeWindVastuCompatibility(
    buildingOrientation: Orientation,
    windDirection?: number
  ): string {
    // North and East are auspicious for wind flow
    const auspiciousWindDirections = [0, 45, 90]; // North, NE, East
    
    if (!windDirection) {
      return 'UNKNOWN - Wind data not provided';
    }
    
    const isAuspiciousWind = auspiciousWindDirections.some(
      dir => Math.abs(windDirection - dir) < 45
    );
    
    const isAuspiciousOrientation = this.AUSPICIOUS_ENTRANCES.includes(buildingOrientation);
    
    if (isAuspiciousWind && isAuspiciousOrientation) {
      return 'EXCELLENT - Wind and Vastu alignment optimal';
    } else if (isAuspiciousWind || isAuspiciousOrientation) {
      return 'GOOD - Partial alignment achieved';
    } else {
      return 'MODERATE - Consider Vastu remedies';
    }
  }

  detectViolations(input: VastuInput): VastuViolation[] {
    const violations: VastuViolation[] = [];
    
    // Entrance violations
    if (this.INAUSPICIOUS_ENTRANCES.includes(input.entranceDirection)) {
      violations.push({
        category: 'ENTRANCE',
        severity: 'HIGH',
        description: `Entrance in ${input.entranceDirection} direction`,
        impact: 'May affect prosperity and positive energy',
      });
    }
    
    // Plot shape violations
    if (input.plotShape.toLowerCase().includes('irregular') || 
        input.plotShape.toLowerCase().includes('l-shape')) {
      violations.push({
        category: 'PLOT_SHAPE',
        severity: 'MEDIUM',
        description: 'Irregular or L-shaped plot',
        impact: 'May cause energy imbalance',
      });
    }
    
    // Height violations
    const heightViolation = this.checkHeightBalance(input.buildingHeight, input.orientation);
    if (heightViolation) {
      violations.push(heightViolation);
    }
    
    return violations;
  }

  generateCorrections(violations: VastuViolation[]): VastuCorrection[] {
    const corrections: VastuCorrection[] = [];
    
    for (const violation of violations) {
      switch (violation.category) {
        case 'ENTRANCE':
          corrections.push({
            violation: violation.description,
            solution: 'Install Vastu pyramid or use auspicious symbols at entrance. Consider secondary entrance in North or East.',
            priority: 'HIGH',
          });
          break;
          
        case 'PLOT_SHAPE':
          corrections.push({
            violation: violation.description,
            solution: 'Use Vastu-compliant landscaping to balance energy. Plant trees in South-West to strengthen.',
            priority: 'MEDIUM',
          });
          break;
          
        case 'HEIGHT_IMBALANCE':
          corrections.push({
            violation: violation.description,
            solution: 'Keep North-East area open and light. Avoid heavy structures in North-East.',
            priority: 'MEDIUM',
          });
          break;
      }
    }
    
    // General corrections
    corrections.push({
      violation: 'General Vastu enhancement',
      solution: 'Keep Brahmasthan (center) open and clutter-free',
      priority: 'MEDIUM',
    });
    
    return corrections;
  }

  calculateComplianceScore(input: VastuInput, violations: VastuViolation[]): number {
    let score = 100;
    
    // Deduct for violations
    for (const violation of violations) {
      if (violation.severity === 'HIGH') score -= 20;
      else if (violation.severity === 'MEDIUM') score -= 10;
      else score -= 5;
    }
    
    // Bonus for auspicious entrance
    if (this.AUSPICIOUS_ENTRANCES.includes(input.entranceDirection)) {
      score += 10;
    }
    
    // Bonus for regular plot shape
    if (input.plotShape.toLowerCase().includes('square') || 
        input.plotShape.toLowerCase().includes('rectangle')) {
      score += 5;
    }
    
    return Math.max(0, Math.min(100, score));
  }

  analyzeVastu(input: VastuInput): VastuAnalysis {
    const violations = this.detectViolations(input);
    const corrections = this.generateCorrections(violations);
    const vastuComplianceScore = this.calculateComplianceScore(input, violations);
    
    let overallCompliance: string;
    if (vastuComplianceScore >= 80) overallCompliance = 'EXCELLENT';
    else if (vastuComplianceScore >= 60) overallCompliance = 'GOOD';
    else if (vastuComplianceScore >= 40) overallCompliance = 'MODERATE';
    else overallCompliance = 'POOR';
    
    return {
      vastuComplianceScore,
      overallCompliance,
      entranceSuitability: this.evaluateEntranceSuitability(input.entranceDirection),
      kitchenZoneCompliance: this.evaluateKitchenZone('SOUTH_EAST'),
      bedroomZoneCompliance: this.evaluateBedroomZone('SOUTH_WEST'),
      staircaseCompliance: this.evaluateStaircaseCompliance('SOUTH_WEST'),
      waterTankDirection: this.recommendWaterTankDirection(),
      borewellDirection: this.recommendBorewellDirection(),
      windVastuCompatibility: this.analyzeWindVastuCompatibility(
        input.orientation,
        input.windDirection
      ),
      violations,
      corrections,
    };
  }
}
