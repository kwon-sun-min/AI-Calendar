import { useMemo } from 'react';
import type { CalendarEvent } from '../store/calendarStore';
import { useCalendarStore } from '../store/calendarStore';

const fallbackRecommendations: CalendarEvent[] = [
  {
    id: 'rec-1',
    title: 'Deep work sprint',
    description: 'Block 90 minutes for your highest priority outcome.',
    start: new Date().toISOString(),
    end: new Date(Date.now() + 90 * 60 * 1000).toISOString(),
    intent: 'WORK',
    tags: ['focus'],
  },
  {
    id: 'rec-2',
    title: 'Walk & unwind',
    description: '15 minute outdoor walk to reset energy.',
    start: new Date().toISOString(),
    end: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    intent: 'WELLNESS',
    tags: ['movement'],
  },
  {
    id: 'rec-3',
    title: 'Personal catch-up',
    description: 'Check in with a friend or family member.',
    start: new Date().toISOString(),
    end: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    intent: 'PERSONAL',
    tags: ['connection'],
  },
];

export function RecommendationsPanel() {
  const { events, upsertEvent } = useCalendarStore();

  const curatedRecommendations = useMemo(() => {
    if (events.length === 0) {
      return fallbackRecommendations;
    }

    return fallbackRecommendations.map((rec) => ({
      ...rec,
      description: `${rec.description} (sample AI logic pending API integration)`,
    }));
  }, [events]);

  return (
    <aside className="recommendations-panel">
      <header>
        <h2>AI Suggestions</h2>
        <p>Step 1 provides mocked suggestions. Step 5 will call the backend.</p>
      </header>
      <ul>
        {curatedRecommendations.map((item) => (
          <li key={item.id} className="recommendations-panel__card">
            <div>
              <p className="recommendations-panel__intent">{item.intent}</p>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </div>
            <button type="button" onClick={() => upsertEvent({ ...item, id: `event-${Date.now()}` })}>
              Add to calendar
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}

