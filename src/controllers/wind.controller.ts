import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { WindService } from '../services/wind.service';
import { AppError } from '../middleware/error.middleware';

const windService = new WindService();

export class WindController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { buildingInputId, windDirection, averageWindSpeed, peakGustSpeed, terrainRoughness } = req.body;

      const buildingInput = await prisma.buildingInput.findUnique({
        where: { id: buildingInputId },
      });

      if (!buildingInput) {
        throw new AppError('Building input not found', 404);
      }

      const windAnalysis = windService.analyzeWindData(
        {
          averageWindSpeed,
          peakGustSpeed,
          terrainRoughness,
          buildingHeight: buildingInput.totalHeight,
          buildingWidth: Math.sqrt(buildingInput.builtUpArea),
          buildingDepth: Math.sqrt(buildingInput.builtUpArea),
        },
        buildingInput.orientation
      );

      const windData = await prisma.windData.create({
        data: {
          buildingInputId,
          windDirection,
          averageWindSpeed,
          peakGustSpeed,
          terrainRoughness,
          windPressure: windAnalysis.windPressure,
          windLoad: windAnalysis.windLoad,
          optimalOrientation: windAnalysis.optimalOrientation,
          aerodynamicForm: windAnalysis.aerodynamicForm,
          ventilationStrategy: windAnalysis.ventilationStrategy,
        },
      });

      res.status(201).json({
        status: 'success',
        data: windData,
      });
    } catch (error) {
      next(error);
    }
  }

  async getByBuildingId(req: Request, res: Response, next: NextFunction) {
    try {
      const { buildingInputId } = req.params;

      const windData = await prisma.windData.findUnique({
        where: { buildingInputId },
      });

      if (!windData) {
        throw new AppError('Wind data not found', 404);
      }

      res.status(200).json({
        status: 'success',
        data: windData,
      });
    } catch (error) {
      next(error);
    }
  }
}
