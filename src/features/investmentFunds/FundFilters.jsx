import styles from './FundFilters.module.css';

const SORT_OPTIONS = [
  { value: '',                  label: 'Podrazumevano sortiranje' },
  { value: 'name_asc',          label: 'Naziv (A–Z)'              },
  { value: 'name_desc',         label: 'Naziv (Z–A)'              },
  { value: 'totalValue_desc',   label: 'Ukupna vrednost (↓)'      },
  { value: 'totalValue_asc',    label: 'Ukupna vrednost (↑)'      },
  { value: 'profit_desc',       label: 'Profit (↓)'               },
  { value: 'profit_asc',        label: 'Profit (↑)'               },
  { value: 'minContrib_asc',    label: 'Min. ulog (↑)'            },
  { value: 'minContrib_desc',   label: 'Min. ulog (↓)'            },
];

export default function FundFilters({ search, sortBy, onSearchChange, onSortChange }) {
  const hasActive = search || sortBy;

  function reset() {
    onSearchChange('');
    onSortChange('');
  }

  return (
    <div className={styles.wrap}>
      <input
        className={styles.input}
        type="text"
        placeholder="Pretraži po nazivu ili opisu..."
        value={search}
        onChange={e => onSearchChange(e.target.value)}
      />
      <select
        className={styles.select}
        value={sortBy}
        onChange={e => onSortChange(e.target.value)}
      >
        {SORT_OPTIONS.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {hasActive && (
        <button className={styles.btnReset} onClick={reset}>
          × Resetuj filtere
        </button>
      )}
    </div>
  );
}
