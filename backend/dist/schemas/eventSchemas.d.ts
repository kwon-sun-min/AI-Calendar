import { z } from 'zod';
export declare const intentSchema: z.ZodEnum<{
    WORK: "WORK";
    WELLNESS: "WELLNESS";
    PERSONAL: "PERSONAL";
    OTHER: "OTHER";
}>;
export declare const createEventSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    start: z.ZodString;
    end: z.ZodString;
    timezone: z.ZodOptional<z.ZodString>;
    isAllDay: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    recurrenceRule: z.ZodOptional<z.ZodString>;
    intent: z.ZodOptional<z.ZodEnum<{
        WORK: "WORK";
        WELLNESS: "WELLNESS";
        PERSONAL: "PERSONAL";
        OTHER: "OTHER";
    }>>;
    tags: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString>>>;
}, z.core.$strip>;
export declare const updateEventSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    start: z.ZodOptional<z.ZodString>;
    end: z.ZodOptional<z.ZodString>;
    timezone: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    isAllDay: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodBoolean>>>;
    recurrenceRule: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    intent: z.ZodOptional<z.ZodOptional<z.ZodEnum<{
        WORK: "WORK";
        WELLNESS: "WELLNESS";
        PERSONAL: "PERSONAL";
        OTHER: "OTHER";
    }>>>;
    tags: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString>>>>;
}, z.core.$strip>;
export declare const eventQuerySchema: z.ZodObject<{
    month: z.ZodOptional<z.ZodString>;
    intent: z.ZodOptional<z.ZodEnum<{
        WORK: "WORK";
        WELLNESS: "WELLNESS";
        PERSONAL: "PERSONAL";
        OTHER: "OTHER";
    }>>;
}, z.core.$strip>;
export declare const eventIdParamSchema: z.ZodObject<{
    id: z.ZodString;
}, z.core.$strip>;
export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type EventQueryInput = z.infer<typeof eventQuerySchema>;
export declare const recurrenceQuerySchema: z.ZodObject<{
    start: z.ZodString;
    end: z.ZodString;
    intent: z.ZodOptional<z.ZodEnum<{
        WORK: "WORK";
        WELLNESS: "WELLNESS";
        PERSONAL: "PERSONAL";
        OTHER: "OTHER";
    }>>;
    limit: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>;
export type RecurrenceQueryInput = z.infer<typeof recurrenceQuerySchema>;
//# sourceMappingURL=eventSchemas.d.ts.map