import { useState, useEffect } from 'react';
import Alert                   from '../../components/ui/Alert';
import styles                  from './LimitModal.module.css';

export default function LimitModal({ open, onClose, onConfirm, actuary, loading }) {
  const [newLimit, setNewLimit] = useState('');
  const [error,    setError]    = useState(null);

  useEffect(() => {
    if (!open) {
      setTimeout(() => { setNewLimit(''); setError(null); }, 0);
    } else if (actuary) {
      setTimeout(() => setNewLimit(actuary.limit ?? ''), 0);
    }
  }, [open, actuary]);

  if (!open) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    const parsed = Number(newLimit);
    if (!newLimit.toString().trim() || isNaN(parsed) || parsed <= 0) {
      setError('Unesite validan limit (pozitivan broj).');
      return;
    }
    const usedLimit = actuary?.used_limit ?? 0;
    if (parsed < usedLimit) {
      setError(`Novi limit ne sme biti manji od iskorišćenog limita (${usedLimit.toLocaleString('sr-RS')} RSD).`);
      return;
    }
    setError(null);
    await onConfirm(parsed);
  }

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <h3 className={styles.title}>Promeni limit</h3>
        <p className={styles.subtitle}>
          {actuary ? `${actuary.first_name} ${actuary.last_name}` : 'Aktuaр'}
        </p>
        <div className={styles.divider} />

        {error && <Alert tip="greska" poruka={error} />}

        <form onSubmit={handleSubmit} noValidate>
          <div className={styles.field}>
            <label>Trenutni limit</label>
            <div className={styles.currentLimit}>
              {actuary?.limit?.toLocaleString('sr-RS')} RSD
            </div>
          </div>
          <div className={styles.field}>
            <label>Iskorišćen limit</label>
            <div className={styles.currentLimit}>
              {(actuary?.used_limit ?? 0).toLocaleString('sr-RS')} RSD
            </div>
          </div>

          <div className={styles.field}>
            <label>
              Novi limit <span className={styles.required}>*</span>
            </label>
            <input
              type="number"
              min="0"
              value={newLimit}
              onChange={e => { setNewLimit(e.target.value); setError(null); }}
              placeholder="Unesite novi limit..."
              autoFocus
            />
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.btnGhost} onClick={onClose} disabled={loading}>
              Otkaži
            </button>
            <button type="submit" className={styles.btnPrimary} disabled={loading}>
              {loading ? 'Čuvanje...' : 'Potvrdi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
