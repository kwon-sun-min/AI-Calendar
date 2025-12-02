import React from 'react';

const DeleteEventModal = ({ isOpen, onClose, onConfirm }) => {
    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(4px)'
        }}>
            <div className="glass-panel" style={{
                width: '90%',
                maxWidth: '400px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                backgroundColor: '#1e293b',
                border: '1px solid var(--border-color)'
            }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>일정 삭제</h3>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                    반복되는 일정입니다. 어떻게 삭제하시겠습니까?
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <button
                        className="btn-secondary"
                        style={{ textAlign: 'left', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                        onClick={() => onConfirm('this')}
                    >
                        <div style={{ fontWeight: 'bold', fontSize: '14px' }}>이 일정만 삭제</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>선택한 날짜의 일정만 제외합니다.</div>
                    </button>

                    <button
                        className="btn-secondary"
                        style={{ textAlign: 'left', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                        onClick={() => onConfirm('following')}
                    >
                        <div style={{ fontWeight: 'bold', fontSize: '14px' }}>이 일정 이후 모두 삭제</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>오늘을 포함하여 앞으로의 모든 반복을 중단합니다.</div>
                    </button>

                    <button
                        className="btn-secondary"
                        style={{ textAlign: 'left', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                        onClick={() => onConfirm('all')}
                    >
                        <div style={{ fontWeight: 'bold', fontSize: '14px' }}>모든 일정 삭제</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>과거 내역을 포함한 전체 반복 일정을 삭제합니다.</div>
                    </button>
                </div>

                <button
                    style={{
                        marginTop: '8px',
                        padding: '10px',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer'
                    }}
                    onClick={onClose}
                >
                    취소
                </button>
            </div>
        </div>
    );
};

export default DeleteEventModal;
