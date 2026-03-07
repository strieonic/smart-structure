import prisma from '../config/database';
import logger from '../config/logger';
import huggingfaceService from './huggingface.service';
import regulationService from './regulation.service';
import locationService from './location.service';

interface HybridAnalysisInput {
  projectId: string;
  buildingInputId: string;
  landSurveyId: string;
}

interface HybridAnalysisOutput {
  projectId: string;
  ruleBasedAnalysis: {
    complianceChecks: any[];
    complianceSummary: any;
  };
  aiAnalysis: {
    complianceReport: any;
    riskAnalysis: any;
    recommendations: any;
    modifications: any;
  };
  combinedScore: number;
  overallStatus: 'COMPLIANT' | 'PARTIAL' | 'NON_COMPLIANT';
  criticalIssues: string[];
  actionItems: string[];
}

class HybridAnalysisService {
  /**
   * Run complete hybrid analysis (rule-based + AI)
   */
  async runCompleteAnalysis(input: HybridAnalysisInput): Promise<HybridAnalysisOutput> {
    try {
      logger.info(`Starting hybrid analysis for project: ${input.projectId}`);

      // Step 1: Fetch all required data
      const { buildingData, landData, locationData, existingAnalysis } = await this.fetchProjectData(input);

      // Step 2: Run rule-based compliance checks
      logger.info('Running rule-based compliance checks...');
      const complianceChecks = await regulationService.checkCompliance({
        projectId: input.projectId,
        buildingData,
        landData,
        locationData
      });

      const complianceSummary = await regulationService.getComplianceSummary(input.projectId);

      // Step 3: Get applicable rules for AI context
      const applicableRules = await locationService.getApplicableRules(locationData.id);

      // Step 4: Run AI analysis with all context
      logger.info('Running Hugging Face AI analysis...');
      const aiAnalysis = await huggingfaceService.analyzeBuilding({
        buildingData,
        landData,
        locationData,
        applicableRules,
        existingAnalysis
      });

      // Step 5: Enhance compliance checks with AI explanations
      await this.enhanceWithAI(complianceChecks, buildingData, locationData);

      // Step 6: Calculate combined score and status
      const combinedScore = this.calculateCombinedScore(complianceSummary, aiAnalysis);
      const overallStatus = this.determineOverallStatus(complianceSummary, aiAnalysis);

      // Step 7: Extract critical issues and action items
      const criticalIssues = this.extractCriticalIssues(complianceChecks, aiAnalysis);
      const actionItems = this.extractActionItems(aiAnalysis);

      // Step 8: Save AI analysis result to project
      await prisma.buildingProject.update({
        where: { id: input.projectId },
        data: {
          aiAnalysisCompleted: true,
          aiAnalysisResult: JSON.parse(JSON.stringify({
            aiAnalysis,
            complianceSummary,
            combinedScore,
            overallStatus,
            analyzedAt: new Date()
          }))
        }
      });

      logger.info(`Hybrid analysis completed for project: ${input.projectId}`);

      return {
        projectId: input.projectId,
        ruleBasedAnalysis: {
          complianceChecks,
          complianceSummary
        },
        aiAnalysis,
        combinedScore,
        overallStatus,
        criticalIssues,
        actionItems
      };

    } catch (error: any) {
      logger.error('Error in hybrid analysis:', error);
      throw new Error(`Hybrid analysis failed: ${error.message}`);
    }
  }

  /**
   * Fetch all project data needed for analysis
   */
  private async fetchProjectData(input: HybridAnalysisInput) {
    const project = await prisma.buildingProject.findUnique({
      where: { id: input.projectId },
      include: {
        location: true,
        buildingInput: {
          include: {
            landSurvey: true,
            disasterAnalysis: true,
            vastuReport: true
          }
        }
      }
    });

    if (!project || !project.buildingInput) {
      throw new Error('Project or building input not found');
    }

    return {
      buildingData: project.buildingInput,
      landData: project.buildingInput.landSurvey,
      locationData: project.location,
      existingAnalysis: project.buildingInput.disasterAnalysis
    };
  }

  /**
   * Enhance compliance checks with AI explanations
   */
  private async enhanceWithAI(checks: any[], buildingData: any, locationData: any) {
    for (const check of checks) {
      if (!check.isCompliant) {
        try {
          const rule = await prisma.governmentRule.findUnique({
            where: { id: check.ruleId }
          });

          if (rule) {
            const explanation = await huggingfaceService.explainViolation(
              rule,
              check.actualValue || 0,
              check.requiredValue || 0,
              {
                buildingType: buildingData.buildingType,
                city: locationData.city,
                state: locationData.state,
                totalFloors: buildingData.totalFloors
              }
            );

            await prisma.complianceCheck.update({
              where: { id: check.id },
              data: { aiExplanation: explanation }
            });
          }
        } catch (error) {
          logger.warn(`Failed to get AI explanation for check ${check.id}`);
        }
      }
    }
  }

  /**
   * Calculate combined score from rule-based and AI analysis
   */
  private calculateCombinedScore(complianceSummary: any, aiAnalysis: any): number {
    const ruleBasedScore = complianceSummary.complianceRate;
    const aiScore = aiAnalysis.complianceReport.score;
    
    // Weighted average: 60% rule-based, 40% AI
    const combined = (ruleBasedScore * 0.6) + (aiScore * 0.4);
    
    return parseFloat(combined.toFixed(2));
  }

  /**
   * Determine overall compliance status
   */
  private determineOverallStatus(
    complianceSummary: any,
    aiAnalysis: any
  ): 'COMPLIANT' | 'PARTIAL' | 'NON_COMPLIANT' {
    const criticalViolations = complianceSummary.criticalViolations;
    const aiCompliance = aiAnalysis.complianceReport.overallCompliance;
    
    if (criticalViolations > 0 || aiCompliance === 'NON_COMPLIANT') {
      return 'NON_COMPLIANT';
    }
    
    if (complianceSummary.complianceRate === 100 && aiCompliance === 'COMPLIANT') {
      return 'COMPLIANT';
    }
    
    return 'PARTIAL';
  }

  /**
   * Extract critical issues from both analyses
   */
  private extractCriticalIssues(checks: any[], aiAnalysis: any): string[] {
    const issues: string[] = [];
    
    // From rule-based checks
    const criticalChecks = checks.filter(c => 
      !c.isCompliant && (c.severity === 'CRITICAL' || c.severity === 'HIGH')
    );
    
    for (const check of criticalChecks) {
      issues.push(`${check.ruleCode}: ${check.recommendation}`);
    }
    
    // From AI analysis
    const criticalViolations = aiAnalysis.complianceReport.violations.filter(
      (v: any) => v.severity === 'CRITICAL' || v.severity === 'HIGH'
    );
    
    for (const violation of criticalViolations) {
      issues.push(`${violation.ruleCode}: ${violation.description}`);
    }
    
    return [...new Set(issues)]; // Remove duplicates
  }

  /**
   * Extract action items from AI recommendations
   */
  private extractActionItems(aiAnalysis: any): string[] {
    const items: string[] = [];
    
    items.push(...aiAnalysis.recommendations.immediate);
    items.push(...aiAnalysis.recommendations.shortTerm);
    
    return items;
  }

  /**
   * Get analysis status for a project
   */
  async getAnalysisStatus(projectId: string) {
    const project = await prisma.buildingProject.findUnique({
      where: { id: projectId },
      select: {
        aiAnalysisRequested: true,
        aiAnalysisCompleted: true,
        aiAnalysisResult: true,
        complianceChecks: {
          include: { rule: true }
        }
      }
    });

    if (!project) {
      throw new Error('Project not found');
    }

    return {
      requested: project.aiAnalysisRequested,
      completed: project.aiAnalysisCompleted,
      result: project.aiAnalysisResult,
      complianceChecks: project.complianceChecks
    };
  }
}

export default new HybridAnalysisService();
