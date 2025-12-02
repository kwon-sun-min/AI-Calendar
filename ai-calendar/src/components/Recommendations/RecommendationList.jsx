import React, { useMemo } from 'react';

const RecommendationList = ({ events, onAddEvent }) => {

    const recommendations = useMemo(() => {
        // "AI" Logic: Find free slots for tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);

        // Filter events for tomorrow
        const eventsForTomorrow = events.filter(event => {
            const eventDate = new Date(event.start);
            const isSameDay = eventDate.getFullYear() === tomorrow.getFullYear() &&
                eventDate.getMonth() === tomorrow.getMonth() &&
                eventDate.getDate() === tomorrow.getDate();

            if (isSameDay) return true;
            if (event.recurrence === 'daily') return true;
            if (event.recurrence === 'weekly' && eventDate.getDay() === tomorrow.getDay()) return true;
            if (event.recurrence === 'monthly' && eventDate.getDate() === tomorrow.getDate()) return true;
            return false;
        });

        // Sort by time
        eventsForTomorrow.sort((a, b) => new Date(a.start).getHours() - new Date(b.start).getHours());

        const slots = [];
        const workStart = 9; // 9 AM
        const workEnd = 18; // 6 PM

        // Simple gap finding
        let currentHour = workStart;

        // Occupied hours set
        const occupiedHours = new Set();
        eventsForTomorrow.forEach(e => {
            const h = new Date(e.start).getHours();
            occupiedHours.add(h);
        });

        // Suggest 3 slots
        const suggestions = [
            { title: '집중 업무 시간', duration: 2 },
            { title: '짧은 미팅 / 휴식', duration: 1 },
            { title: '자기 계발 / 독서', duration: 1 }
        ];

        for (let i = 0; i < suggestions.length; i++) {
            // Find a slot
            while (currentHour < workEnd) {
                if (!occupiedHours.has(currentHour)) {
                    // Found a slot
                    const slotTime = new Date(tomorrow);
                    slotTime.setHours(currentHour, 0, 0, 0);

                    slots.push({
                        ...suggestions[i],
                        start: slotTime.toISOString(),
                        reason: `내일 ${currentHour}:00 빈 시간`
                    });

                    occupiedHours.add(currentHour); // Mark as used for this batch
                    currentHour++;
                    break;
                }
                currentHour++;
            }
        }

        return slots;
    }, [events]);

    if (recommendations.length === 0) {
        return <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>내일 추천 가능한 일정이 없습니다.</div>;
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {recommendations.map((rec, index) => (
                <div key={index} className="glass-panel" style={{ padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)' }}>
                    <div>
                        <div style={{ fontWeight: '600', fontSize: '14px' }}>{rec.title}</div>
                        <div style={{ fontSize: '12px', color: 'var(--accent-primary)' }}>{rec.reason}</div>
                    </div>
                    <button
                        className="btn-secondary"
                        style={{ fontSize: '12px', padding: '6px 12px' }}
                        onClick={() => onAddEvent({ title: rec.title, start: rec.start, recurrence: 'none' })}
                    >
                        Add
                    </button>
                </div>
            ))}
        </div>
    );
};

export default RecommendationList;
