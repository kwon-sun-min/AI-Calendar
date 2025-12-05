import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as chatService from '../services/chatService';

const router = Router();

router.get(
    '/:userId',
    asyncHandler(async (req, res) => {
        const { userId } = req.params;
        if (!userId) {
            res.status(400).json({ error: 'User ID is required' });
            return;
        }
        const history = await chatService.getChatHistory(userId);
        res.json({ history });
    }),
);

router.post(
    '/',
    asyncHandler(async (req, res) => {
        const { userId, role, text } = req.body;
        if (!userId || !role || !text) {
            res.status(400).json({ error: 'Missing required fields' });
            return;
        }
        const message = await chatService.saveChatMessage(userId, role, text);
        res.status(201).json({ message });
    }),
);

router.delete(
    '/:userId',
    asyncHandler(async (req, res) => {
        const { userId } = req.params;
        if (!userId) {
            res.status(400).json({ error: 'User ID is required' });
            return;
        }
        await chatService.clearChatHistory(userId);
        res.status(204).end();
    }),
);

export default router;
