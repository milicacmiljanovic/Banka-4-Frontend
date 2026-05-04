import styles from './TaxSummary.module.css';

// DODAJ 'default' OVDE:
export default function TaxSummary({ stats }) {
  if (!stats) return null;

  return (
    <div className={styles.taxWrapper}>
      <div className={styles.taxItem}>
        <span className={styles.label}>Plaćen porez (2026)</span>
        <span className={styles.paid}>{stats.taxPaid?.toLocaleString('sr-RS', { minimumFractionDigits: 2 })} RSD</span>
      </div>
      <div className={styles.divider} />
      <div className={styles.taxItem}>
        <span className={styles.label}>Neplaćen porez (Mart)</span>
        <span className={styles.unpaid}>{stats.taxUnpaid?.toLocaleString('sr-RS', { minimumFractionDigits: 2 })} RSD</span>
      </div>
    </div>
  );
}