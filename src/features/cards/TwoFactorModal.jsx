import { useEffect, useState } from 'react';
import Alert from '../../components/ui/Alert';
import styles from '../../pages/CardsPage.module.css';

export default function TwoFactorModal({
  open,
  onClose,
  onConfirm,
  loading = false,
}) {
  const [code, setCode] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    setCode('');
    setError(null);
  }, [open]);

  const isValidCode = /^\d{6}$/.test(code);

  function handleSubmit(e) {
    e.preventDefault();

    if (!isValidCode) {
      setError('Unesite ispravan 6-cifren kod.');
      return;
    }

    onConfirm(code);
  }

  if (!open) return null;

  return (
    <div className={styles.modalBackdrop}>
      <div className={styles.modalCardSmall}>
        <div className={styles.modalHeader}>
          <div>
            <h3 className={styles.modalTitle}>2FA potvrda</h3>
            <p className={styles.modalText}>
              Unesite 6-cifreni kod pre finalnog slanja zahteva.
            </p>
          </div>

          <button type="button" className={styles.closeIconButton} onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalBody}>
          {error && <Alert tip="greska" poruka={error} />}

          <label className={styles.field}>
            <span>6-cifren kod</span>
            <input
              type="text"
              maxLength={6}
              value={code}
              onChange={(e) => {
                const next = e.target.value.replace(/\D/g, '');
                setCode(next);
                if (error) setError(null);
              }}
            />
          </label>

          <div className={styles.modalActions}>
            <button type="button" className={styles.btnGhost} onClick={onClose}>
              Nazad
            </button>

            <button
              type="submit"
              className={styles.btnPrimary}
              disabled={!isValidCode || loading}
            >
              {loading ? 'Potvrđivanje...' : 'Pošalji zahtev'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}