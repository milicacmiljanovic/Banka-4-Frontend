/**
 * NewOrderPage.jsx
 *
 * Ruta: /create-order
 * Poziva se iz PortfolioTable kada korisnik klikne SELL dugme:
 *   navigate('/create-order', { state: asset })
 *
 * asset objekat koji stiže iz PortfolioTable:
 *   { id, ticker, amount, price, profit, lastModified }
 *
 * Stranica kreira SELL order preko securitiesApi.sell()
 * Račun se bira iz liste klijentovih računa (clientApi.getAccounts)
 * ili bankinih računa ako je zaposleni (accountsApi.getBankAccounts)
 */

import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { securitiesApi } from '../../api/endpoints/securities';
import { clientApi } from '../../api/endpoints/client';
import { accountsApi } from '../../api/endpoints/accounts';
import { useFetch } from '../../hooks/useFetch';
import Navbar from '../../components/layout/Navbar';
import Spinner from '../../components/ui/Spinner';
import styles from './ClientSubPage.module.css';

const ORDER_TYPES = [
  { value: 'MARKET',     label: 'Market' },
  { value: 'LIMIT',      label: 'Limit' },
  { value: 'STOP',       label: 'Stop' },
  { value: 'STOP_LIMIT', label: 'Stop Limit' },
];

export default function NewOrderPage() {
  const location = useLocation();
  const navigate  = useNavigate();
  const asset     = location.state; // { id, ticker, amount, price, ... }

  const user       = useAuthStore(s => s.user);
  const isEmployee = user?.identity_type === 'employee';
  const clientId   = user?.client_id ?? user?.id;

  const [qty,        setQty]        = useState('');
  const [qtyError,   setQtyError]   = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [orderType,  setOrderType]  = useState('MARKET');
  const [limitValue, setLimitValue] = useState('');
  const [stopValue,  setStopValue]  = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted]  = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error,      setError]      = useState('');

  const isMarket   = orderType === 'MARKET';
  const needsLimit = orderType === 'LIMIT'  || orderType === 'STOP_LIMIT';
  const needsStop  = orderType === 'STOP'   || orderType === 'STOP_LIMIT';

  // Zaposleni vide bankine račune, klijenti vide svoje
  const { data: accountsData, loading: accountsLoading } = useFetch(
    () => isEmployee ? accountsApi.getBankAccounts() : clientApi.getAccounts(clientId),
    [isEmployee, clientId]
  );
  const accounts = Array.isArray(accountsData) ? accountsData : accountsData?.data ?? [];

  const selectedAccount = accounts.find(a => (a.account_number ?? a.number) === accountNumber);
  const qtyNum  = Number(qty) || 0;
  const total   = ((asset?.price ?? 0) * qtyNum).toLocaleString('sr-RS', { minimumFractionDigits: 2 });
  const maxQty  = asset?.amount ?? null; // ne sme da proda više nego što ima

  function handleQtyChange(e) {
    const raw = e.target.value;
    setQty(raw);
    const n = Number(raw);
    if (raw === '' || isNaN(n)) {
      setQtyError('');
    } else if (n <= 0) {
      setQtyError('Količina mora biti pozitivan broj (veći od 0).');
    } else if (!Number.isInteger(n)) {
      setQtyError('Količina mora biti ceo broj.');
    } else if (maxQty !== null && n > maxQty) {
      setQtyError(`Ne možete prodati više od ${maxQty} hartija (vaše stanje).`);
    } else {
      setQtyError('');
    }
  }

  function validate() {
    setError('');
    if (!accountNumber) { setError('Izaberite račun.'); return false; }
    const n = Number(qty);
    if (!qty || isNaN(n) || n <= 0 || !Number.isInteger(n)) {
      setQtyError('Količina mora biti pozitivan ceo broj (veći od 0).');
      return false;
    }
    if (maxQty !== null && n > maxQty) {
      setQtyError(`Ne možete prodati više od ${maxQty} hartija.`);
      return false;
    }
    if (needsLimit && (!limitValue || Number(limitValue) <= 0)) {
      setError('Unesite validnu limit cenu.'); return false;
    }
    if (needsStop && (!stopValue || Number(stopValue) <= 0)) {
      setError('Unesite validnu stop cenu.'); return false;
    }
    return true;
  }

  function handleProceedToConfirm(e) {
    e.preventDefault();
    if (!validate()) return;
    setShowConfirm(true);
  }

  async function handleConfirmSubmit() {
    setSubmitting(true);
    setError('');
    try {
      await securitiesApi.sell({
        listingId:     asset.id,
        accountNumber: accountNumber,
        quantity:      Number(qty),
        orderType:     orderType,
        limitValue:    needsLimit ? Number(limitValue) : 0,
        stopValue:     needsStop  ? Number(stopValue)  : 0,
      });
      setSubmitted(true);
      setShowConfirm(false);
    } catch (err) {
      setError(err?.message || 'Greška pri prodaji. Pokušajte ponovo.');
      setShowConfirm(false);
    } finally {
      setSubmitting(false);
    }
  }

  // Ako nije stigao asset (direktna navigacija bez state-a)
  if (!asset) {
    return (
      <div className={styles.pageContainer}>
        <Navbar />
        <main className={styles.pageContent}>
          <p style={{ color: 'var(--tx-3)', padding: '2rem' }}>
            Nema podataka o hartiji. Idite na portfolio i kliknite SELL.
          </p>
          <button className={styles.submitBtn} onClick={() => navigate(-1)}>Nazad</button>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <Navbar />
      <main className={styles.pageContent} style={{ maxWidth: 520 }}>

        <div className={styles.pageHeader}>
          <p className={styles.pageEyebrow}>Portfolio</p>
          <h1 className={styles.pageTitle}>Prodaj hartiju</h1>
        </div>

        {submitted ? (
          /* ── Uspešno ── */
          <div className={styles.formCard} style={{ textAlign: 'center', padding: '2rem' }}>
            <div className={styles.successBanner}>
              {isEmployee
                ? '✓ Sell order je kreiran i čeka odobrenje.'
                : '✓ Sell order je kreiran i u obradi.'}
            </div>
            {isEmployee && (
              <p style={{ fontSize: 13, color: 'var(--tx-2)', marginTop: 12 }}>
                Hartija će biti skinuta sa portoflia tek nakon odobrenja.
              </p>
            )}
            <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'center' }}>
              <button className={styles.submitBtn} onClick={() => navigate(-1)}>
                Nazad na portfolio
              </button>
            </div>
          </div>

        ) : showConfirm ? (
          /* ── Potvrda ── */
          <div className={styles.formCard}>
            <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--tx-1)', marginTop: 0, marginBottom: 16 }}>
              Potvrda SELL ordera
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14, color: 'var(--tx-1)' }}>
              <Row label="Hartija"      value={`${asset.ticker}`} />
              <Row label="Broj hartija" value={qty} />
              <Row label="Tip ordera"   value={ORDER_TYPES.find(t => t.value === orderType)?.label} />
              {isMarket && (
                <Row label="Cena" value="Koristi se tržišna cena" italic />
              )}
              {needsLimit && (
                <Row label="Limit cena" value={`${Number(limitValue).toLocaleString('sr-RS', { minimumFractionDigits: 2 })}`} />
              )}
              {needsStop && (
                <Row label="Stop cena" value={`${Number(stopValue).toLocaleString('sr-RS', { minimumFractionDigits: 2 })}`} />
              )}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--tx-2)' }}>Aproximativna vrednost:</span>
                <strong style={{ fontSize: 16, color: 'var(--accent)' }}>{total}</strong>
              </div>
            </div>

            {error && <p style={{ fontSize: 13, color: 'var(--red)', margin: '12px 0 0' }}>{error}</p>}

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button
                type="button"
                className={styles.submitBtn}
                style={{ flex: 1, background: 'var(--bg)', color: 'var(--tx-2)', border: '1px solid var(--border)' }}
                onClick={() => setShowConfirm(false)}
                disabled={submitting}
              >
                Nazad
              </button>
              <button
                type="button"
                className={styles.submitBtn}
                style={{ flex: 2 }}
                onClick={handleConfirmSubmit}
                disabled={submitting}
              >
                {submitting ? 'Slanje...' : 'Potvrdi prodaju'}
              </button>
            </div>
          </div>

        ) : (
          /* ── Forma ── */
          <form className={styles.formCard} onSubmit={handleProceedToConfirm}>

            <div className={styles.formField}>
              <label>Hartija</label>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent)' }}>
                {asset.ticker}
                {maxQty !== null && (
                  <span style={{ fontWeight: 400, color: 'var(--tx-3)', marginLeft: 8 }}>
                    (imate {maxQty} komada)
                  </span>
                )}
              </div>
            </div>

            <div className={styles.formField}>
              <label>Cena po jedinici</label>
              <div style={{ fontSize: 14, fontWeight: 600 }}>
                ${asset.price?.toLocaleString('sr-RS', { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className={styles.formField}>
              <label>Tip ordera</label>
              <select
                className={styles.formInput}
                value={orderType}
                onChange={e => setOrderType(e.target.value)}
              >
                {ORDER_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              {isMarket && (
                <p style={{ fontSize: 12, color: 'var(--tx-3)', margin: '4px 0 0', fontStyle: 'italic' }}>
                  Koristi se trenutna tržišna (market) cena.
                </p>
              )}
            </div>

            {needsLimit && (
              <div className={styles.formField}>
                <label>Limit cena</label>
                <input
                  className={styles.formInput}
                  type="number" min="0.01" step="0.01"
                  placeholder="Unesite limit cenu..."
                  value={limitValue}
                  onChange={e => setLimitValue(e.target.value)}
                  required
                />
              </div>
            )}

            {needsStop && (
              <div className={styles.formField}>
                <label>Stop cena</label>
                <input
                  className={styles.formInput}
                  type="number" min="0.01" step="0.01"
                  placeholder="Unesite stop cenu..."
                  value={stopValue}
                  onChange={e => setStopValue(e.target.value)}
                  required
                />
              </div>
            )}

            <div className={styles.formField}>
              <label>Račun za uplatu prihoda</label>
              {accountsLoading ? (
                <Spinner />
              ) : (
                <select
                  className={styles.formInput}
                  value={accountNumber}
                  onChange={e => setAccountNumber(e.target.value)}
                  required
                >
                  <option value="">
                    {isEmployee ? 'Izaberite bankini račun...' : 'Izaberite račun...'}
                  </option>
                  {accounts.map(a => (
                    <option key={a.account_number ?? a.number} value={a.account_number ?? a.number}>
                      {a.name} — {a.account_number ?? a.number}
                      {a.balance != null
                        ? ` (${a.balance.toLocaleString('sr-RS', { minimumFractionDigits: 2 })})`
                        : ''}
                    </option>
                  ))}
                </select>
              )}
              {accounts.length === 0 && !accountsLoading && (
                <p style={{ fontSize: 12, color: 'var(--red)', margin: '4px 0 0' }}>
                  {isEmployee
                    ? 'Nisu pronađeni bankini interni računi.'
                    : 'Nemate aktivnih računa.'}
                </p>
              )}
            </div>

            <div className={styles.formField}>
              <label>Količina za prodaju</label>
              <input
                className={styles.formInput}
                type="number" step="1" min="1"
                max={maxQty ?? undefined}
                placeholder={maxQty ? `1 – ${maxQty}` : 'Unesite količinu...'}
                value={qty}
                onChange={handleQtyChange}
                required
              />
              {qtyError && (
                <p style={{ fontSize: 12, color: 'var(--red)', margin: '4px 0 0', fontWeight: 600 }}>
                  {qtyError}
                </p>
              )}
            </div>

            <div className={styles.formField}>
              <label>Aproximativna vrednost prodaje</label>
              <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--tx-1)' }}>{total}</div>
            </div>

            {isEmployee && (
              <p style={{ fontSize: 12, color: 'var(--tx-3)', margin: 0 }}>
                Sell order ide na odobrenje. Hartija se skida tek nakon odobrenja.
              </p>
            )}

            {error && <p style={{ fontSize: 13, color: 'var(--red)', margin: 0 }}>{error}</p>}

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                className={styles.submitBtn}
                style={{ flex: 1, background: 'var(--bg)', color: 'var(--tx-2)', border: '1px solid var(--border)' }}
                onClick={() => navigate(-1)}
              >
                Otkaži
              </button>
              <button
                type="submit"
                className={styles.submitBtn}
                style={{ flex: 2 }}
                disabled={submitting || !!qtyError}
              >
                {submitting ? 'Slanje...' : 'Nastavi'}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}

// Helper komponenta za red u confirmation dijalogu
function Row({ label, value, italic }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <span style={{ color: 'var(--tx-2)' }}>{label}:</span>
      <strong style={italic ? { fontStyle: 'italic', color: 'var(--tx-2)', fontWeight: 400 } : {}}>
        {value}
      </strong>
    </div>
  );
}