import styles from './FundTable.module.css';

function formatRsd(value) {
  if (value == null) return '—';
  return Number(value).toLocaleString('sr-RS', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function fmtPct(val, decimals = 1) {
  if (val == null || !isFinite(val)) return '—';
  return `${(val * 100).toFixed(decimals)}%`;
}

function fmtRatio(val, decimals = 2) {
  if (val == null || !isFinite(val)) return '—';
  return val.toFixed(decimals);
}

/**
 * Props:
 *   funds       – array
 *   loading     – boolean
 *   isClient    – boolean (shows "Investiraj" button)
 *   sortBy      – string
 *   onSortChange– (newSortBy) => void
 *   onRowClick  – (fund) => void
 *   onInvest    – (fund) => void  (client only)
 */
export default function FundTable({
  funds = [],
  loading = false,
  isClient = false,
  sortBy = '',
  onSortChange,
  onRowClick,
  onInvest,
}) {
  if (loading) {
    return <div className={styles.empty}>Učitavanje...</div>;
  }

  if (funds.length === 0) {
    return (
      <div className={styles.empty}>
        Nema investicionih fondova koji odgovaraju zadatim filterima.
      </div>
    );
  }

  function handleSortClick(column) {
    if (!onSortChange) return;
    const lastU = sortBy.lastIndexOf('_');
    const currentCol = sortBy.slice(0, lastU);
    const currentDir = sortBy.slice(lastU + 1);
    if (currentCol === column) {
      onSortChange(`${column}_${currentDir === 'asc' ? 'desc' : 'asc'}`);
    } else {
      onSortChange(`${column}_asc`);
    }
  }

  function SortIcon({ column }) {
    const lastU = sortBy.lastIndexOf('_');
    const col = sortBy.slice(0, lastU);
    const dir = sortBy.slice(lastU + 1);
    if (col !== column) {
      return (
        <svg className={styles.sortIcon} width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6 9 12 15 18 9" opacity="0.35" />
        </svg>
      );
    }
    return (
      <svg className={`${styles.sortIcon} ${styles.sortActive}`} width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        {dir === 'asc'
          ? <polyline points="6 15 12 9 18 15" />
          : <polyline points="6 9 12 15 18 9" />
        }
      </svg>
    );
  }

  function SortTh({ column, children }) {
    return (
      <th className={styles.sortableTh} onClick={() => handleSortClick(column)}>
        {children} <SortIcon column={column} />
      </th>
    );
  }

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <SortTh column="name">Naziv</SortTh>
            <th>Opis</th>
            <SortTh column="totalValue">Ukupna vrednost</SortTh>
            <SortTh column="profit">Profit</SortTh>
            <SortTh column="minContrib">Minimalni ulog</SortTh>
            <SortTh column="annualReturn">Godišnji prinos</SortTh>
            <SortTh column="rewardToVar">R/V ratio</SortTh>
            <SortTh column="maxDrawdown">Max Drawdown</SortTh>
            <SortTh column="volatility">Volatilnost</SortTh>
            {isClient && <th className={styles.actionTh}>Akcija</th>}
          </tr>
        </thead>
        <tbody>
          {funds.map((fund, i) => {
            const profitPositive = (fund.profit ?? 0) >= 0;
            const annualReturnPos = fund.annualReturn == null || fund.annualReturn >= 0;
            const rvPos = fund.rewardToVariability == null || fund.rewardToVariability >= 0;
            return (
              <tr
                key={fund.id ?? fund.fundId ?? i}
                className={styles.row}
                onClick={() => onRowClick && onRowClick(fund)}
              >
                <td className={styles.nameCell}>
                  <span className={styles.name}>{fund.name ?? fund.fundName ?? '—'}</span>
                </td>
                <td className={styles.descCell}>
                  <span className={styles.descText}>
                    {fund.description ?? fund.desc ?? '—'}
                  </span>
                </td>
                <td className={styles.amountCell}>
                  {formatRsd(fund.totalValue ?? fund.totalNetAssetValue)} RSD
                </td>
                <td className={styles.amountCell}>
                  <span className={profitPositive ? styles.profitPos : styles.profitNeg}>
                    {profitPositive ? '+' : ''}{formatRsd(fund.profit ?? fund.totalProfit)} RSD
                  </span>
                </td>
                <td className={styles.amountCell}>
                  {formatRsd(fund.minimumInvestment ?? fund.minContribution)} RSD
                </td>
                <td className={styles.amountCell}>
                  <span className={annualReturnPos ? styles.profitPos : styles.profitNeg}>
                    {fmtPct(fund.annualReturn)}
                  </span>
                </td>
                <td className={styles.amountCell}>
                  <span className={rvPos ? styles.profitPos : styles.profitNeg}>
                    {fmtRatio(fund.rewardToVariability)}
                  </span>
                </td>
                <td className={styles.amountCell}>
                  <span className={fund.maxDrawdown != null ? styles.profitNeg : undefined}>
                    {fmtPct(fund.maxDrawdown)}
                  </span>
                </td>
                <td className={styles.amountCell}>
                  {fmtPct(fund.volatility)}
                </td>
                {isClient && (
                  <td
                    className={styles.actionCell}
                    onClick={e => e.stopPropagation()}
                  >
                    <button
                      className={styles.btnInvest}
                      onClick={() => onInvest && onInvest(fund)}
                    >
                      Investiraj
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
