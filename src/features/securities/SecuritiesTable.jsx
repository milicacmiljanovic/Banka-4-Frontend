import styles from './SecuritiesTable.module.css';

const SORT_KEYS = {
  price: 'price',
  volume: 'volume',
  maintenanceMargin: 'maintenanceMargin',
};

function fmt(n, decimals = 2) {
  if (n == null) return '—';
  return new Intl.NumberFormat('sr-RS', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(n);
}

function fmtVol(n) {
  if (n == null) return '—';
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2) + 'B';
  if (n >= 1_000_000)     return (n / 1_000_000).toFixed(2) + 'M';
  if (n >= 1_000)         return (n / 1_000).toFixed(1) + 'K';
  return n.toString();
}

export default function SecuritiesTable({
  securities,
  selectedId,
  onSelect,
  onAction,   // { label: 'Buy' | 'Create Order', handler: fn }
  sortBy,
  sortDir,
  onSort,
}) {
  function SortIcon({ col }) {
    const active = sortBy === col;
    return (
      <svg
        width="10" height="10" viewBox="0 0 24 24" fill="none"
        stroke={active ? 'var(--accent, #3b82f6)' : 'currentColor'}
        strokeWidth="2.5"
        style={{ marginLeft: 4, opacity: active ? 1 : 0.35, transform: active && sortDir === 'asc' ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}
      >
        <polyline points="6 9 12 15 18 9"/>
      </svg>
    );
  }

  function Th({ col, children }) {
    return (
      <th
        className={`${styles.th} ${styles.sortable}`}
        onClick={() => onSort(col)}
      >
        {children}<SortIcon col={col} />
      </th>
    );
  }

  if (securities.length === 0) {
    return (
      <div className={styles.empty}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--tx-3)" strokeWidth="1.5">
          <path d="M9 19v-6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2z"/>
          <path d="M15 5v14a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2z"/>
        </svg>
        <p>Nema hartija za prikaz.</p>
      </div>
    );
  }

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.th}>Ticker</th>
            <th className={styles.th}>Naziv</th>
            <th className={styles.th}>Berza</th>
            <Th col="price">Cena</Th>
            <th className={styles.th}>Promena</th>
            <Th col="volume">Volumen</Th>
            <th className={styles.th}>Bid</th>
            <th className={styles.th}>Ask</th>
            <Th col="maintenanceMargin">Maint. Margin</Th>
            <th className={styles.th}>Init. Margin Cost</th>
            {onAction && <th className={styles.th}></th>}
          </tr>
        </thead>
        <tbody>
          {securities.map(sec => {
            const isSelected = selectedId === sec.id;
            const changePositive = sec.change >= 0;
            return (
              <tr
                key={sec.id}
                className={`${styles.row} ${isSelected ? styles.selected : ''}`}
                onClick={() => onSelect(sec)}
              >
                <td className={styles.td}>
                  <span className={styles.ticker}>{sec.ticker}</span>
                </td>
                <td className={styles.td}>{sec.name}</td>
                <td className={styles.td}>
                  <span className={styles.exchange}>{sec.exchange}</span>
                </td>
                <td className={styles.td}>
                  <strong>{fmt(sec.price)}</strong>
                  <span className={styles.currency}> {sec.currency}</span>
                </td>
                <td className={styles.td}>
                  <span className={changePositive ? styles.up : styles.down}>
                    {changePositive ? '+' : ''}{fmt(sec.change)} ({changePositive ? '+' : ''}{fmt(sec.changePercent)}%)
                  </span>
                </td>
                <td className={styles.td}>{fmtVol(sec.volume)}</td>
                <td className={styles.td}>{fmt(sec.bid)}</td>
                <td className={styles.td}>{fmt(sec.ask)}</td>
                <td className={styles.td}>
                  {sec.type === 'FOREX'
                    ? `${(sec.maintenanceMargin * 100).toFixed(0)}%`
                    : fmt(sec.maintenanceMargin)}
                </td>
                <td className={styles.td}>{fmt(sec.initialMarginCost)}</td>
                {onAction && (
                  <td className={styles.td} onClick={e => e.stopPropagation()}>
                    <button
                      className={styles.actionBtn}
                      onClick={() => onAction.handler(sec)}
                    >
                      {onAction.label}
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
