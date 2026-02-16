import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validate } from '../middleware/validation.middleware';
import { registerSchema, loginSchema } from '../validators/auth.validator';
import { authLimiter } from '../middleware/rateLimit.middleware';

const router = Router();
const authController = new AuthController();

router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/refresh', authController.refreshToken);

export default router;
