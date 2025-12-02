import type { CalendarEvent } from '../store/calendarStore';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

const buildUrl = (path: string, params?: Record<string, string | undefined>) => {
  const url = new URL(path, API_BASE_URL);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value) url.searchParams.set(key, value);
    });
  }
  return url.toString();
};

export const api = {
  async listEvents(input: { month?: string; intent?: string } = {}) {
    const response = await fetch(buildUrl('/events', input));
    if (!response.ok) throw new Error('Failed to fetch events');
    return (await response.json()) as { events: CalendarEvent[] };
  },
  async createEvent(payload: Omit<CalendarEvent, 'id'>) {
    const response = await fetch(buildUrl('/events'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Failed to create event');
    return (await response.json()) as { event: CalendarEvent };
  },
};



