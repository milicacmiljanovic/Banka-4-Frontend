import { useState, useRef, useLayoutEffect } from 'react';
import { useNavigate }                        from 'react-router-dom';
import gsap                                   from 'gsap';
import { accountsApi }                        from '../../api/endpoints/accounts';
import { clientsApi }                         from '../../api/endpoints/clients';
import { useAuthStore }                       from '../../store/authStore';
import { jeObavezno, jeValidanEmail }         from '../../utils/helpers';
import Navbar                                 from '../../components/layout/Navbar';
import Alert                                  from '../../components/ui/Alert';
import ClientSearch                           from '../../features/accounts/ClientSearch';
import ClientForm                             from '../../features/accounts/ClientForm';
import AccountForm                            from '../../features/accounts/AccountForm';
import AccountPreview                         from '../../features/accounts/AccountPreview';
import styles                                 from './NewAccount.module.css';

export const CURRENCIES_BY_TYPE = {
  tekuci:  ['RSD'],
  devizni: ['EUR', 'CHF', 'USD', 'GBP', 'JPY', 'CAD', 'AUD'],
};

const CATEGORY_TO_SUBTYPE = {
  licni_standardni:   'Standard',
  licni_stedni:       'Savings',
  licni_penzionerski: 'Pension',
  licni_mladi:        'Youth',
  poslovni_doo:       'LLC',
  poslovni_ad:        'JointStock',
  poslovni_fondacija: 'Foundation',
};

const CATEGORY_TO_ACCOUNT_TYPE = {
  licni_standardni:   'Personal',
  licni_stedni:       'Personal',
  licni_penzionerski: 'Personal',
  licni_mladi:        'Personal',
  poslovni_doo:       'Business',
  poslovni_ad:        'Business',
  poslovni_fondacija: 'Business',
};

export default function NewAccount() {
  const navigate = useNavigate();
  const pageRef  = useRef(null);
  const user     = useAuthStore(s => s.user);

  const [searchStatus,   setSearchStatus]   = useState('idle');
  const [clientMode,     setClientMode]     = useState(null);
  const [existingClient, setExistingClient] = useState(null);
  const [newClientData,  setNewClientData]  = useState({
    first_name: '',
    last_name:  '',
    email:      '',
    jmbg:       '',
  });

  const [accountData, setAccountData] = useState({
    account_type:    '',
    currency:        '',
    category:        '',
    initial_balance: '',
    daily_limit:     '',
    monthly_limit:   '',
    create_card:     false,
  });

  const [errors,         setErrors]         = useState({});
  const [isSubmitting,   setIsSubmitting]   = useState(false);
  const [submitError,    setSubmitError]    = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.page-anim', {
        opacity:  0,
        y:        20,
        duration: 0.45,
        stagger:  0.08,
        ease:     'power2.out',
      });
    }, pageRef);
    return () => ctx.revert();
  }, []);

  async function handleSearch(query) {
    setSearchStatus('searching');
    setSubmitError(null);

    const q = (query ?? '').trim();
    if (!q) {
      setSearchStatus('idle');
      return;
    }

    try {
      const res    = await accountsApi.searchClient(q);
      const client = res?.data?.data?.[0] ?? res?.data?.data ?? res?.data?.[0] ?? res?.data;
      setExistingClient(client);
      setClientMode('existing');
      setSearchStatus('found');
      setErrors(prev => {
        const next = { ...prev };
        ['first_name', 'last_name', 'email', 'jmbg'].forEach(k => delete next[k]);
        return next;
      });
    } catch (err) {
      const status = err?.status ?? err?.response?.status;
      const code   = err?.code   ?? err?.error_code;

      if (status === 404 || code === 'NOT_FOUND') {
        setExistingClient(null);
        setClientMode('new');
        setSearchStatus('not_found');
      } else {
        setSearchStatus('error');
        setSubmitError(err?.message || err?.error || 'Greška pri pretrazi klijenta.');
      }
    }
  }

  function handleClearClient() {
    setExistingClient(null);
    setClientMode(null);
    setSearchStatus('idle');
    setNewClientData({ first_name: '', last_name: '', email: '', jmbg: '' });
  }

  function updateClientField(field, value) {
    setNewClientData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  }

  function updateAccountField(field, value) {
    setAccountData(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'account_type') {
        next.currency = value === 'tekuci' ? 'RSD' : 'EUR';
      }
      return next;
    });
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  }

  function validateForm() {
    const e = {};
    const check = (field, err) => { if (err) e[field] = err; };

    if (clientMode === 'new') {
      check('first_name', jeObavezno(newClientData.first_name));
      check('last_name',  jeObavezno(newClientData.last_name));
      check('email',      jeObavezno(newClientData.email) ?? jeValidanEmail(newClientData.email));

      if (!newClientData.jmbg?.trim()) {
        e.jmbg = 'Polje je obavezno';
      } else if (!/^\d{13}$/.test(newClientData.jmbg.trim())) {
        e.jmbg = 'JMBG mora sadržati tačno 13 cifara';
      }
    }

    check('account_type',    jeObavezno(accountData.account_type));
    check('currency',        jeObavezno(accountData.currency));
    check('category',        jeObavezno(accountData.category));
    check('initial_balance', jeObavezno(accountData.initial_balance));
    check('daily_limit',     jeObavezno(accountData.daily_limit));
    check('monthly_limit',   jeObavezno(accountData.monthly_limit));

    const ib = Number(accountData.initial_balance);
    const dl = Number(accountData.daily_limit);
    const ml = Number(accountData.monthly_limit);

    if (accountData.initial_balance !== '' && ib < 0)
      e.initial_balance = 'Početno stanje ne može biti negativno';
    if (accountData.daily_limit !== '' && dl < 0)
      e.daily_limit = 'Dnevni limit ne može biti negativan';
    if (accountData.monthly_limit !== '' && ml < 0)
      e.monthly_limit = 'Mesečni limit ne može biti negativan';
    if (accountData.daily_limit !== '' && accountData.monthly_limit !== '' && ml < dl)
      e.monthly_limit = 'Mesečni limit ne može biti manji od dnevnog limita';

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitError(null);
    setSuccessMessage(null);

    try {
      let clientId = existingClient?.id ?? existingClient?.ClientID ?? existingClient?.client_id ?? null;

      if (clientMode === 'new') {
        const created = await clientsApi.create({
          first_name: newClientData.first_name,
          last_name:  newClientData.last_name,
          email:      newClientData.email,
          jmbg:       newClientData.jmbg,
        });
        clientId = created?.data?.id ?? created?.id;
      }

      const firstName = existingClient?.first_name ?? newClientData.first_name;
      const lastName  = existingClient?.last_name  ?? newClientData.last_name;

      const payload = {
        name:            `${lastName} ${firstName}`.trim(),
        client_id:       clientId,
        employee_id:     user.id,
        account_type:    CATEGORY_TO_ACCOUNT_TYPE[accountData.category] ?? 'Personal',
        account_kind:    accountData.account_type === 'tekuci' ? 'Current' : 'Foreign',
        subtype:         CATEGORY_TO_SUBTYPE[accountData.category] ?? 'Standard',
        initial_balance: Number(accountData.initial_balance),
        expires_at:      new Date(new Date().setFullYear(new Date().getFullYear() + 5)).toISOString(),
        create_card:     !!accountData.create_card,
      };

      if (accountData.account_type === 'devizni') {
        payload.currency_code = accountData.currency;
      }

      console.log('CREATE ACCOUNT PAYLOAD >>>', payload);

      await accountsApi.create(payload);

      setSuccessMessage('Račun je uspešno kreiran!');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => navigate('/admin'), 2500);

    } catch (err) {
      console.log('CREATE ACCOUNT ERROR', err);
      setSubmitError(
          err?.response?.data?.message ||
          err?.message ||
          err?.error ||
          'Greška pri kreiranju računa.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
      <div ref={pageRef} className={styles.stranica}>
        <Navbar />

        <main className={styles.sadrzaj}>

          <div className="page-anim">
            <div className={styles.breadcrumb}>
            <span
                className={styles.breadcrumbLink}
                role="button"
                tabIndex={0}
                onClick={() => navigate(-1)}
                onKeyDown={e => e.key === 'Enter' && navigate(-1)}
            >
              Računi klijenta
            </span>
              <span className={styles.breadcrumbSep}>›</span>
              <span className={styles.breadcrumbAktivna}>Kreiranje računa</span>
            </div>

            <div className={styles.pageHeader}>
              <div>
                <h1 className={styles.pageTitle}>Kreiranje računa korisnika</h1>
                <p className={styles.pageDesc}>
                  Popunite formular za otvaranje novog bankovnog računa
                </p>
              </div>
              <button type="button" className={styles.btnGhost} onClick={() => navigate(-1)}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="19" y1="12" x2="5" y2="12"/>
                  <polyline points="12 19 5 12 12 5"/>
                </svg>
                Nazad
              </button>
            </div>
          </div>

          <div className={`page-anim ${styles.grid}`}>

            <div className={styles.formCard}>

              {successMessage && (
                  <div className={styles.alertWrap}>
                    <Alert tip="uspeh" poruka={successMessage} />
                  </div>
              )}

              {submitError && (
                  <div className={styles.alertWrap}>
                    <Alert tip="greska" poruka={submitError} />
                  </div>
              )}

              <ClientSearch
                  onSearch={handleSearch}
                  searchStatus={searchStatus}
              />

              {clientMode !== null && (
                  <ClientForm
                      clientMode={clientMode}
                      existingClient={existingClient}
                      onClear={handleClearClient}
                      newClientData={newClientData}
                      onClientChange={updateClientField}
                      errors={errors}
                  />
              )}

              <AccountForm
                  form={accountData}
                  onChange={updateAccountField}
                  errors={errors}
              />

              <div className={styles.formActions}>
                <button type="button" className={styles.btnGhost} onClick={() => navigate(-1)}>
                  Odustani
                </button>
                <button
                    type="button"
                    disabled={isSubmitting}
                    className={styles.btnPrimary}
                    onClick={handleSubmit}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  {isSubmitting ? 'Kreiranje...' : 'Potvrdi kreiranje računa'}
                </button>
              </div>
            </div>

            <AccountPreview
                existingClient={existingClient}
                newClientData={newClientData}
                clientMode={clientMode}
                accountData={accountData}
            />

          </div>

        </main>
      </div>
  );
}