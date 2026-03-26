import styles from './AccountForm.module.css';

// Backend enums (values MUST match backend exactly)
export const ACCOUNT_TYPES = [
  { value: 'Personal', label: 'Lični' },
  { value: 'Business', label: 'Poslovni' },
  { value: 'Bank', label: 'Bank' },
];

export const ACCOUNT_KINDS = [
  {
    value: 'Current',
    label: 'Tekući račun',
    desc: 'Standardni račun za svakodnevne transakcije (RSD)',
  },
  {
    value: 'Foreign',
    label: 'Devizni račun',
    desc: 'Račun u stranoj valuti (EUR, USD, CHF…)',
  },
  {
    value: 'Internal',
    label: 'Interni račun',
    desc: 'Interni račun banke (po potrebi)',
  },
];

export const PERSONAL_SUBTYPES = [
  { value: 'Standard', label: 'Standardni' },
  { value: 'Savings', label: 'Štedni' },
  { value: 'Pension', label: 'Penzioni' },
  { value: 'Youth', label: 'Za mlade' },
  { value: 'Student', label: 'Studentski' },
  { value: 'Unemployed', label: 'Nezaposleni' },
];

export const BUSINESS_SUBTYPES = [
  { value: 'LLC', label: 'D.O.O.' },
  { value: 'JointStock', label: 'A.D.' },
  { value: 'Foundation', label: 'Fondacija' },
];

// Currency choices based on AccountKind
export const CURRENCIES = {
  Current: [{ value: 'RSD', label: 'RSD' }],
  Foreign: [
    { value: 'EUR', label: 'EUR' },
    { value: 'CHF', label: 'CHF' },
    { value: 'USD', label: 'USD' },
    { value: 'GBP', label: 'GBP' },
    { value: 'JPY', label: 'JPY' },
    { value: 'CAD', label: 'CAD' },
    { value: 'AUD', label: 'AUD' },
  ],
  Internal: [{ value: 'RSD', label: 'RSD' }],
};

export default function AccountForm({ form, onChange, errors }) {
  const currencies = CURRENCIES?.[form.account_kind] ?? [];

  const subtypeOptions =
      form.account_type === 'Business' ? BUSINESS_SUBTYPES : PERSONAL_SUBTYPES;

  return (
      <>
        {/* AccountKind + currency */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="2">
                <rect x="1" y="4" width="22" height="16" rx="2" />
                <line x1="1" y1="10" x2="23" y2="10" />
              </svg>
            </div>
            <span className={styles.sectionTitle}>Vrsta i valuta računa</span>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>
              Vrsta (AccountKind) <span className={styles.required}>*</span>
            </label>

            <div className={styles.radioGroup}>
              {ACCOUNT_KINDS.map(k => (
                  <label
                      key={k.value}
                      className={`${styles.radioOption} ${
                          form.account_kind === k.value ? styles.radioSelected : ''
                      }`}
                  >
                    <input
                        type="radio"
                        name="account_kind"
                        value={k.value}
                        checked={form.account_kind === k.value}
                        onChange={e => onChange('account_kind', e.target.value)}
                    />
                    <div>
                      <div className={styles.radioLabel}>{k.label}</div>
                      <div className={styles.radioDesc}>{k.desc}</div>
                    </div>
                  </label>
              ))}
            </div>

            {errors.account_kind && <span className={styles.greska}>{errors.account_kind}</span>}
          </div>

          {form.account_kind && (
              <div className={styles.field} style={{ marginTop: '20px' }}>
                <label className={styles.label}>
                  Valuta <span className={styles.required}>*</span>
                </label>
                <div className={styles.currencyGrid}>
                  {currencies.map(c => (
                      <button
                          key={c.value}
                          type="button"
                          onClick={() => onChange('currency', c.value)}
                          className={`${styles.currencyOpt} ${
                              form.currency === c.value ? styles.currencySelected : ''
                          }`}
                      >
                        {c.label}
                      </button>
                  ))}
                </div>
                {errors.currency && <span className={styles.greska}>{errors.currency}</span>}
              </div>
          )}
        </div>

        {/* AccountType + subtype */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="2">
                <path d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </div>
            <span className={styles.sectionTitle}>Tip i podtip</span>
          </div>

          <div className={styles.fieldGrid2}>
            <div className={styles.field}>
              <label className={styles.label}>
                Tip (AccountType) <span className={styles.required}>*</span>
              </label>

              <select
                  value={form.account_type}
                  onChange={e => onChange('account_type', e.target.value)}
                  className={`${styles.select} ${errors.account_type ? styles.inputError : ''}`}
              >
                {ACCOUNT_TYPES.map(t => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                ))}
              </select>

              {errors.account_type && <span className={styles.greska}>{errors.account_type}</span>}
            </div>

            <div className={styles.field}>
              <label className={styles.label}>
                Podtip (Subtype) <span className={styles.required}>*</span>
              </label>

              <select
                  value={form.subtype}
                  onChange={e => onChange('subtype', e.target.value)}
                  className={`${styles.select} ${errors.subtype ? styles.inputError : ''}`}
              >
                {subtypeOptions.map(s => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                ))}
              </select>

              {errors.subtype && <span className={styles.greska}>{errors.subtype}</span>}
            </div>
          </div>
        </div>

        {/* Parameters */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="2">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <span className={styles.sectionTitle}>Parametri i opcije</span>
          </div>

          <div className={styles.fieldGrid2}>
            <div className={styles.field}>
              <label className={styles.label}>
                Početno stanje <span className={styles.required}>*</span>
              </label>
              <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={form.initial_balance}
                  onChange={e => onChange('initial_balance', e.target.value)}
                  className={`${styles.input} ${errors.initial_balance ? styles.inputError : ''}`}
              />
              {errors.initial_balance && (
                  <span className={styles.greska}>{errors.initial_balance}</span>
              )}
            </div>
          </div>

          <label className={styles.checkboxRow}>
            <input
                type="checkbox"
                checked={form.create_card}
                onChange={e => onChange('create_card', e.target.checked)}
                className={styles.checkbox}
            />
            <div>
              <div className={styles.checkboxLabel}>Napravi karticu</div>
              <div className={styles.checkboxDesc}>
                Sistem automatski generi��e zahtev i vezuje novu debitnu karticu za ovaj račun
              </div>
            </div>
          </label>
        </div>
      </>
  );
}