import { useState } from 'react';
import styles from './FiltersPanel.module.css';

const DEFAULT_FILTERS = {
  exchange: '',
  priceMin: '', priceMax: '',
  bidMin: '', bidMax: '',
  askMin: '', askMax: '',
  volumeMin: '', volumeMax: '',
  settlementDate: '',
};

export default function FiltersPanel({ activeTab, filters, onChange, onReset }) {
  const [open, setOpen] = useState(false);

  function handleChange(key, value) {
    onChange({ ...filters, [key]: value });
  }

  const activeCount = Object.values(filters).filter(v => v !== '').length;

  return (
    <div className={styles.wrapper}>
      <button
        className={`${styles.toggleBtn} ${activeCount > 0 ? styles.hasFilters : ''}`}
        onClick={() => setOpen(o => !o)}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="4" y1="6" x2="20" y2="6"/>
          <line x1="8" y1="12" x2="16" y2="12"/>
          <line x1="11" y1="18" x2="13" y2="18"/>
        </svg>
        Filteri
        {activeCount > 0 && <span className={styles.badge}>{activeCount}</span>}
        <svg
          width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          style={{ marginLeft: 4, opacity: 0.5, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <div className={styles.panel}>
          <div className={styles.grid}>
            <div className={styles.field}>
              <label>Berza (prefix)</label>
              <input
                className={styles.input}
                placeholder="npr. NASDAQ"
                value={filters.exchange}
                onChange={e => handleChange('exchange', e.target.value)}
              />
            </div>

            <div className={styles.field}>
              <label>Cena od — do</label>
              <div className={styles.rangeRow}>
                <input className={styles.input} type="number" placeholder="Min" value={filters.priceMin} onChange={e => handleChange('priceMin', e.target.value)} />
                <span className={styles.dash}>—</span>
                <input className={styles.input} type="number" placeholder="Max" value={filters.priceMax} onChange={e => handleChange('priceMax', e.target.value)} />
              </div>
            </div>

            <div className={styles.field}>
              <label>Bid od — do</label>
              <div className={styles.rangeRow}>
                <input className={styles.input} type="number" placeholder="Min" value={filters.bidMin} onChange={e => handleChange('bidMin', e.target.value)} />
                <span className={styles.dash}>—</span>
                <input className={styles.input} type="number" placeholder="Max" value={filters.bidMax} onChange={e => handleChange('bidMax', e.target.value)} />
              </div>
            </div>

            <div className={styles.field}>
              <label>Ask od — do</label>
              <div className={styles.rangeRow}>
                <input className={styles.input} type="number" placeholder="Min" value={filters.askMin} onChange={e => handleChange('askMin', e.target.value)} />
                <span className={styles.dash}>—</span>
                <input className={styles.input} type="number" placeholder="Max" value={filters.askMax} onChange={e => handleChange('askMax', e.target.value)} />
              </div>
            </div>

            <div className={styles.field}>
              <label>Volumen od — do</label>
              <div className={styles.rangeRow}>
                <input className={styles.input} type="number" placeholder="Min" value={filters.volumeMin} onChange={e => handleChange('volumeMin', e.target.value)} />
                <span className={styles.dash}>—</span>
                <input className={styles.input} type="number" placeholder="Max" value={filters.volumeMax} onChange={e => handleChange('volumeMax', e.target.value)} />
              </div>
            </div>

            {(activeTab === 'FUTURES' || activeTab === 'OPTIONS') && (
              <div className={styles.field}>
                <label>Settlement Date</label>
                <input
                  className={styles.input}
                  type="date"
                  value={filters.settlementDate}
                  onChange={e => handleChange('settlementDate', e.target.value)}
                />
              </div>
            )}
          </div>

          <div className={styles.actions}>
            <button className={styles.resetBtn} onClick={onReset}>Resetuj filtere</button>
          </div>
        </div>
      )}
    </div>
  );
}

export { DEFAULT_FILTERS };
