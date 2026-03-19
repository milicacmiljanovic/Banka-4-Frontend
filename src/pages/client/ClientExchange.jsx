import { useRef, useLayoutEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { clientApi } from '../../api/endpoints/client';
import { useFetch } from '../../hooks/useFetch';
import styles from './ClientSubPage.module.css';

export default function ClientExchange() {
  const pageRef = useRef(null);
  const navigate = useNavigate();
  const { data: ratesData } = useFetch(() => clientApi.getRates(), []);
  const { data: accountsData } = useFetch(() => clientApi.getAccounts(), []);
  const rates = ratesData?.data ?? [];
  const accounts = accountsData?.data ?? [];

  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('EUR');
  const [direction, setDirection] = useState('buy'); // buy = kupujem devize, sell = prodajem devize
  const [result, setResult] = useState('');
  const [success, setSuccess] = useState(false);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.sub-card', { opacity: 0, y: 20, duration: 0.45, ease: 'power2.out', stagger: 0.07 });
    }, pageRef);
    return () => ctx.revert();
  }, []);

  function handleCalc() {
    const rate = rates.find(r => r.currency === currency);
    if (!rate || !amount) return;
    const val = parseFloat(amount);
    if (direction === 'buy') {
      setResult(`${val} ${currency} = ${(val * rate.sell).toFixed(2)} RSD`);
    } else {
      setResult(`${val} RSD = ${(val / rate.buy).toFixed(4)} ${currency}`);
    }
  }

  function handleExchange() {
    if (!amount) return;
    setSuccess(true);
    setTimeout(() => { setSuccess(false); setAmount(''); setResult(''); }, 2500);
  }

  return (
    <div ref={pageRef} className={styles.page}>
      <div className={styles.topBar}>
        <button className={styles.back} onClick={() => navigate('/dashboard')}>← Nazad</button>
        <h1 className={styles.title}>Menjačnica</h1>
      </div>

      {/* Kursna lista */}
      <div className={`sub-card ${styles.card}`}>
        <h2 className={styles.sectionTitle}>Kursna lista</h2>
        <table className={styles.ratesTable}>
          <thead>
            <tr><th>Valuta</th><th>Kupovni kurs</th><th>Prodajni kurs</th></tr>
          </thead>
          <tbody>
            {rates.map(r => (
              <tr key={r.currency}>
                <td><strong>{r.currency}</strong></td>
                <td>{r.buy.toFixed(2)} RSD</td>
                <td>{r.sell.toFixed(2)} RSD</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Forma za konverziju */}
      <div className={`sub-card ${styles.card} ${styles.formCard}`}>
        <h2 className={styles.sectionTitle}>Konverzija valuta</h2>
        {success && <div className={styles.successBanner}>✓ Menjačka transakcija je uspešno izvršena!</div>}
        <div className={styles.directionToggle}>
          <button className={`${styles.toggleBtn} ${direction === 'buy' ? styles.toggleActive : ''}`} onClick={() => setDirection('buy')}>
            Kupujem devize
          </button>
          <button className={`${styles.toggleBtn} ${direction === 'sell' ? styles.toggleActive : ''}`} onClick={() => setDirection('sell')}>
            Prodajem devize
          </button>
        </div>
        <div className={styles.calcRow}>
          <input type="number" placeholder="Iznos" className={styles.formInput} style={{ flex: 1 }} value={amount} onChange={e => setAmount(e.target.value)} />
          <select className={styles.formInput} style={{ width: 100 }} value={currency} onChange={e => setCurrency(e.target.value)}>
            {rates.map(r => <option key={r.currency} value={r.currency}>{r.currency}</option>)}
          </select>
          <button className={styles.calcBtn} onClick={handleCalc}>Izračunaj</button>
        </div>
        {result && <div className={styles.calcResult}>{result}</div>}
        <div className={styles.formField}>
          <label>Sa računa</label>
          <select className={styles.formInput}>
            {accounts.map(a => <option key={a.id}>{a.name}</option>)}
          </select>
        </div>
        <button className={styles.submitBtn} onClick={handleExchange} disabled={!amount}>
          Izvrši konverziju
        </button>
      </div>
    </div>
  );
}
