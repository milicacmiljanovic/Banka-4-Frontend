import { useState, useEffect } from 'react';
import { investmentFundsApi } from '../../api/endpoints/investmentFunds';
import Spinner from '../../components/ui/Spinner';
import Alert from '../../components/ui/Alert';
import FundDetailsModal from './FundDetailsModal';
import FundDepositModal from './FundDepositModal';
import FundWithdrawModal from './FundWithdrawModal';
import styles from './SupervisorFundsTab.module.css';

function extractFundsResponse(res) {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.data)) return res.data.data;
  return [];
}

function normalizeSupervisorFund(fund) {
  return {
    fund_id: fund.fund_id ?? fund.id,
    name: fund.name ?? fund.fund_name ?? '',
    description: fund.description ?? fund.fund_description ?? '',
    fund_value: fund.fund_value ?? 0,
    liquid_assets:
      fund.liquid_assets ??
      fund.available_liquidity_rsd ??
      fund.liquidity_rsd ??
      0,
    investor_count: fund.investor_count ?? 0,
    account_number: fund.account_number ?? '',
  };
}

function formatMoney(value) {
  if (value == null) return '—';
  return `${Number(value).toLocaleString('sr-RS', { minimumFractionDigits: 2 })} RSD`;
}

export default function SupervisorFundsTab({ actuaryId }) {
  const [funds, setFunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFund, setSelectedFund] = useState(null);
  const [depositModal, setDepositModal] = useState(null);
  const [withdrawModal, setWithdrawModal] = useState(null);

  async function loadFunds() {
    try {
      setLoading(true);
      setError(null);

      const res = await investmentFundsApi.getActuaryFunds(actuaryId);
      const fundList = extractFundsResponse(res).map(normalizeSupervisorFund);

      setFunds(fundList);
    } catch (err) {
      console.error('Greška pri učitavanju fondova:', err);
      setError(err?.response?.data?.message || 'Nije moguće učitati podatke fondova.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (actuaryId) {
      loadFunds();
    }
  }, [actuaryId]);

  if (loading) {
    return (
      <div style={{ padding: '24px' }}>
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert tip="greska" poruka={error} />
      </div>
    );
  }

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
                      {formatMoney(fund.fund_value)}
                    </span>
                  </div>

                  <div className={styles.statItem}>
                    <span className={styles.label}>Likvidnost:</span>
                    <span className={styles.value}>
                      {formatMoney(fund.liquid_assets)}
                    </span>
                  </div>

                  <div className={styles.statItem}>
                    <span className={styles.label}>Broj klijenta:</span>
                    <span className={styles.value}>{fund.investor_count}</span>
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
          actuaryId={actuaryId}
          isSupervisor={true}
          onClose={() => setDepositModal(null)}
          onSuccess={() => {
            setDepositModal(null);
            loadFunds();
          }}
        />
      )}

      {withdrawModal && (
        <FundWithdrawModal
          fund={withdrawModal}
          actuaryId={actuaryId}
          isSupervisor={true}
          onClose={() => setWithdrawModal(null)}
          onSuccess={() => {
            setWithdrawModal(null);
            loadFunds();
          }}
        />
      )}
    </>
  );
}