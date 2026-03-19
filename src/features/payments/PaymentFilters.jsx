import { useState } from 'react';
import styles from './PaymentFilters.module.css';

export default function PaymentFilters({ filters, onFilterChange }) {
    const [error, setError] = useState('');

    function update(key, value) {
        // Ako menjamo min iznos, proveravamo da li je veći od max
        if (key === 'amountFrom' && filters.amountTo !== '' && Number(value) > Number(filters.amountTo)) {
            setError('Min iznos ne sme biti veći od Max iznosa');
            return; // ne dozvoljavamo update
        } else {
            setError(''); // nema greške
        }
        onFilterChange({ ...filters, [key]: value });
    }

    return (
        <div className={styles.filters}>
            {/* STATUS */}
            <div className={styles.inputGroup}>
                <span className={styles.label}>Status</span>
                <select
                    value={filters.status}
                    onChange={e => update('status', e.target.value)}
                    className={styles.selectInput}
                >
                    <option value="">Svi statusi</option>
                    <option value="Realizovano">Realizovano</option>
                    <option value="U obradi">U obradi</option>
                    <option value="Odbijeno">Odbijeno</option>
                </select>
            </div>

            {/* DATUM OD */}
            <div className={styles.inputGroup}>
                <span className={styles.label}>Od datuma</span>
                <input
                    type="date"
                    className={styles.dateInput}
                    value={filters.dateFrom}
                    onChange={e => update('dateFrom', e.target.value)}
                />
            </div>

            {/* DATUM DO */}
            <div className={styles.inputGroup}>
                <span className={styles.label}>Do datuma</span>
                <input
                    type="date"
                    className={styles.dateInput}
                    value={filters.dateTo}
                    onChange={e => update('dateTo', e.target.value)}
                />
            </div>

            {/* MIN IZNOS */}
            <div className={styles.inputGroup}>
                <span className={styles.label}>Min Iznos</span>
                <input
                    type="number"
                    value={filters.amountFrom}
                    onChange={e => update('amountFrom', e.target.value)}
                    className={error ? styles.errorInput : ''}
                />
                {error && <span className={styles.errorMessage}>{error}</span>}
            </div>

            {/* MAX IZNOS */}
            <div className={styles.inputGroup}>
                <span className={styles.label}>Max Iznos</span>
                <input
                    type="number"
                    value={filters.amountTo}
                    onChange={e => update('amountTo', e.target.value)}
                />
            </div>
        </div>
    );
}