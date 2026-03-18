import { useState, useEffect } from 'react';
import { loansApi } from '../api/endpoints/loans';
import LoanList           from '../features/loans/LoanList';
import LoanDetails        from '../features/loans/LoanDetails';
import LoanRequestsTable  from '../features/loans/LoanRequestsTable';
import Spinner from '../components/ui/Spinner';
import Alert   from '../components/ui/Alert';
import styles from './Loans.module.css';

export default function Loans() {
  const [tab, setTab] = useState('active'); // 'active' | 'requests'

  // Active loans state
  const [loans, setLoans]               = useState([]);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [loadingLoans, setLoadingLoans] = useState(true);
  const [errorLoans, setErrorLoans]     = useState(null);

  // Loan requests state
  const [requests, setRequests]         = useState([]);
  const [loadingReqs, setLoadingReqs]   = useState(true);
  const [errorReqs, setErrorReqs]       = useState(null);
  const [actionId, setActionId]         = useState(null);

  useEffect(() => {
    loansApi.getAll()
      .then(res => {
        const data = res.data ?? [];
        setLoans(data);
        if (data.length > 0) setSelectedLoan(data[0]);
      })
      .catch(() => setErrorLoans('Nije moguće učitati kredite.'))
      .finally(() => setLoadingLoans(false));
  }, []);

  useEffect(() => {
    loansApi.getRequests()
      .then(res => setRequests(res.data ?? []))
      .catch(() => setErrorReqs('Nije moguće učitati kreditne zahteve.'))
      .finally(() => setLoadingReqs(false));
  }, []);

  async function handleApprove(id) {
    setActionId(id);
    try {
      await loansApi.approve(id);
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'ODOBRENA' } : r));
    } finally {
      setActionId(null);
    }
  }

  async function handleReject(id) {
    setActionId(id);
    try {
      await loansApi.reject(id);
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'ODBIJENA' } : r));
    } finally {
      setActionId(null);
    }
  }

  return (
    <div className={styles.loansPage}>
      <header className={styles.pageHeader}>
        <div className={styles.headerTitle}>
          <h1>Krediti</h1>
          <p>Pregled kredita i kreditnih zahteva</p>
        </div>
      </header>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '2px solid var(--border)' }}>
        {[
          { key: 'active',   label: 'Aktivni krediti' },
          { key: 'requests', label: 'Kreditni zahtevi' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '0.6rem 1.4rem',
              background: 'none',
              border: 'none',
              borderBottom: tab === t.key ? '2px solid var(--blue)' : '2px solid transparent',
              color: tab === t.key ? 'var(--blue)' : 'var(--tx-2)',
              fontWeight: tab === t.key ? 700 : 400,
              cursor: 'pointer',
              marginBottom: '-2px',
              fontSize: '0.95rem',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className={styles.contentArea}>
        {tab === 'active' && (
          loadingLoans ? (
            <div className={styles.center}><Spinner /></div>
          ) : errorLoans ? (
            <div className={styles.center}><Alert type="error" message={errorLoans} /></div>
          ) : (
            <div className={styles.layout}>
              <aside className={styles.masterSide}>
                <LoanList loans={loans} selectedId={selectedLoan?.id} onSelectLoan={setSelectedLoan} />
              </aside>
              <main className={styles.detailSide}>
                {selectedLoan ? (
                  <LoanDetails loan={selectedLoan} />
                ) : (
                  <div className={styles.emptyState}><p>Izaberite kredit sa leve strane.</p></div>
                )}
              </main>
            </div>
          )
        )}

        {tab === 'requests' && (
          loadingReqs ? (
            <div className={styles.center}><Spinner /></div>
          ) : errorReqs ? (
            <div className={styles.center}><Alert type="error" message={errorReqs} /></div>
          ) : (
            <LoanRequestsTable
              requests={requests}
              onApprove={handleApprove}
              onReject={handleReject}
              actionId={actionId}
            />
          )
        )}
      </div>
    </div>
  );
}
