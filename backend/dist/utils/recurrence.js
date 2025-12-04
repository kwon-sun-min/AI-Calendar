"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isEventWithinRange = exports.expandRecurringEvent = void 0;
const rrule_1 = require("rrule");
const buildOccurrenceId = (eventId, date, index) => `${eventId}:${date.toISOString()}:${index}`;
const expandRecurringEvent = (event, rangeStart, rangeEnd, limit = 200) => {
    if (!event.recurrenceRule) {
        return [];
    }
    try {
        const rule = (0, rrule_1.rrulestr)(event.recurrenceRule, { dtstart: new Date(event.start) });
        const durationMs = new Date(event.end).getTime() - new Date(event.start).getTime();
        const dates = rule.between(rangeStart, rangeEnd, true);
        return dates.slice(0, limit).map((startDate, index) => ({
            occurrenceId: buildOccurrenceId(event.id, startDate, index),
            sourceEventId: event.id,
            title: event.title,
            description: event.description ?? null,
            start: startDate,
            end: new Date(startDate.getTime() + durationMs),
            timezone: event.timezone ?? null,
            isAllDay: event.isAllDay,
            recurrenceRule: event.recurrenceRule,
            intent: event.intent,
            tags: event.tags ?? [],
            createdAt: event.createdAt,
            updatedAt: event.updatedAt,
            isRecurringInstance: true,
        }));
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.warn(`Failed to parse recurrence rule for event ${event.id}`, error);
        return [];
    }
};
exports.expandRecurringEvent = expandRecurringEvent;
const isEventWithinRange = (event, rangeStart, rangeEnd) => {
    const start = new Date(event.start).getTime();
    return start >= rangeStart.getTime() && start < rangeEnd.getTime();
};
exports.isEventWithinRange = isEventWithinRange;
//# sourceMappingURL=recurrence.js.map