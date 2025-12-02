import { z } from 'zod';

export const intentSchema = z.enum(['WORK', 'WELLNESS', 'PERSONAL', 'OTHER']);

const isoDateTimeSchema = z
  .string()
  .datetime({ offset: true, message: 'Value must be an ISO8601 string with timezone offset' });

const baseEventSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().max(1024).optional(),
  start: isoDateTimeSchema,
  end: isoDateTimeSchema,
  timezone: z.string().max(64).optional(),
  isAllDay: z.boolean().optional().default(false),
  recurrenceRule: z.string().max(255).optional(),
  intent: intentSchema.optional(),
  tags: z.array(z.string().min(1).max(32)).max(10).optional().default([]),
});

export const createEventSchema = baseEventSchema.superRefine((data, ctx) => {
  if (new Date(data.end).getTime() <= new Date(data.start).getTime()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'End time must be after start time',
      path: ['end'],
    });
  }
});

export const updateEventSchema = baseEventSchema
  .partial()
  .refine(
    (data) => {
      if (!data.start || !data.end) {
        return true;
      }
      return new Date(data.end).getTime() > new Date(data.start).getTime();
    },
    { message: 'End time must be after start time', path: ['end'] },
  );

export const eventQuerySchema = z.object({
  month: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Use YYYY-MM format for month filters')
    .optional(),
  intent: intentSchema.optional(),
});

export const eventIdParamSchema = z.object({
  id: z.string().cuid('Invalid event id'),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type EventQueryInput = z.infer<typeof eventQuerySchema>;

export const recurrenceQuerySchema = z
  .object({
    start: isoDateTimeSchema,
    end: isoDateTimeSchema,
    intent: intentSchema.optional(),
    limit: z.coerce.number().min(1).max(500).optional(),
  })
  .superRefine((data, ctx) => {
    if (new Date(data.end).getTime() <= new Date(data.start).getTime()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['end'],
        message: 'End must be after start',
      });
    }
  });

export type RecurrenceQueryInput = z.infer<typeof recurrenceQuerySchema>;

