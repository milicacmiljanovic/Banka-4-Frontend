import { useState, useEffect } from 'react';
import { clientApi } from '../../api/endpoints/client';
import { accountsApi } from '../../api/endpoints/accounts';
import { securitiesApi } from '../../api/endpoints/securities';
import modalStyles from '../../pages/client/ClientSubPage.module.css';

const ORDER_TYPES = [
  { value: 'MARKET',     label: 'Market' },
  { value: 'LIMIT',      label: 'Limit' },
  { value: 'STOP',       label: 'Stop' },
  { value: 'STOP_LIMIT', label: 'Stop Limit' },
];

export default function SellOrderModal({ asset, clientId, isEmployee, onClose, onSuccess }) {
  const [qty, setQty]                     = useState('');
  const [qtyError, setQtyError]           = useState('');
  const [orderType, setOrderType]         = useState('MARKET');
  const [limitValue, setLimitValue]       = useState('');
  const [stopValue, setStopValue]         = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [margin, setMargin]               = useState(false);
  const [allOrNone, setAllOrNone]         = useState(false);
  const [accounts, setAccounts]           = useState([]);
  const [showConfirm, setShowConfirm]     = useState(false);
  const [submitting, setSubmitting]       = useState(false);
  const [submitted, setSubmitted]         = useState(false);
  const [error, setError]                 = useState('');

  const needsLimit = orderType === 'LIMIT'      || orderType === 'STOP_LIMIT';
  const needsStop  = orderType === 'STOP'       || orderType === 'STOP_LIMIT';

  useEffect(() => {
    const fetch = isEmployee
      ? accountsApi.getBankAccounts()
      : clientApi.getAccounts(clientId);

    fetch
      .then(res => {
        const list = Array.isArray(res) ? res : res?.data ?? [];
        setAccounts(list);
      })
      .catch(() => {});
  }, [clientId, isEmployee]);

  function handleQtyChange(e) {
    const raw = e.target.value;
    setQty(raw);
    const n = Number(raw);
    if (raw === '' || isNaN(n)) { setQtyError(''); return; }
    if (n <= 0 || !Number.isInteger(n)) {
      setQtyError('Količina mora biti pozitivan ceo broj.');
    } else if (n > asset.amount) {
      setQtyError(`Nemate dovoljno. Posedujete: ${asset.amount}.`);
    } else {
      setQtyError('');
    }
  }

  function validate() {
    setError('');
    if (!accountNumber) { setError('Izaberite račun.'); return false; }
    const n = Number(qty);
    if (!qty || isNaN(n) || n <= 0 || !Number.isInteger(n)) {
      setQtyError('Količina mora biti pozitivan ceo broj.'); return false;
    }
    if (n > asset.amount) {
      setQtyError(`Nemate dovoljno. Posedujete: ${asset.amount}.`); return false;
    }
    if (needsLimit && (!limitValue || Number(limitValue) <= 0)) {
      setError('Unesite validnu limit cenu.'); return false;
    }
    if (needsStop && (!stopValue || Number(stopValue) <= 0)) {
      setError('Unesite validnu stop cenu.'); return false;
    }
    return true;
  }

  function handleProceed(e) {
    e.preventDefault();
    if (validate()) setShowConfirm(true);
  }

  async function handleConfirm() {
    setSubmitting(true);
    setError('');
    try {
      await securitiesApi.sell({
        listingId:     asset.listing_id ?? asset.assetId ?? asset.id,
        accountNumber,
        quantity:      Number(qty),
        orderType,
        limitValue:    needsLimit ? Number(limitValue) : 0,
        stopValue:     needsStop  ? Number(stopValue)  : 0,
        margin,
        allOrNone,
      });
      setSubmitted(true);
      setShowConfirm(false);
      onSuccess?.();
    } catch (err) {
      setError(err?.message || 'Greška pri prodaji. Pokušajte ponovo.');
      setShowConfirm(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={modalStyles.modalOverlay} onClick={onClose}>
      <div className={modalStyles.modal} onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
        <div className={modalStyles.modalHeader}>
          <h3>Prodaj — {asset.ticker}</h3>
          <button className={modalStyles.modalClose} onClick={onClose}>✕</button>
        </div>

        {submitted ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <div className={modalStyles.successBanner}>
              {isEmployee ? '✓ Sell order je kreiran i čeka odobrenje.' : '✓ Sell order je kreiran i u obradi.'}
            </div>
            <p style={{ fontSize: 13, color: 'var(--tx-2)', marginTop: 12 }}>
              {isEmployee
                ? 'Akcije će biti sklonjene sa portfolija tek nakon odobrenja.'
                : 'Akcije će biti sklonjene sa portfolija nakon izvršenja ordera.'}
            </p>
          </div>
        ) : showConfirm ? (
          <div style={{ padding: '1.5rem' }}>
            <h4 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 16px' }}>Potvrda prodaje</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--tx-2)' }}>Hartija:</span>
                <strong>{asset.ticker}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--tx-2)' }}>Količina:</span>
                <strong>{qty}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--tx-2)' }}>Tip ordera:</span>
                <strong>{ORDER_TYPES.find(t => t.value === orderType)?.label}</strong>
              </div>
              {needsLimit && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--tx-2)' }}>Limit cena:</span>
                  <strong>{Number(limitValue).toLocaleString('sr-RS', { minimumFractionDigits: 2 })}</strong>
                </div>
              )}
              {needsStop && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--tx-2)' }}>Stop cena:</span>
                  <strong>{Number(stopValue).toLocaleString('sr-RS', { minimumFractionDigits: 2 })}</strong>
                </div>
              )}
              {allOrNone && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--tx-2)' }}>All or None:</span><strong>Da</strong>
                </div>
              )}
              {margin && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--tx-2)' }}>Margin:</span><strong>Da</strong>
                </div>
              )}
            </div>
            {error && <p style={{ fontSize: 13, color: 'var(--red)', margin: '12px 0 0' }}>{error}</p>}
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button type="button" className={modalStyles.submitBtn}
                style={{ flex: 1, background: 'var(--bg)', color: 'var(--tx-2)', border: '1px solid var(--border)' }}
                onClick={() => setShowConfirm(false)} disabled={submitting}>
                Nazad
              </button>
              <button type="button" className={modalStyles.submitBtn}
                style={{ flex: 2, background: '#ef4444' }}
                onClick={handleConfirm} disabled={submitting}>
                {submitting ? 'Slanje...' : 'Potvrdi prodaju'}
              </button>
            </div>
          </div>
        ) : (
          <form className={modalStyles.formCard} style={{ boxShadow: 'none', border: 'none' }} onSubmit={handleProceed}>
            <div className={modalStyles.formField}>
              <label>Hartija</label>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent)' }}>
                {asset.ticker} — posedujete {asset.amount} kom
              </div>
            </div>

            <div className={modalStyles.formField}>
              <label>Tip ordera</label>
              <select className={modalStyles.formInput} value={orderType} onChange={e => setOrderType(e.target.value)}>
                {ORDER_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>

            {needsLimit && (
              <div className={modalStyles.formField}>
                <label>Limit cena</label>
                <input className={modalStyles.formInput} type="number" min="0.01" step="0.01"
                  placeholder="Unesite limit cenu..." value={limitValue}
                  onChange={e => setLimitValue(e.target.value)} required />
              </div>
            )}

            {needsStop && (
              <div className={modalStyles.formField}>
                <label>Stop cena</label>
                <input className={modalStyles.formInput} type="number" min="0.01" step="0.01"
                  placeholder="Unesite stop cenu..." value={stopValue}
                  onChange={e => setStopValue(e.target.value)} required />
              </div>
            )}

            <div className={modalStyles.formField}>
              <label>Račun</label>
              <select className={modalStyles.formInput} value={accountNumber}
                onChange={e => setAccountNumber(e.target.value)} required>
                <option value="">Izaberite račun...</option>
                {accounts.map((a, i) => {
                  const num  = a.AccountNumber ?? a.account_number ?? a.accountNumber ?? a.number ?? '';
                  const name = a.Name ?? a.name ?? a.ownerName ?? a.owner_name ?? a.owner ?? '';
                  const bal  = a.Balance ?? a.AvailableBalance ?? a.balance ?? a.available_balance ?? a.availableBalance;
                  const cur  = a.Currency?.Code ?? a.currency ?? a.Currency ?? '';
                  const label = name || num || `Račun ${i + 1}`;
                  return (
                    <option key={num || i} value={num}>
                      {label}{name && num ? ` — ${num}` : ''}
                      {bal != null ? ` (${Number(bal).toLocaleString('sr-RS', { minimumFractionDigits: 2 })}${cur ? ` ${cur}` : ''})` : ''}
                    </option>
                  );
                })}
              </select>
              {accounts.length === 0 && (
                <p style={{ fontSize: 12, color: 'var(--red)', margin: '4px 0 0' }}>
                  {isEmployee ? 'Nisu pronađeni bankini interni računi.' : 'Nemate aktivnih računa.'}
                </p>
              )}
            </div>

            <div className={modalStyles.formField}>
              <label>Količina</label>
              <input className={modalStyles.formInput} type="number" step="1" min="1" max={asset.amount}
                placeholder={`Max: ${asset.amount}`} value={qty} onChange={handleQtyChange} required />
              {qtyError && <p style={{ fontSize: 12, color: 'var(--red)', margin: '4px 0 0', fontWeight: 600 }}>{qtyError}</p>}
            </div>

            <div style={{ display: 'flex', gap: 20 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                <input type="checkbox" checked={margin} onChange={e => setMargin(e.target.checked)} />
                Margin
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                <input type="checkbox" checked={allOrNone} onChange={e => setAllOrNone(e.target.checked)} />
                All or None
              </label>
            </div>

            {error && <p style={{ fontSize: 13, color: 'var(--red)', margin: 0 }}>{error}</p>}

            <button type="submit" className={modalStyles.submitBtn}
              style={{ background: '#ef4444' }} disabled={!!qtyError}>
              Nastavi
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
