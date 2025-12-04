import type { CreateEventInput, EventQueryInput, UpdateEventInput } from '../schemas/eventSchemas';
export declare const listEvents: (filters: EventQueryInput) => Promise<{
    start: Date;
    end: Date;
    title: string;
    description: string | null;
    timezone: string | null;
    isAllDay: boolean;
    recurrenceRule: string | null;
    intent: import(".prisma/client").$Enums.Intent | null;
    tags: string[];
    id: string;
    createdAt: Date;
    updatedAt: Date;
}[]>;
export declare const getEventById: (id: string) => Promise<{
    start: Date;
    end: Date;
    title: string;
    description: string | null;
    timezone: string | null;
    isAllDay: boolean;
    recurrenceRule: string | null;
    intent: import(".prisma/client").$Enums.Intent | null;
    tags: string[];
    id: string;
    createdAt: Date;
    updatedAt: Date;
}>;
export declare const createEvent: (payload: CreateEventInput) => Promise<{
    start: Date;
    end: Date;
    title: string;
    description: string | null;
    timezone: string | null;
    isAllDay: boolean;
    recurrenceRule: string | null;
    intent: import(".prisma/client").$Enums.Intent | null;
    tags: string[];
    id: string;
    createdAt: Date;
    updatedAt: Date;
}>;
export declare const updateEvent: (id: string, payload: UpdateEventInput) => Promise<{
    start: Date;
    end: Date;
    title: string;
    description: string | null;
    timezone: string | null;
    isAllDay: boolean;
    recurrenceRule: string | null;
    intent: import(".prisma/client").$Enums.Intent | null;
    tags: string[];
    id: string;
    createdAt: Date;
    updatedAt: Date;
}>;
export declare const deleteEvent: (id: string) => Promise<void>;
//# sourceMappingURL=eventService.d.ts.map