import { rrulestr } from 'rrule';
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

const buildOccurrenceId = (eventId: string, date: Date, index: number) => `${eventId}:${date.toISOString()}:${index}`;

export const expandRecurringEvent = (
  event: Event,
  rangeStart: Date,
  rangeEnd: Date,
  limit = 200,
): EventOccurrence[] => {
  if (!event.recurrenceRule) {
    return [];
  }

  try {
    const rule = rrulestr(event.recurrenceRule, { dtstart: new Date(event.start) });
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
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn(`Failed to parse recurrence rule for event ${event.id}`, error);
    return [];
  }
};

export const isEventWithinRange = (event: Event, rangeStart: Date, rangeEnd: Date) => {
  const start = new Date(event.start).getTime();
  return start >= rangeStart.getTime() && start < rangeEnd.getTime();
};



