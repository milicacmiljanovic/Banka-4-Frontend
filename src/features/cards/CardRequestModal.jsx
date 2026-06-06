import { useEffect, useMemo, useState } from 'react';
import Alert from '../../components/ui/Alert';
import styles from '../../pages/admin/CardsPage.module.css';

function isBusinessAccount(acc) {
  const type = (acc.account_type ?? acc.type ?? '').toUpperCase();
  return type.includes('BUSINESS') || type.includes('POSLOVNI') || !!acc.company_name;
}

export default function CardRequestModal({
  open,
  onClose,
  onContinue,
  cards,
  selectedCard,
  accounts = [],
}) {
  const [form, setForm] = useState({
    accountNumber: '',
    makeCard: true,
    authorizedFirstName: '',
    authorizedLastName: '',
    authorizedJmbg: '',
  });

  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    setTimeout(() => {
      setForm({
        accountNumber: accounts[0]?.account_number ?? accounts[0]?.number ?? selectedCard?.accountNumber ?? '',
        makeCard: true,
        authorizedFirstName: '',
        authorizedLastName: '',
        authorizedJmbg: '',
      });
      setError(null);
    }, 0);
  }, [open, selectedCard, accounts]);

  // Check card limit for selected account
  const selectedAccount = useMemo(() => {
    return accounts.find(a => (a.account_number ?? a.number) === form.accountNumber);
  }, [accounts, form.accountNumber]);

  const isBusiness = selectedAccount ? isBusinessAccount(selectedAccount) : false;

  const cardsForAccount = useMemo(() => {
    return cards.filter(c => (c.accountNumber ?? c.account_number) === form.accountNumber);
  }, [cards, form.accountNumber]);

  const maxReached = isBusiness
    ? false // business: 1 per authorized person — validated by backend
    : cardsForAccount.length >= 2; // personal: max 2

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (error) setError(null);
  }

  function handleSubmit(e) {
    e.preventDefault();

    if (!form.makeCard) {
      setError('Morate označiti opciju "Napravi karticu".');
      return;
    }

    if (!form.accountNumber.trim()) {
      setError('Izaberite račun.');
      return;
    }

    if (maxReached) {
      setError('Ovaj račun već ima maksimalan broj kartica (2).');
      return;
    }

    if (isBusiness) {
      if (!form.authorizedFirstName.trim() || !form.authorizedLastName.trim()) {
        setError('Unesite ime i prezime ovlašćenog lica.');
        return;
      }
      const jmbgDigits = form.authorizedJmbg.replace(/\D/g, '');
      if (jmbgDigits.length !== 13) {
        setError('JMBG ovlašćenog lica mora imati tačno 13 cifara.');
        return;
      }
    }

    const payload = {
      ...form,
      authorizedPerson: isBusiness
        ? `${form.authorizedFirstName.trim()} ${form.authorizedLastName.trim()}`
        : undefined,
    };

    onContinue(payload);
  }

  if (!open) return null;

  return (
    <div className={styles.modalBackdrop}>
      <div className={styles.modalCard}>
        <div className={styles.modalHeader}>
          <div>
            <h3 className={styles.modalTitle}>Zatraži novu karticu</h3>
            <p className={styles.modalText}>
              Izaberite račun i potvrdite zahtev kroz 2FA kod.
            </p>
          </div>
          <button type="button" className={styles.closeIconButton} onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalBody}>
          {error && <Alert tip="greska" poruka={error} />}

          <div className={styles.modalGrid}>
            <label className={styles.field}>
              <span>Račun</span>
              {accounts.length > 0 ? (
                <select
                  value={form.accountNumber}
                  onChange={(e) => updateField('accountNumber', e.target.value)}
                >
                  <option value="">Izaberite račun...</option>
                  {accounts.map(acc => {
                    const num = acc.account_number ?? acc.number;
                    const accCards = cards.filter(c => (c.accountNumber ?? c.account_number) === num);
                    const accIsBusiness = isBusinessAccount(acc);
                    const accMaxed = !accIsBusiness && accCards.length >= 2;
                    return (
                      <option key={num} value={num} disabled={accMaxed}>
                        {acc.name ?? 'Račun'} — {num} {accMaxed ? '(max kartica)' : ''}
                      </option>
                    );
                  })}
                </select>
              ) : (
                <input
                  type="text"
                  placeholder="Broj računa"
                  value={form.accountNumber}
                  onChange={(e) => updateField('accountNumber', e.target.value)}
                />
              )}
            </label>
          </div>

          <label className={styles.checkboxRow}>
            <input
              type="checkbox"
              checked={form.makeCard}
              onChange={(e) => updateField('makeCard', e.target.checked)}
            />
            <span>Napravi karticu</span>
          </label>

          {maxReached && (
            <p className={styles.disabledNote}>
              Lični račun može imati najviše 2 kartice. Ovaj račun je dostigao limit.
            </p>
          )}

          {isBusiness && (
            <>
              <div className={styles.modalGrid}>
                <label className={styles.field}>
                  <span>Ime ovlašćenog lica</span>
                  <input
                    type="text"
                    placeholder="Ime"
                    value={form.authorizedFirstName}
                    onChange={(e) => updateField('authorizedFirstName', e.target.value)}
                  />
                </label>
                <label className={styles.field}>
                  <span>Prezime ovlašćenog lica</span>
                  <input
                    type="text"
                    placeholder="Prezime"
                    value={form.authorizedLastName}
                    onChange={(e) => updateField('authorizedLastName', e.target.value)}
                  />
                </label>
              </div>
              <label className={styles.field}>
                <span>JMBG ovlašćenog lica</span>
                <input
                  type="text"
                  maxLength={13}
                  placeholder="0000000000000"
                  value={form.authorizedJmbg}
                  onChange={(e) => updateField('authorizedJmbg', e.target.value.replace(/\D/g, ''))}
                />
              </label>
            </>
          )}

          <div className={styles.modalActions}>
            <button type="button" className={styles.btnGhost} onClick={onClose}>
              Otkaži
            </button>
            <button type="submit" className={styles.btnPrimary} disabled={maxReached}>
              Potvrdi zahtev
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
