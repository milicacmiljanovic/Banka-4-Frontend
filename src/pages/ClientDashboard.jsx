import { useRef, useLayoutEffect, useState, useEffect } from 'react';
import { useNavigate }    from 'react-router-dom';
import gsap               from 'gsap';
import { clientApi }      from '../api/endpoints/client';
import { useAuthStore }   from '../store/authStore';
import { useFetch }       from '../hooks/useFetch';
import Spinner            from '../components/ui/Spinner';
import styles             from './ClientDashboard.module.css';

function formatAmount(amount, currency = 'RSD') {
  return new Intl.NumberFormat('sr-RS', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(amount)) + ' ' + currency;
}
function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('sr-RS', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function ProfileModal({ user, onClose }) {
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Lični podaci</h3>
          <button className={styles.modalClose} onClick={onClose}>✕</button>
        </div>
        <div className={styles.profileContent}>
          <div className={styles.profileAvatar}>{user?.first_name?.[0]}{user?.last_name?.[0]}</div>
          <div className={styles.profileName}>{user?.first_name} {user?.last_name}</div>
          <div className={styles.profileEmail}>{user?.email}</div>
          <div className={styles.profileFields}>
            {[
              { label: 'Ime', value: user?.first_name },
              { label: 'Prezime', value: user?.last_name },
              { label: 'Email', value: user?.email },
              { label: 'Telefon', value: user?.phone ?? '+381 60 123 4567' },
              { label: 'Adresa', value: user?.address ?? 'Knez Mihailova 10, Beograd' },
            ].map(f => (
              <div key={f.label} className={styles.profileField}>
                <span className={styles.profileFieldLabel}>{f.label}</span>
                <span className={styles.profileFieldValue}>{f.value ?? '—'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PaymentModal({ recipient, accounts, onClose }) {
  const [from, setFrom] = useState(accounts[0]?.id ?? '');
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [success, setSuccess] = useState(false);
  function handleSend() {
    if (!amount) return;
    setSuccess(true);
    setTimeout(onClose, 1800);
  }
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>{recipient ? `Plaćanje — ${recipient.name}` : 'Novo plaćanje'}</h3>
          <button className={styles.modalClose} onClick={onClose}>✕</button>
        </div>
        {success ? (
          <div className={styles.successMsg}><div className={styles.successIcon}>✓</div><p>Nalog za plaćanje je uspešno poslat!</p></div>
        ) : (
          <div className={styles.payForm}>
            <div className={styles.payField}><label>Primalac</label><input type="text" defaultValue={recipient?.name ?? ''} placeholder="Ime primaoca" className={styles.payInput} /></div>
            <div className={styles.payField}><label>Račun primaoca</label><input type="text" defaultValue={recipient?.account ?? ''} placeholder="Broj računa" className={styles.payInput} /></div>
            <div className={styles.payField}><label>Sa računa</label>
              <select className={styles.payInput} value={from} onChange={e => setFrom(e.target.value)}>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name} — {formatAmount(a.balance, a.currency)}</option>)}
              </select>
            </div>
            <div className={styles.payField}><label>Iznos (RSD)</label><input type="number" placeholder="0.00" className={styles.payInput} value={amount} onChange={e => setAmount(e.target.value)} /></div>
            <div className={styles.payField}><label>Svrha plaćanja</label><input type="text" placeholder="Npr. Stanarima za mart" className={styles.payInput} value={desc} onChange={e => setDesc(e.target.value)} /></div>
            <button className={styles.payBtn} onClick={handleSend}>Pošalji nalog za plaćanje</button>
          </div>
        )}
      </div>
    </div>
  );
}

function AccountSwitcherModal({ accounts, selected, onSelect, onClose }) {
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalSmall} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Izaberite račun</h3>
          <button className={styles.modalClose} onClick={onClose}>✕</button>
        </div>
        <div className={styles.switcherList}>
          {accounts.map((acc, i) => (
            <button key={acc.id} className={`${styles.switcherItem} ${selected === i ? styles.switcherItemActive : ''}`} onClick={() => { onSelect(i); onClose(); }}>
              <div className={styles.switcherIcon}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
              </div>
              <div className={styles.switcherInfo}>
                <div className={styles.switcherName}>{acc.name}</div>
                <div className={styles.switcherNumber}>••••{acc.number.slice(-4)}</div>
              </div>
              <div className={styles.switcherBalance}>{formatAmount(acc.balance, acc.currency)}</div>
              {selected === i && <span className={styles.switcherCheck}>✓</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ClientDashboard() {
  const pageRef  = useRef(null);
  const navigate = useNavigate();
  const user     = useAuthStore(s => s.user);
  const logout   = useAuthStore(s => s.logout);

  const [selectedAccount, setSelectedAccount] = useState(0);
  const [calcAmount, setCalcAmount] = useState('');
  const [calcFrom,   setCalcFrom]   = useState('EUR');
  const [calcResult, setCalcResult] = useState('');
  const [showProfile,      setShowProfile]      = useState(false);
  const [showSwitcher,     setShowSwitcher]     = useState(false);
  const [paymentRecipient, setPaymentRecipient] = useState(null);
  const [showPayment,      setShowPayment]      = useState(false);
  const [showPaymentsMenu, setShowPaymentsMenu] = useState(false);
  const paymentsMenuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (paymentsMenuRef.current && !paymentsMenuRef.current.contains(e.target)) {
        setShowPaymentsMenu(false);
      }
    }
    if (showPaymentsMenu) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPaymentsMenu]);

  const { data: accountsData,  loading: loadingAccounts } = useFetch(() => clientApi.getAccounts(),     []);
  const { data: txData,        loading: loadingTx }       = useFetch(() => clientApi.getTransactions(), []);
  const { data: recipientsData }                          = useFetch(() => clientApi.getRecipients(),   []);
  const { data: ratesData }                               = useFetch(() => clientApi.getRates(),        []);

  const accounts     = accountsData?.data   ?? [];
  const transactions = txData?.data         ?? [];
  const recipients   = recipientsData?.data ?? [];
  const rates        = ratesData?.data      ?? [];

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.dash-card', { opacity: 0, y: 24, duration: 0.5, ease: 'power2.out', stagger: 0.08 });
    }, pageRef);
    return () => ctx.revert();
  }, []);

  function handleCalc() {
    const rate = rates.find(r => r.currency === calcFrom);
    if (!rate || !calcAmount) return;
    setCalcResult(`${calcAmount} ${calcFrom} = ${(parseFloat(calcAmount) * rate.sell).toFixed(2)} RSD`);
  }

  function handleLogout() { logout(); navigate('/login'); }

  const activeAccount = accounts[selectedAccount];

  const navItems = [
    { label: 'Računi',     path: '/accounts' },
    { label: 'Transferi',  path: '/client/transfers' },
    { label: 'Menjačnica', path: '/client/exchange' },
    { label: 'Kartice',    path: '/client/cards' },
    { label: 'Krediti',    path: '/client/loans' },
  ];

  const paymentsSubItems = [
    { label: 'Novo plaćanje',       path: '/client/payments/new' },
    { label: 'Prenos',              path: '/client/transfers' },
    { label: 'Primaoci plaćanja',   path: '/client/recipients' },
    { label: 'Pregled plaćanja',    path: '/payments' },
  ];

  return (
    <div ref={pageRef} className={styles.page}>
      <header className={styles.header}>
        <button className={styles.headerBrand} onClick={() => navigate('/dashboard')} style={{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className={styles.headerIcon}>
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <span className={styles.headerBrandText}>RAFBank</span>
        </button>
        <nav className={styles.headerNav}>
          {navItems.map(item => (
            <button key={item.label} className={styles.headerNavBtn} onClick={() => navigate(item.path)}>
              {item.label}
            </button>
          ))}

          {/* Plaćanja dropdown */}
          <div className={styles.payDropdownWrap} ref={paymentsMenuRef}>
            <button
              className={`${styles.headerNavBtn} ${showPaymentsMenu ? styles.headerNavBtnActive : ''}`}
              onClick={() => setShowPaymentsMenu(prev => !prev)}
            >
              Plaćanja
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginLeft: 4 }}>
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
            {showPaymentsMenu && (
              <div className={styles.payDropdownMenu}>
                {paymentsSubItems.map(item => (
                  <button
                    key={item.label}
                    className={styles.payDropdownItem}
                    onClick={item.action ?? (() => { navigate(item.path); setShowPaymentsMenu(false); })}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </nav>
        <div className={styles.headerRight}>
          <button className={styles.headerProfile} onClick={() => setShowProfile(true)}>
            <div className={styles.headerAvatar}>{user?.first_name?.[0]}{user?.last_name?.[0]}</div>
            <span>{user?.first_name} {user?.last_name}</span>
          </button>
          <button className={styles.headerLogout} onClick={handleLogout}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Odjavi se
          </button>
        </div>
      </header>

      <div className={styles.content}>
        <div className={styles.welcome}>
          <h1 className={styles.welcomeTitle}>Dobro jutro, {user?.first_name ?? 'Klijente'} 👋</h1>
          <p className={styles.welcomeSub}>Evo pregleda vašeg finansijskog stanja.</p>
        </div>
        <div className={styles.grid}>

          {/* RAČUNI */}
          <section className={`dash-card ${styles.card} ${styles.accountsCard}`}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Moji računi</h2>
              <button className={styles.cardLink} onClick={() => navigate('/client/accounts')}>Svi računi →</button>
            </div>
            {loadingAccounts ? <Spinner /> : (
              <div className={styles.accountsList}>
                {accounts.map((acc, i) => (
                  <div key={acc.id} className={`${styles.accountItem} ${selectedAccount === i ? styles.accountItemActive : ''}`} onClick={() => setSelectedAccount(i)}>
                    <div className={styles.accountIcon}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                    </div>
                    <div className={styles.accountInfo}>
                      <div className={styles.accountName}>{acc.name}</div>
                      <div className={styles.accountNumber}>••••  {acc.number.replace(/-/g, '').slice(-6)}</div>
                    </div>
                    <div className={styles.accountBalance}>
                      <div className={styles.balanceAmount}>{formatAmount(acc.balance, acc.currency)}</div>
                      <div className={styles.balanceCurrency}>{acc.currency}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* TRANSAKCIJE + ACCOUNT SWITCHER */}
          <section className={`dash-card ${styles.card} ${styles.txCard}`}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Poslednje transakcije</h2>
              <button className={styles.switcherBtn} onClick={() => setShowSwitcher(true)} title="Promeni račun">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/>
                  <polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
                </svg>
                {activeAccount?.name ?? 'Račun'}
              </button>
            </div>
            {loadingTx ? <Spinner /> : (
              <table className={styles.txTable}>
                <thead><tr><th>Opis</th><th>Datum</th><th style={{ textAlign: 'right' }}>Iznos</th></tr></thead>
                <tbody>
                  {transactions.slice(0, 5).map(tx => (
                    <tr key={tx.id}>
                      <td>{tx.description}</td>
                      <td>{formatDate(tx.date)}</td>
                      <td className={tx.type === 'credit' ? styles.credit : styles.debit}>
                        {tx.type === 'credit' ? '+' : '-'}{formatAmount(tx.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          {/* BRZO PLAĆANJE */}
          <section className={`dash-card ${styles.card} ${styles.payCard}`}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Brzo plaćanje</h2>
              <button className={styles.newPayBtn} onClick={() => navigate('/client/recipients')}>+ Novi primalac</button>
            </div>
            <div className={styles.recipientsList}>
              {recipients.map(r => (
                <button key={r.id} className={styles.recipientBtn} onClick={() => navigate('/client/payments/new')} title={`Plati ${r.name}`}>
                  <div className={styles.recipientAvatar}>{r.initials}</div>
                  <span className={styles.recipientName}>{r.name.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </section>

          {/* KURSNA LISTA */}
          <section className={`dash-card ${styles.card} ${styles.ratesCard}`}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Kursna lista</h2>
              <button className={styles.cardLink} onClick={() => navigate('/client/exchange')}>Idi na menjačnicu →</button>
            </div>
            <div className={styles.ratesTable}>
              {rates.map(r => (
                <div key={r.currency} className={styles.rateRow}>
                  <span className={styles.rateCurrency}>{r.currency}</span>
                  <span className={styles.rateLabel}>Kupovni</span>
                  <span className={styles.rateValue}>{r.buy.toFixed(2)}</span>
                  <span className={styles.rateLabel}>Prodajni</span>
                  <span className={styles.rateValue}>{r.sell.toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className={styles.calcDivider} />
            <h3 className={styles.calcTitle}>Mini kalkulator</h3>
            <div className={styles.calcRow}>
              <input className={styles.calcInput} type="number" placeholder="Iznos" value={calcAmount} onChange={e => setCalcAmount(e.target.value)} />
              <select className={styles.calcSelect} value={calcFrom} onChange={e => setCalcFrom(e.target.value)}>
                {rates.map(r => <option key={r.currency} value={r.currency}>{r.currency}</option>)}
              </select>
              <button className={styles.calcBtn} onClick={handleCalc}>→ RSD</button>
            </div>
            {calcResult && <div className={styles.calcResult}>{calcResult}</div>}
          </section>
        </div>
      </div>

      {showProfile  && <ProfileModal user={user} onClose={() => setShowProfile(false)} />}
      {showSwitcher && <AccountSwitcherModal accounts={accounts} selected={selectedAccount} onSelect={setSelectedAccount} onClose={() => setShowSwitcher(false)} />}
      {showPayment  && <PaymentModal recipient={paymentRecipient} accounts={accounts} onClose={() => { setShowPayment(false); setPaymentRecipient(null); }} />}
    </div>
  );
}
