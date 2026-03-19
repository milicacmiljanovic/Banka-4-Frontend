import { useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';
import styles from './LoanList.module.css';

export default function LoanList({ loans, selectedId, onSelectLoan }) {
  const ref = useRef(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(ref.current, {
        opacity: 0,
        x: -16,
        duration: 0.4,
        ease: 'power2.out',
      });
    }, ref);
    return () => ctx.revert();
  }, []);

  // Requirement 1: Inicijalno sortirati listu opadajuće prema ukupnom iznosu kredita
  const sortedLoans = [...loans].sort((a, b) => b.total_amount - a.total_amount);

  const formatCurrency = (amount) => 
    new Intl.NumberFormat('sr-RS', { minimumFractionDigits: 2 }).format(amount);

  return (
    <div ref={ref} className={styles.listContainer}>
      {sortedLoans.map((loan) => (
        <div
          key={loan.id}
          className={`ll-card ${styles.loanCard} ${selectedId === loan.id ? styles.active : ''}`}
          onClick={() => onSelectLoan(loan)}
        >
          <div className={styles.cardHeader}>
            <span className={styles.loanName}>{loan.name}</span>
            <span className={styles.statusBadge}>{loan.status}</span>
          </div>
          
          <div className={styles.cardBody}>
            <p className={styles.idLabel}>Broj ugovora: <strong>{loan.id}</strong></p>
            <div className={styles.amountWrapper}>
              <span className={styles.label}>Početni iznos</span>
              <span className={styles.amount}>
                {formatCurrency(loan.total_amount)} {loan.currency}
              </span>
            </div>
          </div>

          <div className={styles.selectionIndicator}></div>
        </div>
      ))}
    </div>
  );
}