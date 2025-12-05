import { prisma } from '../lib/prisma';

export const getUserSessions = async (userId: string) => {
    return prisma.chatSession.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        include: {
            messages: {
                take: 1,
                orderBy: { createdAt: 'desc' },
            },
        },
    });
};

export const createSession = async (userId: string, title: string = 'New Chat') => {
    return prisma.chatSession.create({
        data: {
            userId,
            title,
        },
    });
};

export const getSessionMessages = async (sessionId: string) => {
    return prisma.chatMessage.findMany({
        where: { sessionId },
        orderBy: { createdAt: 'asc' },
    });
};

export const saveChatMessage = async (sessionId: string, role: string, text: string) => {
    // Update session updatedAt
    await prisma.chatSession.update({
        where: { id: sessionId },
        data: { updatedAt: new Date() },
    });

    return prisma.chatMessage.create({
        data: {
            sessionId,
            role,
            text,
        },
    });
};

export const deleteSession = async (sessionId: string) => {
    return prisma.chatSession.delete({
        where: { id: sessionId },
    });
};

export const updateSessionTitle = async (sessionId: string, title: string) => {
    return prisma.chatSession.update({
        where: { id: sessionId },
        data: { title },
    });
};
