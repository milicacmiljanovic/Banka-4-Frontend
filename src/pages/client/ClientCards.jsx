import { useRef, useLayoutEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { clientApi } from '../../api/endpoints/client';
import { cardsApi } from '../../api/endpoints/cards';
import { useFetch } from '../../hooks/useFetch';
import { useAuthStore } from '../../store/authStore';
import Spinner from '../../components/ui/Spinner';
import Alert from '../../components/ui/Alert';
import styles from './ClientSubPage.module.css';

function maskNumber(num) {
  if (!num) return '****';
  const last4 = num.slice(-4);
  return `**** **** **** ${last4}`;
}

function formatExpiry(dateStr) {
  if (!dateStr) return '--/--';
  const d = new Date(dateStr);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yy = String(d.getFullYear()).slice(-2);
  return `${mm}/${yy}`;
}

function cardTypeName(type) {
  const map = { DEBIT: 'Debitna kartica', CREDIT: 'Kreditna kartica' };
  return map[type] ?? type ?? 'Kartica';
}

function statusLabel(status) {
  const map = { ACTIVE: 'Aktivna', BLOCKED: 'Blokirana', DEACTIVATED: 'Deaktivirana' };
  return map[status] ?? status ?? '';
}

function normalizeClientStatus(status) {
  // Backend might return either English or Serbian status values.
  switch (status) {
    case 'AKTIVNA':      return 'ACTIVE';
    case 'BLOKIRANA':    return 'BLOCKED';
    case 'DEAKTIVIRANA': return 'DEACTIVATED';
    default:             return status;
  }
}

export default function ClientCards() {
  const pageRef = useRef(null);
  const navigate = useNavigate();
  const clientId = useAuthStore(s => s.user?.client_id ?? s.user?.id);

  // First fetch accounts, then cards per account
  const { data: accountsData, loading: loadingAccounts } = useFetch(() => clientApi.getAccounts(clientId), [clientId]);
  const accounts = Array.isArray(accountsData) ? accountsData : accountsData?.data ?? [];

  const [cards, setCards] = useState([]);
  const [loadingCards, setLoadingCards] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Fetch cards for all accounts
  useLayoutEffect(() => {
    if (!accounts.length) { setLoadingCards(false); return; }
    let cancelled = false;
    setLoadingCards(true);

    Promise.all(
      accounts.map(acc => {
        const accNum = acc.account_number ?? acc.number;
        return cardsApi.getByAccount(clientId, accNum)
          .then(res => {
            const list = res?.cards ?? (Array.isArray(res) ? res : res?.data ?? []);
            return list.map(c => ({ ...c, _accountNumber: c.account_number ?? accNum }));
          })
          .catch(() => []);
      })
    ).then(results => {
      if (!cancelled) setCards(results.flat());
    }).finally(() => {
      if (!cancelled) setLoadingCards(false);
    });

    return () => { cancelled = true; };
  }, [accounts, clientId]);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.sub-card', { opacity: 0, y: 20, duration: 0.45, ease: 'power2.out', stagger: 0.1 });
    }, pageRef);
    return () => ctx.revert();
  }, [cards]);

  async function handleBlock(cardId) {
    setActionLoading(cardId);
    setActionError('');
    try {
      await cardsApi.block(cardId);
      setCards(prev => prev.map(c => c.id === cardId ? { ...c, status: 'BLOCKED' } : c));
      setActionSuccess(`Kartica je blokirana.`);
      setTimeout(() => setActionSuccess(''), 3000);
    } catch (err) {
      setActionError(err?.message || 'Greška pri blokiranju kartice.');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDeactivate(cardId) {
    setActionLoading(cardId);
    setActionError('');
    try {
      await cardsApi.deactivate(cardId);
      setCards(prev => prev.map(c => c.id === cardId ? { ...c, status: 'DEACTIVATED' } : c));
      setActionSuccess(`Kartica je deaktivirana.`);
      setTimeout(() => setActionSuccess(''), 3000);
    } catch (err) {
      setActionError(err?.message || 'Greška pri deaktivaciji kartice.');
    } finally {
      setActionLoading(null);
    }
  }

  const loading = loadingAccounts || loadingCards;

  return (
    <div ref={pageRef} className={styles.page}>
      <div className={styles.topBar}>
        <button className={styles.back} onClick={() => navigate('/dashboard')}>← Nazad</button>
        <h1 className={styles.title}>Moje kartice</h1>
      </div>

      {actionSuccess && <div className={styles.successBanner}>{actionSuccess}</div>}
      {actionError && <Alert type="error" message={actionError} />}

      {loading ? <Spinner /> : cards.length === 0 ? (
        <p style={{ color: 'var(--tx-3)', textAlign: 'center', padding: '3rem' }}>Nemate kartica.</p>
      ) : (
        <div className={styles.list}>
          {cards.map(card => {
            const uiStatus = normalizeClientStatus(card.status);
            const isActive = uiStatus === 'ACTIVE';
            const isDeactivated = uiStatus === 'DEACTIVATED';
            const isLoading = actionLoading === card.id;

            return (
              <div key={card.id} className={`sub-card ${styles.card}`}>
                <div className={styles.cardVisual}>
                  <div className={styles.cardChip} />
                  <div className={styles.cardNumber}>{maskNumber(card.card_number)}</div>
                  <div className={styles.cardMeta}>
                    <span>{cardTypeName(card.card_type)}</span>
                    <span>Ističe: {formatExpiry(card.expires_at ?? card.expiration_date)}</span>
                    <span className={styles.cardNetwork}>{card.card_brand ?? ''}</span>
                  </div>
                </div>
                <div className={styles.cardActions}>
                  <span className={`${styles.statusBadge} ${isActive ? styles.statusActive : styles.statusInactive}`}>
                    {statusLabel(uiStatus)}
                  </span>

                  {isActive && (
                    <button className={styles.actionBtn} onClick={() => handleBlock(card.id)} disabled={isLoading}>
                      {isLoading ? 'Blokiranje...' : 'Blokiraj karticu'}
                    </button>
                  )}

                  {!isDeactivated && (
                    <button className={styles.actionBtn} onClick={() => handleDeactivate(card.id)} disabled={isLoading}>
                      {isLoading ? 'Deaktivacija...' : 'Deaktiviraj karticu'}
                    </button>
                  )}

                  {card.limit !== undefined && (
                    <div style={{ fontSize: 12, color: 'var(--tx-3)', padding: '4px 0' }}>
                      Limit: {Number(card.limit).toLocaleString('sr-RS')} {card.currency ?? 'RSD'}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
