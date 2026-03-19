import { useRef, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { clientApi } from '../../api/endpoints/client';
import { useFetch } from '../../hooks/useFetch';
import Spinner from '../../components/ui/Spinner';
import styles from './ClientSubPage.module.css';

function formatAmount(amount, currency = 'RSD') {
  return new Intl.NumberFormat('sr-RS', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(amount)) + ' ' + currency;
}

export default function ClientAccounts() {
  const pageRef = useRef(null);
  const navigate = useNavigate();
  const { data, loading } = useFetch(() => clientApi.getAccounts(), []);
  const accounts = data?.data ?? [];

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.sub-card', { opacity: 0, y: 20, duration: 0.45, ease: 'power2.out', stagger: 0.07 });
    }, pageRef);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={pageRef} className={styles.page}>
      <div className={styles.topBar}>
        <button className={styles.back} onClick={() => navigate('/dashboard')}>← Nazad</button>
        <h1 className={styles.title}>Moji računi</h1>
      </div>
      {loading ? <Spinner /> : (
        <div className={styles.list}>
          {accounts.map(acc => (
            <div key={acc.id} className={`sub-card ${styles.card}`}>
              <div className={styles.cardIcon}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
                </svg>
              </div>
              <div className={styles.cardInfo}>
                <div className={styles.cardName}>{acc.name}</div>
                <div className={styles.cardNumber}>{acc.number}</div>
                <div className={styles.cardCurrency}>{acc.currency}</div>
              </div>
              <div className={styles.cardBalance}>{formatAmount(acc.balance, acc.currency)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
