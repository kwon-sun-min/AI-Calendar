import React, { useState, useEffect, useRef } from 'react';
import { generateGeminiResponse } from '../../services/gemini';
import { chatService } from '../../services/chatService';
import { authService } from '../../services/authService';

const AIChat = ({ events, onAddEvent, onUndo, canUndo, onShowSuggestions }) => {
    const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
    const [showKeyInput, setShowKeyInput] = useState(!localStorage.getItem('gemini_api_key'));

    const [sessions, setSessions] = useState([]);
    const [currentSessionId, setCurrentSessionId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const messagesEndRef = useRef(null);
    const user = authService.getCurrentUser();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Load sessions on mount
    useEffect(() => {
        if (user) {
            loadSessions();
        }
    }, []);

    // Load messages when session changes
    useEffect(() => {
        if (currentSessionId) {
            loadSessionMessages(currentSessionId);
        } else {
            setMessages([
                { id: 'welcome', sender: 'ai', text: '안녕하세요! Gemini AI 캘린더 어시스턴트입니다. 무엇을 도와드릴까요?' }
            ]);
        }
    }, [currentSessionId]);

    const loadSessions = async () => {
        if (!user) return;
        const data = await chatService.getUserSessions(user.id);
        if (data.sessions) {
            setSessions(data.sessions);
            if (data.sessions.length > 0 && !currentSessionId) {
                setCurrentSessionId(data.sessions[0].id);
            }
        }
    };

    const loadSessionMessages = async (sessionId) => {
        const data = await chatService.getSessionMessages(sessionId);
        if (data.messages) {
            const formattedMessages = data.messages.map(msg => ({
                id: msg.id,
                sender: msg.role,
                text: msg.text
            }));
            setMessages([
                { id: 'welcome', sender: 'ai', text: '안녕하세요! Gemini AI 캘린더 어시스턴트입니다. 무엇을 도와드릴까요?' },
                ...formattedMessages
            ]);
        }
    };

    const handleCreateSession = async () => {
        if (!user) return;
        const data = await chatService.createSession(user.id, 'New Chat');
        if (data.session) {
            setSessions([data.session, ...sessions]);
            setCurrentSessionId(data.session.id);
            setMessages([
                { id: 'welcome', sender: 'ai', text: '안녕하세요! Gemini AI 캘린더 어시스턴트입니다. 무엇을 도와드릴까요?' }
            ]);
        }
    };

    const handleDeleteSession = async (e, sessionId) => {
        e.stopPropagation();
        if (!window.confirm('이 채팅방을 삭제하시겠습니까?')) return;

        await chatService.deleteSession(sessionId);
        const newSessions = sessions.filter(s => s.id !== sessionId);
        setSessions(newSessions);

        if (currentSessionId === sessionId) {
            setCurrentSessionId(newSessions.length > 0 ? newSessions[0].id : null);
        }
    };

    const handleSaveKey = (key) => {
        const trimmedKey = key.trim();
        if (!trimmedKey.startsWith('AIza')) {
            alert('⚠️ 올바른 API 키 형식이 아닙니다.\n\n"projects/..."는 프로젝트 ID입니다.\n"AIza"로 시작하는 긴 문자열(API Key)을 입력해주세요.');
            return;
        }
        localStorage.setItem('gemini_api_key', trimmedKey);
        setApiKey(trimmedKey);
        setShowKeyInput(false);
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        if (!apiKey) {
            setShowKeyInput(true);
            return;
        }

        // Create session if none exists
        let targetSessionId = currentSessionId;
        if (!targetSessionId && user) {
            const data = await chatService.createSession(user.id, input.substring(0, 20) + '...');
            if (data.session) {
                targetSessionId = data.session.id;
                setSessions([data.session, ...sessions]);
                setCurrentSessionId(targetSessionId);
            }
        }

        const userMsg = { id: Date.now(), sender: 'user', text: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        // Save user message
        if (targetSessionId) {
            chatService.saveMessage(targetSessionId, 'user', userMsg.text);

            // Update title if it's "New Chat" and this is the first message
            const currentSession = sessions.find(s => s.id === targetSessionId);
            if (currentSession && currentSession.title === 'New Chat') {
                const newTitle = userMsg.text.substring(0, 20);
                chatService.updateSessionTitle(targetSessionId, newTitle);
                setSessions(prev => prev.map(s => s.id === targetSessionId ? { ...s, title: newTitle } : s));
            }
        }

        // Filter out internal system messages or keep them simple
        const history = messages.filter(m => m.id !== 1 && m.id !== 'welcome').slice(-10);

        // Fetch global context (recent messages from all sessions)
        let globalContext = [];
        if (user) {
            const contextData = await chatService.getRecentContext(user.id);
            if (contextData.context) {
                globalContext = contextData.context.map(msg => ({
                    role: msg.role,
                    text: msg.text,
                    sessionTitle: msg.session?.title || 'Unknown Session',
                    createdAt: msg.createdAt
                }));
            }
        }

        const response = await generateGeminiResponse(apiKey, history, userMsg.text, events, globalContext);

        setIsTyping(false);

        if (response.events && response.events.length > 0 && onShowSuggestions) {
            onShowSuggestions(response.events);
        }

        const aiMsg = {
            id: Date.now() + 1,
            sender: 'ai',
            text: response.text,
            isError: response.error
        };

        setMessages(prev => [...prev, aiMsg]);

        if (targetSessionId && !response.error) {
            chatService.saveMessage(targetSessionId, 'ai', aiMsg.text);
        }
    };

    if (showKeyInput) {
        return (
            <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
                <h3 style={{ marginBottom: '12px' }}>Gemini API 키 설정</h3>
                <input
                    type="password"
                    placeholder="API Key 입력"
                    onChange={(e) => setApiKey(e.target.value)}
                    value={apiKey}
                    style={{
                        width: '100%', padding: '10px', marginBottom: '12px',
                        borderRadius: '8px', border: '1px solid var(--border-color)',
                        background: 'var(--bg-primary)', color: 'white'
                    }}
                />
                <button className="btn-primary" style={{ width: '100%' }} onClick={() => handleSaveKey(apiKey)}>
                    시작하기
                </button>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
            {/* Sidebar */}
            <div style={{
                width: isSidebarOpen ? '200px' : '0',
                transition: 'width 0.3s ease',
                borderRight: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                background: 'rgba(0,0,0,0.2)',
                overflow: 'hidden'
            }}>
                <div style={{ padding: '10px', borderBottom: '1px solid var(--border-color)' }}>
                    <button
                        onClick={handleCreateSession}
                        className="btn-primary"
                        style={{ width: '100%', fontSize: '12px', padding: '8px' }}
                    >
                        + New Chat
                    </button>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
                    {sessions.map(session => (
                        <div
                            key={session.id}
                            onClick={() => setCurrentSessionId(session.id)}
                            style={{
                                padding: '8px',
                                borderRadius: '8px',
                                marginBottom: '4px',
                                cursor: 'pointer',
                                background: currentSessionId === session.id ? 'rgba(255,255,255,0.1)' : 'transparent',
                                fontSize: '12px',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}
                        >
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{session.title}</span>
                            <button
                                onClick={(e) => handleDeleteSession(e, session.id)}
                                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0 4px' }}
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Chat Area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                {/* Header with Toggle */}
                <div style={{ padding: '10px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center' }}>
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', marginRight: '10px' }}
                    >
                        {isSidebarOpen ? '◀' : '▶'}
                    </button>
                    <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
                        {sessions.find(s => s.id === currentSessionId)?.title || 'New Chat'}
                    </span>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '10px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {messages.map((msg) => (
                        <div key={msg.id} style={{ alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '90%' }}>
                            <div style={{
                                padding: '12px 16px',
                                borderRadius: '16px',
                                borderBottomRightRadius: msg.sender === 'user' ? '4px' : '16px',
                                borderBottomLeftRadius: msg.sender === 'ai' ? '4px' : '16px',
                                backgroundColor: msg.sender === 'user' ? 'var(--accent-primary)' : (msg.isError ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-ai-bubble)'),
                                color: msg.sender === 'user' ? 'var(--text-on-accent)' : (msg.isError ? '#fca5a5' : 'var(--text-ai-bubble)'),
                                fontSize: '14px',
                                lineHeight: '1.5',
                                whiteSpace: 'pre-wrap',
                                border: msg.isError ? '1px solid rgba(239, 68, 68, 0.3)' : 'none'
                            }}>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    {isTyping && (
                        <div style={{ alignSelf: 'flex-start', padding: '0 10px', fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                            Gemini가 생각 중입니다...
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div style={{ padding: '10px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '8px' }}>
                    <button
                        onClick={() => { localStorage.removeItem('gemini_api_key'); setApiKey(''); setShowKeyInput(true); }}
                        style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '18px', cursor: 'pointer' }}
                        title="API 키 재설정"
                    >
                        ⚙️
                    </button>

                    {canUndo && (
                        <button
                            onClick={onUndo}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-secondary)',
                                width: '40px',
                                height: '40px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                borderRadius: '50%',
                                transition: 'all 0.2s ease'
                            }}
                            title="실행 취소"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 7v6h6" />
                                <path d="M21 17a9 9 0 0 0-9-9 9 0 0 0-6 2.3L3 13" />
                            </svg>
                        </button>
                    )}

                    <form onSubmit={handleSend} style={{ flex: 1, display: 'flex', gap: '8px' }}>
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    if (e.nativeEvent.isComposing) return;
                                    e.preventDefault();
                                    handleSend(e);
                                }
                            }}
                            placeholder="Gemini에게 일정을 부탁해보세요"
                            rows={1}
                            style={{
                                flex: 1,
                                padding: '12px 16px',
                                borderRadius: '16px',
                                border: '1px solid var(--border-color)',
                                background: 'var(--bg-primary)',
                                color: 'var(--text-primary)',
                                fontSize: '14px',
                                resize: 'none',
                                minHeight: '40px',
                                maxHeight: '120px',
                                overflowY: 'auto',
                                fontFamily: 'inherit'
                            }}
                        />
                        <button type="submit" className="btn-primary" style={{ padding: '0 20px', borderRadius: '24px' }}>
                            Send
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AIChat;
