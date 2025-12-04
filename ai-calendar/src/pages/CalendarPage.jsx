import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import MonthView from '../components/Calendar/MonthView';
import EventModal from '../components/Event/EventModal';
import AIChat from '../components/AI/AIChat';
import EventList from '../components/Calendar/EventList';
import { getEventsForDay } from '../utils/eventUtils';
import '../index.css';
import DeleteEventModal from '../components/Event/DeleteEventModal';
import { googleCalendarService } from '../services/googleCalendar';
import { authService } from '../services/authService';

function CalendarPage() {
    const navigate = useNavigate();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date()); // Default to today

    // Google Calendar State
    const [isGoogleSignedIn, setIsGoogleSignedIn] = useState(false);
    const [currentUser, setCurrentUser] = useState(authService.getCurrentUser());
    const [isDataLoaded, setIsDataLoaded] = useState(false);

    // Delete Modal State
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, event: null });

    const [editingEvent, setEditingEvent] = useState(null);

    const [history, setHistory] = useState([]);
    const [aiSuggestions, setAiSuggestions] = useState([]);

    // Theme State
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

    // Apply theme to document
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    // Initialize Google Calendar Service
    useEffect(() => {
        googleCalendarService.initialize((success) => {
            if (success && googleCalendarService.isAuthenticated()) {
                setIsGoogleSignedIn(true);
            }
        });
    }, []);

    // Pending Deletions to prevent race conditions with polling
    const pendingDeletions = React.useRef(new Set());
    // Pending Updates to prevent race conditions (preserve local state)
    const pendingUpdates = React.useRef(new Set());
    // Track specific instance deletions: Set<"masterId_startTime">
    const pendingInstanceDeletions = React.useRef(new Set());

    // Define fetch function with useCallback
    const fetchGoogleEvents = useCallback(async () => {
        if (!isGoogleSignedIn) return;
        try {
            // Fetch for current month view + buffer
            const start = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
            const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 2, 0);
            const gEvents = await googleCalendarService.listEvents(start, end);

            setEvents(prev => {
                // Keep local events
                const localEvents = prev.filter(e => !e.isGoogleEvent);

                // 1. Filter out pending deletions
                let validGoogleEvents = gEvents.filter(e => !pendingDeletions.current.has(e.id));
                validGoogleEvents = validGoogleEvents.filter(e => {
                    if (e.recurringEventId && pendingDeletions.current.has(e.recurringEventId)) return false;
                    return true;
                });

                // 2. Handle pending updates (Preserve local state for recurring events)
                const pendingMasterIds = new Set();
                pendingUpdates.current.forEach(id => pendingMasterIds.add(id));

                // Filter out server events that belong to a pending master ID
                validGoogleEvents = validGoogleEvents.filter(e => {
                    const masterId = e.recurringEventId || e.id;
                    if (pendingMasterIds.has(masterId)) {
                        return false;
                    }

                    const compositeKey = `${masterId}_${e.start.dateTime || e.start.date}`;
                    if (pendingInstanceDeletions.current.has(compositeKey)) return false;

                    if (pendingUpdates.current.has(e.id)) return false;

                    return true;
                });

                // Keep local versions of events that are currently being updated
                const preservedEvents = prev.filter(e => {
                    const masterId = e.recurringEventId || e.id;
                    const compositeKey = `${masterId}_${e.start}`;
                    return pendingMasterIds.has(masterId) ||
                        pendingUpdates.current.has(e.id) ||
                        pendingInstanceDeletions.current.has(compositeKey);
                });

                return [...localEvents, ...preservedEvents, ...validGoogleEvents];
            });
        } catch (error) {
            console.error("Failed to fetch Google events", error);
        }
    }, [isGoogleSignedIn, currentDate]);

    // Initial Fetch & Date Change
    useEffect(() => {
        fetchGoogleEvents();
    }, [fetchGoogleEvents]);

    // Polling (Auto-refresh every 30 seconds)
    useEffect(() => {
        if (!isGoogleSignedIn) return;
        const interval = setInterval(fetchGoogleEvents, 30000); // 30 seconds
        return () => clearInterval(interval);
    }, [fetchGoogleEvents, isGoogleSignedIn]);

    // Refresh on Window Focus (When user comes back to the tab)
    useEffect(() => {
        if (!isGoogleSignedIn) return;
        const handleFocus = () => {
            console.log("Window focused, refreshing events...");
            fetchGoogleEvents();
        };
        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, [fetchGoogleEvents, isGoogleSignedIn]);

    const handleGoogleLogin = async () => {
        try {
            await googleCalendarService.login();
            setIsGoogleSignedIn(true);
        } catch (err) {
            console.error("Login failed", err);
        }
    };

    const handleLogout = () => {
        // Logout from both
        googleCalendarService.logout();
        authService.logout();
        setIsGoogleSignedIn(false);
        navigate('/');
    };

    // Load events from local storage (User-specific Database Simulation)
    useEffect(() => {
        if (currentUser && currentUser.id) {
            const key = `calendar_events_${currentUser.id}`;
            const savedEvents = localStorage.getItem(key);
            if (savedEvents) {
                try {
                    const parsedLocalEvents = JSON.parse(savedEvents);
                    setEvents(prev => {
                        // Keep existing Google events, replace local events with loaded ones from "DB"
                        const currentGoogleEvents = prev.filter(e => e.isGoogleEvent);
                        return [...parsedLocalEvents, ...currentGoogleEvents];
                    });
                } catch (e) {
                    console.error("Failed to load events from local database", e);
                }
            }
            setIsDataLoaded(true);
        }
    }, [currentUser]);

    // Save events to local storage (User-specific Database Simulation)
    useEffect(() => {
        if (!isDataLoaded) return;

        if (currentUser && currentUser.id) {
            const key = `calendar_events_${currentUser.id}`;
            // Only save non-google events to local storage
            const localEvents = events.filter(e => !e.isGoogleEvent);
            localStorage.setItem(key, JSON.stringify(localEvents));
        }
    }, [events, currentUser, isDataLoaded]);

    const saveToHistory = () => {
        setHistory(prev => [...prev, events]);
    };

    const handleUndo = () => {
        if (history.length === 0) return;
        const previousEvents = history[history.length - 1];
        setEvents(previousEvents);
        setHistory(prev => prev.slice(0, -1));
    };

    const handleApplyActions = async (actionsOrEvent) => {
        console.log("📥 handleApplyActions received:", actionsOrEvent);
        saveToHistory();

        if (Array.isArray(actionsOrEvent)) {
            // Handle AI suggestions (Batch)
            setEvents(prevEvents => {
                let updatedEvents = [...prevEvents];
                actionsOrEvent.forEach(actionItem => {
                    if (actionItem.action === 'delete') {
                        updatedEvents = updatedEvents.filter(e => e.title !== actionItem.originalTitle);
                    } else if (actionItem.action === 'update') {
                        updatedEvents = updatedEvents.map(e => {
                            if (e.title === actionItem.originalTitle) {
                                return { ...e, ...actionItem, id: e.id, action: undefined, originalTitle: undefined };
                            }
                            return e;
                        });
                    } else {
                        updatedEvents.push({ ...actionItem, id: crypto.randomUUID() });
                    }
                });
                return updatedEvents;
            });
        } else {
            // Single event from Modal
            let eventToSave = { ...actionsOrEvent };

            if (isGoogleSignedIn) {
                try {
                    if (eventToSave.id && eventToSave.isGoogleEvent) {
                        // Update Google Event
                        const updated = await googleCalendarService.updateEvent(eventToSave.id, eventToSave);
                        eventToSave = {
                            ...eventToSave,
                            ...updated, // Merge back fields from Google
                            isGoogleEvent: true
                        };
                    } else if (!eventToSave.id || !events.find(e => e.id === eventToSave.id)) {
                        // Create New Google Event
                        const created = await googleCalendarService.createEvent(eventToSave);
                        eventToSave = {
                            ...eventToSave,
                            id: created.id,
                            htmlLink: created.htmlLink,
                            isGoogleEvent: true
                        };
                    }
                } catch (err) {
                    console.error("Failed to sync with Google Calendar", err);
                    alert("Google Calendar 연동 실패. 로컬에만 저장됩니다.");
                }
            }

            if (actionsOrEvent.id) {
                setEvents(prev => prev.map(e => e.id === actionsOrEvent.id ? eventToSave : e));
            } else {
                setEvents(prev => [...prev, { ...eventToSave, id: eventToSave.id || crypto.randomUUID() }]);
            }
        }
        setIsModalOpen(false);
        setEditingEvent(null);
    };

    const handleDeleteEvent = async (event) => {
        // If event is just an ID (legacy or from somewhere else), try to find it
        let eventToDelete = event;
        if (typeof event === 'string') {
            eventToDelete = events.find(e => e.id === event);
        }

        if (!eventToDelete) return;

        if (eventToDelete.recurrence && eventToDelete.recurrence !== 'none') {
            setDeleteModal({ isOpen: true, event: eventToDelete });
        } else {
            if (window.confirm('정말 이 일정을 삭제하시겠습니까?')) {
                saveToHistory();
                const eventId = eventToDelete.id;

                // 1. Optimistic Update: Remove from UI immediately
                const previousEvents = [...events];
                setEvents(prev => prev.filter(e => e.id !== eventId));

                // Track pending deletion
                pendingDeletions.current.add(eventId);

                // 2. Background Sync
                if (isGoogleSignedIn && eventToDelete.isGoogleEvent) {
                    try {
                        await googleCalendarService.deleteEvent(eventId);
                        // Success: Remove from pending set after a delay to ensure server consistency
                        setTimeout(() => {
                            pendingDeletions.current.delete(eventId);
                        }, 5000);
                    } catch (err) {
                        console.error("Failed to delete from Google Calendar", err);
                        alert("Google Calendar 삭제 실패. 일정을 복구합니다.");
                        setEvents(previousEvents); // Rollback on failure
                        pendingDeletions.current.delete(eventId); // Remove from pending since we rolled back
                        return;
                    }
                } else {
                    // Local event, just remove from pending immediately
                    pendingDeletions.current.delete(eventId);
                }
            }
        }
    };

    const handleEditEvent = (event) => {
        setEditingEvent(event);
        setIsModalOpen(true);
    };
    const handleConfirmDelete = async (option) => {
        const { event } = deleteModal;
        if (!event) return;

        const eventToDelete = event;
        const masterId = eventToDelete.recurringEventId || eventToDelete.id;

        // Determine the specific instance date being deleted
        let instanceDate;
        if (eventToDelete.isGoogleEvent) {
            instanceDate = new Date(eventToDelete.start.dateTime || eventToDelete.start.date || eventToDelete.start);
        } else {
            // For local events, eventToDelete is the Master Event (start = series start).
            // We use selectedDate because that's the day the user is viewing/deleting.
            instanceDate = new Date(selectedDate);
        }

        // Format date for exclusion/comparison (YYYY-MM-DD)
        const year = instanceDate.getFullYear();
        const month = String(instanceDate.getMonth() + 1).padStart(2, '0');
        const day = String(instanceDate.getDate()).padStart(2, '0');
        const instanceDateStr = `${year}-${month}-${day}`;

        saveToHistory();

        // 1. Optimistic Update
        const previousEvents = [...events];

        setEvents(prevEvents => {
            if (option === 'all') {
                // Delete Master and all instances
                return prevEvents.filter(e => (e.recurringEventId !== masterId && e.id !== masterId));
            }

            if (option === 'following') {
                // Delete this and future instances
                return prevEvents.map(evt => {
                    const evtMasterId = evt.recurringEventId || evt.id;
                    if (evtMasterId === masterId) {
                        // For Google Events, we filter out instances
                        if (evt.isGoogleEvent) {
                            const evtStart = new Date(evt.start.dateTime || evt.start.date || evt.start);
                            if (evtStart >= instanceDate) return null;
                        }
                        // For Local Events (Master), we update recurrenceEnd
                        else if (evt.id === masterId) {
                            // Set recurrenceEnd to the day BEFORE the instance date
                            const yesterday = new Date(instanceDate);
                            yesterday.setDate(yesterday.getDate() - 1);

                            const y = yesterday.getFullYear();
                            const m = String(yesterday.getMonth() + 1).padStart(2, '0');
                            const d = String(yesterday.getDate()).padStart(2, '0');

                            return {
                                ...evt,
                                recurrenceEnd: `${y}-${m}-${d}`
                            };
                        }
                    }
                    return evt;
                }).filter(Boolean);
            }

            if (option === 'this') {
                // Delete only this instance
                if (eventToDelete.isGoogleEvent) {
                    // For Google, we filter out the specific instance from the list (if it's in the list)
                    return prevEvents.filter(e => e.id !== eventToDelete.id);
                } else {
                    // For Local, we add the date to excludedDates of the Master Event
                    return prevEvents.map(evt => {
                        if (evt.id === masterId) {
                            return {
                                ...evt,
                                excludedDates: [...(evt.excludedDates || []), instanceDateStr]
                            };
                        }
                        return evt;
                    });
                }
            }
            return prevEvents;
        });

        setDeleteModal({ isOpen: false, event: null });

        // Track pending updates
        if (option === 'all') {
            pendingDeletions.current.add(masterId);
        } else if (option === 'following') {
            pendingUpdates.current.add(masterId);
        } else if (option === 'this') {
            if (eventToDelete.isGoogleEvent) {
                pendingDeletions.current.add(eventToDelete.id);
            } else {
                pendingUpdates.current.add(masterId);
            }
            // For Google optimistic UI blocking
            const compositeKey = `${masterId}_${eventToDelete.start.dateTime || eventToDelete.start.date || eventToDelete.start}`;
            pendingInstanceDeletions.current.add(compositeKey);
        }

        // 2. Background Sync (Google)
        if (isGoogleSignedIn && eventToDelete?.isGoogleEvent) {
            try {
                if (option === 'all') {
                    const idToDelete = eventToDelete.recurringEventId || eventToDelete.id;
                    await googleCalendarService.deleteEvent(idToDelete);
                } else if (option === 'this') {
                    await googleCalendarService.deleteEvent(eventToDelete.id);
                } else if (option === 'following') {
                    const masterId = eventToDelete.recurringEventId;
                    if (masterId) {
                        // Pass the instance start time for accurate splitting
                        await googleCalendarService.deleteFollowingEvents(masterId, instanceDate.toISOString());
                    }
                }

                // Cleanup pending sets after delay
                setTimeout(() => {
                    if (option === 'all') {
                        pendingDeletions.current.delete(masterId);
                    } else if (option === 'following') {
                        pendingUpdates.current.delete(masterId);
                    } else if (option === 'this') {
                        pendingDeletions.current.delete(eventToDelete.id);
                        const compositeKey = `${masterId}_${eventToDelete.start.dateTime || eventToDelete.start.date || eventToDelete.start}`;
                        pendingInstanceDeletions.current.delete(compositeKey);
                    }
                }, 5000);

            } catch (err) {
                console.error("Failed to sync delete with Google Calendar", err);
                alert("Google Calendar 동기화 실패. 일정을 복구합니다.");
                setEvents(previousEvents); // Rollback

                // Cleanup pending sets immediately
                if (option === 'all') {
                    pendingDeletions.current.delete(masterId);
                } else if (option === 'following') {
                    pendingUpdates.current.delete(masterId);
                } else if (option === 'this') {
                    pendingDeletions.current.delete(eventToDelete.id);
                }
            }
        }
    };

    const handleDayClick = (date) => {
        setSelectedDate(date);
    };

    return (
        <div className="app-container" style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
            <header style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>AI Calendar</h1>
                    {currentUser && (
                        <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                            Welcome, {currentUser.name}
                        </span>
                    )}
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    {isGoogleSignedIn ? (
                        <span style={{ fontSize: '12px', color: '#34d399', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            ● Google Sync On
                        </span>
                    ) : (
                        currentUser?.type === 'google' && (
                            <button
                                onClick={handleGoogleLogin}
                                className="btn-secondary"
                                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
                                </svg>
                                Google Calendar 연동
                            </button>
                        )
                    )}

                    <button
                        onClick={handleLogout}
                        className="btn-secondary"
                        style={{ padding: '8px 16px' }}
                    >
                        로그아웃
                    </button>

                    <button
                        onClick={toggleTheme}
                        style={{
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '50%',
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: 'var(--text-primary)',
                            transition: 'all 0.2s ease',
                            boxShadow: 'var(--shadow-sm)'
                        }}
                        title={theme === 'dark' ? '화이트 테마로 변경' : '블랙 테마로 변경'}
                        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        {theme === 'dark' ? (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="5"></circle>
                                <line x1="12" y1="1" x2="12" y2="3"></line>
                                <line x1="12" y1="21" x2="12" y2="23"></line>
                                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                                <line x1="1" y1="12" x2="3" y2="12"></line>
                                <line x1="21" y1="12" x2="23" y2="12"></line>
                                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                            </svg>
                        ) : (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                            </svg>
                        )}
                    </button>
                    <button className="btn-primary" onClick={() => { setEditingEvent(null); setIsModalOpen(true); }}>+</button>
                </div>
            </header>

            <div className="app-layout">
                {/* Left Column: Calendar & Chat */}
                <div className="main-section">
                    <div className="glass-panel" style={{ marginBottom: '24px', padding: '16px' }}>
                        <MonthView
                            currentDate={currentDate}
                            events={events}
                            onDayClick={handleDayClick}
                            onMonthChange={setCurrentDate}
                        />
                    </div>

                    <div className="glass-panel" style={{ padding: '0', height: '600px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        <div style={{ padding: '16px 16px 0 16px', flexShrink: 0 }}>
                            <h2 style={{ fontSize: '18px', color: 'var(--text-secondary)' }}>AI Assistant</h2>
                        </div>
                        <div style={{ flex: 1, minHeight: 0 }}>
                            <AIChat
                                events={events}
                                onAddEvent={handleApplyActions}
                                onUndo={handleUndo}
                                canUndo={history.length > 0}
                                onShowSuggestions={setAiSuggestions}
                            />
                        </div>
                    </div>
                </div>

                {/* Right Column: Selected Day & AI Suggestions */}
                <div className="side-section" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <EventList
                        date={selectedDate}
                        events={getEventsForDay(selectedDate, events)}
                        onAddEvent={() => { setEditingEvent(null); setIsModalOpen(true); }}
                        onDeleteEvent={handleDeleteEvent}
                        onEditEvent={handleEditEvent}
                    />

                    {/* AI Suggestions Panel */}
                    {aiSuggestions.length > 0 && (
                        <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', maxHeight: '400px', overflow: 'hidden' }}>
                            <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--accent-primary)' }}>✨ AI 제안 일정 ({aiSuggestions.length})</h3>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        className="btn-primary"
                                        style={{ fontSize: '11px', padding: '4px 8px' }}
                                        onClick={() => {
                                            handleApplyActions(aiSuggestions);
                                            setAiSuggestions([]);
                                        }}
                                    >
                                        모두 수락
                                    </button>
                                    <button
                                        className="btn-secondary"
                                        style={{ fontSize: '11px', padding: '4px 8px' }}
                                        onClick={() => setAiSuggestions([])}
                                    >
                                        지우기
                                    </button>
                                </div>
                            </div>

                            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {aiSuggestions.map((evt, idx) => (
                                    <div key={idx} style={{
                                        backgroundColor: evt.action === 'delete' ? 'rgba(239, 68, 68, 0.1)' : (evt.action === 'update' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(255,255,255,0.05)'),
                                        padding: '16px',
                                        borderRadius: '12px',
                                        border: evt.action === 'delete' ? '1px solid rgba(239, 68, 68, 0.3)' : (evt.action === 'update' ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid var(--border-color)'),
                                    }}>
                                        {/* Header: Badge & Title */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                            <span style={{
                                                fontSize: '11px',
                                                fontWeight: 'bold',
                                                padding: '4px 8px',
                                                borderRadius: '6px',
                                                backgroundColor: evt.action === 'delete' ? 'rgba(239, 68, 68, 0.2)' : (evt.action === 'update' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(16, 185, 129, 0.2)'),
                                                color: evt.action === 'delete' ? '#fca5a5' : (evt.action === 'update' ? '#818cf8' : '#34d399'),
                                            }}>
                                                {evt.action === 'delete' ? '삭제' : (evt.action === 'update' ? '변경' : '추가')}
                                            </span>
                                            <div style={{ fontWeight: '600', fontSize: '15px', flex: 1 }}>
                                                {evt.title || evt.originalTitle}
                                            </div>
                                            <button
                                                onClick={() => setAiSuggestions(prev => prev.filter((_, i) => i !== idx))}
                                                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}
                                                title="제안 닫기"
                                            >
                                                ✕
                                            </button>
                                        </div>

                                        {/* Details Grid */}
                                        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 16px', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                                            {evt.start && (
                                                <>
                                                    <div style={{ color: 'var(--text-primary)', fontWeight: '500' }}>날짜</div>
                                                    <div>
                                                        {new Date(evt.start).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })}
                                                    </div>

                                                    <div style={{ color: 'var(--text-primary)', fontWeight: '500' }}>시간</div>
                                                    <div>
                                                        {new Date(evt.start).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })}
                                                        {evt.end ? (
                                                            <> ~ {new Date(evt.end).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })}</>
                                                        ) : (
                                                            <> ~ {new Date(new Date(evt.start).getTime() + 60 * 60 * 1000).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })} (예상)</>
                                                        )}
                                                    </div>
                                                </>
                                            )}

                                            {evt.recurrence && evt.recurrence !== 'none' && (
                                                <>
                                                    <div style={{ color: 'var(--text-primary)', fontWeight: '500' }}>반복</div>
                                                    <div style={{ color: '#818cf8' }}>
                                                        {(() => {
                                                            if (evt.recurrence === 'custom' && evt.recurrenceDays) {
                                                                const days = ['일', '월', '화', '수', '목', '금', '토'];
                                                                const sortedDays = evt.recurrenceDays.sort((a, b) => a - b);
                                                                const dayStr = sortedDays.map(d => days[d]).join('');

                                                                // Check for common patterns
                                                                if (dayStr === '월화수목금') return '평일 (월-금)';
                                                                if (dayStr === '일토') return '주말 (토-일)'; // Note: 0 is Sun, 6 is Sat. Sort order 0,6 -> 일,토
                                                                if (dayStr === '일월화수목금토') return '매일';

                                                                return sortedDays.map(d => days[d]).join(', ');
                                                            }
                                                            const map = {
                                                                'daily': '매일',
                                                                'weekday': '평일 (월-금)',
                                                                'weekend': '주말 (토-일)',
                                                                'weekly': '매주',
                                                                'biweekly': '격주',
                                                                'monthly': '매월'
                                                            };
                                                            return map[evt.recurrence] || evt.recurrence;
                                                        })()}
                                                        {evt.recurrenceEnd && (
                                                            <span style={{ marginLeft: '4px', color: '#fbbf24', fontSize: '12px' }}>
                                                                (종료: {new Date(evt.recurrenceEnd).toLocaleDateString([], { month: 'numeric', day: 'numeric' })})
                                                            </span>
                                                        )}
                                                    </div>
                                                </>
                                            )}

                                            {evt.description && (
                                                <>
                                                    <div style={{ color: 'var(--text-primary)', fontWeight: '500' }}>설명</div>
                                                    <div>{evt.description}</div>
                                                </>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        {evt.action === 'delete' ? (
                                            <button
                                                className="btn-primary"
                                                style={{ width: '100%', fontSize: '13px', padding: '10px', background: 'rgba(239, 68, 68, 0.8)', borderColor: 'transparent' }}
                                                onClick={() => {
                                                    if (window.confirm(`'${evt.title || evt.originalTitle}' 일정을 정말 삭제하시겠습니까?`)) {
                                                        handleApplyActions([evt]);
                                                        setAiSuggestions(prev => prev.filter((_, i) => i !== idx));
                                                    }
                                                }}
                                            >
                                                일정 삭제하기
                                            </button>
                                        ) : (
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button
                                                    className="btn-secondary"
                                                    style={{ flex: 1, fontSize: '13px', padding: '10px' }}
                                                    onClick={() => {
                                                        let eventToEdit = { ...evt };
                                                        if (evt.action === 'update' && evt.originalTitle) {
                                                            const originalEvent = events.find(e => e.title === evt.originalTitle);
                                                            if (originalEvent) {
                                                                eventToEdit = { ...originalEvent, ...evt, id: originalEvent.id };
                                                            }
                                                        }
                                                        setEditingEvent(eventToEdit);
                                                        setIsModalOpen(true);
                                                    }}
                                                >
                                                    수정하여 추가
                                                </button>
                                                <button
                                                    className="btn-primary"
                                                    style={{ flex: 1, fontSize: '13px', padding: '10px' }}
                                                    onClick={() => {
                                                        handleApplyActions([evt]);
                                                        setAiSuggestions(prev => prev.filter((_, i) => i !== idx));
                                                    }}
                                                >
                                                    {evt.action === 'update' ? '변경사항 적용' : '일정 추가하기'}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {isModalOpen && (
                <EventModal
                    isOpen={isModalOpen}
                    onClose={() => { setIsModalOpen(false); setEditingEvent(null); }}
                    onSave={handleApplyActions}
                    initialDate={selectedDate}
                    initialEvent={editingEvent}
                />
            )}

            {deleteModal.isOpen && (
                <DeleteEventModal
                    isOpen={deleteModal.isOpen}
                    onClose={() => setDeleteModal({ isOpen: false, event: null })}
                    onConfirm={handleConfirmDelete}
                />
            )}
        </div>
    );
}

export default CalendarPage;
