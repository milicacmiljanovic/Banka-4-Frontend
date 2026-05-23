import { useEffect } from 'react';

export default function Toast({ open, message, onClose, durationMs = 4000 }) {
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => onClose?.(), durationMs);
    return () => clearTimeout(t);
  }, [open, durationMs, onClose]);

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        right: 16,
        bottom: 16,
        zIndex: 9999,
        background: '#111827',
        color: 'white',
        padding: '12px 14px',
        borderRadius: 10,
        boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
        maxWidth: 360,
        display: 'flex',
        gap: 12,
        alignItems: 'center',
      }}
      role="status"
      aria-live="polite"
    >
      <div style={{ flex: 1, fontSize: 14, lineHeight: 1.2 }}>{message}</div>
      <button
        onClick={onClose}
        style={{
          border: 'none',
          background: 'transparent',
          color: 'white',
          fontSize: 16,
          cursor: 'pointer',
          opacity: 0.85,
        }}
        aria-label="Zatvori"
        title="Zatvori"
      >
        ×
      </button>
    </div>
  );
}