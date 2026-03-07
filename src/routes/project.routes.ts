import express from 'express';
import * as projectController from '../controllers/project.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { z } from 'zod';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Validation schemas
const createProjectSchema = z.object({
  body: z.object({
    projectName: z.string().min(1).max(200),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    landSurveyId: z.string().uuid().optional(),
    buildingInputId: z.string().uuid().optional(),
    projectType: z.enum(['RESIDENTIAL', 'COMMERCIAL', 'HOSPITAL', 'SCHOOL', 'INDUSTRIAL', 'MIXED_USE']).optional()
  })
});

const updateProjectSchema = z.object({
  body: z.object({
    projectName: z.string().min(1).max(200).optional(),
    status: z.enum(['DRAFT', 'ANALYZING', 'COMPLETED']).optional()
  })
});

// Routes
router.post('/', validateRequest(createProjectSchema), projectController.createProject);
router.get('/', projectController.listProjects);
router.get('/:id', projectController.getProject);
router.put('/:id', validateRequest(updateProjectSchema), projectController.updateProject);
router.delete('/:id', projectController.deleteProject);
router.post('/:id/analyze', projectController.runAnalysis);
router.get('/:id/analysis-status', projectController.getAnalysisStatus);

export default router;
