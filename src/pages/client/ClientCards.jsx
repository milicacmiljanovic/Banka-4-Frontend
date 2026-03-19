import { useRef, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import styles from './ClientSubPage.module.css';

const FAKE_CARDS = [
  { id: 1, type: 'Debitna kartica', number: '**** **** **** 4521', expires: '09/27', status: 'Aktivna', network: 'Visa' },
  { id: 2, type: 'Kreditna kartica', number: '**** **** **** 8803', expires: '03/26', status: 'Aktivna', network: 'Mastercard' },
];

export default function ClientCards() {
  const pageRef = useRef(null);
  const navigate = useNavigate();

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.sub-card', { opacity: 0, y: 20, duration: 0.45, ease: 'power2.out', stagger: 0.1 });
    }, pageRef);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={pageRef} className={styles.page}>
      <div className={styles.topBar}>
        <button className={styles.back} onClick={() => navigate('/dashboard')}>← Nazad</button>
        <h1 className={styles.title}>Moje kartice</h1>
      </div>
      <div className={styles.list}>
        {FAKE_CARDS.map(card => (
          <div key={card.id} className={`sub-card ${styles.card}`}>
            <div className={styles.cardVisual}>
              <div className={styles.cardChip} />
              <div className={styles.cardNumber}>{card.number}</div>
              <div className={styles.cardMeta}>
                <span>{card.type}</span>
                <span>Ističe: {card.expires}</span>
                <span className={styles.cardNetwork}>{card.network}</span>
              </div>
            </div>
            <div className={styles.cardActions}>
              <span className={`${styles.statusBadge} ${card.status === 'Aktivna' ? styles.statusActive : styles.statusInactive}`}>
                {card.status}
              </span>
              <button className={styles.actionBtn}>Blokiranje kartice</button>
              <button className={styles.actionBtn}>Promena limita</button>
              <button className={styles.actionBtn}>PIN servisi</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
