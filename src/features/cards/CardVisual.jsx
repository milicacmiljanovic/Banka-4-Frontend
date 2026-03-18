import { useMemo, useState } from 'react';
import {
  formatLimit,
  getCardBrand,
  maskCardNumber,
} from '../../utils/cardHelpers';
import styles from '../../pages/CardsPage.module.css';

export default function CardVisual({ card, onOpenDetails }) {
  const [showBack, setShowBack] = useState(false);

  const maskedNumber = useMemo(() => maskCardNumber(card.cardNumber), [card.cardNumber]);
  const brand = useMemo(() => getCardBrand(card.cardNumber), [card.cardNumber]);

  return (
    <div className={styles.cardVisualWrap}>
      <div className={`${styles.card3d} ${showBack ? styles.card3dFlipped : ''}`}>
        <div className={`${styles.cardFace} ${styles.cardFront}`}>
          <div className={styles.bankChip} />

          <div className={styles.cardBrand}>{brand?.label || 'Kartica'}</div>
          <div className={styles.cardAmount}>{formatLimit(card.limitTotal)} RSD</div>

          <div className={styles.cardNumber}>{maskedNumber}</div>

          <div className={styles.cardMetaRow}>
            <div>
              <span className={styles.cardMetaLabel}>Vlasnik</span>
              <strong className={styles.cardMetaValue}>{card.holderName}</strong>
            </div>

            <div className={styles.cardMetaRight}>
              <span className={styles.cardMetaLabel}>Važi do</span>
              <strong className={styles.cardMetaValue}>{card.expiresAt}</strong>
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