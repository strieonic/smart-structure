import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../middleware/error.middleware';

export class BuildingInputController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { landSurveyId } = req.body;
      
      const landSurvey = await prisma.landSurvey.findUnique({
        where: { id: landSurveyId },
      });

      if (!landSurvey) {
        throw new AppError('Land survey not found', 404);
      }

      if (landSurvey.userId !== req.user!.id && req.user!.role !== 'ADMIN') {
        throw new AppError('Unauthorized access', 403);
      }

      const buildingInput = await prisma.buildingInput.create({
        data: req.body,
      });

      res.status(201).json({
        status: 'success',
        data: buildingInput,
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const buildingInput = await prisma.buildingInput.findUnique({
        where: { id },
        include: {
          landSurvey: true,
          windData: true,
          disasterAnalysis: true,
          vastuReport: true,
          finalReport: true,
        },
      });

      if (!buildingInput) {
        throw new AppError('Building input not found', 404);
      }

      res.status(200).json({
        status: 'success',
        data: buildingInput,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const buildingInput = await prisma.buildingInput.update({
        where: { id },
        data: req.body,
      });

      res.status(200).json({
        status: 'success',
        data: buildingInput,
      });
    } catch (error) {
      next(error);
    }
  }
}
