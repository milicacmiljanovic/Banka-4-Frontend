// src/pages/client/FundDetailsPage/FundDetailsPage.jsx
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import gsap from 'gsap';

import { investmentFundsApi } from '../../api/endpoints/investmentFunds';
import { accountsApi } from '../../api/endpoints/accounts';
import { usePermissions } from '../../hooks/usePermissions';
import { useAuthStore } from '../../store/authStore';

import ClientHeader from '../../components/layout/ClientHeader';
import Navbar from '../../components/layout/Navbar';
import Alert from '../../components/ui/Alert';

import styles from './FundDetailsPage.module.css';
import { getErrorMessage } from '../../utils/apiError';

export default function FundDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const pageRef = useRef(null);

  const user = useAuthStore((s) => s.user);
  const perms = usePermissions();

  const isSupervisor =
    (perms?.isSupervisor ?? false) ||
    Boolean(perms?.can?.('admin.all')) ||
    Boolean(perms?.can?.('investment.fund.manage'));

  const isClient = user?.identity_type === 'client';

  const [fund, setFund] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [feedback, setFeedback] = useState(null);

    // Na vrh komponente, gde su ostali state-ovi
  const [modalType, setModalType] = useState('invest');

  // invest modal
  const [investOpen, setInvestOpen] = useState(false);
  const [investAmount, setInvestAmount] = useState('');
  const [investAccountNumber, setInvestAccountNumber] = useState('');
  const [investSubmitting, setInvestSubmitting] = useState(false);

  const [accounts, setAccounts] = useState([]);
  const [accountsLoading, setAccountsLoading] = useState(false);

  const handleSellHoldings = async (asset) => {
  const assetId = asset.id ?? asset.asset_id ?? asset.assetId;
  

  if (!assetId) {
    setFeedback({ type: 'greska', text: 'Interna greška: ID hartije nije pronađen.' });
    return;
  }

  if (!window.confirm(`Da li ste sigurni da želite da prodate hartiju ${asset.ticker}?`)) return;
  
  try {
    setLoading(true);
    // Payload zavisi od bekenda, obično traže količinu (volume)
    await investmentFundsApi.sellFundAsset(fundId, assetId, {
      volume: asset.volume,
      ticker: asset.ticker
    });

    setFeedback({ type: 'uspeh', text: `Uspešno prodata hartija ${asset.ticker}.` });
    
    // Osvežavanje podataka nakon prodaje
    const updatedFund = await investmentFundsApi.getFundDetails(id);
    setFund(updatedFund);
  } catch (err) {
    setFeedback({ type: 'greska', text: getErrorMessage(err, 'Greška pri prodaji hartije.') });
  } finally {
    setLoading(false);
  }
};

// Za klijenta: Povlačenje sopstvenih sredstava
const handleClientWithdraw = async (e) => {
  if (e) e.preventDefault(); // Sprečava reload ako je unutar forme

  const amount = Number(investAmount);

  // Provera kao i za investiranje
  if (!investAmount || isNaN(amount) || amount <= 0) {
    setFeedback({ type: 'greska', text: 'Unesite validan iznos.' });
    return;
  }

  if (!investAccountNumber) {
    setFeedback({ type: 'greska', text: 'Izaberite račun.' });
    return;
  }

  try {
    setInvestSubmitting(true);
    setFeedback(null);

    // Šaljemo payload koji pokriva i 'accountNumber' i 'AccountNumber'
    const payload = {
      amount: amount,
      accountNumber: String(investAccountNumber),
      AccountNumber: String(investAccountNumber) // Rešava tvoj "required" error
    };

    await investmentFundsApi.withdrawFromFund(fundId, payload);
    
    setFeedback({ type: 'uspeh', text: 'Uspešno poslat zahtev za povlačenje.' });
    setInvestOpen(false); // Zatvori modal
    setInvestAmount('');  // Resetuj polje
  } catch (err) {
    setFeedback({ type: 'greska', text: getErrorMessage(err, 'Greška pri povlačenju.') });
  } finally {
    setInvestSubmitting(false);
  }
};

// Za supervizora: Direktna uplata/povlačenje na račun fonda
const handleSupervisorFundAction = async (type) => {
  const action = type === 'deposit' ? 'uplatu' : 'povlačenje';
  const apiCall = type === 'deposit' 
    ? investmentFundsApi.depositToFund 
    : investmentFundsApi.withdrawFromFund;

  try {
    setInvestSubmitting(true);
    await apiCall(fundId, { amount: investAmount });
    setFeedback({ type: 'uspeh', text: `Uspešno ste izvršili ${action}.` });
  } catch (err) {
    setFeedback({ type: 'greska', text: getErrorMessage(err, `Greška pri operaciji: ${action}.`) });
  } finally {
    setInvestSubmitting(false);
  }
};

  const HeaderComponent = isClient ? ClientHeader : Navbar;
  const headerProps = isClient ? { activeNav: 'funds' } : {};

  // Load fund details (Swagger: GET /api/investment-funds/{fundId})
  useEffect(() => {
    let alive = true;

    async function loadFund() {
      try {
        setLoading(true);
        setError('');

        const payload = await investmentFundsApi.getFundDetails(id);
        if (!alive) return;

        setFund(payload); // interceptor should return object directly
      } catch (e) {
        console.error(e);
        if (!alive) return;
        setError(getErrorMessage(e, 'Greška pri učitavanju fonda.'));
      } finally {
        if (alive) setLoading(false);
      }
    }

    if (id) loadFund();
    return () => {
      alive = false;
    };
  }, [id]);

  // Load client accounts for invest
  useEffect(() => {
    if (!isClient) return;

    let alive = true;
    const clientId = user?.client_id ?? user?.identity_id ?? user?.id;
    if (!clientId) return;

    const loadAccounts = async () => {
      try {
        setAccountsLoading(true);
        const payload = await accountsApi.getClientAccounts(clientId);

        const list =
          Array.isArray(payload) ? payload :
          Array.isArray(payload?.data) ? payload.data :
          Array.isArray(payload?.content) ? payload.content :
          [];

        if (!alive) return;

        setAccounts(list);
        const first = list?.[0];
        if (first?.account_number) setInvestAccountNumber(String(first.account_number));
      } catch (e) {
        console.error(e);
        if (!alive) return;
        setAccounts([]);
      } finally {
        if (alive) setAccountsLoading(false);
      }
    };

    loadAccounts();
    return () => { alive = false; };
  }, [isClient, user]);

  useLayoutEffect(() => {
    if (loading || !fund) return;
    const ctx = gsap.context(() => {
      const nodes = pageRef.current?.querySelectorAll('.page-anim') ?? [];
      if (!nodes.length) return;
      gsap.from(nodes, { opacity: 0, y: 20, duration: 0.45, stagger: 0.08, ease: 'power2.out' });
    }, pageRef);
    return () => ctx.revert();
  }, [loading, fund]);

  const holdings = useMemo(() => Array.isArray(fund?.holdings) ? fund.holdings : [], [fund]);
  const performance = useMemo(() => Array.isArray(fund?.performance_history) ? fund.performance_history : [], [fund]);

  const fundId = fund?.id ?? id;

  async function handleInvestSubmit(e) {
  e.preventDefault();
  const amount = Number(investAmount);

  if (!investAccountNumber) {
    setFeedback({ type: 'greska', text: 'Izaberite račun.' });
    return;
  }

  try {
    setInvestSubmitting(true);
    setFeedback(null);

    // Payload koji rešava "AccountNumber" error
    const payload = {
      amount,
      accountNumber: String(investAccountNumber),
      AccountNumber: String(investAccountNumber), // Obavezno za backend
      account_number: String(investAccountNumber),
    };

    if (modalType === 'invest') {
      await investmentFundsApi.investInFund(fundId, payload);
      setFeedback({ type: 'uspeh', text: 'Investicija uspešna!' });
    } else {
      // OVO JE DEO KOJI TI JE FALIO:
      await investmentFundsApi.withdrawFromFund(fundId, payload);
      setFeedback({ type: 'uspeh', text: 'Zahtev za povlačenje poslat!' });
    }

    setInvestOpen(false);
    setInvestAmount('');
  } catch (err) {
    setFeedback({ type: 'greska', text: getErrorMessage(err, 'Akcija nije uspela.') });
  } finally {
    setInvestSubmitting(false);
  }
}

  if (loading) {
    return (
      <div className={styles.page}>
        <HeaderComponent {...headerProps} />
        <div className={styles.loadingState}>Učitavanje...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <HeaderComponent {...headerProps} />
        <main className={styles.content}>
          <Alert tip="greska" poruka={error} />
        </main>
      </div>
    );
  }

  if (!fund) return null;

  return (
    <div ref={pageRef} className={styles.page}>
      <HeaderComponent {...headerProps} />

      <main className={styles.content}>
        <div className={`page-anim ${styles.breadcrumb}`}>
          <button
            className={styles.breadcrumbLink}
            onClick={() => navigate(isClient ? '/client/investment-funds' : '/profit-bank')}
          >
            Investicioni fondovi
          </button>
          <span className={styles.breadcrumbSep}>›</span>
          <span>{fund.name ?? 'Fond'}</span>
        </div>

        <div className={`page-anim ${styles.pageHeader}`}>
          <div>
            <h1 className={styles.pageTitle}>{fund.name ?? 'Fond'}</h1>
            {(fund.description ?? '') && <p className={styles.pageDesc}>{fund.description}</p>}
          </div>
          {isSupervisor && <span className={styles.supervisorBadge}>Supervisor</span>}
        </div>

        {feedback && (
          <div className="page-anim" style={{ marginBottom: 20 }}>
            <Alert tip={feedback.type} poruka={feedback.text} />
          </div>
        )}

        <section className={`page-anim ${styles.statsGrid}`}>
          <InfoCard label="Menadžer" value={fund.manager ?? '—'} />
          <InfoCard label="Minimalni ulog" value={formatRSD(fund.min_investment)} />
          <InfoCard label="Likvidnost" value={formatRSD(fund.account_balance)} />
          <InfoCard label="Vrednost fonda" value={formatRSD(fund.fund_value)} />
          <InfoCard label="Profit" value={formatRSD(fund.profit)} />
        </section>

        {/* Holdings table */}
        <section className={`page-anim ${styles.card}`}>
          <div className={styles.cardHeader}>
            <div>
              <div className={styles.cardEyebrow}>Hartije</div>
              <h2 className={styles.cardTitle}>Sastav fonda</h2>
            </div>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Ticker</th>
                  <th>Price</th>
                  <th>Change</th>
                  <th>Volume</th>
                  <th>InitialMarginCost</th>
                  <th>AcquisitionDate</th>
                  {isSupervisor && <th>Akcija</th>}
                </tr>
              </thead>
              <tbody>
                {holdings.length === 0 ? (
                  <tr>
                    <td colSpan={isSupervisor ? 7 : 6} className={styles.emptyTable}>
                      Nema hartija u fondu.
                    </td>
                  </tr>
                ) : (
                  holdings.map((h, idx) => (
                    <tr key={`${h.ticker}-${h.acquisition_date}-${idx}`}>
                      <td>{h.ticker ?? '—'}</td>
                      <td>{formatRSD(h.price)}</td>
                      <td>{formatNumber(h.change)}</td>
                      <td>{formatNumber(h.volume)}</td>
                      <td>{formatRSD(h.initial_margin_cost)}</td>
                      <td>{formatDate(h.acquisition_date)}</td>
 {isSupervisor && (
  <td>
    <button
      className={styles.btnSecondary} // Promeni stil da ne bude ghost ako je aktivno
      onClick={() => handleSellHoldings(h)}
    >
      Prodaj
    </button>
  </td>
)}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Performance */}
        <section className={`page-anim ${styles.card}`}>
          <div className={styles.cardHeader}>
            <div>
              <div className={styles.cardEyebrow}>Performanse</div>
              <h2 className={styles.cardTitle}>Istorijski prikaz</h2>
            </div>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Datum</th>
                  <th>Liquid assets</th>
                  <th>Value</th>
                  <th>Profit</th>
                </tr>
              </thead>
              <tbody>
                {performance.length === 0 ? (
                  <tr>
                    <td colSpan={4} className={styles.emptyTable}>
                      Nema podataka o performansama.
                    </td>
                  </tr>
                ) : (
                  performance.map((p, idx) => (
                    <tr key={`${p.date}-${idx}`}>
                      <td>{formatDate(p.date)}</td>
                      <td>{formatRSD(p.liquid_assets)}</td>
                      <td>{formatRSD(p.value)}</td>
                      <td>{formatRSD(p.profit)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

{/* Actions */}
<section className={`page-anim ${styles.actionSection}`}>
  {isClient && (
    <>
      <button 
        className={styles.btnPrimary} 
        onClick={() => {
          setModalType('invest'); // Kažeš: želim da investiram
          setInvestOpen(true);
        }}
      >
        Investiraj
      </button>

      <button 
        className={styles.btnGhost} 
        onClick={() => {
          setModalType('withdraw'); // Kažeš: želim da povučem pare
          setInvestOpen(true);
        }}
      >
        Povuci sredstva
      </button>
    </>
  )}

  {isSupervisor && (
    <>
      <button className={styles.btnPrimary} onClick={() => handleSupervisorFundAction('deposit')}>
        Uplata u fond
      </button>
      <button className={styles.btnGhost} onClick={() => handleSupervisorFundAction('withdraw')}>
        Povlačenje iz fonda
      </button>
    </>
  )}
</section>
      </main>

{/* Invest modal */}
{investOpen && (
  <div className={styles.modalBackdrop} onClick={() => setInvestOpen(false)}>
    <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
      <div className={styles.modalHeader}>
        <div>
          {/* DINAMIČKI NASLOV */}
          <h3 className={styles.modalTitle}>
            {modalType === 'invest' ? 'Investiraj u fond' : 'Povuci sredstva iz fonda'}
          </h3>
          <p className={styles.modalText}>
            Fond: <strong>{fund.name}</strong>
          </p>
        </div>
        <button className={styles.closeBtn} onClick={() => setInvestOpen(false)}>×</button>
      </div>

      <form onSubmit={handleInvestSubmit} className={styles.modalBody}>
        <div className={styles.field}>
          <label>Račun *</label>
          <select
            value={investAccountNumber}
            onChange={(e) => setInvestAccountNumber(e.target.value)}
            required
            disabled={accountsLoading || accounts.length === 0}
          >
            {accountsLoading ? (
              <option value="">Učitavanje računa...</option>
            ) : accounts.length === 0 ? (
              <option value="">Nema dostupnih računa</option>
            ) : (
              accounts.map((acc) => (
                <option key={acc.account_number} value={acc.account_number}>
                  {acc.name ?? 'Račun'} — {acc.account_number}
                </option>
              ))
            )}
          </select>
        </div>

        <div className={styles.field}>
          <label>Iznos (RSD) *</label>
          <input
            type="number"
            min="0.01"
            step="0.01"
            placeholder="Unesite iznos..."
            value={investAmount}
            onChange={(e) => setInvestAmount(e.target.value)}
            required
          />
        </div>

        <div className={styles.formActions}>
          <button 
            type="button" 
            className={styles.btnGhost} 
            onClick={() => setInvestOpen(false)} 
            disabled={investSubmitting}
          >
            Otkaži
          </button>
          <button 
            type="submit" 
            className={styles.btnPrimary} 
            disabled={investSubmitting}
          >
            {/* DINAMIČKI TEKST NA DUGMETU */}
            {investSubmitting 
              ? 'Slanje...' 
              : (modalType === 'invest' ? 'Potvrdi investiciju' : 'Potvrdi povlačenje')
            }
          </button>
        </div>
      </form>
    </div>
  </div>
)}
    </div>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className={styles.infoCard}>
      <span className={styles.infoLabel}>{label}</span>
      <strong className={styles.infoValue}>{value}</strong>
    </div>
  );
}

function formatRSD(value) {
  if (value == null || value === '—') return '—';
  const num = Number(value);
  if (Number.isNaN(num)) return '—';
  return `${new Intl.NumberFormat('sr-RS', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num)} RSD`;
}

function formatNumber(value) {
  if (value == null) return '—';
  const num = Number(value);
  if (Number.isNaN(num)) return '—';
  return new Intl.NumberFormat('sr-RS').format(num);
}

function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString('sr-RS');
}