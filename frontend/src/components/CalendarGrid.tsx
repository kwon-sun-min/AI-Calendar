import { useMemo } from 'react';
import { useCalendarStore } from '../store/calendarStore';

const getPlaceholderMonth = () => {
  const base = new Date();
  base.setDate(1);

  const days = Array.from({ length: 30 }, (_, index) => {
    const date = new Date(base);
    date.setDate(index + 1);
    return date.toISOString();
  });

  return days;
};

export function CalendarGrid() {
  const { events, selectedDate, setSelectedDate } = useCalendarStore();

  const placeholderDays = useMemo(() => getPlaceholderMonth(), []);

  return (
    <div className="calendar-grid">
      <div className="calendar-grid__header">
        <h2>Monthly Calendar</h2>
        <p>Step 1 placeholder grid using local state. API wiring arrives in Step 2.</p>
      </div>
      <div className="calendar-grid__days">
        {placeholderDays.map((day) => {
          const label = new Date(day).getDate();
          const isSelected = selectedDate === day;
          const dayEvents = events.filter((event) => event.start.startsWith(day.slice(0, 10)));

          return (
            <button
              key={day}
              className={`calendar-grid__cell ${isSelected ? 'is-selected' : ''}`}
              onClick={() => setSelectedDate(day)}
              type="button"
            >
              <span className="calendar-grid__date">{label}</span>
              {dayEvents.length > 0 && <span className="calendar-grid__pill">{dayEvents.length} events</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}



