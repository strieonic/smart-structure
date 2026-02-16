import { Router } from 'express';
import { WindController } from '../controllers/wind.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { createWindDataSchema } from '../validators/buildingInput.validator';
import { auditLog } from '../middleware/audit.middleware';

const router = Router();
const windController = new WindController();

router.use(authenticate);

router.post(
  '/',
  validate(createWindDataSchema),
  auditLog('CREATE', 'WIND_DATA'),
  windController.create
);

router.get('/building/:buildingInputId', windController.getByBuildingId);

export default router;
