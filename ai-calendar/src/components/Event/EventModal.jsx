import React, { useState, useEffect } from 'react';

const EventModal = ({ isOpen, onClose, onSave, initialDate, initialEvent }) => {
    const [title, setTitle] = useState('');
    const [date, setDate] = useState('');
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('10:00');
    const [hasEndTime, setHasEndTime] = useState(false);
    const [recurrenceDays, setRecurrenceDays] = useState([]);

    const [location, setLocation] = useState('');
    const [attendees, setAttendees] = useState('');
    const [useGoogleMeet, setUseGoogleMeet] = useState(false);
    const [description, setDescription] = useState('');

    const [selectedColor, setSelectedColor] = useState(null);

    const [showDetails, setShowDetails] = useState(false);

    useEffect(() => {
        if (initialEvent) {
            setTitle(initialEvent.title);
            setLocation(initialEvent.location || '');
            setAttendees(initialEvent.attendees ? initialEvent.attendees.map(a => a.email).join(', ') : '');
            setUseGoogleMeet(!!initialEvent.conferenceData);
            setDescription(initialEvent.description || '');
            setSelectedColor(initialEvent.colorId || '8');

            // Auto-expand if details exist
            if (initialEvent.location || (initialEvent.attendees && initialEvent.attendees.length > 0) || initialEvent.conferenceData) {
                setShowDetails(true);
            } else {
                setShowDetails(false);
            }

            const eventDate = new Date(initialEvent.start);
            const year = eventDate.getFullYear();
            const month = String(eventDate.getMonth() + 1).padStart(2, '0');
            const day = String(eventDate.getDate()).padStart(2, '0');
            setDate(`${year}-${month}-${day}`);
            setStartTime(eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));

            if (initialEvent.end) {
                const endDate = new Date(initialEvent.end);
                setEndTime(endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
                setHasEndTime(true);
            } else {
                // Default end time = start time + 1 hour
                const end = new Date(eventDate.getTime() + 60 * 60 * 1000);
                setEndTime(end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
                setHasEndTime(false);
            }

            // Map existing recurrence to days
            if (initialEvent.recurrence === 'custom' && initialEvent.recurrenceDays) {
                setRecurrenceDays(initialEvent.recurrenceDays);
            } else if (initialEvent.recurrence === 'daily') {
                setRecurrenceDays([0, 1, 2, 3, 4, 5, 6]);
            } else if (initialEvent.recurrence === 'weekday') {
                setRecurrenceDays([1, 2, 3, 4, 5]);
            } else if (initialEvent.recurrence === 'weekend') {
                setRecurrenceDays([0, 6]);
            } else if (initialEvent.recurrence === 'weekly') {
                setRecurrenceDays([eventDate.getDay()]);
            } else {
                setRecurrenceDays([]);
            }
        } else if (initialDate) {
            setTitle('');
            setLocation('');
            setAttendees('');
            setUseGoogleMeet(false);
            setDescription('');
            setSelectedColor('8'); // Default to Graphite
            setShowDetails(false);

            const year = initialDate.getFullYear();
            const month = String(initialDate.getMonth() + 1).padStart(2, '0');
            const day = String(initialDate.getDate()).padStart(2, '0');
            setDate(`${year}-${month}-${day}`);
            setStartTime('09:00');
            setEndTime('10:00');
            setHasEndTime(false);
            setRecurrenceDays([]);
        } else {
            setTitle('');
            setLocation('');
            setAttendees('');
            setUseGoogleMeet(false);
            setDescription('');
            setSelectedColor('8'); // Default to Graphite
            setShowDetails(false);

            setDate(new Date().toISOString().split('T')[0]);
            setStartTime('09:00');
            setEndTime('10:00');
            setHasEndTime(false);
            setRecurrenceDays([]);
        }
    }, [initialDate, initialEvent, isOpen]);

    const handleSubmit = (e) => {
        e.preventDefault();
        const startDateTime = new Date(`${date}T${startTime}`);
        const endDateTime = new Date(`${date}T${endTime}`);

        const isRecurring = recurrenceDays.length > 0;

        // Format attendees as object array
        const attendeeList = attendees.split(',')
            .map(email => email.trim())
            .filter(email => email.length > 0)
            .map(email => ({ email }));

        onSave({
            ...(initialEvent || {}),
            title,
            location,
            description,
            colorId: selectedColor,
            start: startDateTime.toISOString(),
            end: hasEndTime ? endDateTime.toISOString() : undefined,
            recurrence: isRecurring ? 'custom' : 'none',
            recurrenceDays: isRecurring ? recurrenceDays : undefined,
            attendees: attendeeList.length > 0 ? attendeeList : undefined,
            // Simulate Google Meet structure if checked
            conferenceData: useGoogleMeet ? {
                createRequest: { requestId: Date.now().toString() },
                entryPoints: [{ uri: 'https://meet.google.com/new-meeting-placeholder' }]
            } : undefined
        });
    };

    const toggleDay = (dayIndex) => {
        setRecurrenceDays(prev =>
            prev.includes(dayIndex)
                ? prev.filter(d => d !== dayIndex)
                : [...prev, dayIndex]
        );
    };

    const days = ['일', '월', '화', '수', '목', '금', '토'];

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, backdropFilter: 'blur(4px)'
        }}>
            <div className="glass-panel" style={{ width: '90%', maxWidth: '400px', padding: '24px', backgroundColor: 'var(--bg-secondary)', maxHeight: '90vh', overflowY: 'auto' }}>
                <h2 style={{ marginBottom: '20px', fontSize: '20px' }}>{initialEvent ? '일정 수정' : '새 일정'}</h2>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>제목</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            placeholder="일정 제목"
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>날짜</label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            required
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>시작 시간</label>
                            <input
                                type="time"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                required
                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontSize: '14px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={hasEndTime}
                                    onChange={(e) => setHasEndTime(e.target.checked)}
                                    style={{ cursor: 'pointer' }}
                                />
                                종료 시간
                            </label>
                            <input
                                type="time"
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                disabled={!hasEndTime}
                                required={hasEndTime}
                                style={{
                                    width: '100%', padding: '10px', borderRadius: '8px',
                                    border: '1px solid var(--border-color)',
                                    background: hasEndTime ? 'var(--bg-primary)' : 'rgba(0,0,0,0.2)',
                                    color: hasEndTime ? 'var(--text-primary)' : 'var(--text-secondary)',
                                    cursor: hasEndTime ? 'text' : 'not-allowed'
                                }}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>설명</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="일정 상세 내용"
                            rows={3}
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', resize: 'none' }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>반복 요일</label>
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                            <button type="button" className="btn-secondary" style={{ flex: 1, fontSize: '11px', padding: '6px' }} onClick={() => setRecurrenceDays([0, 1, 2, 3, 4, 5, 6])}>매일</button>
                            <button type="button" className="btn-secondary" style={{ flex: 1, fontSize: '11px', padding: '6px' }} onClick={() => setRecurrenceDays([1, 2, 3, 4, 5])}>평일</button>
                            <button type="button" className="btn-secondary" style={{ flex: 1, fontSize: '11px', padding: '6px' }} onClick={() => setRecurrenceDays([0, 6])}>주말</button>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '4px' }}>
                            {days.map((day, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    onClick={() => toggleDay(index)}
                                    style={{
                                        width: '36px', height: '36px', borderRadius: '50%',
                                        border: recurrenceDays.includes(index) ? 'none' : '1px solid var(--border-color)',
                                        background: recurrenceDays.includes(index) ? 'var(--accent-primary)' : 'transparent',
                                        color: recurrenceDays.includes(index) ? 'white' : 'var(--text-secondary)',
                                        fontSize: '12px',
                                        fontWeight: recurrenceDays.includes(index) ? 'bold' : 'normal',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {day}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>태그 색상</label>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            {[
                                { id: '8', color: 'var(--tag-default)', label: 'Default' },
                                { id: '11', color: 'var(--tag-red)', label: 'Red' },
                                { id: '6', color: 'var(--tag-orange)', label: 'Orange' },
                                { id: '5', color: 'var(--tag-yellow)', label: 'Yellow' },
                                { id: '10', color: 'var(--tag-green)', label: 'Green' },
                                { id: '9', color: 'var(--tag-blue)', label: 'Blue' },
                                { id: '7', color: 'var(--tag-indigo)', label: 'Indigo' },
                                { id: '3', color: 'var(--tag-violet)', label: 'Violet' }
                            ].map((tag) => (
                                <button
                                    key={tag.id}
                                    type="button"
                                    onClick={() => setSelectedColor(tag.id)}
                                    style={{
                                        width: '24px',
                                        height: '24px',
                                        borderRadius: '50%',
                                        backgroundColor: tag.color,
                                        border: selectedColor === tag.id ? '2px solid white' : 'none',
                                        boxShadow: selectedColor === tag.id ? '0 0 0 2px var(--accent-primary)' : 'none',
                                        cursor: 'pointer',
                                        transition: 'transform 0.2s'
                                    }}
                                    title={tag.label}
                                    onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
                                    onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                />
                            ))}
                        </div>
                    </div>

                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                        <button
                            type="button"
                            onClick={() => setShowDetails(!showDetails)}
                            style={{
                                background: 'none', border: 'none', color: 'var(--text-primary)',
                                fontSize: '14px', cursor: 'pointer', width: '100%',
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '8px 0', fontWeight: '500'
                            }}
                        >
                            <span>추가 옵션</span>
                            <svg
                                width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                style={{ transform: showDetails ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
                            >
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </button>

                        {showDetails && (
                            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>위치</label>
                                    <input
                                        type="text"
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                        placeholder="장소 추가"
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>참석자 (이메일, 쉼표로 구분)</label>
                                    <input
                                        type="text"
                                        value={attendees}
                                        onChange={(e) => setAttendees(e.target.value)}
                                        placeholder="friend@example.com, colleague@work.com"
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={useGoogleMeet}
                                            onChange={(e) => setUseGoogleMeet(e.target.checked)}
                                            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                        />
                                        Google Meet 화상 회의 추가
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                        <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1 }}>취소</button>
                        <button type="submit" className="btn-primary" style={{ flex: 1 }}>저장</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EventModal;
