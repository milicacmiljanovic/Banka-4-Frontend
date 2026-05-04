import { useState, useEffect } from 'react';
import { investmentFundsApi } from '../../api/endpoints/investmentFunds';
import Spinner from '../../components/ui/Spinner';
import Alert from '../../components/ui/Alert';
import FundDetailsModal from './FundDetailsModal';
import FundDepositModal from './FundDepositModal';
import FundWithdrawModal from './FundWithdrawModal';
import styles from './ClientFundsTab.module.css';

export default function ClientFundsTab({ clientId }) {
  const [funds, setFunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFund, setSelectedFund] = useState(null);
  const [depositModal, setDepositModal] = useState(null);
  const [withdrawModal, setWithdrawModal] = useState(null);

  useEffect(() => {
    const loadFunds = async () => {
      try {
        setLoading(true);
        setError(null);

        // Client-specific endpoint (/me/funds) — backend must provide this
        const res = await investmentFundsApi.getClientFunds(clientId);
        const fundList = Array.isArray(res?.data) ? res.data : (res?.data?.data || []);
        setFunds(fundList);

      } catch (err) {
        console.error('Greška pri učitavanju fondova:', err);
        setError(err?.response?.data?.message || 'Nije moguće učitati podatke fondova.');
      } finally {
        setLoading(false);
      }
    };

    if (clientId) {
      loadFunds();
    }
  }, [clientId]);

  if (loading) return <div style={{ padding: '24px' }}><Spinner /></div>;
  if (error) return <div style={{ padding: '24px' }}><Alert tip="greska" poruka={error} /></div>;

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
                    <span className={styles.label}>Vaš udeo:</span>
                    <span className={styles.value}>
                      {Number(fund.client_share_value ?? 0).toLocaleString('sr-RS', { minimumFractionDigits: 2 })} RSD
                    </span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.label}>Procenat:</span>
                    <span className={styles.value}>
                      {Number(fund.client_share_percentage ?? 0).toFixed(2)}%
                    </span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.label}>Profit:</span>
                    <span className={`${styles.value} ${(fund.profit ?? 0) >= 0 ? styles.profit : styles.loss}`}>
                      {(fund.profit ?? 0) >= 0 ? '+' : ''}{Number(fund.profit ?? 0).toLocaleString('sr-RS', { minimumFractionDigits: 2 })} RSD
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
            // Refresh funds list
            const loadFunds = async () => {
              try {
                const res = await investmentFundsApi.getClientFunds(clientId);
                const fundList = Array.isArray(res?.data) ? res.data : (res?.data?.data || []);
                setFunds(fundList);
              } catch (err) {
                console.error('Greška pri osvežavanju fondova:', err);
              }
            };
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
            // Refresh funds list
            const loadFunds = async () => {
              try {
                const res = await investmentFundsApi.getClientFunds(clientId);
                const fundList = Array.isArray(res?.data) ? res.data : (res?.data?.data || []);
                setFunds(fundList);
              } catch (err) {
                console.error('Greška pri osvežavanju fondova:', err);
              }
            };
            loadFunds();
          }}
        />
      )}
    </>
  );
}
