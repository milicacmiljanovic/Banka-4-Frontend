import { useState, useEffect } from 'react';
import { useAuthStore }         from '../../store/authStore';
import { clientApi }            from '../../api/endpoints/client';
import styles                   from './InvestModal.module.css';

function formatRsd(value) {
  if (value == null) return '—';
  return Number(value).toLocaleString('sr-RS', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Props:
 *   fund     – fund object
 *   onClose  – () => void
 *   onConfirm – (fundId, payload) => Promise<void>
 */
export default function InvestModal({ fund, onClose, onConfirm }) {
  const user       = useAuthStore(s => s.user);
  const [accounts,    setAccounts]    = useState([]);
  const [accountId,   setAccountId]   = useState('');
  const [amount,      setAmount]      = useState('');
  const [amountError, setAmountError] = useState('');
  const [loading,     setLoading]     = useState(false);
  const [loadingAcc,  setLoadingAcc]  = useState(true);
  const [submitError, setSubmitError] = useState(null);

  const minContrib = fund?.minimumInvestment ?? fund?.minContribution ?? 0;
  const fundId     = fund?.id ?? fund?.fundId;
  const fundName   = fund?.name ?? fund?.fundName ?? 'Fond';

  useEffect(() => {
    const clientId = user?.client_id ?? user?.id;
    setLoadingAcc(true);
    clientApi.getAccounts(clientId)
      .then(res => {
        const raw = Array.isArray(res) ? res : (res?.data ?? res?.accounts ?? []);
        const rsd = raw.filter(a =>
          (a.currency ?? '').toUpperCase() === 'RSD' &&
          (a.status ?? a.account_status ?? '').toLowerCase() !== 'closed'
        );
        setAccounts(rsd);
        if (rsd.length > 0) {
          setAccountId(rsd[0].account_number ?? rsd[0].id ?? '');
        }
      })
      .catch(() => setAccounts([]))
      .finally(() => setLoadingAcc(false));
  }, [user?.id]);

  function validateAmount(val) {
    const num = parseFloat(val);
    if (!val || isNaN(num) || num <= 0) {
      return 'Unesite validan iznos.';
    }
    if (num < minContrib) {
      return `Minimalni ulog je ${formatRsd(minContrib)} RSD.`;
    }
    return '';
  }

  function handleAmountChange(e) {
    const val = e.target.value;
    setAmount(val);
    if (amountError) setAmountError(validateAmount(val));
  }

  async function handleSubmit() {
    const err = validateAmount(amount);
    if (err) { setAmountError(err); return; }
    if (!accountId) { setAmountError('Izaberite račun.'); return; }

    setLoading(true);
    setSubmitError(null);
    try {
      await onConfirm(fundId, { amount: parseFloat(amount), account_number: accountId });
    } catch (e) {
      setSubmitError(e?.response?.data?.message ?? e?.message ?? 'Greška pri investiranju.');
    } finally {
      setLoading(false);
    }
  }

  function handleBackdrop(e) {
    if (e.target === e.currentTarget && !loading) onClose();
  }

  return (
    <div className={styles.backdrop} onClick={handleBackdrop} role="dialog" aria-modal="true">
      <div className={styles.modal}>

        <div className={styles.iconWrap}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
            <polyline points="17 6 23 6 23 12"/>
          </svg>
        </div>

        <h2 className={styles.title}>Investiraj u fond</h2>

        <div className={styles.fundChip}>
          <span className={styles.fundName}>{fundName}</span>
          <span className={styles.fundMin}>Min. ulog: {formatRsd(minContrib)} RSD</span>
        </div>

        {submitError && (
          <div className={styles.errorBanner}>{submitError}</div>
        )}

        <div className={styles.field}>
          <label className={styles.label}>Iznos investicije (RSD)</label>
          <input
            className={`${styles.input} ${amountError ? styles.inputError : ''}`}
            type="number"
            min={minContrib}
            step="0.01"
            placeholder={`Min. ${formatRsd(minContrib)}`}
            value={amount}
            onChange={handleAmountChange}
            onBlur={() => setAmountError(validateAmount(amount))}
            disabled={loading}
          />
          {amountError && <span className={styles.errorMsg}>{amountError}</span>}
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Račun za plaćanje (RSD)</label>
          {loadingAcc ? (
            <div className={styles.loadingText}>Učitavanje računa...</div>
          ) : accounts.length === 0 ? (
            <div className={styles.errorMsg}>Nemate potreban iznos na računu.</div>
          ) : (
            <select
              className={styles.select}
              value={accountId}
              onChange={e => setAccountId(e.target.value)}
              disabled={loading}
            >
              {accounts.map(acc => {
                const num = acc.account_number ?? acc.accountNumber ?? acc.id;
                const bal = acc.balance ?? acc.available_balance ?? acc.availableBalance ?? 0;
                return (
                  <option key={num} value={num}>
                    {acc.name ? `${acc.name} — ` : ''}{num} — {formatRsd(bal)} RSD
                  </option>
                );
              })}
            </select>
          )}
        </div>

        <div className={styles.actions}>
          <button
            className={styles.btnCancel}
            onClick={onClose}
            disabled={loading}
          >
            Otkaži
          </button>
          <button
            className={styles.btnConfirm}
            onClick={handleSubmit}
            disabled={loading || loadingAcc || accounts.length === 0}
          >
            {loading ? (
              <>
                <span className={styles.spinner} />
                Procesiranje...
              </>
            ) : (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Potvrdi investiciju
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
