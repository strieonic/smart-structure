import { Router } from 'express';
import authRoutes from './auth.routes';
import landSurveyRoutes from './landSurvey.routes';
import buildingInputRoutes from './buildingInput.routes';
import windRoutes from './wind.routes';
import analysisRoutes from './analysis.routes';
import projectRoutes from './project.routes';
import chatRoutes from './chat.routes';
import expertRoutes from './expert.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/land-surveys', landSurveyRoutes);
router.use('/building-inputs', buildingInputRoutes);
router.use('/wind', windRoutes);
router.use('/analysis', analysisRoutes);
router.use('/projects', projectRoutes);
router.use('/chat', chatRoutes);
router.use('/experts', expertRoutes);

router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Smart Load Distribution Analyzer API is running',
    timestamp: new Date().toISOString(),
  });
});

export default router;
