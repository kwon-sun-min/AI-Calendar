import type { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import type { RecurrenceQueryInput } from '../schemas/eventSchemas';
import { expandRecurringEvent, isEventWithinRange, type EventOccurrence } from '../utils/recurrence';

export const listOccurrences = async (filters: RecurrenceQueryInput) => {
  const rangeStart = new Date(filters.start);
  const rangeEnd = new Date(filters.end);
  const limit = filters.limit ?? 200;

  const where: Prisma.EventWhereInput = {
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

  const events = await prisma.event.findMany({ where });

  const occurrences: EventOccurrence[] = [];

  events.forEach((event) => {
    if (event.recurrenceRule) {
      occurrences.push(...expandRecurringEvent(event, rangeStart, rangeEnd, limit));
    } else if (isEventWithinRange(event, rangeStart, rangeEnd)) {
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



