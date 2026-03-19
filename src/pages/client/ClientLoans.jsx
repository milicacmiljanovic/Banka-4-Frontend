import { useRef, useLayoutEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { clientApi } from '../../api/endpoints/client';
import { loansApi } from '../../api/endpoints/loans';
import { useFetch } from '../../hooks/useFetch';
import LoanList    from '../../features/loans/LoanList';
import LoanDetails from '../../features/loans/LoanDetails';
import Spinner from '../../components/ui/Spinner';
import Alert   from '../../components/ui/Alert';
import styles from './ClientSubPage.module.css';

const LOAN_TYPES = [
  { value: 'CASH',     label: 'Keš kredit',      maxMonths: 84  },
  { value: 'AUTO',     label: 'Auto kredit',      maxMonths: 84  },
  { value: 'MORTGAGE', label: 'Stambeni kredit',  maxMonths: 360 },
];

function formatAmount(n) {
  return new Intl.NumberFormat('sr-RS', { minimumFractionDigits: 2 }).format(n) + ' RSD';
}

export default function ClientLoans() {
  const pageRef = useRef(null);
  const navigate = useNavigate();

  const [selectedLoan, setSelectedLoan] = useState(null);

  const [showForm, setShowForm]       = useState(false);
  const [submitted, setSubmitted]     = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [formError, setFormError]     = useState('');

  const [loanType, setLoanType]                   = useState('CASH');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [amount, setAmount]                       = useState('');
  const [period, setPeriod]                       = useState('');

  const { data: loansData, loading, error } = useFetch(() => loansApi.getAll(), []);
  const loans = loansData?.data ?? [];

  const { data: accountsData } = useFetch(() => clientApi.getAccounts(), []);
  const accounts = accountsData?.data ?? [];

  // Auto-select first loan
  useLayoutEffect(() => {
    if (loans.length > 0 && !selectedLoan) {
      setSelectedLoan(loans[0]);
    }
  }, [loans]);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.sub-card', { opacity: 0, y: 20, duration: 0.45, ease: 'power2.out', stagger: 0.07 });
    }, pageRef);
    return () => ctx.revert();
  }, []);

  const selectedLoanType = LOAN_TYPES.find(t => t.value === loanType);
  const maxMonths = selectedLoanType?.maxMonths ?? 84;
  const selectedAccount = accounts.find(a => String(a.id) === String(selectedAccountId));

  function openForm() {
    setLoanType('CASH');
    setSelectedAccountId(accounts[0]?.id ? String(accounts[0].id) : '');
    setAmount('');
    setPeriod('');
    setFormError('');
    setSubmitted(false);
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');

    if (!selectedAccount) { setFormError('Izaberite račun.'); return; }
    if (!amount || Number(amount) <= 0) { setFormError('Unesite ispravan iznos.'); return; }

    const numPeriod = Number(period);
    if (!period || numPeriod < 1) { setFormError('Unesite broj rata.'); return; }
    if (numPeriod > maxMonths) {
      setFormError(`Maksimalan broj rata za ${selectedLoanType?.label} je ${maxMonths}.`);
      return;
    }

    setSubmitting(true);
    try {
      await loansApi.createRequest({
        loan_type:        loanType,
        account_id:       selectedAccount.id,
        currency:         selectedAccount.currency,
        amount:           Number(amount),
        repayment_period: numPeriod,
      });
      setSubmitted(true);
    } catch (err) {
      setFormError(err?.message || 'Greška pri podnošenju zahteva.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div ref={pageRef} className={styles.page}>
      <div className={styles.topBar}>
        <button className={styles.back} onClick={() => navigate('/dashboard')}>← Nazad</button>
        <h1 className={styles.title}>Krediti</h1>
        <button className={styles.newBtn} onClick={openForm}>+ Novi zahtev</button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><Spinner /></div>
      ) : error ? (
        <Alert type="error" message="Nije moguće učitati kredite." />
      ) : loans.length === 0 ? (
        <div className={styles.emptyState}>
          <p>Nemate aktivnih kredita.</p>
          <button className={styles.newBtn} onClick={openForm}>Podnesi zahtev</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.5rem', alignItems: 'start' }}>
          <div className="sub-card" style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border)' }}>
            <LoanList loans={loans} selectedId={selectedLoan?.id} onSelectLoan={setSelectedLoan} />
          </div>
          <div className="sub-card">
            {selectedLoan
              ? <LoanDetails loan={selectedLoan} />
              : <p style={{ color: 'var(--tx-3)', padding: '2rem' }}>Izaberite kredit.</p>
            }
          </div>
        </div>
      )}

      {showForm && (
        <div className={styles.modalOverlay} onClick={() => setShowForm(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Zahtev za kredit</h3>
              <button className={styles.modalClose} onClick={() => setShowForm(false)}>✕</button>
            </div>
            {submitted ? (
              <div className={styles.successBanner} style={{ margin: '2rem' }}>
                ✓ Zahtev je uspešno podnet! Kontaktiraćemo vas u roku od 2 radna dana.
              </div>
            ) : (
              <form className={styles.formCard} style={{ boxShadow: 'none', border: 'none' }} onSubmit={handleSubmit}>
                <div className={styles.formField}>
                  <label>Vrsta kredita</label>
                  <select className={styles.formInput} value={loanType} onChange={e => { setLoanType(e.target.value); setPeriod(''); setFormError(''); }}>
                    {LOAN_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>

                <div className={styles.formField}>
                  <label>Račun za kredit</label>
                  <select className={styles.formInput} value={selectedAccountId} onChange={e => { setSelectedAccountId(e.target.value); setFormError(''); }}>
                    <option value="">Izaberite račun...</option>
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.name} — {formatAmount(a.balance)} ({a.currency})
                      </option>
                    ))}
                  </select>
                  {selectedAccount && (
                    <span style={{ fontSize: 12, color: 'var(--tx-3)', marginTop: 3 }}>
                      Valuta kredita: <strong>{selectedAccount.currency}</strong>
                    </span>
                  )}
                </div>

                <div className={styles.formField}>
                  <label>Željeni iznos {selectedAccount ? `(${selectedAccount.currency})` : ''}</label>
                  <input type="number" min="1" step="any" placeholder="500000" className={styles.formInput} value={amount} onChange={e => setAmount(e.target.value)} required />
                </div>

                <div className={styles.formField}>
                  <label>Broj rata (maks. {maxMonths})</label>
                  <input
                    type="number" min="1" max={maxMonths} placeholder={`1 – ${maxMonths}`}
                    className={styles.formInput} value={period}
                    onChange={e => { const v = e.target.value; setPeriod(v); if (Number(v) > maxMonths) setFormError(`Maksimalan broj rata za ${selectedLoanType?.label} je ${maxMonths}.`); else setFormError(''); }}
                    required
                  />
                  <span style={{ fontSize: 12, color: 'var(--tx-3)' }}>
                    {selectedLoanType?.label}: max {maxMonths} meseci
                  </span>
                </div>

                {formError && <p style={{ fontSize: 13, color: 'var(--red)', margin: 0 }}>{formError}</p>}

                <button type="submit" className={styles.submitBtn} disabled={submitting || !!formError}>
                  {submitting ? 'Slanje...' : 'Podnesi zahtev'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
