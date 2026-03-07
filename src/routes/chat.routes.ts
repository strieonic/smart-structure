import express from 'express';
import * as chatController from '../controllers/chat.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { z } from 'zod';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Validation schemas
const createSessionSchema = z.object({
  body: z.object({
    projectId: z.string().uuid()
  })
});

const sendMessageSchema = z.object({
  body: z.object({
    message: z.string().min(1).max(2000)
  })
});

// Routes
router.post('/sessions', validateRequest(createSessionSchema), chatController.createChatSession);
router.get('/sessions', chatController.listChatSessions);
router.get('/sessions/:id', chatController.getChatHistory);
router.post('/sessions/:id/messages', validateRequest(sendMessageSchema), chatController.sendMessage);
router.post('/sessions/:id/close', chatController.closeChatSession);

export default router;
