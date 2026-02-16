import { Router } from 'express';
import { AnalysisController } from '../controllers/analysis.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { auditLog } from '../middleware/audit.middleware';

const router = Router();
const analysisController = new AnalysisController();

router.use(authenticate);

router.post(
  '/disaster/:buildingInputId',
  auditLog('ANALYZE', 'DISASTER'),
  analysisController.performDisasterAnalysis
);

router.post(
  '/vastu/:buildingInputId',
  auditLog('ANALYZE', 'VASTU'),
  analysisController.performVastuAnalysis
);

router.post(
  '/report/:buildingInputId',
  auditLog('GENERATE', 'FINAL_REPORT'),
  analysisController.generateFinalReport
);

router.get('/disaster/:buildingInputId', analysisController.getDisasterAnalysis);
router.get('/vastu/:buildingInputId', analysisController.getVastuReport);
router.get('/report/:buildingInputId', analysisController.getFinalReport);

export default router;
