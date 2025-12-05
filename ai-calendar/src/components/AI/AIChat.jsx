import React, { useState, useEffect, useRef } from 'react';
import { generateGeminiResponse } from '../../services/gemini';
import { chatService } from '../../services/chatService';
import { authService } from '../../services/authService';

const AIChat = ({ events, onAddEvent, onUndo, canUndo, onShowSuggestions }) => {
    const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
    const [showKeyInput, setShowKeyInput] = useState(!localStorage.getItem('gemini_api_key'));

    const [messages, setMessages] = useState([
        { id: 1, sender: 'ai', text: '안녕하세요! Gemini AI 캘린더 어시스턴트입니다. 무엇을 도와드릴까요?' }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);
    const user = authService.getCurrentUser();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Load chat history on mount
    useEffect(() => {
        if (user) {
            chatService.getHistory(user.id).then(data => {
                if (data.history && data.history.length > 0) {
                    const formattedMessages = data.history.map(msg => ({
                        id: msg.id,
                        sender: msg.role,
                        text: msg.text
                    }));
                    setMessages([
                        { id: 'welcome', sender: 'ai', text: '안녕하세요! Gemini AI 캘린더 어시스턴트입니다. 무엇을 도와드릴까요?' },
                        ...formattedMessages
                    ]);
                }
            });
        }
    }, []);

    const handleSaveKey = (key) => {
        const trimmedKey = key.trim();
        if (!trimmedKey.startsWith('AIza')) {
            alert('⚠️ 올바른 API 키 형식이 아닙니다.\n\n"projects/..."는 프로젝트 ID입니다.\n"AIza"로 시작하는 긴 문자열(API Key)을 입력해주세요.');
            return;
        }

        console.log("🔑 API Key Saved:", trimmedKey.substring(0, 10) + "..." + trimmedKey.substring(trimmedKey.length - 5));

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

        const userMsg = { id: Date.now(), sender: 'user', text: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        // Save user message
        if (user) {
            chatService.saveMessage(user.id, 'user', userMsg.text);
        }

        // Filter out internal system messages or keep them simple
        const history = messages.filter(m => m.id !== 1 && m.id !== 'welcome').slice(-10); // Keep last 10 context

        const response = await generateGeminiResponse(apiKey, history, userMsg.text, events);

        setIsTyping(false);

        // Pass suggestions to parent instead of rendering them here
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

        // Save AI response
        if (user && !response.error) {
            chatService.saveMessage(user.id, 'ai', aiMsg.text);
        }
    };

    if (showKeyInput) {
        return (
            <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
                <h3 style={{ marginBottom: '12px' }}>Gemini API 키 설정</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                    더 똑똑한 AI를 사용하기 위해 Google Gemini API 키가 필요합니다.<br />
                    (키는 브라우저에만 저장됩니다)
                </p>
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
                <button
                    className="btn-primary"
                    style={{ width: '100%' }}
                    onClick={() => handleSaveKey(apiKey)}
                >
                    시작하기
                </button>
                <div style={{ marginTop: '12px', fontSize: '10px' }}>
                    <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-primary)' }}>
                        API 키 발급받기 &rarr;
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ flex: 1, overflowY: 'auto', padding: '10px', display: 'flex', flexDirection: 'column', gap: '16px', minHeight: 0 }}>
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
                        onMouseOver={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                            e.currentTarget.style.color = 'var(--text-primary)';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.color = 'var(--text-secondary)';
                        }}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 7v6h6" />
                            <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
                        </svg>
                    </button>
                )}

                <form onSubmit={handleSend} style={{ flex: 1, display: 'flex', gap: '8px' }}>
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                // Prevent submission during IME composition (Korean input)
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
    );
};

export default AIChat;
