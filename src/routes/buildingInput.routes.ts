import { Router } from 'express';
import { BuildingInputController } from '../controllers/buildingInput.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { createBuildingInputSchema } from '../validators/buildingInput.validator';
import { auditLog } from '../middleware/audit.middleware';

const router = Router();
const buildingInputController = new BuildingInputController();

router.use(authenticate);

router.post(
  '/',
  validate(createBuildingInputSchema),
  auditLog('CREATE', 'BUILDING_INPUT'),
  buildingInputController.create
);

router.get('/:id', buildingInputController.getById);
router.put('/:id', auditLog('UPDATE', 'BUILDING_INPUT'), buildingInputController.update);

export default router;
