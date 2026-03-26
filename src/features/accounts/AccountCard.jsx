import styles from './AccountCard.module.css';

export default function AccountCard({ account, selected, onSelect, onDetails }) {
  const formatted = new Intl.NumberFormat('sr-RS', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(account.available_balance);

  return (
    <div
      className={`${styles.card} ${selected ? styles.selected : ''}`}
      onClick={() => onSelect(account.account_id)}
    >
      <div className={styles.name}>{account.name}</div>
      <div className={styles.number}>{account.account_number}</div>
      <div className={styles.balanceRow}>
        <span className={styles.balance}>{formatted}</span>
        <span className={styles.currency}>{account.currency}</span>
      </div>
      <button
        className={styles.detailsBtn}
        onClick={e => { e.stopPropagation(); onDetails(account); }}
      >
        Detalji
      </button>
    </div>
  );
}
