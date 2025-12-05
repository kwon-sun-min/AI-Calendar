import { prisma } from '../lib/prisma';

export const getChatHistory = async (userId: string) => {
    return prisma.chatMessage.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' },
    });
};

export const saveChatMessage = async (userId: string, role: string, text: string) => {
    return prisma.chatMessage.create({
        data: {
            userId,
            role,
            text,
        },
    });
};

export const clearChatHistory = async (userId: string) => {
    return prisma.chatMessage.deleteMany({
        where: { userId },
    });
};
