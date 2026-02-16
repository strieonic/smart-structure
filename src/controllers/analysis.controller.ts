import { Request, Response, NextFunction } from 'express';
import { AnalysisService } from '../services/analysis.service';
import prisma from '../config/database';
import { AppError } from '../middleware/error.middleware';

const analysisService = new AnalysisService();

export class AnalysisController {
  async performDisasterAnalysis(req: Request, res: Response, next: NextFunction) {
    try {
      const { buildingInputId } = req.params;
      
      const result = await analysisService.performCompleteAnalysis(buildingInputId);

      res.status(200).json({
        status: 'success',
        message: 'Disaster analysis completed',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async performVastuAnalysis(req: Request, res: Response, next: NextFunction) {
    try {
      const { buildingInputId } = req.params;
      
      const result = await analysisService.performVastuAnalysis(buildingInputId);

      res.status(200).json({
        status: 'success',
        message: 'Vastu analysis completed',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async generateFinalReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { buildingInputId } = req.params;
      
      const result = await analysisService.generateFinalReport(buildingInputId);

      res.status(200).json({
        status: 'success',
        message: 'Final report generated',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getDisasterAnalysis(req: Request, res: Response, next: NextFunction) {
    try {
      const { buildingInputId } = req.params;
      
      const analysis = await prisma.disasterAnalysis.findUnique({
        where: { buildingInputId },
      });

      if (!analysis) {
        throw new AppError('Disaster analysis not found', 404);
      }

      res.status(200).json({
        status: 'success',
        data: analysis,
      });
    } catch (error) {
      next(error);
    }
  }

  async getVastuReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { buildingInputId } = req.params;
      
      const report = await prisma.vastuReport.findUnique({
        where: { buildingInputId },
      });

      if (!report) {
        throw new AppError('Vastu report not found', 404);
      }

      res.status(200).json({
        status: 'success',
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }

  async getFinalReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { buildingInputId } = req.params;
      
      const report = await prisma.finalReport.findUnique({
        where: { buildingInputId },
        include: {
          buildingInput: {
            include: {
              landSurvey: true,
              windData: true,
              disasterAnalysis: true,
              vastuReport: true,
            },
          },
        },
      });

      if (!report) {
        throw new AppError('Final report not found', 404);
      }

      res.status(200).json({
        status: 'success',
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }
}
