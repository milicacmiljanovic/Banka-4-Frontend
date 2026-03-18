import { useEffect, useState } from 'react';
import Alert from '../../components/ui/Alert';
import CardStatusTag from './CardStatusTag';
import {
  formatDate,
  formatLimit,
  getAllowedActions,
} from '../../utils/cardHelpers';
import styles from '../../pages/CardsPage.module.css';

export default function CardDetailsPanel({
  card,
  portalType,
  onAction,
  onSaveLimits,
  onBack,
}) {
  const [limits, setLimits] = useState({ daily: '', monthly: '' });
  const [message, setMessage] = useState(null);

  useEffect(() => {
    setLimits({
      daily: String(card.limitDaily ?? ''),
      monthly: String(card.limitMonthly ?? ''),
    });
    setMessage(null);
  }, [card]);

  const allowedActions = getAllowedActions(card.status, portalType);

  function submitLimits(event) {
    event.preventDefault();

    const daily = Number(limits.daily);
    const monthly = Number(limits.monthly);

    if (Number.isNaN(daily) || Number.isNaN(monthly) || daily < 0 || monthly < 0) {
      setMessage({ type: 'greska', text: 'Unesite validne pozitivne vrednosti limita.' });
      return;
    }

    if (daily > monthly) {
      setMessage({ type: 'greska', text: 'Dnevni limit ne može biti veći od mesečnog.' });
      return;
    }

    onSaveLimits(card.id, { daily_limit: daily, monthly_limit: monthly });
    setMessage({ type: 'uspeh', text: 'Limiti su spremni za slanje ka backendu.' });
  }

  return (
    <section className={styles.detailsCardPage}>
      <div className={styles.detailsHeaderTop}>
        <h2 className={styles.detailsPageTitle}>Card Details</h2>

        <button
          type="button"
          className={styles.closeIconButton}
          onClick={onBack}
        >
          ×
        </button>
      </div>

      <div className={styles.detailsGrid}>
        <InfoItem label="Card Name" value={`${card.type} kartica ${card.cardNumber.slice(-4)}`} />
        <InfoItem label="Card Type" value={card.brand || 'MasterCard'} />
        <InfoItem label="ID Card Number" value={card.cardNumber.slice(-4)} />
        <InfoItem label="Type" value={card.type} />
        <InfoItem label="Account Number" value={card.accountNumber} />
        <InfoItem label="CVV Code" value="•••" />
        <InfoItem label="Limit" value={`${formatLimit(card.limitTotal)} RSD`} />
        <InfoItem label="Status" value={<CardStatusTag status={card.status} />} />
        <InfoItem label="Creation Date" value={formatDate(card.createdAt)} />
        <InfoItem label="Expiration Date" value={card.expiresAt} />
      </div>

      <div className={styles.sectionDivider} />

      <div className={styles.optionSection}>
        <h3 className={styles.optionTitle}>Options</h3>

        <form className={styles.limitSection} onSubmit={submitLimits}>
          {message && <Alert tip={message.type} poruka={message.text} />}

          <div className={styles.limitGrid}>
            <label className={styles.field}>
              <span>Dnevni limit</span>
              <input
                type="number"
                min="0"
                value={limits.daily}
                onChange={(event) => setLimits((prev) => ({ ...prev, daily: event.target.value }))}
              />
            </label>

            <label className={styles.field}>
              <span>Mesečni limit</span>
              <input
                type="number"
                min="0"
                value={limits.monthly}
                onChange={(event) => setLimits((prev) => ({ ...prev, monthly: event.target.value }))}
              />
            </label>
          </div>

          <div className={styles.optionsList}>
            <button type="submit" className={styles.optionButtonRow}>
              <span>Promeni limit kartice</span>
              <span>›</span>
            </button>

            {allowedActions.map((action) => (
              <button
                key={action.key}
                type="button"
                className={`${styles.optionButtonRow} ${action.tone === 'danger' ? styles.optionDanger : ''}`}
                onClick={() => onAction(card.id, action.key)}
              >
                <span>{action.label}</span>
                <span>›</span>
              </button>
            ))}
          </div>
        </form>
      </div>

      <div className={styles.sectionDivider} />

      <button
        type="button"
        className={styles.btnGhost}
        onClick={onBack}
      >
        ‹ Nazad na kartice
      </button>
    </section>
  );
}

function InfoItem({ label, value }) {
  return (
    <div className={styles.infoItemBox}>
      <span className={styles.infoLabel}>{label}</span>
      <strong className={styles.infoValue}>{value || '—'}</strong>
    </div>
  );
}