import { useState, useRef, useLayoutEffect } from 'react';
import gsap                                   from 'gsap';
import { useFetch }                           from '../../hooks/useFetch';
import { useDebounce }                        from '../../hooks/useDebounce';
import { clientsApi }                         from '../../api/endpoints/clients';
import Navbar                                 from '../../components/layout/Navbar';
import Spinner                                from '../../components/ui/Spinner';
import Alert                                  from '../../components/ui/Alert';
import CardsFilters                           from '../../features/cards/CardsFilters';
import CardsTable                             from '../../features/cards/CardsTable';
import UnblockCardModal                       from '../../features/cards/UnblockCardModal';
import styles                                 from './CardsPortal.module.css';

export default function CardsPortal() {
  const pageRef = useRef(null);

  const [filters, setFilters] = useState({
    first_name: '', last_name: '', jmbg: '', account_number: '',
  });

  const debFirst   = useDebounce(filters.first_name,     400);
  const debLast    = useDebounce(filters.last_name,      400);
  const debJmbg    = useDebounce(filters.jmbg,           400);
  const debAccount = useDebounce(filters.account_number, 400);

  const { data, loading, error, refetch } = useFetch(
    () => {
      const params = {};
      if (debFirst)   params.first_name     = debFirst;
      if (debLast)    params.last_name      = debLast;
      if (debJmbg)    params.jmbg           = debJmbg;
      if (debAccount) params.account_number = debAccount;
      return clientsApi.getAll(params);
    },
    [debFirst, debLast, debJmbg, debAccount]
  );

  const [modalTarget,    setModalTarget]    = useState(null);
  const [unblockSuccess, setUnblockSuccess] = useState(null);

  function handleUnblockClick({ card, clientName }) {
    setUnblockSuccess(null);
    setModalTarget({ card, clientName });
  }

  function handleModalSuccess() {
    setModalTarget(null);
    setUnblockSuccess('Kartica je uspešno deblokirana.');
    refetch();
  }

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.page-anim', { opacity: 0, y: 20, duration: 0.45, stagger: 0.07, ease: 'power2.out' });
    }, pageRef);
    return () => ctx.revert();
  }, []);

  const clients = data?.data ?? [];

  return (
    <div ref={pageRef} className={styles.stranica}>
      <Navbar />
      <main className={styles.sadrzaj}>

        <div className="page-anim">
          <div className={styles.breadcrumb}>
            <span>Admin</span><span className={styles.sep}>›</span>
            <span className={styles.current}>Portal za račune i kartice</span>
          </div>
          <h1 className={styles.title}>Portal za račune i kartice</h1>
          <p className={styles.desc}>
            Pregled klijenata i upravljanje karticama. Jedino mesto za deblokadu kartice.
          </p>
        </div>

        {unblockSuccess && (
          <div className="page-anim">
            <Alert tip="uspeh" poruka={unblockSuccess} />
          </div>
        )}

        <div className="page-anim">
          <CardsFilters filters={filters} onChange={setFilters} />
        </div>

        {loading && <Spinner />}
        {!loading && error && (
          <Alert tip="greska" poruka={error?.response?.data?.error ?? 'Greška pri učitavanju klijenata.'} />
        )}
        {!loading && !error && (
          <div className="page-anim">
            <CardsTable clients={clients} onUnblockClick={handleUnblockClick} />
          </div>
        )}

      </main>

      {modalTarget && (
        <UnblockCardModal
          card={modalTarget.card}
          clientName={modalTarget.clientName}
          onClose={() => setModalTarget(null)}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  );
}
