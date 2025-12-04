import type { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { HttpError } from '../lib/httpError';
import { buildMonthRange } from '../utils/dateRange';
import type { CreateEventInput, EventQueryInput, UpdateEventInput } from '../schemas/eventSchemas';

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
} satisfies Prisma.EventSelect;

export const listEvents = async (filters: EventQueryInput) => {
  const where: Prisma.EventWhereInput = {};

  if (filters.month) {
    const { start, end } = buildMonthRange(filters.month);
    where.start = {
      gte: start,
      lt: end,
    };
  }

  if (filters.intent) {
    where.intent = filters.intent;
  }

  return prisma.event.findMany({
    where,
    orderBy: { start: 'asc' },
    select: baseSelect,
  });
};

export const getEventById = async (id: string) => {
  const event = await prisma.event.findUnique({
    where: { id },
    select: baseSelect,
  });

  if (!event) {
    throw new HttpError(404, 'Event not found');
  }

  return event;
};

export const createEvent = async (payload: CreateEventInput) => {
  const data: Prisma.EventCreateInput = {
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

  return prisma.event.create({
    data,
    select: baseSelect,
  });
};

export const updateEvent = async (id: string, payload: UpdateEventInput) => {
  await getEventById(id);

  const data: Prisma.EventUpdateInput = {};

  if (payload.title !== undefined) data.title = payload.title;
  if (payload.description !== undefined) data.description = payload.description;
  if (payload.start) data.start = new Date(payload.start);
  if (payload.end) data.end = new Date(payload.end);
  if (payload.timezone !== undefined) data.timezone = payload.timezone;
  if (payload.isAllDay !== undefined) data.isAllDay = payload.isAllDay;
  if (payload.recurrenceRule !== undefined) data.recurrenceRule = payload.recurrenceRule;
  if (payload.intent !== undefined) data.intent = payload.intent;
  if (payload.tags !== undefined) data.tags = payload.tags;

  return prisma.event.update({
    where: { id },
    data,
    select: baseSelect,
  });
};

export const deleteEvent = async (id: string) => {
  await getEventById(id);
  await prisma.event.delete({ where: { id } });
};

