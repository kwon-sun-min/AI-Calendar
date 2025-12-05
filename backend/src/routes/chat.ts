import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as chatService from '../services/chatService';

const router = Router();

router.get(
    '/sessions/:userId',
    asyncHandler(async (req, res) => {
        const { userId } = req.params;
        if (!userId) {
            res.status(400).json({ error: 'User ID is required' });
            return;
        }
        const sessions = await chatService.getUserSessions(userId);
        res.json({ sessions });
    }),
);

router.post(
    '/sessions',
    asyncHandler(async (req, res) => {
        const { userId, title } = req.body;
        if (!userId) {
            res.status(400).json({ error: 'User ID is required' });
            return;
        }
        const session = await chatService.createSession(userId, title);
        res.status(201).json({ session });
    }),
);

router.get(
    '/sessions/:sessionId/messages',
    asyncHandler(async (req, res) => {
        const { sessionId } = req.params;
        if (!sessionId) {
            res.status(400).json({ error: 'Session ID is required' });
            return;
        }
        const messages = await chatService.getSessionMessages(sessionId);
        res.json({ messages });
    }),
);

router.post(
    '/messages',
    asyncHandler(async (req, res) => {
        const { sessionId, role, text } = req.body;
        if (!sessionId || !role || !text) {
            res.status(400).json({ error: 'Missing required fields' });
            return;
        }
        const message = await chatService.saveChatMessage(sessionId, role, text);
        res.status(201).json({ message });
    }),
);

router.delete(
    '/sessions/:sessionId',
    asyncHandler(async (req, res) => {
        const { sessionId } = req.params;
        if (!sessionId) {
            res.status(400).json({ error: 'Session ID is required' });
            return;
        }
        await chatService.deleteSession(sessionId);
        res.status(204).end();
    }),
);

router.put(
    '/sessions/:sessionId',
    asyncHandler(async (req, res) => {
        const { sessionId } = req.params;
        const { title } = req.body;
        if (!sessionId || !title) {
            res.status(400).json({ error: 'Session ID and Title are required' });
            return;
        }
        const session = await chatService.updateSessionTitle(sessionId, title);
        res.json({ session });
    }),
);

export default router;
