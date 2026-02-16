import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../middleware/error.middleware';

export class LandSurveyController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const landSurvey = await prisma.landSurvey.create({
        data: {
          userId: req.user!.id,
          ...req.body,
        },
      });

      res.status(201).json({
        status: 'success',
        data: landSurvey,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const landSurveys = await prisma.landSurvey.findMany({
        where: { userId: req.user!.id },
        orderBy: { createdAt: 'desc' },
      });

      res.status(200).json({
        status: 'success',
        data: landSurveys,
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const landSurvey = await prisma.landSurvey.findUnique({
        where: { id },
        include: {
          buildingInputs: true,
        },
      });

      if (!landSurvey) {
        throw new AppError('Land survey not found', 404);
      }

      if (landSurvey.userId !== req.user!.id && req.user!.role !== 'ADMIN') {
        throw new AppError('Unauthorized access', 403);
      }

      res.status(200).json({
        status: 'success',
        data: landSurvey,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const landSurvey = await prisma.landSurvey.findUnique({
        where: { id },
      });

      if (!landSurvey) {
        throw new AppError('Land survey not found', 404);
      }

      if (landSurvey.userId !== req.user!.id && req.user!.role !== 'ADMIN') {
        throw new AppError('Unauthorized access', 403);
      }

      const updated = await prisma.landSurvey.update({
        where: { id },
        data: req.body,
      });

      res.status(200).json({
        status: 'success',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const landSurvey = await prisma.landSurvey.findUnique({
        where: { id },
      });

      if (!landSurvey) {
        throw new AppError('Land survey not found', 404);
      }

      if (landSurvey.userId !== req.user!.id && req.user!.role !== 'ADMIN') {
        throw new AppError('Unauthorized access', 403);
      }

      await prisma.landSurvey.delete({
        where: { id },
      });

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
