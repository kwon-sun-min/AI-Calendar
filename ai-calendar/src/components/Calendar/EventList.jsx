import React from 'react';

const EventList = ({ date, events, onAddEvent, onDeleteEvent, onEditEvent }) => {
    if (!date) {
        return (
            <div className="glass-panel" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', padding: '20px' }}>
                Select a date to view events
            </div>
        );
    }

    const dateString = date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <div className="glass-panel" style={{ height: '100%', padding: '24px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                    <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>{date.getDate()}</h2>
                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{dateString}</div>
                </div>
                <button className="btn-primary" onClick={onAddEvent}>+ Add</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', flex: 1 }}>
                {events.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        No events for this day.
                    </div>
                ) : (
                    events.map((event, index) => {
                        const eventTime = new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
                            <div key={index} style={{
                                padding: '12px',
                                borderRadius: 'var(--radius-md)',
                                background: 'rgba(255,255,255,0.03)',
                                borderLeft: `4px solid ${getColor(event.colorId)}`,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                justifyContent: 'space-between',
                                cursor: 'pointer', // Indicate clickable
                                transition: 'background 0.2s'
                            }}
                                onClick={() => onEditEvent && onEditEvent(event)}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ fontSize: '14px', fontWeight: '600', minWidth: '60px' }}>
                                        {eventTime}
                                        {event.end && (
                                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginLeft: '4px' }}>
                                                - {new Date(event.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        )}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '16px' }}>{event.title}</div>
                                        <div style={{ display: 'flex', gap: '8px', marginTop: '4px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                                            {event.location && (
                                                <span title={`위치: ${event.location}`}>📍 {event.location}</span>
                                            )}
                                            {event.attendees && event.attendees.length > 0 && (
                                                <span title={`참석자: ${event.attendees.length}명`}>👥 {event.attendees.length}</span>
                                            )}
                                            {event.conferenceData && (
                                                <span title="Google Meet 화상 회의">📹 Meet</span>
                                            )}
                                        </div>
                                        {event.recurrence !== 'none' && (
                                            <div style={{ fontSize: '10px', color: 'var(--accent-secondary)', marginTop: '2px', textTransform: 'uppercase' }}>
                                                ↻ {(() => {
                                                    if (event.recurrence === 'custom' && event.recurrenceDays) {
                                                        const days = ['일', '월', '화', '수', '목', '금', '토'];
                                                        return event.recurrenceDays.sort((a, b) => a - b).map(d => days[d]).join(', ');
                                                    }
                                                    const map = {
                                                        'daily': '매일',
                                                        'weekday': '평일',
                                                        'weekend': '주말',
                                                        'weekly': '매주',
                                                        'biweekly': '격주',
                                                        'monthly': '매월'
                                                    };
                                                    return map[event.recurrence] || event.recurrence;
                                                })()}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation(); // Prevent opening edit modal
                                        onDeleteEvent && onDeleteEvent(event.id);
                                    }}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: 'var(--text-secondary)',
                                        cursor: 'pointer',
                                        padding: '4px',
                                        fontSize: '16px',
                                        opacity: 0.6,
                                        transition: 'opacity 0.2s, color 0.2s'
                                    }}
                                    onMouseEnter={(e) => { e.target.style.opacity = '1'; e.target.style.color = '#ef4444'; }}
                                    onMouseLeave={(e) => { e.target.style.opacity = '0.6'; e.target.style.color = 'var(--text-secondary)'; }}
                                    title="Delete Event"
                                >
                                    🗑️
                                </button>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default EventList;
