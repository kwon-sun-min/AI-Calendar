import { create } from 'zustand';

export type CalendarIntent = 'WORK' | 'WELLNESS' | 'PERSONAL' | 'OTHER';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: string;
  end: string;
  timezone?: string;
  isAllDay?: boolean;
  recurrenceRule?: string;
  intent?: CalendarIntent;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}

interface CalendarState {
  events: CalendarEvent[];
  selectedDate: string;
}

interface CalendarActions {
  setSelectedDate: (dateISO: string) => void;
  upsertEvent: (event: CalendarEvent) => void;
  hydrateEvents: (events: CalendarEvent[]) => void;
}

const todayISO = new Date().toISOString();

export const useCalendarStore = create<CalendarState & CalendarActions>((set) => ({
  events: [],
  selectedDate: todayISO,
  setSelectedDate: (dateISO) => set({ selectedDate: dateISO }),
  upsertEvent: (event) =>
    set((state) => {
      const existingIndex = state.events.findIndex((e) => e.id === event.id);
      if (existingIndex >= 0) {
        const updated = [...state.events];
        updated[existingIndex] = event;
        return { events: updated };
      }
      return { events: [...state.events, event] };
    }),
  hydrateEvents: (events) => set({ events }),
}));

