import { useState, useEffect } from 'react';
import { jeObavezno, jeValidanEmail } from '../../utils/helpers';
import Alert                          from '../../components/ui/Alert';
import styles                         from './ClientEditForm.module.css';

export default function ClientEditForm({
  client,
  onSave,
  onCancel,
  saving      = false,
  saveError   = null,
  saveSuccess = null,
  emailError  = null,
}) {
  const [form,   setForm]   = useState(buildForm(client));
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setTimeout(() => { setForm(buildForm(client)); setErrors({}); }, 0);
  }, [client?.id]);

  useEffect(() => {
    if (emailError) setTimeout(() => setErrors(prev => ({ ...prev, email: emailError })), 0);
  }, [emailError]);

  function update(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  }

  function validate() {
    const e = {};
    const check = (field, err) => { if (err) e[field] = err; };
    check('first_name', jeObavezno(form.first_name));
    check('last_name',  jeObavezno(form.last_name));
    check('email',      jeObavezno(form.email) ?? jeValidanEmail(form.email));
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    onSave(form);
  }

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <svg viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="2" width="15" height="15">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
        <span>Izmena podataka — {client.first_name} {client.last_name}</span>
      </div>

      {saveSuccess && <div className={styles.alerts}><Alert tip="uspeh"  poruka={saveSuccess} /></div>}
      {saveError   && <div className={styles.alerts}><Alert tip="greska" poruka={saveError} /></div>}

      <form onSubmit={handleSubmit} noValidate className={styles.form}>
        <div className={styles.fieldGrid}>
          <Polje label="Ime" required greska={errors.first_name} styles={styles}>
            <input
              type="text"
              value={form.first_name}
              onChange={e => update('first_name', e.target.value)}
              className={errors.first_name ? styles.inputError : styles.input}
            />
          </Polje>

          <Polje label="Prezime" required greska={errors.last_name} styles={styles}>
            <input
              type="text"
              value={form.last_name}
              onChange={e => update('last_name', e.target.value)}
              className={errors.last_name ? styles.inputError : styles.input}
            />
          </Polje>

          <Polje label="Email adresa" required greska={errors.email} styles={styles}>
            <input
              type="text"
              inputMode="email"
              autoComplete="email"
              value={form.email}
              onChange={e => update('email', e.target.value)}
              className={errors.email ? styles.inputError : styles.input}
            />
          </Polje>

          <Polje label="Broj telefona" greska={errors.phone_number} styles={styles}>
            <input
              type="text"
              placeholder="+381..."
              value={form.phone_number}
              onChange={e => update('phone_number', e.target.value)}
              className={styles.input}
            />
          </Polje>

          <Polje label="Adresa" greska={errors.address} styles={styles}>
            <input
              type="text"
              value={form.address}
              onChange={e => update('address', e.target.value)}
              className={styles.input}
            />
          </Polje>
        </div>

        <div className={styles.actions}>
          <button type="button" className={styles.btnGhost} onClick={onCancel}>
            Otkaži
          </button>
          <button type="submit" disabled={saving} className={styles.btnPrimary}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            {saving ? 'Čuvam...' : 'Sačuvaj izmene'}
          </button>
        </div>
      </form>
    </div>
  );
}


function buildForm(client) {
  return {
    first_name:   client?.first_name   ?? '',
    last_name:    client?.last_name    ?? '',
    email:        client?.email        ?? '',
    phone_number: client?.phone_number ?? '',
    address:      client?.address      ?? '',
  };
}

function Polje({ label, required, greska, children, styles }) {
  return (
    <div className={styles.field}>
      <label className={styles.fieldLabel}>
        {label}
        {required && <span className={styles.required}> *</span>}
      </label>
      {children}
      {greska && <span className={styles.greska}>{greska}</span>}
    </div>
  );
}
