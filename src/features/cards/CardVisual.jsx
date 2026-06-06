import { useMemo, useState } from 'react';
import {
  CARD_STATUS,
  formatCardNumberForUi,
  getCardBrand,
  getStatusMeta,
} from '../../utils/cardHelpers';
import styles from '../../pages/admin/CardsPage.module.css';

export default function CardVisual({ card, onOpenDetails }) {
  const [showBack, setShowBack] = useState(false);

  const maskedNumber = useMemo(() => formatCardNumberForUi(card.cardNumber), [card.cardNumber]);
  const brand = useMemo(() => getCardBrand(card.cardNumber), [card.cardNumber]);
  const statusMeta = useMemo(() => getStatusMeta(card.status), [card.status]);
  
  const formattedExpiry = useMemo(() => {
    if (!card.expiresAt) return '';
    try {
      const d = new Date(card.expiresAt);
      if (isNaN(d.getTime())) return card.expiresAt;
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const y = String(d.getFullYear()).slice(-2);
      return `${m}/${y}`;
    } catch {
      return card.expiresAt;
    }
  }, [card.expiresAt]);

  return (
    <div className={styles.cardVisualWrap}>
      <div className={`${styles.card3d} ${showBack ? styles.card3dFlipped : ''}`}>
        <div className={`${styles.cardFace} ${styles.cardFront}`}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
            <div className={styles.bankChip} />
            <span className={`${styles.cardStatusTag} ${styles[`cardStatus_${statusMeta.tone}`]}`}>
              {statusMeta.label}
            </span>
          </div>

          <div className={styles.cardBrand}>{brand?.label || 'Kartica'}</div>

          <div className={styles.cardNumber}>{maskedNumber}</div>

          <div className={styles.cardMetaRow}>
            <div>
              <span className={styles.cardMetaLabel}>Vlasnik</span>
              <strong className={styles.cardMetaValue}>{card.holderName}</strong>
            </div>

            <div className={styles.cardMetaRight}>
              <span className={styles.cardMetaLabel}>Važi do</span>
              <strong className={styles.cardMetaValue}>{formattedExpiry}</strong>
            </div>
          </div>
        </div>

        <div className={`${styles.cardFace} ${styles.cardBack}`}>
          <div className={styles.cardBackStripe} />
          <div className={styles.cvvBoxWrap}>
            <span className={styles.cardMetaLabel}>CVV</span>
            <div className={styles.cvvBox}>{card.cvv}</div>
          </div>
        </div>
      </div>

      <div className={styles.cardBottomActions}>
        <button
          type="button"
          className={styles.cardActionButton}
          onClick={onOpenDetails}
        >
          Detalji kartice
        </button>

        <button
          type="button"
          className={styles.cardActionButton}
          onClick={() => setShowBack((prev) => !prev)}
        >
          {showBack ? 'Prikaži prednju stranu' : 'Prikaži CVV'}
        </button>
      </div>
    </div>
  );
}