import { useState, useEffect } from 'react';
import { investmentFundsApi } from '../../api/endpoints/investmentFunds';
import Spinner from '../../components/ui/Spinner';
import Alert from '../../components/ui/Alert';
import FundDetailsModal from './FundDetailsModal';
import FundDepositModal from './FundDepositModal';
import FundWithdrawModal from './FundWithdrawModal';
import styles from './SupervisorFundsTab.module.css';
import { useAuthStore } from '../../store/authStore';

function unwrapFundsResponse(res) {
  const raw = res?.data ?? res;
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw?.funds)) return raw.funds;
  if (Array.isArray(raw?.content)) return raw.content;
  return [];
}

function normalizeSupervisorFund(fund) {
  return {
    ...fund,
    fund_id: fund.fund_id ?? fund.fundId ?? fund.id,
    name: fund.name ?? fund.fund_name ?? fund.fundName ?? '—',
    description: fund.description ?? fund.fund_description ?? fund.fundDescription ?? '—',
    fund_value: fund.fund_value ?? fund.fundValue ?? fund.total_value ?? fund.totalValue ?? 0,
    liquid_assets: fund.liquid_assets ?? fund.liquidAssets ?? 0,
  };
}

export default function SupervisorFundsTab({ actuaryId }) {
  const user = useAuthStore(s => s.user);
  const [funds, setFunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFund, setSelectedFund] = useState(null);
  const [depositModal, setDepositModal] = useState(null);
  const [withdrawModal, setWithdrawModal] = useState(null);

  useEffect(() => {
    const resolvedActuaryId =
      user?.actuary_id ?? user?.actuaryId ?? user?.employee_id ?? user?.employeeId ?? user?.identity_id ?? user?.identityId ?? actuaryId;

    const loadFunds = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await investmentFundsApi.getActuaryFunds(resolvedActuaryId);
        setFunds(unwrapFundsResponse(res).map(normalizeSupervisorFund));
      } catch (err) {
        console.error('Greška pri učitavanju fondova:', err);
        setError('Nije moguće učitati podatke fondova.');
      } finally {
        setLoading(false);
      }
    };

    if (resolvedActuaryId) {
      loadFunds();
    }
  }, [actuaryId, user?.actuary_id, user?.actuaryId, user?.employee_id, user?.employeeId, user?.identity_id, user?.identityId]);

  if (loading) return <div style={{ padding: '24px' }}><Spinner /></div>;
  if (error) return <div style={{ padding: '24px' }}><Alert tip="greska" poruka={error} /></div>;

  return (
    <>
      <div className={styles.fundsContainer}>
        {funds.length === 0 ? (
          <div className={styles.empty}>
            <p>Trenutno ne upravljate nijednim fondom.</p>
          </div>
        ) : (
          <div className={styles.fundsList}>
            {funds.map(fund => (
              <div
                key={fund.fund_id}
                className={styles.fundCard}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedFund(fund)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedFund(fund);
                  }
                }}
              >
                <div className={styles.fundHeader}>
                  <div>
                    <h4 className={styles.fundName}>{fund.name}</h4>
                    <p className={styles.fundDesc}>{fund.description}</p>
                  </div>
                  <button
                    className={styles.detailsBtn}
                    onClick={e => {
                      e.stopPropagation();
                      setSelectedFund(fund);
                    }}
                  >
                    Detalji
                  </button>
                </div>

                <div className={styles.fundStats}>
                  <div className={styles.statItem}>
                    <span className={styles.label}>Vrednost fonda:</span>
                    <span className={styles.value}>
                      {Number(fund.fund_value ?? 0).toLocaleString('sr-RS', { minimumFractionDigits: 2 })} RSD
                    </span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.label}>Likvidnost:</span>
                    <span className={styles.value}>
                      {Number(fund.liquid_assets ?? 0).toLocaleString('sr-RS', { minimumFractionDigits: 2 })} RSD
                    </span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.label}>Broj klijenta:</span>
                    <span className={styles.value}>{fund.investor_count ?? 0}</span>
                  </div>
                </div>

                <div className={styles.fundActions}>
                  <button
                    className={styles.actionBtn}
                    onClick={e => {
                      e.stopPropagation();
                      setDepositModal(fund);
                    }}
                  >
                    Uplata u fond
                  </button>
                  <button
                    className={`${styles.actionBtn} ${styles.secondary}`}
                    onClick={e => {
                      e.stopPropagation();
                      setWithdrawModal(fund);
                    }}
                  >
                    Povlačenje iz fonda
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedFund && (
        <FundDetailsModal
          fund={selectedFund}
          isSupervisor={true}
          onClose={() => setSelectedFund(null)}
        />
      )}

      {depositModal && (
        <FundDepositModal
          fund={depositModal}
          actuaryId={actuaryId ?? user?.actuary_id ?? user?.actuaryId ?? user?.employee_id ?? user?.employeeId ?? user?.identity_id ?? user?.identityId}
          isSupervisor={true}
          onClose={() => setDepositModal(null)}
          onSuccess={() => {
            setDepositModal(null);
            const refreshActuaryId = actuaryId ?? user?.actuary_id ?? user?.actuaryId ?? user?.employee_id ?? user?.employeeId ?? user?.identity_id ?? user?.identityId;
            investmentFundsApi.getActuaryFunds(refreshActuaryId)
              .then(res => setFunds(unwrapFundsResponse(res).map(normalizeSupervisorFund)))
              .catch(err => console.error('Greška pri osvežavanju fondova:', err));
          }}
        />
      )}

      {withdrawModal && (
        <FundWithdrawModal
          fund={withdrawModal}
          actuaryId={actuaryId ?? user?.actuary_id ?? user?.actuaryId ?? user?.employee_id ?? user?.employeeId ?? user?.identity_id ?? user?.identityId}
          isSupervisor={true}
          onClose={() => setWithdrawModal(null)}
          onSuccess={() => {
            setWithdrawModal(null);
            const refreshActuaryId = actuaryId ?? user?.actuary_id ?? user?.actuaryId ?? user?.employee_id ?? user?.employeeId ?? user?.identity_id ?? user?.identityId;
            investmentFundsApi.getActuaryFunds(refreshActuaryId)
              .then(res => setFunds(unwrapFundsResponse(res).map(normalizeSupervisorFund)))
              .catch(err => console.error('Greška pri osvežavanju fondova:', err));
          }}
        />
      )}
    </>
  );
}
