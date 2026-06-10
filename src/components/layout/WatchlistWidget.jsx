import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePermissions } from '../../hooks/usePermissions';
import { useWatchlistStore } from '../../store/watchlistStore';
import Toast from '../ui/Toast';
import styles from './WatchlistWidget.module.css';

function fmt(n, d = 2) {
  if (n == null) return '—';
  return new Intl.NumberFormat('sr-RS', { minimumFractionDigits: d, maximumFractionDigits: d }).format(n);
}

function fmtVol(n) {
  if (n == null) return '—';
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return String(n);
}

function BookmarkIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14H6L5 6"/>
      <path d="M10 11v6M14 11v6"/>
      <path d="M9 6V4h6v2"/>
    </svg>
  );
}

export default function WatchlistWidget() {
  const watchlists = useWatchlistStore(s => s.watchlists);
  const createWatchlist = useWatchlistStore(s => s.createWatchlist);
  const deleteWatchlist = useWatchlistStore(s => s.deleteWatchlist);
  const removeSecurity = useWatchlistStore(s => s.removeSecurity);
  const toastOpen = useWatchlistStore(s => s.toastOpen);
  const toastMsg = useWatchlistStore(s => s.toastMsg);
  const closeToast = useWatchlistStore(s => s.closeToast);

  const navigate = useNavigate();
  const { isSupervisor, canAny } = usePermissions();
  const isAgent = canAny('portfolio.otc.manage', 'portfolio.options.view', 'portfolio.options.exercise', 'admin.all', 'trading');

  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const ref = useRef(null);

  const totalWatched = watchlists.reduce((n, w) => n + w.securities.length, 0);

  const activeList = (activeId && watchlists.find(w => w.id === activeId))
    || watchlists[0]
    || null;

  useEffect(() => {
    if (!open) return;
    function outside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', outside);
    return () => document.removeEventListener('mousedown', outside);
  }, [open]);

  async function handleCreate() {
    const name = newName.trim();
    if (!name) return;
    const id = await createWatchlist(name);
    setActiveId(id);
    setNewName('');
    setCreating(false);
  }

  function handleDelete(id) {
    deleteWatchlist(id);
    if (activeId === id) setActiveId(null);
  }

  function handleSecurityClick(sec) {
    const path = (isSupervisor || isAgent) ? '/securities' : '/client/securities';
    navigate(path, { state: { selectId: sec.id, selectType: sec.type } });
    setOpen(false);
  }

  return (
    <>
    <div className={styles.wrap} ref={ref}>
      <button
        className={`${styles.trigger} ${open ? styles.triggerOpen : ''}`}
        onClick={() => setOpen(o => !o)}
        title="Liste praćenja"
      >
        <BookmarkIcon />
        {totalWatched > 0 && <span className={styles.badge}>{totalWatched}</span>}
      </button>

      {open && (
        <div className={styles.panel}>
          <div className={styles.panelHead}>
            <span className={styles.panelTitle}>Liste praćenja</span>
            <button
              className={styles.addBtn}
              onClick={() => setCreating(true)}
              title="Nova lista"
            >
              +
            </button>
          </div>

          {creating && (
            <div className={styles.createRow}>
              <input
                className={styles.input}
                autoFocus
                placeholder="Naziv nove liste..."
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleCreate();
                  if (e.key === 'Escape') { setCreating(false); setNewName(''); }
                }}
              />
              <button className={styles.saveBtn} onClick={handleCreate} disabled={!newName.trim()}>
                Sačuvaj
              </button>
              <button className={styles.cancelBtn} onClick={() => { setCreating(false); setNewName(''); }}>
                ✕
              </button>
            </div>
          )}

          {watchlists.length === 0 && !creating ? (
            <p className={styles.emptyMsg}>
              Niste pratite nijednu hartiju. Kliknite na zvezdicu pored hartije da je dodate.
            </p>
          ) : (
            <>
              {watchlists.length > 0 && (
                <div className={styles.tabs}>
                  {watchlists.map(wl => (
                    <button
                      key={wl.id}
                      className={`${styles.tab} ${activeList?.id === wl.id ? styles.tabActive : ''}`}
                      onClick={() => setActiveId(wl.id)}
                    >
                      {wl.name}
                      {wl.securities.length > 0 && (
                        <span className={styles.tabBadge}>{wl.securities.length}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {activeList && (
                <div className={styles.listBody}>
                  <div className={styles.listBar}>
                    <div className={styles.listBarActions}>
                      <button
                        className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                        title="Obriši listu"
                        onClick={() => handleDelete(activeList.id)}
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </div>

                  {activeList.securities.length === 0 ? (
                    <p className={styles.emptyList}>Lista je prazna.</p>
                  ) : (
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Ticker</th>
                          <th>Cena</th>
                          <th>Promena</th>
                          <th>Vol.</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeList.securities.map(sec => {
                          const pos = (sec.change ?? 0) >= 0;
                          return (
                            <tr
                              key={sec.id}
                              className={styles.secRow}
                              onClick={() => handleSecurityClick(sec)}
                            >
                              <td>
                                <span className={styles.ticker}>{sec.ticker}</span>
                                <span className={styles.typeTag}>{sec.type}</span>
                              </td>
                              <td>
                                <span className={styles.price}>{fmt(sec.price)}</span>
                                <span className={styles.cur}> {sec.currency}</span>
                              </td>
                              <td>
                                <span className={pos ? styles.up : styles.down}>
                                  {pos ? '+' : ''}{fmt(sec.change)}
                                  {sec.changePercent != null && (
                                    <span className={styles.pct}> ({pos ? '+' : ''}{fmt(sec.changePercent)}%)</span>
                                  )}
                                </span>
                              </td>
                              <td className={styles.vol}>{fmtVol(sec.volume)}</td>
                              <td onClick={e => e.stopPropagation()}>
                                <button
                                  className={styles.removeBtn}
                                  onClick={() => removeSecurity(activeList.id, sec.id)}
                                  title="Ukloni sa liste"
                                >
                                  ✕
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
    <Toast open={toastOpen} message={toastMsg} onClose={closeToast} />
    </>
  );
}
