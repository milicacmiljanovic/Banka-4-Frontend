import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useWatchlistStore } from '../../store/watchlistStore';
import styles from './WatchlistButton.module.css';

function pick(s) {
  return {
    id: s.id, type: s.type, ticker: s.ticker, name: s.name,
    price: s.price, change: s.change, changePercent: s.changePercent,
    volume: s.volume, currency: s.currency,
  };
}

function StarIcon({ filled }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  );
}

export default function WatchlistButton({ security }) {
  const watchlists = useWatchlistStore(s => s.watchlists);
  const createWatchlist = useWatchlistStore(s => s.createWatchlist);
  const addSecurity = useWatchlistStore(s => s.addSecurity);
  const removeSecurity = useWatchlistStore(s => s.removeSecurity);

  const [open, setOpen] = useState(false);
  const [dropPos, setDropPos] = useState(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const triggerRef = useRef(null);
  const dropRef = useRef(null);

  const watchedIn = watchlists
    .filter(w => w.securities.some(s => s.id === security.id))
    .map(w => w.id);
  const isWatched = watchedIn.length > 0;

  function closeDropdown() {
    setOpen(false);
    setDropPos(null);
    setCreating(false);
    setNewName('');
  }

  useEffect(() => {
    if (!open) return;
    function handleOutside(e) {
      const inTrigger = triggerRef.current?.contains(e.target);
      const inDrop = dropRef.current?.contains(e.target);
      if (!inTrigger && !inDrop) closeDropdown();
    }
    document.addEventListener('mousedown', handleOutside);
    window.addEventListener('scroll', closeDropdown, true);
    window.addEventListener('resize', closeDropdown);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      window.removeEventListener('scroll', closeDropdown, true);
      window.removeEventListener('resize', closeDropdown);
    };
  }, [open]);

  function handleToggle(e) {
    e.stopPropagation();
    if (open) {
      closeDropdown();
      return;
    }
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const up = spaceBelow < 400;
    setDropPos({
      right: window.innerWidth - rect.right,
      top: up ? 'auto' : rect.bottom + 6,
      bottom: up ? window.innerHeight - rect.top + 6 : 'auto',
    });
    setOpen(true);
  }

  function toggle(wlId) {
    if (watchedIn.includes(wlId)) {
      removeSecurity(wlId, security.id);
    } else {
      addSecurity(wlId, pick(security));
    }
  }

  async function handleCreate() {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const id = await createWatchlist(trimmed);
    if (id) await addSecurity(id, pick(security));
    setNewName('');
    setCreating(false);
  }

  return (
    <div className={styles.wrap} ref={triggerRef}>
      <button
        className={`${styles.btn} ${isWatched ? styles.active : ''}`}
        onClick={handleToggle}
        title={isWatched ? 'Upravljaj listama praćenja' : 'Dodaj u listu praćenja'}
        aria-label="Watchlist"
      >
        <StarIcon filled={isWatched} />
      </button>

      {open && dropPos && createPortal(
        <div
          ref={dropRef}
          className={styles.dropdown}
          style={{
            position: 'fixed',
            top: dropPos.top,
            bottom: dropPos.bottom,
            right: dropPos.right,
            zIndex: 1000,
          }}
          onClick={e => e.stopPropagation()}
        >
          <p className={styles.heading}>Liste praćenja</p>

          {watchlists.length === 0 && !creating && (
            <p className={styles.empty}>Nema lista praćenja.</p>
          )}

          {watchlists.map(wl => (
            <label key={wl.id} className={styles.item}>
              <input
                type="checkbox"
                checked={watchedIn.includes(wl.id)}
                onChange={() => toggle(wl.id)}
              />
              <span>{wl.name}</span>
            </label>
          ))}

          {creating ? (
            <div className={styles.createRow}>
              <input
                className={styles.input}
                autoFocus
                placeholder="Naziv liste..."
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleCreate();
                  if (e.key === 'Escape') { setCreating(false); setNewName(''); }
                }}
              />
              <button className={styles.confirmBtn} onClick={handleCreate} disabled={!newName.trim()}>✓</button>
              <button className={styles.cancelBtn} onClick={() => { setCreating(false); setNewName(''); }}>✕</button>
            </div>
          ) : (
            <button className={styles.newBtn} onClick={() => setCreating(true)}>
              + Nova lista
            </button>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
