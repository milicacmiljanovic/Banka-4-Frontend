import { useState, useRef, useLayoutEffect } from 'react';
import { useNavigate }                        from 'react-router-dom';
import gsap                                   from 'gsap';
import { authApi }                            from '../../api/endpoints/auth';
import { jeObavezno, jeValidanEmail, jeValidanTelefon } from '../../utils/helpers';
import Navbar                                 from '../../components/layout/Navbar';
import Alert                                  from '../../components/ui/Alert';
import styles                                 from './NewEmployee.module.css';

const GENDER_OPTIONS = ['M', 'F'];
const ALL_PERMISSIONS = [
  { value: 'employee.view',   label: 'Pregled zaposlenih' },
  { value: 'employee.create', label: 'Kreiranje zaposlenih' },
  { value: 'employee.update', label: 'Izmena zaposlenih' },
  { value: 'employee.delete', label: 'Brisanje zaposlenih' },
];

export default function NewEmployee() {
  const navigate = useNavigate();
  const pageRef  = useRef(null);

  const [form, setForm] = useState({
    first_name:    '',
    last_name:     '',
    email:         '',
    phone_number:  '',
    address:       '',
    date_of_birth: '',
    gender:        '',
    active:        true,
    position_id:   '',
    department:    '',
    username:      '',
    permissions:   [],
  });

  const [errors,     setErrors]     = useState({});
  const [apiError,   setApiError]   = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.page-anim', {
        opacity: 0,
        y: 20,
        duration: 0.45,
        stagger: 0.08,
        ease: 'power2.out',
      });
    }, pageRef);
    return () => ctx.revert();
  }, []);



  function updateField(field, value) {
    setForm(prev => {
      // Ako je polje position_id, pretvori ga u broj, inače ostavi string
      const finalValue = field === 'position_id' ? (value === '' ? '' : Number(value)) : value;

      const next = { ...prev, [field]: finalValue };

      if (field === 'first_name' || field === 'last_name') {
        const f = field === 'first_name' ? value : prev.first_name;
        const l = field === 'last_name'  ? value : prev.last_name;
        if (f && l) {
          next.username = `${f.toLowerCase().charAt(0)}${l.toLowerCase().replace(/\s+/g, '')}`;
        }
      }
      return next;
    });

    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  }

  function togglePermission(perm) {
    setForm(prev => {
      let perms = prev.permissions.includes(perm)
        ? prev.permissions.filter(p => p !== perm)
        : [...prev.permissions, perm];

      // Ako ima create/update/delete, view mora biti uključen
      const needsView = perms.some(p => p !== 'employee.view');
      if (needsView && !perms.includes('employee.view')) {
        perms = [...perms, 'employee.view'];
      }

      return { ...prev, permissions: perms };
    });
  }

  function validate() {
    const e = {};
    const check = (field, err) => { if (err) e[field] = err; };

    check('first_name',    jeObavezno(form.first_name));
    check('last_name',     jeObavezno(form.last_name));
    check('email',         jeObavezno(form.email) ?? jeValidanEmail(form.email));
    check('date_of_birth', jeObavezno(form.date_of_birth));
    check('gender',        jeObavezno(form.gender));
    check('position_id',   jeObavezno(form.position_id));
    check('department',    jeObavezno(form.department));
    check('username',      jeObavezno(form.username));

    if (form.phone_number && jeValidanTelefon(form.phone_number)) {
      e.phone_number = jeValidanTelefon(form.phone_number);
    }

    setErrors(e);

    if (Object.keys(e).length > 0) {
      console.log("Pronađene greške pri validaciji:", e);
    }

    return Object.keys(e).length === 0; // Vraća true samo ako je 'e' prazan
  }



  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setApiError(null);

    try {

      const formattedDate = form.date_of_birth ? `${form.date_of_birth}T00:00:00Z` : null;

      const payload = {
        ...form,
        position_id:   Number(form.position_id),
        date_of_birth: formattedDate
      };

      console.log("Šaljem payload u Go backend:", payload);

      await authApi.register(payload);
      navigate('/employees');
    } catch (err) {
      console.error("Backend odbio podatke:", err);
      // Prikazujemo poruku koju je Go vratio (ako postoji)
      setApiError(err.message || err.error || 'Greška u komunikaciji sa serverom.');
    } finally {
      setSubmitting(false);
    }
  }


  return (
    <div ref={pageRef} className={styles.stranica}>
      <Navbar />

      <main className={styles.sadrzaj}>
        <div className="page-anim">
          <div className={styles.breadcrumb}>
            <span>Zaposleni</span>
            <span className={styles.breadcrumbSep}>›</span>
            <span className={styles.breadcrumbAktivna}>Novi zaposleni</span>
          </div>
          <div className={styles.pageHeader}>
            <div>
              <h1 className={styles.pageTitle}>Kreiranje novog zaposlenog</h1>
              <p className={styles.pageDesc}>
                Popunite sva obavezna polja. Zaposleni će dobiti email sa linkom za aktivaciju naloga.
              </p>
            </div>
            <button
              type="button"
              className={styles.btnGhost}
              onClick={() => navigate(-1)}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="19" y1="12" x2="5" y2="12"/>
                <polyline points="12 19 5 12 12 5"/>
              </svg>
              Nazad
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate className={`page-anim ${styles.grid}`}>
          <div className={styles.formCard}>

            <div className={styles.formSection}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIcon}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
                <span className={styles.sectionTitle}>Lični podaci</span>
              </div>

              {apiError && <Alert tip="greska" poruka={apiError} />}

              <div className={styles.fieldGrid2}>
                <Polje label="Ime" required greska={errors.first_name}>
                  <input
                    type="text"
                    value={form.first_name}
                    onChange={e => updateField('first_name', e.target.value)}
                    className={form.first_name ? styles.hasValue : ''}
                  />
                </Polje>

                <Polje label="Prezime" required greska={errors.last_name}>
                  <input
                    type="text"
                    value={form.last_name}
                    onChange={e => updateField('last_name', e.target.value)}
                    className={form.last_name ? styles.hasValue : ''}
                  />
                </Polje>

                <Polje label="Email adresa" required greska={errors.email}>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => updateField('email', e.target.value)}
                    className={form.email ? styles.hasValue : ''}
                  />
                </Polje>

                <Polje label="Broj telefona" greska={errors.phone_number}>
                  <input
                    type="tel"
                    value={form.phone_number}
                    placeholder="+381..."
                    onChange={e => updateField('phone_number', e.target.value)}
                    className={form.phone_number ? styles.hasValue : ''}
                  />
                </Polje>

                <Polje label="Adresa" greska={errors.address}>
                  <input
                    type="text"
                    value={form.address}
                    onChange={e => updateField('address', e.target.value)}
                    className={form.address ? styles.hasValue : ''}
                  />
                </Polje>

                <Polje label="Datum rođenja" required greska={errors.date_of_birth}>
                  <input
                    type="date"
                    value={form.date_of_birth}
                    onChange={e => updateField('date_of_birth', e.target.value)}
                    className={form.date_of_birth ? styles.hasValue : ''}
                  />
                </Polje>

                <Polje label="Pol" required greska={errors.gender}>
                  <select
                    value={form.gender}
                    onChange={e => updateField('gender', e.target.value)}
                    className={form.gender ? styles.hasValue : ''}
                  >
                    <option value="">Izaberite...</option>
                    {GENDER_OPTIONS.map(o => <option key={o} value={o}>{o === 'M' ? 'Muški' : 'Ženski'}</option>)}
                  </select>
                </Polje>

                <Polje label="Status pri kreiranju">
                  <div
                    className={styles.toggleWrap}
                    onClick={() => updateField('active', !form.active)}
                    role="switch"
                    aria-checked={form.active}
                    tabIndex={0}
                  >
                    <span className={styles.toggleLabel}>Aktivan nalog</span>
                    <div className={`${styles.toggle} ${form.active ? '' : styles.toggleOff}`} />
                  </div>
                </Polje>
              </div>
            </div>

            <div className={styles.formSection}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIcon}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="2">
                    <rect x="2" y="7" width="20" height="14" rx="2"/>
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                  </svg>
                </div>
                <span className={styles.sectionTitle}>Radno mesto</span>
              </div>

              <div className={styles.fieldGrid2}>
                <Polje label="ID Pozicije" required greska={errors.position_id}>
                  <input
                    type="number"
                    value={form.position_id}
                    onChange={e => updateField('position_id', e.target.value)}
                    className={form.position_id ? styles.hasValue : ''}
                  />
                </Polje>

                <Polje label="Departman" required greska={errors.department}>
                  <input
                    type="text"
                    value={form.department}
                    onChange={e => updateField('department', e.target.value)}
                    className={form.department ? styles.hasValue : ''}
                  />
                </Polje>
              </div>
            </div>

            <div className={styles.formSection}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIcon}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                </div>
                <span className={styles.sectionTitle}>Permisije</span>
              </div>

              <div className={styles.permissionsGrid}>
                {ALL_PERMISSIONS.map(p => {
                  const viewLocked = p.value === 'employee.view'
                    && form.permissions.some(x => x !== 'employee.view');
                  return (
                    <label key={p.value} className={`${styles.permissionItem} ${viewLocked ? styles.permissionLocked : ''}`}>
                      <input
                        type="checkbox"
                        checked={form.permissions.includes(p.value)}
                        onChange={() => togglePermission(p.value)}
                        disabled={viewLocked}
                      />
                      <span className={styles.permissionLabel}>{p.label}</span>
                      <span className={styles.permissionCode}>{p.value}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className={styles.formSection}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIcon}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </div>
                <span className={styles.sectionTitle}>Pristup sistemu</span>
              </div>

              <div className={styles.fieldGrid2}>
                <Polje label="Username" required greska={errors.username}>
                  <div className={styles.inputWithBadge}>
                    <input
                      type="text"
                      value={form.username}
                      onChange={e => updateField('username', e.target.value)}
                      className={form.username ? styles.hasValue : ''}
                    />
                    <span className={styles.inputBadge}>Auto-gen</span>
                  </div>
                </Polje>
              </div>
            </div>

            <div className={styles.formActions}>
              <button type="button" className={styles.btnGhost} onClick={() => navigate(-1)}>
                Otkaži
              </button>
              <div className={styles.actionsRight}>
                <button type="submit" disabled={submitting} className={styles.btnPrimary}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  {submitting ? 'Kreiranje...' : 'Kreiraj zaposlenog'}
                </button>
              </div>
            </div>
          </div>

          <aside className={`page-anim ${styles.sidebar}`}>
            <div className={styles.infoCard}>
              <div className={styles.infoCardHeader}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <h4>Napomene</h4>
              </div>
              <div className={styles.infoCardBody}>
                {[
                  { bold: 'Email mora biti jedinstven', rest: ' — dva naloga ne mogu imati isti email' },
                  { bold: 'Username', rest: ' se auto-generiše iz imena, ali ga možete izmeniti' },
                  { bold: 'Aktivacija putem emaila', rest: ' — zaposleni postavlja lozinku preko aktivacionog linka' },
                  { bold: 'Permisije', rest: ' se dodeljuju nakon kreiranja iz profila zaposlenog' },
                ].map((item, i) => (
                  <div key={i} className={styles.infoItem}>
                    <div className={styles.infoBullet} />
                    <div className={styles.infoItemText}>
                      <strong>{item.bold}</strong>{item.rest}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.emailPreview}>
              <div className={styles.emailPreviewBar} />
              <div className={styles.emailPreviewBody}>
                <div className={styles.emailTag}>Aktivacioni email</div>
                <div className={styles.emailPreviewTitle}>Primer emaila koji zaposleni prima</div>
                <div className={styles.emailPreviewText}>
                  Poštovani <strong>{form.first_name || 'zaposleni'}</strong>,<br /><br />
                  Vaš nalog na RAFBank portalu je kreiran. Kliknite na dugme ispod da aktivirate nalog i postavite lozinku.<br /><br />
                  <em>Link ističe za 24 sata.</em>
                </div>
                <div className={styles.emailPreviewCta}>Aktiviraj nalog →</div>
              </div>
            </div>
          </aside>
        </form>
      </main>
    </div>
  );
}

function Polje({ label, required, greska, children }) {
  return (
    <div className={styles.field}>
      <label>
        {label}
        {required && <span className={styles.required}> *</span>}
      </label>
      {children}
      {greska && <span className={styles.greska}>{greska}</span>}
    </div>
  );
}
