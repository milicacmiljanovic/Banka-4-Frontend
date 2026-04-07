import styles from './TaxCalculationModal.module.css';

/**
 * TaxCalculationModal
 *
 * Props:
 *   user    – user object (null when bulk=true)
 *   bulk    – boolean, true = run for all users
 *   loading – boolean
 *   onConfirm – () => void
 *   onClose   – () => void
 */
export default function TaxCalculationModal({ user, bulk, loading, onConfirm, onClose }) {
  const title = 'Pokreni obračun i naplatu poreza za sve korisnike';

  const desc = bulk
    ? 'Ova akcija će izračunati porez na kapitalnu dobit za prethodni mesec (15% od dobiti) za sve korisnike i skinuti iznos sa njihovih računa. Više računa u različitim valutama se konvertuje u RSD bez provizije.'
    : `Ova akcija će pokrenuti naplatu poreza na kapitalnu dobit za sve korisnike (uključujući ${user?.first_name ?? ''} ${user?.last_name ?? ''}). Više računa u različitim valutama se konvertuje u RSD bez provizije.`;

  function handleBackdrop(e) {
    if (e.target === e.currentTarget && !loading) onClose();
  }

  return (
    <div className={styles.backdrop} onClick={handleBackdrop} role="dialog" aria-modal="true">
      <div className={styles.modal}>

        {/* Icon */}
        <div className={styles.iconWrap}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        </div>

        <h2 className={styles.title}>{title}</h2>

        {!bulk && user && (
          <div className={styles.userChip}>
            <span className={styles.userChipName}>{user.first_name} {user.last_name}</span>
            <span className={styles.userChipEmail}>{user.email}</span>
          </div>
        )}

        <p className={styles.desc}>{desc}</p>

        {/* Formula reminder */}
        <div className={styles.formula}>
          <div className={styles.formulaRow}>
            <span>Dobit</span>
            <span>= Prodajna cena − Kupovna cena</span>
          </div>
          <div className={styles.formulaRow}>
            <span>Porez</span>
            <span>= Dobit × <strong>15%</strong></span>
          </div>
          <div className={styles.formulaNote}>
            Ako dobit &lt; 0 → porez = 0 &nbsp;·&nbsp; Viševalutni računi se konvertuju u RSD
          </div>
        </div>

        <div className={styles.actions}>
          <button
            className={styles.btnCancel}
            onClick={onClose}
            disabled={loading}
          >
            Otkaži
          </button>
          <button
            className={styles.btnConfirm}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className={styles.spinner} />
                Procesiranje...
              </>
            ) : (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                Pokreni obračun
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
