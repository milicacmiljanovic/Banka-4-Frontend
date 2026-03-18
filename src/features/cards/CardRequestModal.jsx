import { useEffect, useMemo, useState } from 'react';
import Alert from '../../components/ui/Alert';
import styles from '../../pages/CardsPage.module.css';

const ACCOUNT_TYPE = {
  PERSONAL: 'PERSONAL',
  BUSINESS: 'BUSINESS',
};

export default function CardRequestModal({
  open,
  onClose,
  onContinue,
  cards,
  selectedCard,
}) {
  const [form, setForm] = useState({
    accountType: ACCOUNT_TYPE.PERSONAL,
    accountName: '',
    accountNumber: '',
    makeCard: true,
    authorizedFirstName: '',
    authorizedLastName: '',
    authorizedJmbg: '',
  });

  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;

    setForm({
      accountType: ACCOUNT_TYPE.PERSONAL,
      accountName: selectedCard?.accountName || '',
      accountNumber: selectedCard?.accountNumber || '',
      makeCard: true,
      authorizedFirstName: '',
      authorizedLastName: '',
      authorizedJmbg: '',
    });
    setError(null);
  }, [open, selectedCard]);

  const personalCardsForAccount = useMemo(() => {
    if (!form.accountNumber) return 0;
    return cards.filter((card) => card.accountNumber === form.accountNumber).length;
  }, [cards, form.accountNumber]);

  const businessCardsForAuthorized = useMemo(() => {
    if (!form.accountNumber || !form.authorizedJmbg) return 0;

    return cards.filter(
      (card) =>
        card.accountNumber === form.accountNumber &&
        card.authorizedJmbg &&
        card.authorizedJmbg === form.authorizedJmbg
    ).length;
  }, [cards, form.accountNumber, form.authorizedJmbg]);

  const personalLimitReached =
    form.accountType === ACCOUNT_TYPE.PERSONAL && personalCardsForAccount >= 2;

  const businessLimitReached =
    form.accountType === ACCOUNT_TYPE.BUSINESS &&
    form.authorizedJmbg &&
    businessCardsForAuthorized >= 1;

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

    if (!form.accountName.trim() || !form.accountNumber.trim()) {
      setError('Naziv i broj računa su obavezni.');
      return;
    }

    if (form.accountType === ACCOUNT_TYPE.PERSONAL && personalLimitReached) {
      setError('Dostignut limit');
      return;
    }

    if (form.accountType === ACCOUNT_TYPE.BUSINESS) {
      if (
        !form.authorizedFirstName.trim() ||
        !form.authorizedLastName.trim() ||
        !form.authorizedJmbg.trim()
      ) {
        setError('Za poslovni račun unesite podatke za ovlašćeno lice.');
        return;
      }

      if (!/^\d{13}$/.test(form.authorizedJmbg.trim())) {
        setError('JMBG mora imati 13 cifara.');
        return;
      }

      if (businessLimitReached) {
        setError('Za ovo ovlašćeno lice već postoji kartica na ovom računu.');
        return;
      }
    }

    onContinue(form);
  }

  if (!open) return null;

  return (
    <div className={styles.modalBackdrop}>
      <div className={styles.modalCard}>
        <div className={styles.modalHeader}>
          <div>
            <h3 className={styles.modalTitle}>Zatraži novu karticu</h3>
            <p className={styles.modalText}>
              Popunite podatke, zatim potvrđujete zahtev kroz 2FA kod.
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
              <span>Tip računa</span>
              <select
                value={form.accountType}
                onChange={(e) => updateField('accountType', e.target.value)}
              >
                <option value={ACCOUNT_TYPE.PERSONAL}>Lični račun</option>
                <option value={ACCOUNT_TYPE.BUSINESS}>Poslovni račun</option>
              </select>
            </label>

            <label className={styles.field}>
              <span>Naziv računa</span>
              <input
                type="text"
                value={form.accountName}
                onChange={(e) => updateField('accountName', e.target.value)}
              />
            </label>

            <label className={styles.field}>
              <span>Broj računa</span>
              <input
                type="text"
                value={form.accountNumber}
                onChange={(e) => updateField('accountNumber', e.target.value)}
              />
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

          {form.accountType === ACCOUNT_TYPE.PERSONAL && personalLimitReached && (
            <p className={styles.disabledNote}>
              Dugme „Zatraži novu” je onemogućeno — <strong>Dostignut limit</strong>.
            </p>
          )}

          {form.accountType === ACCOUNT_TYPE.BUSINESS && (
            <div className={styles.modalGrid}>
              <label className={styles.field}>
                <span>Ovlašćeno lice — Ime</span>
                <input
                  type="text"
                  value={form.authorizedFirstName}
                  onChange={(e) => updateField('authorizedFirstName', e.target.value)}
                />
              </label>

              <label className={styles.field}>
                <span>Ovlašćeno lice — Prezime</span>
                <input
                  type="text"
                  value={form.authorizedLastName}
                  onChange={(e) => updateField('authorizedLastName', e.target.value)}
                />
              </label>

              <label className={styles.field}>
                <span>Ovlašćeno lice — JMBG</span>
                <input
                  type="text"
                  value={form.authorizedJmbg}
                  onChange={(e) => updateField('authorizedJmbg', e.target.value)}
                />
              </label>
            </div>
          )}

          {form.accountType === ACCOUNT_TYPE.BUSINESS && businessLimitReached && (
            <p className={styles.disabledNote}>
              Za ovo ovlašćeno lice već postoji kartica na ovom računu.
            </p>
          )}

          <div className={styles.modalActions}>
            <button type="button" className={styles.btnGhost} onClick={onClose}>
              Otkaži
            </button>

            <button
              type="submit"
              className={styles.btnPrimary}
              disabled={personalLimitReached || businessLimitReached}
            >
              Potvrdi zahtev
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}