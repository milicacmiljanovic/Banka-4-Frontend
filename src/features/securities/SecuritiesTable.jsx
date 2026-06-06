import { useState, useEffect } from 'react';
import Pagination from '../../components/ui/Pagination';
import styles from './SecuritiesTable.module.css';

const PAGE_SIZE = 20;

const SORT_KEYS = {
  price: 'price',
  volume: 'volume',
  maintenanceMargin: 'maintenanceMargin',
};

function SortIcon({ col, sortBy, sortDir }) {
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

function Th({ col, children, sortBy, sortDir, onSort }) {
  return (
    <th
      className={`${styles.th} ${styles.sortable}`}
      onClick={() => onSort(col)}
    >
      {children}<SortIcon col={col} sortBy={sortBy} sortDir={sortDir} />
    </th>
  );
}

function fmt(n, decimals = 2) {
  if (n == null) return '—';
  return new Intl.NumberFormat('sr-RS', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(n);
}

function fmtDate(d) {
  if (!d) return '—';
  const date = new Date(d);
  if (isNaN(date.getTime())) return d;
  return date.toLocaleDateString('sr-RS');
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
  onAction,
  sortBy,
  sortDir,
  onSort,
}) {
  const [page, setPage] = useState(1);

  useEffect(() => { setTimeout(() => setPage(1), 0); }, [securities]);

  const paged    = securities.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const isOption  = securities.length > 0 && securities[0].type === 'OPTION';
  const isFutures = securities.length > 0 && securities[0].type === 'FUTURES';

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
            <th className={styles.th} style={{ color: 'var(--tx-3)', fontWeight: 400, fontSize: 11 }} colSpan={20}>
              Stranica {page} od {Math.max(1, Math.ceil(securities.length / PAGE_SIZE))} · {securities.length} ukupno
            </th>
          </tr>
          <tr>
            <th className={styles.th}>Ticker</th>
            <th className={styles.th}>Naziv</th>
            <th className={styles.th}>Berza</th>
            <Th col="price" sortBy={sortBy} sortDir={sortDir} onSort={onSort}>Cena</Th>
            <th className={styles.th}>Promena</th>
            <Th col="volume" sortBy={sortBy} sortDir={sortDir} onSort={onSort}>Volumen</Th>
            <th className={styles.th}>Bid</th>
            <th className={styles.th}>Ask</th>
            {isOption && <th className={styles.th}>Strike</th>}
            {isOption && <th className={styles.th}>OI</th>}
            {(isOption || isFutures) && <th className={styles.th}>Datum isteka</th>}
            {!isOption && <Th col="maintenanceMargin" sortBy={sortBy} sortDir={sortDir} onSort={onSort}>Maint. Margin</Th>}
            {!isOption && <th className={styles.th}>Init. Margin Cost</th>}
            {onAction && <th className={styles.th}></th>}
          </tr>
        </thead>
        <tbody>
          {paged.map(sec => {
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
                {isOption && <td className={styles.td}>{fmt(sec.strike)} {sec.currency}</td>}
                {isOption && <td className={styles.td}>{fmtVol(sec.openInterest)}</td>}
                {(isOption || isFutures) && (
                  <td className={styles.td}>
                    {sec.settlementDate
                      ? new Date(sec.settlementDate) < new Date()
                        ? <span style={{ color: 'var(--red, #ef4444)', fontWeight: 600 }}>{fmtDate(sec.settlementDate)} (istekao)</span>
                        : fmtDate(sec.settlementDate)
                      : '—'}
                  </td>
                )}
                {!isOption && (
                <td className={styles.td}>
                  {sec.type === 'FOREX'
                    ? `${(sec.maintenanceMargin * 100).toFixed(0)}%`
                    : fmt(sec.maintenanceMargin)}
                </td>
                )}
                {!isOption && <td className={styles.td}>{fmt(sec.initialMarginCost)}</td>}
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
      <Pagination page={page} pageSize={PAGE_SIZE} total={securities.length} onPageChange={setPage} />
    </div>
  );
}
