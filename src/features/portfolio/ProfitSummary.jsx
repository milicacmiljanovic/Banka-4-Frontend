// src/features/portfolio/ProfitSummary.jsx
import styles from './ProfitSummary.module.css';

export default function ProfitSummary({ assets = [] }) {
  // Izračunavamo ukupni profit iz svih hartija
  const totalProfit = assets.reduce((sum, asset) => sum + (asset.profit || 0), 0);
  const isPositive = totalProfit >= 0;

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <span className={styles.label}>Ukupan Profit / Gubitak</span>
        <div className={`${styles.value} ${isPositive ? styles.pos : styles.neg}`}>
          {isPositive ? '▲' : '▼'} {isPositive ? '+' : ''}{totalProfit.toLocaleString('sr-RS', { minimumFractionDigits: 2 })} RSD
        </div>
      </div>
      
      {/* Možeš dodati i broj aktivnih hartija */}
      <div className={styles.card}>
        <span className={styles.label}>Aktivne hartije</span>
        <div className={styles.valueAlt}>{assets.length} stavki</div>
      </div>
    </div>
  );
}