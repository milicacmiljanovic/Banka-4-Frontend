import { useState, useEffect } from 'react';
import { investmentFundsApi } from '../../api/endpoints/investmentFunds';
import Spinner from '../../components/ui/Spinner';
import Alert from '../../components/ui/Alert';
import FundDetailsModal from './FundDetailsModal';
import FundDepositModal from './FundDepositModal';
import FundWithdrawModal from './FundWithdrawModal';
import styles from './ClientFundsTab.module.css';

function extractFundsResponse(res) {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.data)) return res.data.data;
  return [];
}

function normalizeClientFund(fund) {
  return {
    fund_id: fund.fund_id,
    fund_name: fund.fund_name,
    fund_description: fund.fund_description,
    clients_share_percent: fund.clients_share_percent,
    clients_share_value_rsd: fund.clients_share_value_rsd,
    total_profit: fund.total_profit,
  };
}

function formatMoney(value) {
  if (value == null) return '—';
  return `${Number(value).toLocaleString('sr-RS', { minimumFractionDigits: 2 })} RSD`;
}

function formatPercent(value) {
  if (value == null) return '—';
  return `${Number(value).toFixed(2)}%`;
}

export default function ClientFundsTab({ clientId }) {
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

      const res = await investmentFundsApi.getClientFunds(clientId);
      const fundList = extractFundsResponse(res).map(normalizeClientFund);
      setFunds(fundList);
    } catch (err) {
      console.error('Greška pri učitavanju fondova:', err);
      setError(err?.response?.data?.message || 'Nije moguće učitati podatke fondova.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (clientId) {
      loadFunds();
    }
  }, [clientId]);

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
            <p>Trenutno nemate sredstava u fondovima.</p>
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
                    <h4 className={styles.fundName}>{fund.fund_name}</h4>
                    <p className={styles.fundDesc}>{fund.fund_description}</p>
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
                    <span className={styles.label}>Vaš udeo:</span>
                    <span className={styles.value}>
                      {formatMoney(fund.clients_share_value_rsd)}
                    </span>
                  </div>

                  <div className={styles.statItem}>
                    <span className={styles.label}>Procenat:</span>
                    <span className={styles.value}>
                      {formatPercent(fund.clients_share_percent)}
                    </span>
                  </div>

                  <div className={styles.statItem}>
                    <span className={styles.label}>Profit:</span>
                    <span
                      className={`${styles.value} ${(fund.total_profit ?? 0) >= 0 ? styles.profit : styles.loss}`}
                    >
                      {(fund.total_profit ?? 0) >= 0 ? '+' : ''}
                      {formatMoney(fund.total_profit)}
                    </span>
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
          onClose={() => setSelectedFund(null)}
        />
      )}

      {depositModal && (
        <FundDepositModal
          fund={depositModal}
          clientId={clientId}
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
          clientId={clientId}
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