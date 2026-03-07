import prisma from '../config/database';
import logger from '../config/logger';

interface ComplianceCheckInput {
  projectId: string;
  buildingData: any;
  landData: any;
  locationData: any;
}

interface ComplianceResult {
  ruleId: string;
  ruleCode: string;
  ruleTitle: string;
  isCompliant: boolean;
  actualValue?: number;
  requiredValue?: number;
  deviation?: number;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  recommendation: string;
}

class RegulationService {
  /**
   * Check compliance against all applicable rules
   */
  async checkCompliance(input: ComplianceCheckInput): Promise<ComplianceResult[]> {
    try {
      logger.info(`Checking compliance for project: ${input.projectId}`);

      // Get applicable rules
      const rules = await prisma.governmentRule.findMany({
        where: {
          status: 'ACTIVE',
          state: {
            in: [input.locationData.state, 'ALL']
          },
          zoneType: input.locationData.zoneType,
          effectiveFrom: { lte: new Date() },
          OR: [
            { effectiveTo: null },
            { effectiveTo: { gte: new Date() } }
          ]
        }
      });

      const results: ComplianceResult[] = [];

      for (const rule of rules) {
        const checkResult = await this.checkSingleRule(rule, input);
        if (checkResult) {
          results.push(checkResult);

          // Save to database
          await prisma.complianceCheck.create({
            data: {
              projectId: input.projectId,
              ruleId: rule.id,
              isCompliant: checkResult.isCompliant,
              actualValue: checkResult.actualValue,
              requiredValue: checkResult.requiredValue,
              deviation: checkResult.deviation,
              checkDetails: {
                ruleCode: checkResult.ruleCode,
                ruleTitle: checkResult.ruleTitle
              },
              severity: checkResult.severity,
              recommendation: checkResult.recommendation
            }
          });
        }
      }

      logger.info(`Completed ${results.length} compliance checks`);
      return results;

    } catch (error: any) {
      logger.error('Error in compliance check:', error);
      throw error;
    }
  }

  /**
   * Check compliance against a single rule
   */
  private async checkSingleRule(
    rule: any,
    input: ComplianceCheckInput
  ): Promise<ComplianceResult | null> {
    const { buildingData, landData, locationData } = input;

    switch (rule.ruleCategory) {
      case 'FSI':
        return this.checkFSI(rule, buildingData, landData);
      
      case 'HEIGHT_LIMIT':
        return this.checkHeightLimit(rule, buildingData);
      
      case 'SETBACK':
        return this.checkSetback(rule, buildingData, landData);
      
      case 'BUILDING_SPACING':
        return this.checkBuildingSpacing(rule, buildingData);
      
      case 'FOUNDATION_DEPTH':
        return this.checkFoundationDepth(rule, buildingData, landData);
      
      case 'PARKING':
        return this.checkParking(rule, buildingData);
      
      case 'FIRE_SAFETY':
        return this.checkFireSafety(rule, buildingData);
      
      default:
        logger.warn(`Unknown rule category: ${rule.ruleCategory}`);
        return null;
    }
  }

  /**
   * Check FSI (Floor Space Index) compliance
   */
  private checkFSI(rule: any, buildingData: any, landData: any): ComplianceResult {
    const actualFSI = buildingData.builtUpArea / landData.plotArea;
    const maxFSI = rule.maxValue || 2.0;
    const isCompliant = actualFSI <= maxFSI;
    const deviation = ((actualFSI - maxFSI) / maxFSI) * 100;

    return {
      ruleId: rule.id,
      ruleCode: rule.ruleCode,
      ruleTitle: rule.title,
      isCompliant,
      actualValue: parseFloat(actualFSI.toFixed(2)),
      requiredValue: maxFSI,
      deviation: parseFloat(deviation.toFixed(2)),
      severity: deviation > 20 ? 'CRITICAL' : deviation > 10 ? 'HIGH' : 'MEDIUM',
      recommendation: isCompliant
        ? 'FSI is within permissible limits.'
        : `Reduce built-up area by ${((actualFSI - maxFSI) * landData.plotArea).toFixed(2)} sq.m to comply with FSI norms.`
    };
  }

  /**
   * Check height limit compliance
   */
  private checkHeightLimit(rule: any, buildingData: any): ComplianceResult {
    const actualHeight = buildingData.totalHeight;
    const maxHeight = rule.maxValue || 50;
    const isCompliant = actualHeight <= maxHeight;
    const deviation = ((actualHeight - maxHeight) / maxHeight) * 100;

    return {
      ruleId: rule.id,
      ruleCode: rule.ruleCode,
      ruleTitle: rule.title,
      isCompliant,
      actualValue: actualHeight,
      requiredValue: maxHeight,
      deviation: parseFloat(deviation.toFixed(2)),
      severity: deviation > 15 ? 'CRITICAL' : deviation > 5 ? 'HIGH' : 'MEDIUM',
      recommendation: isCompliant
        ? 'Building height is within permissible limits.'
        : `Reduce building height by ${(actualHeight - maxHeight).toFixed(2)}m or reduce ${Math.ceil((actualHeight - maxHeight) / buildingData.floorHeight)} floors.`
    };
  }

  /**
   * Check setback requirements
   */
  private checkSetback(rule: any, buildingData: any, landData: any): ComplianceResult {
    // Simplified setback calculation
    // In production, this would be more complex based on plot dimensions
    const requiredSetback = rule.minValue || 3;
    const plotWidth = Math.sqrt(landData.plotArea); // Simplified assumption
    const buildingWidth = Math.sqrt(buildingData.builtUpArea / buildingData.totalFloors);
    const availableSetback = (plotWidth - buildingWidth) / 2;
    
    const isCompliant = availableSetback >= requiredSetback;
    const deviation = ((requiredSetback - availableSetback) / requiredSetback) * 100;

    return {
      ruleId: rule.id,
      ruleCode: rule.ruleCode,
      ruleTitle: rule.title,
      isCompliant,
      actualValue: parseFloat(availableSetback.toFixed(2)),
      requiredValue: requiredSetback,
      deviation: parseFloat(deviation.toFixed(2)),
      severity: deviation > 30 ? 'CRITICAL' : deviation > 15 ? 'HIGH' : 'MEDIUM',
      recommendation: isCompliant
        ? 'Setback requirements are met.'
        : `Increase setback by ${(requiredSetback - availableSetback).toFixed(2)}m on all sides or reduce building footprint.`
    };
  }

  /**
   * Check building spacing
   */
  private checkBuildingSpacing(rule: any, buildingData: any): ComplianceResult {
    const requiredSpacing = rule.minValue || 6;
    // This would need actual site plan data in production
    const assumedSpacing = buildingData.totalHeight * 0.15; // Simplified
    const isCompliant = assumedSpacing >= requiredSpacing;

    return {
      ruleId: rule.id,
      ruleCode: rule.ruleCode,
      ruleTitle: rule.title,
      isCompliant,
      actualValue: parseFloat(assumedSpacing.toFixed(2)),
      requiredValue: requiredSpacing,
      severity: 'MEDIUM',
      recommendation: isCompliant
        ? 'Building spacing appears adequate.'
        : `Ensure minimum ${requiredSpacing}m spacing between buildings. Verify with detailed site plan.`
    };
  }

  /**
   * Check foundation depth
   */
  private checkFoundationDepth(rule: any, buildingData: any, landData: any): ComplianceResult {
    const requiredDepth = rule.minValue || 1.5;
    
    // Calculate based on soil type and building height
    let recommendedDepth = requiredDepth;
    if (landData.soilType === 'BLACK_COTTON') {
      recommendedDepth = Math.max(requiredDepth, 2.5);
    } else if (landData.soilType === 'SANDY') {
      recommendedDepth = Math.max(requiredDepth, 2.0);
    }
    
    // For high-rise, increase depth
    if (buildingData.totalHeight > 30) {
      recommendedDepth = Math.max(recommendedDepth, 3.0);
    }

    const isCompliant = true; // This is a recommendation, not a violation

    return {
      ruleId: rule.id,
      ruleCode: rule.ruleCode,
      ruleTitle: rule.title,
      isCompliant,
      requiredValue: recommendedDepth,
      severity: 'HIGH',
      recommendation: `Minimum foundation depth should be ${recommendedDepth}m considering soil type (${landData.soilType}) and building height.`
    };
  }

  /**
   * Check parking requirements
   */
  private checkParking(rule: any, buildingData: any): ComplianceResult {
    // Simplified parking calculation
    const requiredParkingPerFloor = rule.minValue || 2;
    const requiredTotal = buildingData.totalFloors * requiredParkingPerFloor;
    const providedParking = buildingData.parkingFloors * 20; // Assume 20 cars per parking floor
    
    const isCompliant = providedParking >= requiredTotal;
    const deviation = ((requiredTotal - providedParking) / requiredTotal) * 100;

    return {
      ruleId: rule.id,
      ruleCode: rule.ruleCode,
      ruleTitle: rule.title,
      isCompliant,
      actualValue: providedParking,
      requiredValue: requiredTotal,
      deviation: parseFloat(deviation.toFixed(2)),
      severity: deviation > 30 ? 'HIGH' : 'MEDIUM',
      recommendation: isCompliant
        ? 'Parking requirements are met.'
        : `Provide ${Math.ceil((requiredTotal - providedParking) / 20)} additional parking floor(s) or ${requiredTotal - providedParking} parking spaces.`
    };
  }

  /**
   * Check fire safety requirements
   */
  private checkFireSafety(rule: any, buildingData: any): ComplianceResult {
    const requiresFireSafety = buildingData.totalHeight > 15 || buildingData.totalFloors > 4;
    const isCompliant = !requiresFireSafety; // Simplified - would need actual fire safety data

    return {
      ruleId: rule.id,
      ruleCode: rule.ruleCode,
      ruleTitle: rule.title,
      isCompliant,
      severity: 'CRITICAL',
      recommendation: requiresFireSafety
        ? 'Building requires: Fire NOC, sprinkler system, fire exits on each floor, fire-resistant materials, emergency lighting, and fire alarm system.'
        : 'Standard fire safety measures required as per NBC.'
    };
  }

  /**
   * Get compliance summary for a project
   */
  async getComplianceSummary(projectId: string) {
    const checks = await prisma.complianceCheck.findMany({
      where: { projectId },
      include: { rule: true }
    });

    const total = checks.length;
    const compliant = checks.filter(c => c.isCompliant).length;
    const critical = checks.filter(c => c.severity === 'CRITICAL' && !c.isCompliant).length;
    const high = checks.filter(c => c.severity === 'HIGH' && !c.isCompliant).length;

    return {
      total,
      compliant,
      nonCompliant: total - compliant,
      complianceRate: total > 0 ? (compliant / total) * 100 : 0,
      criticalViolations: critical,
      highViolations: high,
      checks
    };
  }
}

export default new RegulationService();
