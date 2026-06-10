import { useEffect, useState } from 'react';
import Alert from '../../components/ui/Alert';
import CardStatusTag from './CardStatusTag';
import {
  CARD_STATUS,
  formatDate,
  formatLimit,
  getAllowedActions,
  getCardBrand,
  maskCardNumber,
} from '../../utils/cardHelpers';
import styles from '../../pages/admin/CardsPage.module.css';

function ActionButton({ children, onClick, type = 'button', tone = 'neutral' }) {
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: '8px 12px',
    minWidth: 140,
    borderRadius: 8,
    border: '1px solid transparent',
    background: 'transparent',
    color: 'var(--text, #111)',
    cursor: 'pointer',
    fontSize: 14,
    lineHeight: 1,
    boxShadow: 'none',
    width: 'auto',
  };

  const tones = {
    primary: { background: 'var(--primary, #1976d2)', color: '#fff' },
    danger: { background: 'var(--red, #d32f2f)', color: '#fff' },
    warning: { background: 'var(--orange, #f57c00)', color: '#fff' },
    neutral: { background: 'transparent', color: 'var(--text, #111)', border: '1px solid var(--muted, #e0e0e0)' },
    success: { background: 'var(--green, #388e3c)', color: '#fff' },
  };

  const style = { ...base, ...(tones[tone] || tones.neutral) };

  return (
    <button
      type={type}
      onClick={onClick}
      style={style}
    >
      <span style={{ flex: '1 1 auto', textAlign: 'left' }}>{children}</span>
      <span style={{ opacity: 0.9 }}>›</span>
    </button>
  );
}

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
    setTimeout(() => {
      setLimits({
        daily: String(card.limitDaily ?? ''),
        monthly: String(card.limitMonthly ?? ''),
      });
      setMessage(null);
    }, 0);
  }, [card]);

  const allowedActions = getAllowedActions(card.status, portalType);
  const brand = getCardBrand(card.cardNumber);
  const isDeactivated = card.status === CARD_STATUS.DEACTIVATED;

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
    setMessage({ type: 'uspeh', text: 'Limiti kartice su uspešno ažurirani.' });
  }

  return (
    <section className={styles.detailsCardPage}>
      <div className={styles.detailsHeaderTop}>
        <h2 className={styles.detailsPageTitle}>Detalji kartice</h2>

        <button
          type="button"
          className={styles.closeIconButton}
          onClick={onBack}
        >
          ×
        </button>
      </div>

      <div className={styles.detailsGrid}>
        <InfoItem label="Naziv kartice" value={`${card.type} kartica ${card.cardNumber.slice(-4)}`} />
        <InfoItem label="Brend" value={brand?.label || card.brand || 'Kartica'} />
        <InfoItem label="Broj kartice" value={maskCardNumber(card.cardNumber)} />
        <InfoItem label="Tip" value={card.type} />
        <InfoItem label="Povezani račun" value={`${card.accountName} — ${card.accountNumber}`} />
        <InfoItem label="CVV" value="•••" />
        <InfoItem label="Dnevni limit" value={`${formatLimit(card.limitDaily)} RSD`} />
        <InfoItem label="Mesečni limit" value={`${formatLimit(card.limitMonthly)} RSD`} />
        <InfoItem label="Status" value={<CardStatusTag status={card.status} />} />
        <InfoItem label="Datum kreiranja" value={formatDate(card.createdAt)} />
        <InfoItem label="Datum isteka" value={card.expiresAt} />
        <InfoItem label="Vlasnik" value={card.holderName} />
      </div>

      <div className={styles.sectionDivider} />

      {!isDeactivated && (
        <div className={styles.optionSection}>
          <h3 className={styles.optionTitle}>Opcije</h3>

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

            {/* Options area: use inline flex-wrap row and standardized buttons so they don't stretch full width */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 12 }}>
              <ActionButton type="submit" tone="primary">
                Promeni limite kartice
              </ActionButton>

              {allowedActions.map((action) => (
                <ActionButton
                  key={action.key}
                  type="button"
                  tone={action.tone === 'danger' ? 'danger' : action.tone === 'warning' ? 'warning' : 'neutral'}
                  onClick={() => onAction(card.id, action.key)}
                >
                  {action.label}
                </ActionButton>
              ))}
            </div>
          </form>
        </div>
      )}

      {isDeactivated && (
        <div style={{ padding: '12px 16px', background: 'var(--red-bg, #ffebee)', borderRadius: 'var(--radius)', fontSize: 13, color: 'var(--red)' }}>
          Ova kartica je trajno deaktivirana i ne može se ponovo aktivirati.
        </div>
      )}

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