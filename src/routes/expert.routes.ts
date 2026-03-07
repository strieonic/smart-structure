import { Router } from 'express';
import { ExpertController } from '../controllers/expert.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
const expertController = new ExpertController();

// Public routes
router.get('/', expertController.getExperts);
router.get('/:id', expertController.getExpertProfile);

// Protected routes
router.use(authenticate);

// Expert dashboard
router.get('/dashboard/stats', expertController.getDashboard);

// Expert profile management
router.put('/profile', expertController.updateExpertProfile);

// Query management
router.get('/queries/all', expertController.getExpertQueries);
router.post('/queries', expertController.createQuery);
router.post('/queries/:queryId/assign', expertController.assignQuery);
router.post('/queries/:queryId/respond', expertController.respondToQuery);

export default router;