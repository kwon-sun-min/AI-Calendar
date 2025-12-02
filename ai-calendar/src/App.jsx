import React, { useState, useEffect, useCallback } from 'react';
import MonthView from './components/Calendar/MonthView';
import EventModal from './components/Event/EventModal';
import AIChat from './components/AI/AIChat';
import EventList from './components/Calendar/EventList';
import { getEventsForDay } from './utils/eventUtils';
import './index.css';
import DeleteEventModal from './components/Event/DeleteEventModal';
import { googleCalendarService } from './services/googleCalendar';

function App() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date()); // Default to today

  // Google Calendar State
  const [isSignedIn, setIsSignedIn] = useState(false);

  // Delete Modal State
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, eventId: null });

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
        setIsSignedIn(true);
      }
    });
  }, []);

  // Define fetch function with useCallback
  const fetchGoogleEvents = useCallback(async () => {
    if (!isSignedIn) return;
    try {
      // Fetch for current month view + buffer
      const start = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
      const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 2, 0);
      const gEvents = await googleCalendarService.listEvents(start, end);

      setEvents(prev => {
        // Keep local events (those without isGoogleEvent or with isGoogleEvent=false)
        // And replace/add Google events
        const localEvents = prev.filter(e => !e.isGoogleEvent);
        return [...localEvents, ...gEvents];
      });
    } catch (error) {
      console.error("Failed to fetch Google events", error);
    }
  }, [isSignedIn, currentDate]);

  // Initial Fetch & Date Change
  useEffect(() => {
    fetchGoogleEvents();
  }, [fetchGoogleEvents]);

  // Polling (Auto-refresh every 30 seconds)
  useEffect(() => {
    if (!isSignedIn) return;
    const interval = setInterval(fetchGoogleEvents, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, [fetchGoogleEvents, isSignedIn]);

  // Refresh on Window Focus (When user comes back to the tab)
  useEffect(() => {
    if (!isSignedIn) return;
    const handleFocus = () => {
      console.log("Window focused, refreshing events...");
      fetchGoogleEvents();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchGoogleEvents, isSignedIn]);

  const handleLogin = async () => {
    try {
      await googleCalendarService.login();
      setIsSignedIn(true);
    } catch (err) {
      console.error("Login failed", err);
    }
  };

  const handleLogout = () => {
    googleCalendarService.logout();
    setIsSignedIn(false);
    setEvents(prev => prev.filter(e => !e.isGoogleEvent));
  };

  // Load events from local storage
  useEffect(() => {
    const savedEvents = localStorage.getItem('calendar_events');
    if (savedEvents) {
      const parsed = JSON.parse(savedEvents);
      // Only load local events from storage to avoid duplication if we re-fetch from Google
      // Or we can store everything but filter on load.
      // Let's assume storage is for local-only events or cache.
      // For simplicity, let's load all but if signed in, we might overwrite Google ones.
      // Better: Load only non-google events if we are going to fetch google events.
      // But initially isSignedIn is false.
      setEvents(parsed);
    }
  }, []);

  // Save events to local storage
  useEffect(() => {
    // Only save non-google events to local storage to prevent stale data
    const localEvents = events.filter(e => !e.isGoogleEvent);
    localStorage.setItem('calendar_events', JSON.stringify(localEvents));
  }, [events]);

  const saveToHistory = () => {
    setHistory(prev => [...prev, events]);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const previousEvents = history[history.length - 1];
    setEvents(previousEvents);
    setHistory(prev => prev.slice(0, -1));
  };

  // Helper to parse ISO string as local time to avoid timezone shifts
  const parseLocalISO = (isoString) => {
    if (!isoString) return null;
    if (isoString.length === 10) {
      const [y, m, d] = isoString.split('-').map(Number);
      return new Date(y, m - 1, d);
    }
    const date = new Date(isoString);
    const [datePart, timePart] = isoString.split('T');
    const [y, m, d] = datePart.split('-').map(Number);
    const [h, min] = (timePart || '00:00').split(':').map(Number);
    return new Date(y, m - 1, d, h, min);
  };

  const handleApplyActions = async (actionsOrEvent) => {
    console.log("📥 handleApplyActions received:", actionsOrEvent);
    saveToHistory();

    if (Array.isArray(actionsOrEvent)) {
      // Handle AI suggestions (Batch)
      // For now, we process them locally. 
      // TODO: Implement batch creation for Google Calendar if needed.
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

      if (isSignedIn) {
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

  const handleDeleteEvent = async (eventId) => {
    const eventToDelete = events.find(e => e.id === eventId);
    if (!eventToDelete) return;

    if (eventToDelete.recurrence && eventToDelete.recurrence !== 'none') {
      setDeleteModal({ isOpen: true, eventId });
    } else {
      if (window.confirm('정말 이 일정을 삭제하시겠습니까?')) {
        saveToHistory();

        if (isSignedIn && eventToDelete.isGoogleEvent) {
          try {
            await googleCalendarService.deleteEvent(eventId);
          } catch (err) {
            console.error("Failed to delete from Google Calendar", err);
            alert("Google Calendar 삭제 실패");
            return;
          }
        }

        setEvents(prev => prev.filter(e => e.id !== eventId));
      }
    }
  };

  const handleEditEvent = (event) => {
    setEditingEvent(event);
    setIsModalOpen(true);
  };

  const handleConfirmDelete = async (option) => {
    const { eventId } = deleteModal;
    if (!eventId) return;

    const eventToDelete = events.find(e => e.id === eventId);
    saveToHistory();

    if (option === 'all') {
      if (isSignedIn && eventToDelete?.isGoogleEvent) {
        try {
          await googleCalendarService.deleteEvent(eventId);
        } catch (err) {
          console.error("Failed to delete recurring event from Google Calendar", err);
          alert("Google Calendar 삭제 실패");
          return;
        }
      }
    } else if (option === 'this') {
      // TODO: For Google Calendar, this would involve adding an EXDATE to the recurrence rule
      // or deleting the specific instance. This is more complex and out of scope for this quick fix.
      // For now, it will only update the local state.
      if (isSignedIn && eventToDelete?.isGoogleEvent) {
        alert("Google Calendar의 반복 일정 중 특정 날짜 삭제는 현재 지원되지 않습니다. 로컬에만 반영됩니다.");
      }
    } else if (option === 'following') {
      // TODO: For Google Calendar, this would involve updating the recurrence rule's UNTIL date.
      // This is more complex and out of scope for this quick fix.
      // For now, it will only update the local state.
      if (isSignedIn && eventToDelete?.isGoogleEvent) {
        alert("Google Calendar의 반복 일정 중 이후 일정 삭제는 현재 지원되지 않습니다. 로컬에만 반영됩니다.");
      }
    }

    setEvents(prevEvents => {
      return prevEvents.map(event => {
        if (event.id !== eventId) return event;

        if (option === 'all') {
          return null;
        } else if (option === 'this') {
          const dateStr = selectedDate.toISOString().split('T')[0];
          return {
            ...event,
            excludedDates: [...(event.excludedDates || []), dateStr]
          };
        } else if (option === 'following') {
          const yesterday = new Date(selectedDate);
          yesterday.setDate(yesterday.getDate() - 1);
          return {
            ...event,
            recurrenceEnd: yesterday.toISOString().split('T')[0]
          };
        }
        return event;
      }).filter(Boolean);
    });

    setDeleteModal({ isOpen: false, eventId: null });
  };

  const handleDayClick = (date) => {
    setSelectedDate(date);
  };

  return (
    <div className="app-container" style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
      <header style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>AI Calendar</h1>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {!isSignedIn ? (
            <button
              onClick={handleLogin}
              className="btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
              </svg>
              Google 로그인
            </button>
          ) : (
            <button
              onClick={handleLogout}
              className="btn-secondary"
              style={{ padding: '8px 16px' }}
            >
              로그아웃
            </button>
          )}
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
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--accent-primary)' }}>✨ AI 제안 일정</h3>
                <button
                  className="btn-secondary"
                  style={{ fontSize: '11px', padding: '4px 8px' }}
                  onClick={() => setAiSuggestions([])}
                >
                  지우기
                </button>
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
                              // Fallback if end time is missing (though we requested it)
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
                                return evt.recurrenceDays.sort((a, b) => a - b).map(d => days[d]).join(', ');
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
          onClose={() => setDeleteModal({ isOpen: false, eventId: null })}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
}

export default App;
