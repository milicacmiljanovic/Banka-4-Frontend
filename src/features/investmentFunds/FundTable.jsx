import styles from './FundTable.module.css';

function formatRsd(value) {
  if (value == null) return '—';
  return Number(value).toLocaleString('sr-RS', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Props:
 *   funds       – array
 *   loading     – boolean
 *   isClient    – boolean (shows "Investiraj" button)
 *   isSupervisor– boolean (shows "Kreiraj fond" button — handled in parent)
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
    const [currentCol, currentDir] = sortBy.split('_');
    if (currentCol === column) {
      onSortChange(`${column}_${currentDir === 'asc' ? 'desc' : 'asc'}`);
    } else {
      onSortChange(`${column}_asc`);
    }
  }

  function SortIcon({ column }) {
    const [col, dir] = sortBy.split('_');
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
            {isClient && <th className={styles.actionTh}>Akcija</th>}
          </tr>
        </thead>
        <tbody>
          {funds.map((fund, i) => {
            const profitPositive = (fund.profit ?? fund.totalProfit ?? 0) >= 0;
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
