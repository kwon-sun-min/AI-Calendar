"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recurrenceQuerySchema = exports.eventIdParamSchema = exports.eventQuerySchema = exports.updateEventSchema = exports.createEventSchema = exports.intentSchema = void 0;
const zod_1 = require("zod");
exports.intentSchema = zod_1.z.enum(['WORK', 'WELLNESS', 'PERSONAL', 'OTHER']);
const isoDateTimeSchema = zod_1.z
    .string()
    .datetime({ offset: true, message: 'Value must be an ISO8601 string with timezone offset' });
const baseEventSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(120),
    description: zod_1.z.string().max(1024).optional(),
    start: isoDateTimeSchema,
    end: isoDateTimeSchema,
    timezone: zod_1.z.string().max(64).optional(),
    isAllDay: zod_1.z.boolean().optional().default(false),
    recurrenceRule: zod_1.z.string().max(255).optional(),
    intent: exports.intentSchema.optional(),
    tags: zod_1.z.array(zod_1.z.string().min(1).max(32)).max(10).optional().default([]),
});
exports.createEventSchema = baseEventSchema.superRefine((data, ctx) => {
    if (new Date(data.end).getTime() <= new Date(data.start).getTime()) {
        ctx.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            message: 'End time must be after start time',
            path: ['end'],
        });
    }
});
exports.updateEventSchema = baseEventSchema
    .partial()
    .refine((data) => {
    if (!data.start || !data.end) {
        return true;
    }
    return new Date(data.end).getTime() > new Date(data.start).getTime();
}, { message: 'End time must be after start time', path: ['end'] });
exports.eventQuerySchema = zod_1.z.object({
    month: zod_1.z
        .string()
        .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Use YYYY-MM format for month filters')
        .optional(),
    intent: exports.intentSchema.optional(),
});
exports.eventIdParamSchema = zod_1.z.object({
    id: zod_1.z.string().cuid('Invalid event id'),
});
exports.recurrenceQuerySchema = zod_1.z
    .object({
    start: isoDateTimeSchema,
    end: isoDateTimeSchema,
    intent: exports.intentSchema.optional(),
    limit: zod_1.z.coerce.number().min(1).max(500).optional(),
})
    .superRefine((data, ctx) => {
    if (new Date(data.end).getTime() <= new Date(data.start).getTime()) {
        ctx.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            path: ['end'],
            message: 'End must be after start',
        });
    }
});
//# sourceMappingURL=eventSchemas.js.map