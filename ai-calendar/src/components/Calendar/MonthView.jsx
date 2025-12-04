import React from 'react';
import { getEventsForDay, isSameDay } from '../../utils/eventUtils';

const MonthView = ({ currentDate, events, onDayClick, onMonthChange }) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();

    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
        days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
        days.push(new Date(year, month, i));
    }

    const handlePrevMonth = () => {
        onMonthChange(new Date(year, month - 1, 1));
    };

    const handleNextMonth = () => {
        onMonthChange(new Date(year, month + 1, 1));
    };

    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <button onClick={handlePrevMonth} className="btn-secondary">&lt;</button>
                <h2 style={{ fontSize: '18px', fontWeight: '600' }}>{monthNames[month]} {year}</h2>
                <button onClick={handleNextMonth} className="btn-secondary">&gt;</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', marginBottom: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d}>{d}</div>)}
            </div>

            <div className="calendar-grid">
                {days.map((date, index) => {
                    if (!date) return <div key={`empty-${index}`} />;

                    const dayEvents = getEventsForDay(date, events);
                    const isToday = isSameDay(date, new Date());

                    // Helper to get color from ID
                    const getColor = (id) => {
                        const map = {
                            '8': 'var(--tag-default)',
                            '11': 'var(--tag-red)',
                            '6': 'var(--tag-orange)',
                            '5': 'var(--tag-yellow)',
                            '10': 'var(--tag-green)',
                            '9': 'var(--tag-blue)',
                            '7': 'var(--tag-indigo)',
                            '3': 'var(--tag-violet)'
                        };
                        return map[id] || 'var(--tag-default)';
                    };

                    return (
                        <div
                            key={index}
                            className={`calendar-day ${isToday ? 'today' : ''}`}
                            onClick={() => onDayClick(date)}
                        >
                            <span>{date.getDate()}</span>
                            <div style={{ display: 'flex', gap: '2px', marginTop: '4px', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '100%' }}>
                                {dayEvents.slice(0, 4).map((evt, i) => (
                                    <div
                                        key={i}
                                        className="event-dot"
                                        style={{ backgroundColor: getColor(evt.colorId) }}
                                    />
                                ))}
                                {dayEvents.length > 4 && <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'var(--text-secondary)' }} />}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default MonthView;
