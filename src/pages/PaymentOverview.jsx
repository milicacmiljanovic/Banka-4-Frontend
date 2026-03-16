import { useRef, useLayoutEffect, useState, useMemo } from 'react';
import gsap from 'gsap';
import Navbar from '../components/layout/Navbar';
import styles from './PaymentOverview.module.css';

export default function PaymentOverview() {
  const pageRef = useRef(null);

  // 1. STATE ZA PODATKE I FILTERE (Pravilo 10.2)
  const [loading] = useState(false);
  const [error] = useState(null);
  const [transactions] = useState([
    { id: 1, date: '2024-03-14 14:20', recipient: 'Restoran "Sidro"', amount: -4200.00, currency: 'RSD', status: 'Realizovano', type: 'payment' },
    { id: 2, date: '2024-03-14 12:15', recipient: 'Menjačnica (RSD -> EUR)', amount: -11750.00, currency: 'RSD', status: 'U obradi', type: 'exchange' },
    { id: 3, date: '2024-03-13 09:00', recipient: 'Infostan', amount: -8500.00, currency: 'RSD', status: 'Odbijeno', type: 'payment' }
  ]);

  const [filterStatus, setFilterStatus] = useState('');

  // 2. LOGIKA FILTRIRANJA
  const filteredData = useMemo(() => {
    if (!filterStatus) return transactions;
    return transactions.filter(t => t.status === filterStatus);
  }, [filterStatus, transactions]);

  // 3. GSAP ANIMACIJA (Šablon 10.1)
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.sadrzaj', { 
        opacity: 0, 
        y: 20, 
        stagger: 0.1, 
        duration: 0.4,
        ease: 'power2.out' 
      });
    }, pageRef);
    return () => ctx.revert();
  }, []);

  // 4. HANDLING STANJA (Pravilo 10.3)
  if (loading) return <div className={styles.content}>Učitavanje...</div>;
  if (error) return <div className={styles.content}>Došlo je do greške.</div>;
  if (!transactions) return null;

  // Pomoćna za boje statusa
  const getStatusColor = (status) => {
    switch(status) {
      case 'Realizovano': return { bg: '#e6f4ea', text: '#1e7e34' };
      case 'Odbijeno': return { bg: '#fdecea', text: '#d93025' };
      default: return { bg: '#f1f3f5', text: '#5f6368' };
    }
  };

  return (
    <div className={styles.pageContainer} ref={pageRef}>
      <Navbar />
      
      <main className={styles.content}>
        <header className="sadrzaj">
          <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Pregled plaćanja</h1>
          <p style={{ color: '#666', marginBottom: '30px' }}>Istorija transakcija i menjačkih poslova</p>
        </header>

        {/* FILTERI */}
        <section className={`${styles.filterBox} sadrzaj`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontSize: '11px', fontWeight: 'bold' }}>STATUS</label>
            <select 
              style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ddd', minWidth: '150px' }}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">Svi statusi</option>
              <option value="Realizovano">Realizovano</option>
              <option value="U obradi">U obradi</option>
              <option value="Odbijeno">Odbijeno</option>
            </select>
          </div>
          <button style={{ 
            padding: '11px 25px', background: '#212529', color: 'white', 
            border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold'
          }}>
            Primeni filter
          </button>
        </section>

        {/* TABELA */}
        <div className={`${styles.tableCard} sadrzaj`}>
          <table className={styles.mainTable}>
            <thead>
              <tr>
                <th>Datum i vreme</th>
                <th>Primalac / Svrha</th>
                <th style={{ textAlign: 'right' }}>Iznos</th>
                <th style={{ textAlign: 'center' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map(t => {
                const colors = getStatusColor(t.status);
                return (
                  <tr key={t.id}>
                    <td>{t.date}</td>
                    <td>
                      <div style={{ fontWeight: '500' }}>{t.recipient}</div>
                      <div style={{ fontSize: '11px', color: '#888' }}>{t.type === 'exchange' ? 'Interni prenos' : 'Plaćanje'}</div>
                    </td>
                    <td style={{ textAlign: 'right' }} className={t.amount < 0 ? styles.amountNegative : styles.amountPositive}>
                      {t.amount.toLocaleString('sr-RS', { minimumFractionDigits: 2 })} {t.currency}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={styles.status} style={{ background: colors.bg, color: colors.text }}>
                        {t.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}