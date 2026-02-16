import { Router } from 'express';
import { LandSurveyController } from '../controllers/landSurvey.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { createLandSurveySchema } from '../validators/landSurvey.validator';
import { auditLog } from '../middleware/audit.middleware';

const router = Router();
const landSurveyController = new LandSurveyController();

router.use(authenticate);

router.post(
  '/',
  validate(createLandSurveySchema),
  auditLog('CREATE', 'LAND_SURVEY'),
  landSurveyController.create
);

router.get('/', landSurveyController.getAll);
router.get('/:id', landSurveyController.getById);
router.put('/:id', auditLog('UPDATE', 'LAND_SURVEY'), landSurveyController.update);
router.delete('/:id', auditLog('DELETE', 'LAND_SURVEY'), landSurveyController.delete);

export default router;
