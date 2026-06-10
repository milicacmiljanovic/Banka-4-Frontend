import { useState, useEffect } from 'react';
import Alert          from '../../components/ui/Alert';
import styles         from './LoanRateSection.module.css';

export default function LoanRateSection({ onUpdate, saving, saveError, saveSuccess }) {
  const [value,      setValue]      = useState('');
  const [localError, setLocalError] = useState(null);

  useEffect(() => {
    if (saveSuccess) setTimeout(() => setValue(''), 0);
  }, [saveSuccess]);

  function handleSubmit(e) {
    e.preventDefault();
    const val = parseFloat(value);
    if (isNaN(val)) {
      setLocalError('Unesite validnu numeričku vrednost (npr. 3.25).');
      return;
    }
    setLocalError(null);
    onUpdate(val);
  }

  const error = localError || saveError;

  return (
    <div className={styles.card}>
      <p className={styles.desc}>
        Unesite novi mesečni pomeraj referentne stope (npr. vrednost Euribora ili Belibora).
        Sistem će automatski ažurirati sve kredite sa varijabilnom kamatnom stopom i
        zabeležiti akciju u audit logu.
      </p>

      {saveSuccess && <Alert tip="uspeh"  poruka={saveSuccess} />}
      {error       && <Alert tip="greska" poruka={error} />}

      <form onSubmit={handleSubmit} noValidate className={styles.form}>
        <label className={styles.label}>
          Nova referentna stopa (%)
        </label>
        <div className={styles.row}>
          <input
            type="number"
            step="0.01"
            placeholder="npr. 3.25"
            value={value}
            onChange={e => { setValue(e.target.value); setLocalError(null); }}
            className={error ? styles.inputErr : styles.input}
            aria-label="Vrednost referentne stope"
          />
          <button
            type="submit"
            disabled={saving || !value.trim()}
            className={styles.btnPrimary}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            {saving ? 'Ažuriram...' : 'Potvrdi i ažuriraj sve kredite'}
          </button>
        </div>
      </form>
    </div>
  );
}
