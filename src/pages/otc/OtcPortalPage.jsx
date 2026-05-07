import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import Navbar from '../../components/layout/Navbar';
import Spinner from '../../components/ui/Spinner';
import { useAuthStore } from '../../store/authStore';
import { portfolioApi } from '../../api/endpoints/portfolio';
import { accountsApi } from '../../api/endpoints/accounts';
import { otcApi } from '../../api/endpoints/otc';
import OfferModal from './components/OfferModal';
import styles from './OtcPortalPage.module.css';

const TAB = {
  DOSTUPNE: 'DOSTUPNE',
  AKTIVNE:  'AKTIVNE',
  SKLOPLJENI: 'SKLOPLJENI',
};

function isExpired(settlementDate) {
  if (!settlementDate) return false;
  return new Date(settlementDate) < new Date();
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('sr-RS');
}

// ─── Confirm Modal (exercise) ─────────────────────────────────────────────────
function ConfirmModal({ contract, accounts, selectedAccount, onAccountChange, onConfirm, onClose, loading, error }) {
  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div>
            <h3 className={styles.modalTitle}>Iskoristi opciju</h3>
            <p className={styles.modalText}>Ticker: <strong>{contract.ticker}</strong></p>
          </div>
          <button className={styles.closeIconButton} onClick={onClose}>×</button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.summaryGrid}>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Količina:</span>
              <strong>{contract.amount}</strong>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Profit:</span>
              <strong className={contract.profit >= 0 ? styles.pos : styles.neg}>
                {contract.profit >= 0 ? '+' : ''}
                {Number(contract.profit ?? 0).toLocaleString('sr-RS', { minimumFractionDigits: 2 })} RSD
              </strong>
            </div>
          </div>

          {contract.profit < 0 && (
            <div className={styles.infoStrip}>
              ⚠️ Trenutni profit je negativan. Svejedno možete iskoristiti opciju.
            </div>
          )}

          <div className={styles.field}>
            <label>Račun za plaćanje <span className={styles.required}>*</span></label>
            <select value={selectedAccount} onChange={e => onAccountChange(e.target.value)}>
              <option value="">Izaberite račun...</option>
              {accounts.map((a, i) => {
                const num = a.AccountNumber ?? a.account_number ?? a.accountNumber ?? a.number ?? '';
                const name = a.Name ?? a.name ?? `Račun ${i + 1}`;
                const bal = a.Balance ?? a.balance ?? a.AvailableBalance ?? a.available_balance;
                const cur = a.Currency?.Code ?? a.currency ?? '';
                return (
                  <option key={num || i} value={num}>
                    {name}{num ? ` — ${num}` : ''}
                    {bal != null ? ` (${Number(bal).toLocaleString('sr-RS', { minimumFractionDigits: 2 })}${cur ? ` ${cur}` : ''})` : ''}
                  </option>
                );
              })}
            </select>
          </div>

          {error && <p className={styles.errorText}>{error}</p>}
        </div>

        <div className={styles.formActions}>
          <button className={styles.btnGhost} onClick={onClose} disabled={loading}>Otkaži</button>
          <button className={styles.btnPrimary} onClick={onConfirm} disabled={loading || !selectedAccount}>
            {loading ? 'Slanje...' : 'Potvrdi'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Dostupne akcije (OTC Portal) ───────────────────────────────────────
function DostupneAkcije() {
  const [stocks, setStocks]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [offerStock, setOfferStock] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError('');
        const res  = await otcApi.getPublicListings();
        const list = Array.isArray(res) ? res : (res?.data ?? res?.content ?? []);
        setStocks(list);
      } catch {
        setError('Nije moguće učitati dostupne akcije.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleOfferSubmit(payload) {
    await otcApi.createOffer({
      asset_ownership_id:   payload.stockId,
      amount:               payload.volumeOfStock,
      price_per_stock:      payload.priceOffer,
      settlement_date:      payload.settlementDateOffer,
      premium:              payload.premiumOffer,
    });
    setOfferStock(null);
    setSuccessMsg(`Ponuda za ${payload.stock} je uspešno poslata!`);
    setTimeout(() => setSuccessMsg(''), 4000);
  }

  return (
    <section className={styles.card}>
      <div className={styles.sectionHeader}>
        <div>
          <div className={styles.sectionEyebrow}>OTC Portal</div>
          <h2 className={styles.sectionTitle}>Dostupne akcije za ponudu</h2>
        </div>
      </div>

      {successMsg && (
        <div className={styles.successBanner}>
          ✓ {successMsg}
          <button className={styles.dismissBtn} onClick={() => setSuccessMsg('')}>✕</button>
        </div>
      )}

      {loading ? (
        <div className={styles.loadingState}><Spinner /></div>
      ) : error ? (
        <div className={styles.errorBox}>{error}</div>
      ) : stocks.length === 0 ? (
        <div className={styles.emptyTable}>Trenutno nema javno dostupnih akcija za OTC trgovanje.</div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>TICKER</th>
                <th>NAZIV</th>
                <th>VLASNIK</th>
                <th>DOSTUPNO</th>
                <th>CENA</th>
                <th style={{ textAlign: 'right' }}>AKCIJA</th>
              </tr>
            </thead>
            <tbody>
              {stocks.map((stock, i) => (
                <tr key={stock.asset_ownership_id ?? stock.id ?? i}>
                  <td className={styles.ticker}>{stock.ticker ?? '—'}</td>
                  <td>{stock.name ?? stock.stock_name ?? '—'}</td>
                  <td>{stock.owner_name ?? '—'}</td>
                  <td>{stock.public_amount ?? stock.amount ?? '—'}</td>
                  <td>{stock.price != null ? `$${Number(stock.price).toFixed(2)}` : '—'}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className={styles.btnPrimary}
                      onClick={() => setOfferStock(stock)}
                    >
                      Pošalji ponudu
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {offerStock && (
        <OfferModal
          open={true}
          stock={offerStock}
          onClose={() => setOfferStock(null)}
          onSubmit={handleOfferSubmit}
        />
      )}
    </section>
  );
}

// ─── Tab: Aktivne ponude ──────────────────────────────────────────────────────
function AktivnePonude() {
  const user = useAuthStore(s => s.user);
  const [offers, setOffers]               = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState('');
  const [selected, setSelected]           = useState(null);
  const [modalMode, setModalMode]         = useState('view');
  const [counterForm, setCounterForm]     = useState({ amount: '', price_per_stock: '', settlement_date: '', premium: '' });
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError]     = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  useEffect(() => { loadOffers(); }, []);

  async function loadOffers() {
    try {
      setLoading(true);
      setError('');
      const res  = await otcApi.getMyNegotiations();
      const list = Array.isArray(res) ? res : (res?.content ?? res?.data ?? []);
      setOffers(list);
    } catch {
      setError('Greška pri učitavanju aktivnih ponuda.');
    } finally {
      setLoading(false);
    }
  }

  function openModal(offer) {
    setSelected(offer);
    setModalMode('view');
    setActionError('');
    setActionSuccess('');
    setCounterForm({
      amount:          offer.amount          ?? '',
      price_per_stock: offer.price_per_stock  ?? '',
      settlement_date: offer.settlement_date  ? offer.settlement_date.slice(0, 10) : '',
      premium:         offer.premium          ?? '',
    });
  }

  function closeModal() {
    setSelected(null);
    setModalMode('view');
    setActionError('');
    setActionSuccess('');
  }

  async function handleAccept() {
    try {
      setActionLoading(true);
      setActionError('');
      await otcApi.acceptOffer(selected.otc_offer_id);
      setActionSuccess('Ponuda je uspešno prihvaćena.');
      await loadOffers();
      setTimeout(closeModal, 1500);
    } catch {
      setActionError('Greška pri prihvatanju ponude.');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReject() {
    try {
      setActionLoading(true);
      setActionError('');
      await otcApi.rejectOffer(selected.otc_offer_id);
      setActionSuccess('Pregovor je uspešno otkazan.');
      await loadOffers();
      setTimeout(closeModal, 1500);
    } catch {
      setActionError('Greška pri otkazivanju pregovora.');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCounter() {
    try {
      setActionLoading(true);
      setActionError('');
      await otcApi.sendCounterOffer(selected.otc_offer_id, {
        amount:          Number(counterForm.amount),
        price_per_stock: Number(counterForm.price_per_stock),
        settlement_date: counterForm.settlement_date,
        premium:         Number(counterForm.premium),
      });
      setActionSuccess('Kontraponuda je uspešno poslata.');
      await loadOffers();
      setTimeout(closeModal, 1500);
    } catch {
      setActionError('Greška pri slanju kontraponude.');
    } finally {
      setActionLoading(false);
    }
  }

  function getCounterparty(offer) {
    if (!user) return '—';
    const myId = user.id ?? user.sub;
    if (Number(offer.buyer_id) === Number(myId))  return `Prodavac (ID: ${offer.seller_id})`;
    if (Number(offer.seller_id) === Number(myId)) return `Kupac (ID: ${offer.buyer_id})`;
    return `ID: ${offer.buyer_id} / ${offer.seller_id}`;
  }

  return (
    <section className={styles.card}>
      <div className={styles.sectionHeader}>
        <div>
          <div className={styles.sectionEyebrow}>OTC Ponude i Ugovori</div>
          <h2 className={styles.sectionTitle}>Aktivne ponude</h2>
        </div>
      </div>

      {loading ? (
        <div className={styles.loadingState}><Spinner /></div>
      ) : error ? (
        <div className={styles.errorBox}>{error}</div>
      ) : offers.length === 0 ? (
        <div className={styles.emptyTable}>Nema aktivnih pregovora.</div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>STOCK</th>
                <th>AMOUNT</th>
                <th>PRICE</th>
                <th>SETTLEMENT</th>
                <th>PREMIUM</th>
                <th>PREGOVARA SA</th>
                <th style={{ textAlign: 'right' }}>AKCIJE</th>
              </tr>
            </thead>
            <tbody>
              {offers.map(offer => (
                <tr key={offer.otc_offer_id} onClick={() => openModal(offer)} style={{ cursor: 'pointer' }}>
                  <td>#{offer.otc_offer_id}</td>
                  <td className={styles.ticker}>{offer.ticker ?? offer.stock_name ?? '—'}</td>
                  <td>{offer.amount ?? '—'}</td>
                  <td>{offer.price_per_stock != null ? `$${Number(offer.price_per_stock).toFixed(2)}` : '—'}</td>
                  <td>{formatDate(offer.settlement_date)}</td>
                  <td>{offer.premium != null ? `$${Number(offer.premium).toFixed(2)}` : '—'}</td>
                  <td>{getCounterparty(offer)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button className={styles.btnPrimary} onClick={e => { e.stopPropagation(); openModal(offer); }}>
                      Detalji
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <div className={styles.modalBackdrop} onClick={closeModal}>
          <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                Ponuda #{selected.otc_offer_id} — {selected.ticker ?? selected.stock_name ?? '—'}
              </h3>
              <button className={styles.closeIconButton} onClick={closeModal}>×</button>
            </div>

            <div className={styles.modalBody}>
              {actionSuccess && <div className={styles.successBanner}>{actionSuccess}</div>}
              {actionError   && <p className={styles.errorText}>{actionError}</p>}

              {modalMode === 'view' && (
                <>
                  <div className={styles.summaryGrid}>
                    {[
                      ['Stock',          selected.ticker ?? selected.stock_name ?? '—'],
                      ['Amount',         selected.amount ?? '—'],
                      ['Price per stock', selected.price_per_stock != null ? `$${Number(selected.price_per_stock).toFixed(2)}` : '—'],
                      ['Premium',        selected.premium != null ? `$${Number(selected.premium).toFixed(2)}` : '—'],
                      ['Settlement',     formatDate(selected.settlement_date)],
                      ['Status',         selected.status ?? '—'],
                      ['Pregovara sa',   getCounterparty(selected)],
                    ].map(([label, value]) => (
                      <div key={label} className={styles.summaryRow}>
                        <span className={styles.summaryLabel}>{label}:</span>
                        <strong>{value}</strong>
                      </div>
                    ))}
                  </div>
                  <div className={styles.formActions}>
                    <button className={styles.btnPrimary}  disabled={actionLoading} onClick={handleAccept}>
                      Prihvati
                    </button>
                    <button className={styles.btnGhost}    disabled={actionLoading} onClick={() => setModalMode('counter')}>
                      Kontraponuda
                    </button>
                    <button className={styles.btnDanger ?? styles.btnGhost} disabled={actionLoading} onClick={handleReject}>
                      Odustani
                    </button>
                  </div>
                </>
              )}

              {modalMode === 'counter' && (
                <>
                  <div className={styles.fieldGrid2 ?? styles.field}>
                    {[
                      { key: 'amount',          label: 'Amount',         type: 'number' },
                      { key: 'price_per_stock', label: 'Price per stock', type: 'number' },
                      { key: 'settlement_date', label: 'Settlement Date', type: 'date' },
                      { key: 'premium',         label: 'Premium',         type: 'number' },
                    ].map(({ key, label, type }) => (
                      <div key={key} className={styles.field}>
                        <label>{label}</label>
                        <input
                          type={type}
                          value={counterForm[key]}
                          onChange={e => setCounterForm(p => ({ ...p, [key]: e.target.value }))}
                        />
                      </div>
                    ))}
                  </div>
                  <div className={styles.formActions}>
                    <button className={styles.btnPrimary} disabled={actionLoading} onClick={handleCounter}>
                      Pošalji kontraponudu
                    </button>
                    <button className={styles.btnGhost}   disabled={actionLoading} onClick={() => setModalMode('view')}>
                      Nazad
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

// ─── Tab: Sklopljeni ugovori ──────────────────────────────────────────────────
function SklopljeniUgovori() {
  const user = useAuthStore(s => s.user);
  const [options, setOptions]                 = useState([]);
  const [accounts, setAccounts]               = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [error, setError]                     = useState('');
  const [filter, setFilter]                   = useState('valid');
  const [confirmModal, setConfirmModal]       = useState(null);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [exerciseLoading, setExerciseLoading] = useState(false);
  const [exerciseError, setExerciseError]     = useState('');
  const [successMsg, setSuccessMsg]           = useState('');

  useEffect(() => {
    async function load() {
      if (!user?.id) return;
      try {
        setLoading(true);
        setError('');

        const res = await otcApi.getContracts();
        const contracts = Array.isArray(res) ? res : (res?.data ?? []);
        setOptions(contracts);

        const accountsRes = await accountsApi.getBankAccounts().catch(() => []);
        const accs = Array.isArray(accountsRes) ? accountsRes : (accountsRes?.data ?? []);
        setAccounts(accs);
      } catch {
        setError('Nije moguće učitati podatke. Pokušajte ponovo.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user?.id]);

  const filtered = options.filter(o => {
    if (o.is_exercised) return false;
    return filter === 'expired'
      ? isExpired(o.settlement_date)
      : !isExpired(o.settlement_date);
  });

  function openModal(contract) {
    setConfirmModal(contract);
    setSelectedAccount('');
    setExerciseError('');
  }

  async function handleExercise() {
    if (!confirmModal || !selectedAccount) return;
    try {
      setExerciseLoading(true);
      setExerciseError('');
      await portfolioApi.exerciseOption(user.id, confirmModal.stock_asset_id, selectedAccount);
      setSuccessMsg(`Opcija ${confirmModal.ticker} je uspešno iskorišćena!`);
      setConfirmModal(null);
      const res = await otcApi.getContracts();
      const contracts = Array.isArray(res) ? res : (res?.data ?? []);
      setOptions(contracts);
    } catch (err) {
      setExerciseError(err?.message ?? 'Greška pri iskorišćavanju opcije. Proverite da li je opcija in-the-money.');
    } finally {
      setExerciseLoading(false);
    }
  }

  return (
    <section className={styles.card}>
      <div className={styles.sectionHeader}>
        <div>
          <div className={styles.sectionEyebrow}>OTC Ponude i Ugovori</div>
          <h2 className={styles.sectionTitle}>Sklopljeni ugovori</h2>
        </div>
      </div>

      {successMsg && (
        <div className={styles.successBanner}>
          ✓ {successMsg}
          <button className={styles.dismissBtn} onClick={() => setSuccessMsg('')}>✕</button>
        </div>
      )}

      <div className={styles.filterRow}>
        <button
          className={`${styles.filterChip} ${filter === 'valid' ? styles.filterChipActive : ''}`}
          onClick={() => setFilter('valid')}
        >
          Važeći ugovori
        </button>
        <button
          className={`${styles.filterChip} ${filter === 'expired' ? styles.filterChipActive : ''}`}
          onClick={() => setFilter('expired')}
        >
          Istekli ugovori
        </button>
      </div>

      {loading ? (
        <div className={styles.loadingState}><Spinner /></div>
      ) : error ? (
        <div className={styles.errorBox}>{error}</div>
      ) : filtered.length === 0 ? (
        <div className={styles.emptyTable}>
          Nema {filter === 'expired' ? 'isteklih' : 'važećih'} ugovora.
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>STOCK</th>
                <th>AMOUNT</th>
                <th>STRIKE PRICE</th>
                <th>PREMIUM</th>
                <th>SETTLEMENT DATE</th>
                <th>SELLER INFO</th>
                <th>PROFIT</th>
                {filter === 'valid' && <th>AKCIJA</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map(contract => (
                <tr key={contract.otc_option_contract_id} className={isExpired(contract.settlement_date) ? styles.expiredRow : ''}>
                  <td className={styles.ticker}>{contract.ticker}</td>
                  <td>{contract.amount}</td>
                  <td>{contract.strike_price}</td>
                  <td>{contract.premium}</td>
                  <td>{formatDate(contract.settlement_date)}</td>
                  <td>Seller #{contract.seller_id}</td>
                  <td className={contract.profit >= 0 ? styles.pos : styles.neg}>
                    {contract.profit >= 0 ? '+' : ''}
                    {Number(contract.profit ?? 0).toLocaleString('sr-RS', { minimumFractionDigits: 2 })} RSD
                  </td>
                  {filter === 'valid' && (
                    <td>
                      <button className={styles.btnPrimary} onClick={() => openModal(contract)}>
                        Iskoristi
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {confirmModal && (
        <ConfirmModal
          contract={confirmModal}
          accounts={accounts}
          selectedAccount={selectedAccount}
          onAccountChange={setSelectedAccount}
          onConfirm={handleExercise}
          onClose={() => setConfirmModal(null)}
          loading={exerciseLoading}
          error={exerciseError}
        />
      )}
    </section>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function OtcPortalPage() {
  const pageRef = useRef(null);
  const [activeTab, setActiveTab] = useState(TAB.DOSTUPNE);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const nodes = pageRef.current?.querySelectorAll('.page-anim');
      if (!nodes?.length) return;
      gsap.from(nodes, { opacity: 0, y: 20, duration: 0.45, stagger: 0.08, ease: 'power2.out' });
    }, pageRef);
    return () => ctx.revert();
  }, [activeTab]);

  const tabLabel = {
    [TAB.DOSTUPNE]:   'Dostupne akcije',
    [TAB.AKTIVNE]:    'Aktivne ponude',
    [TAB.SKLOPLJENI]: 'Sklopljeni ugovori',
  };

  return (
    <div ref={pageRef} className={styles.stranica}>
      <Navbar />

      <main className={styles.sadrzaj}>
        <div className="page-anim">
          <div className={styles.breadcrumb}>
            <span>OTC</span>
            <span className={styles.breadcrumbSep}>›</span>
            <span className={styles.breadcrumbAktivna}>{tabLabel[activeTab]}</span>
          </div>
          <div className={styles.pageHeader}>
            <div>
              <h1 className={styles.pageTitle}>OTC Ponude i Ugovori</h1>
              <p className={styles.pageDesc}>Pregled dostupnih akcija, aktivnih pregovora i zaključenih opcionih ugovora.</p>
            </div>
          </div>
        </div>

        <section className={`page-anim ${styles.tabsCard}`}>
          <div className={styles.tabsRow}>
            {Object.entries(tabLabel).map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={`${styles.tabButton} ${activeTab === key ? styles.tabButtonActive : ''}`}
                onClick={() => setActiveTab(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        <div className="page-anim">
          {activeTab === TAB.DOSTUPNE   && <DostupneAkcije />}
          {activeTab === TAB.AKTIVNE    && <AktivnePonude />}
          {activeTab === TAB.SKLOPLJENI && <SklopljeniUgovori />}
        </div>
      </main>
    </div>
  );
}
