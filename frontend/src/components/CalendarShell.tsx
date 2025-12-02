import { CalendarGrid } from './CalendarGrid';
import { RecommendationsPanel } from './RecommendationsPanel';

export function CalendarShell() {
  return (
    <section className="calendar-shell">
      <header className="calendar-shell__header">
        <div>
          <p className="calendar-shell__eyebrow">AI Calendar Assist</p>
          <h1>Plan smarter with intent-aware scheduling</h1>
        </div>
        <p className="calendar-shell__description">
          A modern monthly calendar with recurring events and AI-backed recommendations. Step 1 scaffolds the experience
          before wiring real data.
        </p>
      </header>
      <div className="calendar-shell__body">
        <CalendarGrid />
        <RecommendationsPanel />
      </div>
    </section>
  );
}



