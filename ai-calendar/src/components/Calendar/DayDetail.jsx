import React from 'react';

const DayDetail = ({ date, events, onClose, onAddEvent }) => {
    if (!date) return null;

    const dateString = date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'flex-end',
            zIndex: 900, backdropFilter: 'blur(2px)'
        }} onClick={onClose}>
            <div
                className="glass-panel"
                style={{
                    width: '100%',
                    maxHeight: '80vh',
                    borderBottomLeftRadius: 0,
                    borderBottomRightRadius: 0,
                    padding: '24px',
                    backgroundColor: 'var(--bg-secondary)',
                    animation: 'slideUp 0.3s ease-out'
                }}
                onClick={e => e.stopPropagation()}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div>
                        <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>{date.getDate()}</h2>
                        <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{dateString}</div>
                    </div>
                    <button className="btn-primary" onClick={onAddEvent}>+ Add</button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', maxHeight: '50vh' }}>
                    {events.length === 0 ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                            No events for this day.
                        </div>
                    ) : (
                        events.map((event, index) => {
                            const eventTime = new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                            return (
                                <div key={index} style={{
                                    padding: '12px',
                                    borderRadius: 'var(--radius-md)',
                                    background: 'rgba(255,255,255,0.03)',
                                    borderLeft: '4px solid var(--accent-primary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px'
                                }}>
                                    <div style={{ fontSize: '14px', fontWeight: '600', minWidth: '60px' }}>{eventTime}</div>
                                    <div>
                                        <div style={{ fontSize: '16px' }}>{event.title}</div>
                                        {event.recurrence !== 'none' && (
                                            <div style={{ fontSize: '10px', color: 'var(--accent-secondary)', marginTop: '2px', textTransform: 'uppercase' }}>
                                                ↻ {event.recurrence}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
            <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
        </div>
    );
};

export default DayDetail;
