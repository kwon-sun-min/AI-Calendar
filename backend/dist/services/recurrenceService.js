"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listOccurrences = void 0;
const prisma_1 = require("../lib/prisma");
const recurrence_1 = require("../utils/recurrence");
const listOccurrences = async (filters) => {
    const rangeStart = new Date(filters.start);
    const rangeEnd = new Date(filters.end);
    const limit = filters.limit ?? 200;
    const where = {
        OR: [
            {
                start: {
                    lt: rangeEnd,
                },
                end: {
                    gt: rangeStart,
                },
            },
            {
                recurrenceRule: {
                    not: null,
                },
            },
        ],
    };
    if (filters.intent) {
        where.intent = filters.intent;
    }
    const events = await prisma_1.prisma.event.findMany({ where });
    const occurrences = [];
    events.forEach((event) => {
        if (event.recurrenceRule) {
            occurrences.push(...(0, recurrence_1.expandRecurringEvent)(event, rangeStart, rangeEnd, limit));
        }
        else if ((0, recurrence_1.isEventWithinRange)(event, rangeStart, rangeEnd)) {
            occurrences.push({
                occurrenceId: `${event.id}:${event.start.toISOString()}`,
                sourceEventId: event.id,
                title: event.title,
                description: event.description ?? null,
                start: new Date(event.start),
                end: new Date(event.end),
                timezone: event.timezone ?? null,
                isAllDay: event.isAllDay,
                recurrenceRule: event.recurrenceRule ?? null,
                intent: event.intent,
                tags: event.tags ?? [],
                createdAt: event.createdAt,
                updatedAt: event.updatedAt,
                isRecurringInstance: false,
            });
        }
    });
    return occurrences
        .sort((a, b) => a.start.getTime() - b.start.getTime())
        .slice(0, limit);
};
exports.listOccurrences = listOccurrences;
//# sourceMappingURL=recurrenceService.js.map