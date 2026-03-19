import { useState, useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { useFetch } from '../../hooks/useFetch';
import { paymentsApi } from '../../api/endpoints/payments';
import Navbar from '../../components/layout/Navbar';
import Spinner from '../../components/ui/Spinner';
import Alert from '../../components/ui/Alert';
import PaymentTable from '../../features/payments/PaymentTable';
import PaymentFilters from '../../features/payments/PaymentFilters';
import TransactionDetailsModal from '../../features/payments/TransactionDetailsModal';
import styles from './EmployeeList.module.css';

export default function PaymentOverview() {
  const pageRef = useRef(null);
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.page-anim', {
        opacity: 0,
        y: 24,
        duration: 0.45,
        stagger: 0.08,
        ease: 'power2.out',
      });
    }, pageRef);
    return () => ctx.revert();
  }, []);

  const [activeTab, setActiveTab] = useState('payments');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // STATE ZA ODABRANU TRANSAKCIJU
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  // Filteri moraju imati ove tačne ključeve
  const [filters, setFilters] = useState({
    status: '',
    dateFrom: '',
    dateTo: '',
    amountFrom: '',
    amountTo: ''
  });

  const { data, loading, error } = useFetch(
    () => {
      const params = { 
        page, 
        page_size: pageSize,
        type: activeTab === 'payments' ? 'payment' : 'exchange',
        ...filters // <--- Šalje SVE: status, dateFrom, dateTo, itd.
      };
      return paymentsApi.getAll(params);
    },
    [activeTab, page, filters] // Osvežava se na svaku promenu filtera
  );

  function handleFilterChange(newFilters) {
    setFilters(newFilters);
    setPage(1);
  }

  const totalPages = data?.total_pages ?? 0;

  return (
    <div ref={pageRef} className={styles.stranica}>
      <Navbar />
      <main className={styles.sadrzaj}>
        <div className={`page-anim ${styles.pageHeader}`}>
          <h1 className={styles.pageTitle}>Pregled plaćanja</h1>
        </div>

        {/* TABS */}
        <div className="page-anim" style={{ display: 'flex', gap: '20px', marginBottom: '20px', borderBottom: '1px solid #eee' }}>
           <button 
             onClick={() => { setActiveTab('payments'); setPage(1); }}
             style={{ padding: '10px', border: 'none', background: 'none', cursor: 'pointer', borderBottom: activeTab === 'payments' ? '2px solid #1b4fd8' : 'none', fontWeight: activeTab === 'payments' ? 'bold' : 'normal' }}
           >
             Domaća plaćanja
           </button>
           <button 
             onClick={() => { setActiveTab('exchange'); setPage(1); }}
             style={{ padding: '10px', border: 'none', background: 'none', cursor: 'pointer', borderBottom: activeTab === 'exchange' ? '2px solid #1b4fd8' : 'none', fontWeight: activeTab === 'exchange' ? 'bold' : 'normal' }}
           >
             Menjačnica
           </button>
        </div>

        <div className="page-anim">
        <PaymentFilters filters={filters} onFilterChange={handleFilterChange} />
        </div>

        {loading && <Spinner />}
        {error && <Alert tip="greska" poruka="Greška pri učitavanju." />}

        {!loading && !error && data && (
          <div className={`page-anim ${styles.tableCard}`}>
            <PaymentTable transactions={data.data} onRowClick={(transaction) => setSelectedTransaction(transaction)} />
            {totalPages > 1 && (
              <div className={styles.pagination}>
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prethodna</button>
                <span>Strana {page} od {totalPages}</span>
                <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Sledeća →</button>
              </div>
            )}
          </div>
        )}

        {/* 4. PRIKAZ MODALA AKO JE TRANSAKCIJA ODABRANA */}
        {selectedTransaction && (
          <TransactionDetailsModal 
            transaction={selectedTransaction} 
            onClose={() => setSelectedTransaction(null)} 
          />
        )}
      </main>
    </div>
  );
}