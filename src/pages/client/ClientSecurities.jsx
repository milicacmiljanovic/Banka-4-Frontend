import { useRef, useLayoutEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { useAuthStore }    from '../../store/authStore';
import { usePermissions }  from '../../hooks/usePermissions';
import SecurityTabs        from '../../features/securities/SecurityTabs';
import SecuritiesTable     from '../../features/securities/SecuritiesTable';
import SecurityDetails     from '../../features/securities/SecurityDetails';
import FiltersPanel, { DEFAULT_FILTERS } from '../../features/securities/FiltersPanel';
import {
  MOCK_STOCKS, MOCK_FUTURES, MOCK_FOREX,
} from '../../features/securities/mockData';
import styles from './ClientSubPage.module.css';
import secStyles from './ClientSecurities.module.css';

// ─── helpers ──────────────────────────────────────────────────────────────────
function applyFilters(list, filters, search) {
  return list.filter(sec => {
    if (search) {
      const q = search.toLowerCase();
      if (!sec.ticker.toLowerCase().includes(q) && !sec.name.toLowerCase().includes(q)) return false;
    }
    if (filters.exchange && !sec.exchange.toLowerCase().startsWith(filters.exchange.toLowerCase())) return false;
    if (filters.priceMin  !== '' && sec.price  < Number(filters.priceMin))  return false;
    if (filters.priceMax  !== '' && sec.price  > Number(filters.priceMax))  return false;
    if (filters.bidMin    !== '' && sec.bid    < Number(filters.bidMin))    return false;
    if (filters.bidMax    !== '' && sec.bid    > Number(filters.bidMax))    return false;
    if (filters.askMin    !== '' && sec.ask    < Number(filters.askMin))    return false;
    if (filters.askMax    !== '' && sec.ask    > Number(filters.askMax))    return false;
    if (filters.volumeMin !== '' && sec.volume < Number(filters.volumeMin)) return false;
    if (filters.volumeMax !== '' && sec.volume > Number(filters.volumeMax)) return false;
    if (filters.settlementDate && sec.settlementDate !== filters.settlementDate) return false;
    return true;
  });
}

function applySort(list, sortBy, sortDir) {
  if (!sortBy) return list;
  return [...list].sort((a, b) => {
    const av = a[sortBy] ?? 0;
    const bv = b[sortBy] ?? 0;
    return sortDir === 'asc' ? av - bv : bv - av;
  });
}

// ─── Buy/CreateOrder modal ────────────────────────────────────────────────────
function OrderModal({ security, isEmployee, onClose }) {
  const [qty, setQty] = useState(1);
  const [submitted, setSubmitted] = useState(false);

  if (!security) return null;

  const label    = isEmployee ? 'Create Order (approval flow)' : 'Buy (instant)';
  const total    = (security.price * qty).toLocaleString('sr-RS', { minimumFractionDigits: 2 });

  function handleSubmit(e) {
    e.preventDefault();
    // TODO: call securitiesApi.buy() or securitiesApi.createOrder()
    console.log('[TODO] Order submitted:', { securityId: security.id, qty, isEmployee });
    setSubmitted(true);
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
        <div className={styles.modalHeader}>
          <h3>{isEmployee ? 'Create Order' : 'Buy'} — {security.ticker}</h3>
          <button className={styles.modalClose} onClick={onClose}>✕</button>
        </div>
        {submitted ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <div className={styles.successBanner}>
              {isEmployee
                ? '✓ Order je kreiran i čeka odobrenje.'
                : '✓ Kupovina uspešna! Hartija je dodata u portfolio.'}
            </div>
            {isEmployee && (
              <p style={{ fontSize: 13, color: 'var(--tx-2)', marginTop: 12 }}>
                Novac će biti skinut sa računa tek nakon odobrenja.
              </p>
            )}
          </div>
        ) : (
          <form className={styles.formCard} style={{ boxShadow: 'none', border: 'none' }} onSubmit={handleSubmit}>
            <div className={styles.formField}>
              <label>Hartija</label>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent)' }}>{security.ticker} — {security.name}</div>
            </div>
            <div className={styles.formField}>
              <label>Cena po jedinici ({security.currency})</label>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{security.price.toLocaleString('sr-RS', { minimumFractionDigits: 2 })}</div>
            </div>
            <div className={styles.formField}>
              <label>Količina</label>
              <input
                className={styles.formInput}
                type="number" min="1" step="1"
                value={qty}
                onChange={e => setQty(Math.max(1, Number(e.target.value)))}
                required
              />
            </div>
            <div className={styles.formField}>
              <label>Ukupno ({security.currency})</label>
              <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--tx-1)' }}>{total}</div>
            </div>
            {isEmployee && (
              <p style={{ fontSize: 12, color: 'var(--tx-3)', margin: 0 }}>
                Order ide na odobrenje. Novac se skida tek nakon odobrenja.
              </p>
            )}
            <button type="submit" className={styles.submitBtn}>
              {label}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ClientSecurities() {
  const pageRef  = useRef(null);
  const navigate = useNavigate();
  const user     = useAuthStore(s => s.user);
  const { canAny } = usePermissions();

  const isEmployee  = user?.identity_type === 'employee';
  // Forex visible only to employees/actuaries
  const canSeeForex = isEmployee;

  const [activeTab,    setActiveTab]    = useState('STOCK');
  const [selectedSec,  setSelectedSec]  = useState(null);
  const [search,       setSearch]       = useState('');
  const [filters,      setFilters]      = useState(DEFAULT_FILTERS);
  const [sortBy,       setSortBy]       = useState('');
  const [sortDir,      setSortDir]      = useState('desc');
  const [orderModal,   setOrderModal]   = useState(null); // security for modal

  // Raw data per tab (replace with API calls)
  const rawData = useMemo(() => {
    if (activeTab === 'STOCK')   return MOCK_STOCKS;
    if (activeTab === 'FUTURES') return MOCK_FUTURES;
    if (activeTab === 'FOREX')   return MOCK_FOREX;
    return [];
  }, [activeTab]);

  const filtered = useMemo(() => applyFilters(rawData, filters, search), [rawData, filters, search]);
  const sorted   = useMemo(() => applySort(filtered, sortBy, sortDir), [filtered, sortBy, sortDir]);

  // Auto-select first security when tab changes
  useLayoutEffect(() => {
    setSelectedSec(sorted[0] ?? null);
  }, [activeTab]);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.sec-card', { opacity: 0, y: 18, duration: 0.4, ease: 'power2.out', stagger: 0.06 });
    }, pageRef);
    return () => ctx.revert();
  }, [activeTab]);

  function handleSort(col) {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('desc'); }
  }

  function handleAction(security) {
    setOrderModal(security);
  }

  const actionConfig = {
    label:   isEmployee ? 'Create Order' : 'Buy',
    handler: handleAction,
  };

  return (
    <div ref={pageRef} className={styles.page}>
      {/* Top bar */}
      <div className={styles.topBar}>
        <button className={styles.back} onClick={() => navigate('/dashboard')}>← Nazad</button>
        <h1 className={styles.title}>Hartije od vrednosti</h1>
        <button
          className={styles.newBtn}
          style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--tx-2)' }}
          onClick={() => alert('TODO: Refresh all securities')}
        >
          ↻ Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className={`sec-card ${secStyles.controlRow}`}>
        <SecurityTabs
          activeTab={activeTab}
          onChange={tab => { setActiveTab(tab); setSelectedSec(null); setFilters(DEFAULT_FILTERS); }}
          canSeeForex={canSeeForex}
        />

        {/* Search */}
        <div className={secStyles.searchWrap}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={secStyles.searchIcon}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            className={secStyles.searchInput}
            placeholder="Pretraži ticker ili naziv..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Filters */}
        <FiltersPanel
          activeTab={activeTab}
          filters={filters}
          onChange={setFilters}
          onReset={() => setFilters(DEFAULT_FILTERS)}
        />
      </div>

      {/* Main split layout */}
      <div className={`sec-card ${secStyles.layout}`}>
        {/* Table (left / top) */}
        <div className={secStyles.tablePane}>
          <SecuritiesTable
            securities={sorted}
            selectedId={selectedSec?.id}
            onSelect={setSelectedSec}
            onAction={actionConfig}
            sortBy={sortBy}
            sortDir={sortDir}
            onSort={handleSort}
          />
        </div>

        {/* Details (right / bottom) */}
        <div className={secStyles.detailPane}>
          <SecurityDetails
            security={selectedSec}
            isEmployee={isEmployee}
            onAction={handleAction}
          />
        </div>
      </div>

      {/* Order modal */}
      {orderModal && (
        <OrderModal
          security={orderModal}
          isEmployee={isEmployee}
          onClose={() => setOrderModal(null)}
        />
      )}
    </div>
  );
}
