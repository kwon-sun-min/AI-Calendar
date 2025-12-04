import type { Event } from '@prisma/client';
export interface EventOccurrence {
    occurrenceId: string;
    sourceEventId: string;
    title: string;
    description: string | null;
    start: Date;
    end: Date;
    timezone: string | null;
    isAllDay: boolean;
    recurrenceRule: string | null;
    intent: Event['intent'];
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
    isRecurringInstance: boolean;
}
export declare const expandRecurringEvent: (event: Event, rangeStart: Date, rangeEnd: Date, limit?: number) => EventOccurrence[];
export declare const isEventWithinRange: (event: Event, rangeStart: Date, rangeEnd: Date) => boolean;
//# sourceMappingURL=recurrence.d.ts.map