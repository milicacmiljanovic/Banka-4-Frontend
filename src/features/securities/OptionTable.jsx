import { useState, useMemo } from 'react';
import styles from './OptionTable.module.css';

function fmt(n, d = 2) {
  if (n == null) return '—';
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }).format(n);
}

function fmtVol(n) {
  if (n == null) return '—';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
}

function daysUntil(dateStr) {
  const diff = new Date(dateStr) - new Date();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export default function OptionTable({ options, currentPrice, canExercise }) {
  const [selectedExpiry, setSelectedExpiry] = useState(options[0]?.settlementDate ?? null);
  const [strikeCount, setStrikeCount] = useState(4); // how many strikes above/below shared price

  const expiryGroup = useMemo(
    () => options.find(g => g.settlementDate === selectedExpiry),
    [options, selectedExpiry]
  );

  const allStrikes = expiryGroup?.strikes ?? [];

  // Find index of strike closest to currentPrice
  const sharedIdx = useMemo(() => {
    if (!allStrikes.length) return -1;
    let closest = 0;
    let minDiff = Infinity;
    allStrikes.forEach((s, i) => {
      const diff = Math.abs(s.strike - currentPrice);
      if (diff < minDiff) { minDiff = diff; closest = i; }
    });
    return closest;
  }, [allStrikes, currentPrice]);

  // Slice strikes around shared price
  const visibleStrikes = useMemo(() => {
    if (sharedIdx < 0) return allStrikes;
    const from = Math.max(0, sharedIdx - strikeCount);
    const to   = Math.min(allStrikes.length - 1, sharedIdx + strikeCount);
    return allStrikes.slice(from, to + 1);
  }, [allStrikes, sharedIdx, strikeCount]);

  const now = new Date();
  const canExerciseOption = (strike) =>
    canExercise &&
    new Date(selectedExpiry) > now &&
    strike.call?.last > 0; // placeholder ITM check

  if (!options || options.length === 0) {
    return (
      <div className={styles.empty}>
        Nema dostupnih opcija za ovu akciju.
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      {/* Expiry date selector */}
      <div className={styles.toolbar}>
        <div className={styles.expiryTabs}>
          {options.map(g => {
            const days = daysUntil(g.settlementDate);
            const expired = days === 0;
            return (
              <button
                key={g.settlementDate}
                className={`${styles.expiryTab} ${selectedExpiry === g.settlementDate ? styles.expiryActive : ''} ${expired ? styles.expired : ''}`}
                onClick={() => setSelectedExpiry(g.settlementDate)}
              >
                {g.settlementDate}
                <span className={styles.daysLeft}>{expired ? 'Expired' : `${days}d`}</span>
              </button>
            );
          })}
        </div>
        <div className={styles.strikeControl}>
          <label>Strikes ±</label>
          <select
            className={styles.strikeSelect}
            value={strikeCount}
            onChange={e => setStrikeCount(Number(e.target.value))}
          >
            {[1, 2, 3, 4, 5, 6].map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
            <option value={999}>Svi</option>
          </select>
        </div>
      </div>

      {/* Shared price banner */}
      <div className={styles.sharedPriceBanner}>
        <span>Tržišna cena akcije (Shared Price)</span>
        <strong>${fmt(currentPrice)}</strong>
      </div>

      {/* Options table */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th colSpan={6} className={`${styles.th} ${styles.callsHeader}`}>CALLS</th>
              <th className={`${styles.th} ${styles.strikeHeader}`}>STRIKE</th>
              <th colSpan={6} className={`${styles.th} ${styles.putsHeader}`}>PUTS</th>
              {canExercise && <th className={styles.th}></th>}
            </tr>
            <tr>
              {['Last','Theta','Bid','Ask','Vol','OI'].map(h => (
                <th key={`c-${h}`} className={`${styles.th} ${styles.subHeader} ${styles.callCol}`}>{h}</th>
              ))}
              <th className={`${styles.th} ${styles.subHeader} ${styles.strikeHeader}`}>$</th>
              {['Last','Theta','Bid','Ask','Vol','OI'].map(h => (
                <th key={`p-${h}`} className={`${styles.th} ${styles.subHeader} ${styles.putCol}`}>{h}</th>
              ))}
              {canExercise && <th className={styles.th}></th>}
            </tr>
          </thead>
          <tbody>
            {visibleStrikes.map((row, rowIdx) => {
              const globalIdx = allStrikes.indexOf(row);
              const isSharedRow = globalIdx === sharedIdx;
              const isITMCall  = row.strike < currentPrice; // Call ITM when strike < price
              const isITMPut   = row.strike > currentPrice; // Put ITM when strike > price
              const canEx      = canExerciseOption(row);

              return (
                <>
                  {isSharedRow && (
                    <tr key={`shared-${row.strike}`} className={styles.sharedRow}>
                      <td colSpan={canExercise ? 14 : 13} className={styles.sharedCell}>
                        ▼ Shared Price: <strong>${fmt(currentPrice)}</strong>
                      </td>
                    </tr>
                  )}
                  <tr key={row.strike} className={styles.optionRow}>
                    {/* CALLS */}
                    <td className={`${styles.td} ${isITMCall ? styles.itm : styles.otm}`}>{fmt(row.call?.last)}</td>
                    <td className={`${styles.td} ${isITMCall ? styles.itm : styles.otm}`}>{fmt(row.call?.theta, 4)}</td>
                    <td className={`${styles.td} ${isITMCall ? styles.itm : styles.otm}`}>{fmt(row.call?.bid)}</td>
                    <td className={`${styles.td} ${isITMCall ? styles.itm : styles.otm}`}>{fmt(row.call?.ask)}</td>
                    <td className={`${styles.td} ${isITMCall ? styles.itm : styles.otm}`}>{fmtVol(row.call?.volume)}</td>
                    <td className={`${styles.td} ${isITMCall ? styles.itm : styles.otm}`}>{fmtVol(row.call?.oi)}</td>

                    {/* STRIKE */}
                    <td className={`${styles.td} ${styles.strikeCell}`}>${fmt(row.strike, 0)}</td>

                    {/* PUTS */}
                    <td className={`${styles.td} ${isITMPut ? styles.itm : styles.otm}`}>{fmt(row.put?.last)}</td>
                    <td className={`${styles.td} ${isITMPut ? styles.itm : styles.otm}`}>{fmt(row.put?.theta, 4)}</td>
                    <td className={`${styles.td} ${isITMPut ? styles.itm : styles.otm}`}>{fmt(row.put?.bid)}</td>
                    <td className={`${styles.td} ${isITMPut ? styles.itm : styles.otm}`}>{fmt(row.put?.ask)}</td>
                    <td className={`${styles.td} ${isITMPut ? styles.itm : styles.otm}`}>{fmtVol(row.put?.volume)}</td>
                    <td className={`${styles.td} ${isITMPut ? styles.itm : styles.otm}`}>{fmtVol(row.put?.oi)}</td>

                    {canExercise && (
                      <td className={styles.td}>
                        {canEx && (
                          <button
                            className={styles.exerciseBtn}
                            onClick={() => alert(`TODO: Exercise opcije za strike $${row.strike}`)}
                          >
                            Exercise
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                </>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className={styles.legend}>
        <span className={styles.legendItm}>■ In-The-Money (ITM)</span>
        <span className={styles.legendOtm}>■ Out-of-Money (OTM)</span>
      </div>
    </div>
  );
}
