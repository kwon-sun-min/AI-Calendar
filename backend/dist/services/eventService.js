"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteEvent = exports.updateEvent = exports.createEvent = exports.getEventById = exports.listEvents = void 0;
const prisma_1 = require("../lib/prisma");
const httpError_1 = require("../lib/httpError");
const dateRange_1 = require("../utils/dateRange");
const baseSelect = {
    id: true,
    title: true,
    description: true,
    start: true,
    end: true,
    timezone: true,
    isAllDay: true,
    recurrenceRule: true,
    intent: true,
    tags: true,
    createdAt: true,
    updatedAt: true,
};
const listEvents = async (filters) => {
    const where = {};
    if (filters.month) {
        const { start, end } = (0, dateRange_1.buildMonthRange)(filters.month);
        where.start = {
            gte: start,
            lt: end,
        };
    }
    if (filters.intent) {
        where.intent = filters.intent;
    }
    return prisma_1.prisma.event.findMany({
        where,
        orderBy: { start: 'asc' },
        select: baseSelect,
    });
};
exports.listEvents = listEvents;
const getEventById = async (id) => {
    const event = await prisma_1.prisma.event.findUnique({
        where: { id },
        select: baseSelect,
    });
    if (!event) {
        throw new httpError_1.HttpError(404, 'Event not found');
    }
    return event;
};
exports.getEventById = getEventById;
const createEvent = async (payload) => {
    const data = {
        title: payload.title,
        description: payload.description ?? null,
        start: new Date(payload.start),
        end: new Date(payload.end),
        timezone: payload.timezone ?? null,
        isAllDay: payload.isAllDay ?? false,
        recurrenceRule: payload.recurrenceRule ?? null,
        intent: payload.intent ?? null,
        tags: payload.tags ?? [],
    };
    return prisma_1.prisma.event.create({
        data,
        select: baseSelect,
    });
};
exports.createEvent = createEvent;
const updateEvent = async (id, payload) => {
    await (0, exports.getEventById)(id);
    const data = {};
    if (payload.title !== undefined)
        data.title = payload.title;
    if (payload.description !== undefined)
        data.description = payload.description;
    if (payload.start)
        data.start = new Date(payload.start);
    if (payload.end)
        data.end = new Date(payload.end);
    if (payload.timezone !== undefined)
        data.timezone = payload.timezone;
    if (payload.isAllDay !== undefined)
        data.isAllDay = payload.isAllDay;
    if (payload.recurrenceRule !== undefined)
        data.recurrenceRule = payload.recurrenceRule;
    if (payload.intent !== undefined)
        data.intent = payload.intent;
    if (payload.tags !== undefined)
        data.tags = payload.tags;
    return prisma_1.prisma.event.update({
        where: { id },
        data,
        select: baseSelect,
    });
};
exports.updateEvent = updateEvent;
const deleteEvent = async (id) => {
    await (0, exports.getEventById)(id);
    await prisma_1.prisma.event.delete({ where: { id } });
};
exports.deleteEvent = deleteEvent;
//# sourceMappingURL=eventService.js.map