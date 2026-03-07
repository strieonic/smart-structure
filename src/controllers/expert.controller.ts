import { Request, Response, NextFunction } from 'express';
import { ExpertService } from '../services/expert.service';

const expertService = new ExpertService();

export class ExpertController {
  async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const dashboard = await expertService.getExpertDashboard(userId!);
      
      res.status(200).json({
        status: 'success',
        data: dashboard,
      });
    } catch (error) {
      next(error);
    }
  }

  async getExperts(req: Request, res: Response, next: NextFunction) {
    try {
      const { type, location, experience } = req.query;
      const experts = await expertService.getExperts({
        type: type as string,
        location: location as string,
        experience: experience as string,
      });
      
      res.status(200).json({
        status: 'success',
        data: experts,
      });
    } catch (error) {
      next(error);
    }
  }

  async getExpertProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const expert = await expertService.getExpertById(id);
      
      res.status(200).json({
        status: 'success',
        data: expert,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateExpertProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const expert = await expertService.updateExpertProfile(userId!, req.body);
      
      res.status(200).json({
        status: 'success',
        data: expert,
      });
    } catch (error) {
      next(error);
    }
  }

  async getExpertQueries(req: Request, res: Response, next: NextFunction) {
    try {
      const expertId = req.user?.id;
      const { status } = req.query;
      
      const queries = await expertService.getExpertQueries(expertId!, {
        status: status as string,
      });
      
      res.status(200).json({
        status: 'success',
        data: queries,
      });
    } catch (error) {
      next(error);
    }
  }

  async createQuery(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const query = await expertService.createQuery(userId!, req.body);
      
      res.status(201).json({
        status: 'success',
        data: query,
      });
    } catch (error) {
      next(error);
    }
  }

  async respondToQuery(req: Request, res: Response, next: NextFunction) {
    try {
      const { queryId } = req.params;
      const expertId = req.user?.id;
      
      const query = await expertService.respondToQuery(queryId, expertId!, req.body);
      
      res.status(200).json({
        status: 'success',
        data: query,
      });
    } catch (error) {
      next(error);
    }
  }

  async assignQuery(req: Request, res: Response, next: NextFunction) {
    try {
      const { queryId } = req.params;
      const expertId = req.user?.id;
      
      const query = await expertService.assignQuery(queryId, expertId!);
      
      res.status(200).json({
        status: 'success',
        data: query,
      });
    } catch (error) {
      next(error);
    }
  }
}