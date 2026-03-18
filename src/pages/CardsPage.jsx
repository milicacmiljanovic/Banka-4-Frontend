import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import Alert from '../components/ui/Alert';
import CardVisual from '../features/cards/CardVisual';
import CardDetailsPanel from '../features/cards/CardDetailsPanel';
import CardRequestModal from '../features/cards/CardRequestModal';
import TwoFactorModal from '../features/cards/TwoFactorModal';
import { cardsApi } from '../api/endpoints/cards';
import { useAuthStore } from '../store/authStore';
import {
  CARD_STATUS,
  PORTAL_TYPE,
  formatDate,
  formatLimit,
  normalizeCard,
} from '../utils/cardHelpers';
import styles from './CardsPage.module.css';
import Navbar from '../components/layout/Navbar';

const VIEW_MODE = {
  OVERVIEW: 'overview',
  DETAILS: 'details',
};

const MOCK_CARDS = [
  {
    id: 1,
    card_number: '5326123412343458',
    holder_name: 'Petar Petrović',
    expiration_date: '08/27',
    creation_date: '2022-06-15T00:00:00Z',
    cvv: '312',
    type: 'Debitna',
    account_name: 'Lični tekući račun',
    account_number: '12345678901234578',
    limit_daily: 50000,
    limit_monthly: 120000,
    limit: 120000,
    status: CARD_STATUS.ACTIVE,
    transactions: [
      { id: 't1', accountName: 'Nečiji račun', date: '2024-03-22', status: 'processing', amount: 1000 },
      { id: 't2', accountName: 'Nečiji račun', date: '2024-03-22', status: 'done', amount: 1000 },
      { id: 't3', accountName: 'Nečiji račun', date: '2024-03-22', status: 'denied', amount: 1000 },
      { id: 't4', accountName: 'Nečiji račun', date: '2024-03-22', status: 'denied', amount: 1000 },
    ],
  },
  {
    id: 2,
    card_number: '4532123412341289',
    holder_name: 'Petar Petrović',
    expiration_date: '04/28',
    creation_date: '2023-01-09T00:00:00Z',
    cvv: '491',
    type: 'Debitna',
    account_name: 'Devizni račun',
    account_number: '265000000000123456',
    limit_daily: 30000,
    limit_monthly: 85000,
    limit: 85000,
    status: CARD_STATUS.BLOCKED,
    transactions: [
      { id: 't5', accountName: 'Putni trošak', date: '2024-04-12', status: 'done', amount: 7200 },
      { id: 't6', accountName: 'Prodavnica', date: '2024-04-11', status: 'processing', amount: 3600 },
    ],
  },
];

export default function CardsPage({ portalType = PORTAL_TYPE.CLIENT }) {
  const pageRef = useRef(null);
  const user = useAuthStore((s) => s.user);

  const [cards, setCards] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [viewMode, setViewMode] = useState(VIEW_MODE.OVERVIEW);
  const [loading, setLoading] = useState(true);
  const [submitting2FA, setSubmitting2FA] = useState(false);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [twoFactorOpen, setTwoFactorOpen] = useState(false);
  const [pendingRequest, setPendingRequest] = useState(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const nodes = pageRef.current?.querySelectorAll('.page-anim');
      if (!nodes?.length) return;

      gsap.from(nodes, {
        opacity: 0,
        y: 20,
        duration: 0.45,
        stagger: 0.08,
        ease: 'power2.out',
      });
    }, pageRef);

    return () => ctx.revert();
  }, [viewMode]);

  useEffect(() => {
    let mounted = true;

    async function loadCards() {
      setLoading(true);
      setError(null);

      try {
        if (!user?.id) {
          throw new Error('Korisnik nije učitan.');
        }

        const response = await cardsApi.getByUser(user.id);
        const normalized = (Array.isArray(response) ? response : response?.items ?? []).map(normalizeCard);

        if (!mounted) return;

        const finalCards = normalized.length > 0 ? normalized : MOCK_CARDS.map(normalizeCard);
        setCards(finalCards);
        setSelectedIndex(0);
      } catch (err) {
        if (!mounted) return;

        setCards(MOCK_CARDS.map(normalizeCard));
        setSelectedIndex(0);
        setError(err?.message || 'Kartice trenutno nisu dostupne. Prikazan je mock prikaz radi razvoja.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadCards();

    return () => {
      mounted = false;
    };
  }, [user?.id]);

  const selectedCard = useMemo(() => {
    if (cards.length === 0) return null;
    return cards[selectedIndex] ?? cards[0] ?? null;
  }, [cards, selectedIndex]);

  function moveSelection(direction) {
    setSelectedIndex((prev) => {
      if (cards.length === 0) return 0;
      if (direction === 'prev') return prev === 0 ? cards.length - 1 : prev - 1;
      return prev === cards.length - 1 ? 0 : prev + 1;
    });
  }

  function openDetails() {
    setViewMode(VIEW_MODE.DETAILS);
  }

  function goBackToOverview() {
    setViewMode(VIEW_MODE.OVERVIEW);
  }

  function openRequestModal() {
    setRequestModalOpen(true);
  }

  function handleRequestContinue(formData) {
    setPendingRequest(formData);
    setRequestModalOpen(false);
    setTwoFactorOpen(true);
  }

  async function handleConfirm2FA(code) {
    if (!user?.id || !pendingRequest) return;

    setSubmitting2FA(true);

    try {
      await cardsApi.requestNew(user.id, {
        ...pendingRequest,
        verification_code: code,
      });

      const newCard = normalizeCard({
        id: Date.now(),
        card_number: `4532${Math.floor(Math.random() * 100000000000).toString().padStart(12, '0')}`,
        holder_name: user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : 'Korisnik',
        expiration_date: '12/29',
        creation_date: new Date().toISOString(),
        cvv: '999',
        type: 'Debitna',
        account_name: pendingRequest.accountName,
        account_number: pendingRequest.accountNumber,
        limit_daily: 20000,
        limit_monthly: 60000,
        limit: 60000,
        status: CARD_STATUS.ACTIVE,
        transactions: [],
        authorized_jmbg: pendingRequest.authorizedJmbg || null,
      });

      setCards((prev) => [...prev, newCard]);
      setSelectedIndex(cards.length);
      setTwoFactorOpen(false);
      setPendingRequest(null);
      setFeedback({ type: 'uspeh', text: 'Zahtev za novu karticu je uspešno poslat.' });
    } catch (err) {
      setFeedback({ type: 'greska', text: err?.message || 'Slanje zahteva nije uspelo.' });
    } finally {
      setSubmitting2FA(false);
    }
  }

  async function handleAction(cardId, actionKey) {
    try {
      if (actionKey === 'block') await cardsApi.block(cardId);
      if (actionKey === 'unblock') await cardsApi.unblock(cardId);
      if (actionKey === 'deactivate') await cardsApi.deactivate(cardId);

      setCards((prev) =>
        prev.map((card) => {
          if (card.id !== cardId) return card;

          if (actionKey === 'block') return { ...card, status: CARD_STATUS.BLOCKED };
          if (actionKey === 'unblock') return { ...card, status: CARD_STATUS.ACTIVE };
          if (actionKey === 'deactivate') return { ...card, status: CARD_STATUS.DEACTIVATED };

          return card;
        })
      );

      setFeedback({ type: 'uspeh', text: 'Akcija nad karticom je uspešno izvršena.' });
    } catch (err) {
      setFeedback({ type: 'greska', text: err?.message || 'Akcija trenutno nije uspela.' });
    }
  }

  async function handleSaveLimits(cardId, payload) {
    try {
      await cardsApi.updateLimits(cardId, payload);

      setCards((prev) =>
        prev.map((card) =>
          card.id === cardId
            ? {
                ...card,
                limitDaily: payload.daily_limit,
                limitMonthly: payload.monthly_limit,
              }
            : card
        )
      );

      setFeedback({ type: 'uspeh', text: 'Limiti su sačuvani.' });
    } catch (err) {
      setFeedback({ type: 'greska', text: err?.message || 'Čuvanje limita nije uspelo.' });
    }
  }

  if (loading) {
    return (
      <div ref={pageRef} className={styles.page}>
        <div className={styles.loadingState}>Učitavanje kartica...</div>
      </div>
    );
  }

  if (!selectedCard) {
    return (
      <div ref={pageRef} className={styles.page}>
        <div className={styles.emptyState}>Nema dostupnih kartica za prikaz.</div>
      </div>
    );
  }

  return (
    <div ref={pageRef} className={styles.page}>
      <Navbar/>
      <main className={styles.sadrzaj}>

      {error && (
        <div className="page-anim">
          <Alert tip="greska" poruka={error} />
        </div>
      )}

      {feedback && (
        <div className="page-anim">
          <Alert tip={feedback.type} poruka={feedback.text} />
        </div>
      )}

      {viewMode === VIEW_MODE.OVERVIEW ? (
        <>
          <div className={`page-anim ${styles.topBar}`}>
            <div>
              <h1 className={styles.pageTitle}>Kartice</h1>
              <p className={styles.pageDescription}>Upravljajte vašim platnim karticama</p>
            </div>

            <button type="button" className={styles.btnPrimary} onClick={openRequestModal}>
              Zatraži novu
            </button>
          </div>

          <section className={`page-anim ${styles.heroSection}`}>
            <div className={styles.heroControls}>
              <button
                type="button"
                className={styles.navCircle}
                onClick={() => moveSelection('prev')}
              >
                ‹
              </button>

              <button
                type="button"
                className={styles.navCircle}
                onClick={() => moveSelection('next')}
              >
                ›
              </button>

              <div className={styles.paginationDots}>
                {cards.map((card, index) => (
                  <button
                    key={card.id}
                    type="button"
                    aria-label={`Prikaži karticu ${index + 1}`}
                    className={`${styles.dot} ${index === selectedIndex ? styles.dotActive : ''}`}
                    onClick={() => setSelectedIndex(index)}
                  />
                ))}
              </div>
            </div>

            <div className={styles.cardRow}>
              <div className={styles.cardWrap}>
                <CardVisual card={selectedCard} onOpenDetails={openDetails} />
              </div>
            </div>
          </section>


          {/* Ovaj section je samo mock, deluje mi da se ova komponenta i njene funkcionalnosti implementiraju kao deo nekog drugog taska, sudeci po figmi. */}
          <section className={`page-anim ${styles.transactionsCard}`}>
            <div className={styles.transactionsHeader}>
              <div>
                <p className={styles.eyebrow}>Pregled transakcija</p>
              </div>
              <span className={styles.transactionsLink}>Transakcije</span>
            </div>

            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Bankovni račun</th>
                    <th>Datum</th>
                    <th>Status</th>
                    <th>Iznos</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {selectedCard.transactions.length === 0 && (
                    <tr>
                      <td colSpan="5" className={styles.emptyTable}>
                        Nema transakcija za prikaz.
                      </td>
                    </tr>
                  )}

                  {selectedCard.transactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td>{transaction.accountName}</td>
                      <td>{formatDate(transaction.date)}</td>
                      <td>
                        <span className={`${styles.transactionStatus} ${styles[`transaction_${transaction.status}`]}`}>
                          {transaction.status}
                        </span>
                      </td>
                      <td>{formatLimit(transaction.amount)} RSD</td>
                      <td className={styles.detailsCell}>Detalji</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : (
        <>
          <div className="page-anim">
            <div className={styles.breadcrumb}>
              <button type="button" className={styles.breadcrumbBack} onClick={goBackToOverview}>
                ← Kartice
              </button>
              <span className={styles.breadcrumbSep}>/</span>
              <span className={styles.breadcrumbCurrent}>Detalji</span>
            </div>

            <h1 className={styles.pageTitle}>Detalji kartice</h1>
            <p className={styles.pageDescription}>Pregled svih informacija o odabranoj kartici</p>
          </div>

          <section className={`page-anim ${styles.detailsPageWrap}`}>
            <CardDetailsPanel
              card={selectedCard}
              portalType={portalType}
              onAction={handleAction}
              onSaveLimits={handleSaveLimits}
              onBack={goBackToOverview}
            />
          </section>
        </>
      )} </main>

      <CardRequestModal
        open={requestModalOpen}
        onClose={() => setRequestModalOpen(false)}
        onContinue={handleRequestContinue}
        cards={cards}
        selectedCard={selectedCard}
      />

      <TwoFactorModal
        open={twoFactorOpen}
        onClose={() => setTwoFactorOpen(false)}
        onConfirm={handleConfirm2FA}
        loading={submitting2FA}
      />
    </div>
  );
}