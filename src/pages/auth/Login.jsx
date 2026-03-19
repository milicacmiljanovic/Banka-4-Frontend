import { useState, useRef, useLayoutEffect } from 'react';
import { useNavigate, Link }                  from 'react-router-dom';
import gsap                                   from 'gsap';
import { authApi }                            from '../../api/endpoints/auth';
import { useAuthStore }                       from '../../store/authStore';
import Alert                                  from '../../components/ui/Alert';
import styles                                 from './Login.module.css';

export default function Login() {
  const navigate = useNavigate();
  const setAuth  = useAuthStore(s => s.setAuth);
  const cardRef  = useRef(null);

  const [email,      setEmail]      = useState('');
  const [password,   setPassword]  = useState('');
  const [error,      setError]     = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(cardRef.current, {
        opacity: 0,
        y: 16,
        duration: 0.5,
        ease: 'power2.out',
      });
    });
    return () => ctx.revert();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await authApi.login({ email, password });
      setAuth(res.user, res.token, res.refresh_token);
      navigate('/');
    } catch (err) {
      setError(err.error ?? 'Pogrešan email ili lozinka. Proverite unos i pokušajte ponovo.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.wrap}>

      <aside className={styles.brand}>
        <div className={styles.brandLogo}>
          <div className={styles.brandIcon}>
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <div>
            <div className={styles.brandName}>Banka 4</div>
            <div className={styles.brandSub}>Portal za zaposlene</div>
          </div>
        </div>

        <div className={styles.brandContent}>
          <div className={styles.brandEyebrow}>Interni sistem</div>
          <h1 className={styles.brandHeadline}>Upravljanje<br />korisnicima</h1>
          <p className={styles.brandDesc}>
            Centralizovana platforma za administraciju zaposlenih, kontrolu pristupa i upravljanje klijentskim nalozima.
          </p>
          <div className={styles.brandFeatures}>
            {[
              'Upravljanje zaposlenima i permisijama',
              'Pregled i kreiranje klijentskih naloga',
              'Bezbedna autentifikacija i autorizacija',
              'Revizijski trag svih akcija',
            ].map(f => (
              <div key={f} className={styles.brandFeature}>
                <div className={styles.featureDot} />
                <span className={styles.featureText}>{f}</span>
              </div>
            ))}
          </div>
        </div>

      </aside>

      <main className={styles.formPanel}>
        <div ref={cardRef} className={styles.card}>
          <h2 className={styles.formTitle}>Dobrodošli nazad</h2>
          <p className={styles.formSubtitle}>Unesite vaše kredencijale za pristup portalu.</p>
          <div className={styles.divider} />

          {error && <Alert tip="greska" poruka={error} />}

          <form onSubmit={handleSubmit} noValidate>
            <div className={styles.field}>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                placeholder="ime@raf.rs"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                required
                className={email ? styles.hasValue : ''}
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="password">Lozinka</label>
              <input
                id="password"
                type="password"
                placeholder="Unesite lozinku"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                className={password ? styles.hasValue : ''}
              />
            </div>

            <div className={styles.fieldRow}>
              <label className={styles.rememberLabel}>
                <input type="checkbox" style={{ width: 15, height: 15, accentColor: 'var(--blue)' }} />
                Zapamti prijavu
              </label>
              <Link to="/reset-password" className={styles.forgotLink}>
                Zaboravili ste lozinku?
              </Link>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className={styles.btnPrimary}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                <polyline points="10 17 15 12 10 7"/>
                <line x1="15" y1="12" x2="3" y2="12"/>
              </svg>
              {submitting ? 'Prijavljivanje...' : 'Prijavi se'}
            </button>
          </form>

          <p className={styles.footerText}>
            Problem sa prijavom? Kontaktirajte IT podršku: <strong>it@raf.rs</strong>
          </p>
        </div>
      </main>
    </div>
  );
}
