import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { loansApi } from '../../api/endpoints/loans';
import styles from './LoanRequestForm.module.css';

export default function LoanRequestForm() {
  const user = useAuthStore(s => s.user);
  const clientId = user?.id;


  const [formData, setFormData] = useState({
    loanType: 'CASH',
    amount: '',
    repaymentPeriod: 12,
    currency: 'RSD'
  });

  const [status, setStatus] = useState('IDLE'); 
  const [error, setError] = useState(null);

  const maxMonths = formData.loanType === 'MORTGAGE' ? 360 : 84;

  // DINAMIČKI OBRAČUN RATE I EKS (Popravljeno da izbegne NaN)
  const baseEks = formData.loanType === 'MORTGAGE' ? 4.5 : 7.2;
  const eks = Number(baseEks).toFixed(2); 

  const calculatedMonthlyInstallment = (formData.amount && !isNaN(formData.amount))
    ? ((Number(formData.amount) * (1 + (Number(eks)/100))) / formData.repaymentPeriod).toFixed(2) 
    : "0.00";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validacija valute prema tekućem računu (iz zadatka)
    const userCurrency = user?.account_currency || 'RSD';
    if (formData.currency !== userCurrency) {
      setError(`Valuta kredita mora biti ista kao valuta vašeg računa (${userCurrency})`);
      return;
    }

    setStatus('PROCESSING');

    try {
      await loansApi.createRequest(clientId, formData);
      
      setTimeout(() => {
        const isEmployedPermanently = user?.employment_status === 'stalno';
        const isSalaryOk = user?.salary > (Number(formData.amount) / formData.repaymentPeriod) * 3;

        // DODAJEMO uslov: formData.loanType === 'CASH'
        // To znači: Automatski odobri SAMO ako je keš kredit, plata OK, stalni radni odnos i iznos < 500k
        if (
          formData.loanType === 'CASH' &&
          isEmployedPermanently &&
          isSalaryOk &&
          Number(formData.amount) < 500000
        ) {
          setStatus('APPROVED');
        } else {
          // Svi stambeni (MORTGAGE) i auto krediti, ili veliki keš iznosi idu ovde
          setStatus('MANUAL_REVIEW');
        }
      }, 2000);
    } catch {
      setError("Sistem trenutno nije u mogućnosti da obradi zahtev.");
      setStatus('IDLE');
    }
  };

  return (
    <div className={styles.formContainer}>
      {status === 'IDLE' ? (
        <>
          <h3>Podnošenje zahteva za kredit</h3>
          <form onSubmit={handleSubmit} className={styles.form}>
            
            <div className={styles.row}>
              <div className={styles.group}>
                <label>Tip kredita</label>
                <select 
                  value={formData.loanType} 
                  onChange={(e) => setFormData({...formData, loanType: e.target.value})}
                >
                  <option value="CASH">Keš kredit</option>
                  <option value="AUTO">Auto kredit</option>
                  <option value="MORTGAGE">Stambeni kredit</option>
                </select>
              </div>

              <div className={styles.group}>
                <label>Valuta</label>
                <select 
                  value={formData.currency} 
                  onChange={(e) => setFormData({...formData, currency: e.target.value})}
                >
                  <option value="RSD">RSD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
            </div>

            <div className={styles.group}>
              <label>Iznos kredita</label>
              <input 
                type="number" 
                placeholder="Unesite iznos..."
                value={formData.amount} 
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                required 
              />
            </div>

            <div className={styles.group}>
              <label>Period otplate (Maksimalno: {maxMonths} meseci)</label>
              <input 
                type="number" 
                max={maxMonths}
                min="6"
                value={formData.repaymentPeriod} 
                onChange={(e) => setFormData({...formData, repaymentPeriod: e.target.value})}
                required 
              />
            </div>

            {/* INTERAKTIVNI KALKULATOR RATE - Prikazuje 0.00 umesto NaN */}
            <div className={styles.calculatorBox}>
              <div className={styles.calcItem}>
                <span>Mesečna rata (informativno):</span>
                <strong>{calculatedMonthlyInstallment} {formData.currency}</strong>
              </div>
              <div className={styles.calcItem}>
                <span>Kamatna stopa (EKS):</span>
                <span>{eks}% fiksno</span>
              </div>
            </div>

            {error && <div className={styles.errorMsg}>{error}</div>}
            
            <button type="submit" className={styles.submitBtn}>Pošalji zahtev na obradu</button>
          </form>
        </>
      ) : (
        <div className={styles.statusDisplay}>
          <div className={styles.progressBar}>
            <div className={`${styles.progress} ${styles[status]}`}></div>
          </div>
          
          <div className={styles.messageBox}>
            <div className={styles.requestSummary}>
              Iznos zahteva: <strong>{formData.amount} {formData.currency}</strong>
            </div>

            {status === 'PROCESSING' && (
              <p className={styles.pulse}>⏳ Vaš zahtev je primljen i u obradi je...</p>
            )}
            {status === 'APPROVED' && (
              <p>✅ Čestitamo! Vaš zahtev je <strong>automatski odobren</strong>. Sredstva će uskoro biti na vašem računu.</p>
            )}
            {status === 'MANUAL_REVIEW' && (
              <p>📝 Zahtev je uspešno kreiran i prosleđen na <strong>ručnu proveru</strong> od strane bankarskog agenta.</p>
            )}
          </div>

          {status !== 'PROCESSING' && (
            <button onClick={() => setStatus('IDLE')} className={styles.resetBtn}>
              Zatvori
            </button>
          )}
        </div>
      )}
    </div>
  );
}