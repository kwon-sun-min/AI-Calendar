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
            backgroundColor: 'rgba(0, 0, 0, 0.8)', // Darker overlay
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 99999, // Extremely high z-index
            backdropFilter: 'blur(4px)'
        }}
            onClick={(e) => {
                // Close if clicked on overlay
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div style={{
                width: '90%',
                maxWidth: '400px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                backgroundColor: '#2d2d2d', // Explicit dark gray
                color: '#ffffff', // Explicit white text
                borderRadius: '16px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                border: '1px solid #404040',
                position: 'relative', // Ensure stacking context
                zIndex: 100000 // Higher than overlay
            }}>
                <div>
                    <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px', color: '#fff' }}>일정 삭제</h3>
                    <p style={{ fontSize: '14px', color: '#a0a0a0' }}>
                        반복되는 일정입니다. 삭제 범위를 선택해주세요.
                    </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <button
                        style={{
                            textAlign: 'left',
                            padding: '16px',
                            backgroundColor: '#3d3d3d',
                            border: '1px solid #505050',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            transition: 'background 0.2s',
                            color: '#fff'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4d4d4d'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3d3d3d'}
                        onClick={() => onConfirm('this')}
                    >
                        <div style={{ fontWeight: 'bold', fontSize: '15px', marginBottom: '4px' }}>이 일정만 삭제</div>
                        <div style={{ fontSize: '13px', color: '#a0a0a0' }}>선택한 날짜의 일정만 제외합니다.</div>
                    </button>

                    <button
                        style={{
                            textAlign: 'left',
                            padding: '16px',
                            backgroundColor: '#3d3d3d',
                            border: '1px solid #505050',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            transition: 'background 0.2s',
                            color: '#fff'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4d4d4d'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3d3d3d'}
                        onClick={() => onConfirm('following')}
                    >
                        <div style={{ fontWeight: 'bold', fontSize: '15px', marginBottom: '4px' }}>이 일정 이후 모두 삭제</div>
                        <div style={{ fontSize: '13px', color: '#a0a0a0' }}>오늘을 포함하여 앞으로의 모든 반복을 중단합니다.</div>
                    </button>

                    <button
                        style={{
                            textAlign: 'left',
                            padding: '16px',
                            backgroundColor: '#3d3d3d',
                            border: '1px solid #505050',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            transition: 'background 0.2s',
                            color: '#fff'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4d4d4d'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3d3d3d'}
                        onClick={() => onConfirm('all')}
                    >
                        <div style={{ fontWeight: 'bold', fontSize: '15px', marginBottom: '4px' }}>모든 일정 삭제</div>
                        <div style={{ fontSize: '13px', color: '#a0a0a0' }}>과거 내역을 포함한 전체 반복 일정을 삭제합니다.</div>
                    </button>
                </div>

                <button
                    style={{
                        marginTop: '8px',
                        padding: '12px',
                        background: 'transparent',
                        border: 'none',
                        color: '#a0a0a0',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#a0a0a0'}
                    onClick={onClose}
                >
                    취소
                </button>
            </div>
        </div>
    );
};

export default DeleteEventModal;
