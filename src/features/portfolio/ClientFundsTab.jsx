import { useState, useEffect } from 'react';
import { investmentFundsApi } from '../../api/endpoints/investmentFunds';
import Spinner from '../../components/ui/Spinner';
import Alert from '../../components/ui/Alert';
import FundDetailsModal from './FundDetailsModal';
import FundDepositModal from './FundDepositModal';
import FundWithdrawModal from './FundWithdrawModal';
import styles from './ClientFundsTab.module.css';
import { useAuthStore } from '../../store/authStore';

function formatMoney(value) {
  return Number(value ?? 0).toLocaleString('sr-RS', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function unwrapFundsResponse(res) {
  const raw = res?.data ?? res;
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw?.funds)) return raw.funds;
  if (Array.isArray(raw?.content)) return raw.content;
  return [];
}

function normalizeClientFund(fund) {
  return {
    ...fund,
    fund_id: fund.fund_id ?? fund.fundId ?? fund.id,
    name: fund.name ?? fund.fund_name ?? fund.fundName ?? '—',
    description: fund.description ?? fund.fund_description ?? fund.fundDescription ?? '—',
    fund_value: fund.fund_value ?? fund.fundValue ?? fund.total_value ?? fund.totalValue ?? 0,
    clients_share_percent: fund.clients_share_percent ?? fund.client_share_percentage ?? fund.client_share_percent ?? 0,
    clients_share_value_rsd: fund.clients_share_value_rsd ?? fund.client_share_value ?? 0,
    total_profit: fund.total_profit ?? fund.profit ?? 0,
  };
}

async function enrichFundsWithDetails(list) {
  return Promise.all(
    list.map(async (fund) => {
      const fundId = fund.fund_id ?? fund.fundId ?? fund.id;
      if (!fundId) return fund;

      try {
        const res = await investmentFundsApi.getFundDetails(fundId);
        const details = res?.data ?? res;
        return {
          ...fund,
          fund_value:
            details?.fund_value ??
            details?.account_balance ??
            details?.totalValue ??
            fund.fund_value,
        };
      } catch {
        return fund;
      }
    })
  );
}

export default function ClientFundsTab({ clientId }) {
  const user = useAuthStore(s => s.user);
  const [funds, setFunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFund, setSelectedFund] = useState(null);
  const [depositModal, setDepositModal] = useState(null);
  const [withdrawModal, setWithdrawModal] = useState(null);

  const loadFunds = async () => {
    const resolvedClientId =
      user?.client_id ?? user?.clientId ?? user?.identity_id ?? user?.identityId ?? clientId;

    try {
      setLoading(true);
      setError(null);

      const res = await investmentFundsApi.getClientFunds(resolvedClientId);
      const normalized = unwrapFundsResponse(res).map(normalizeClientFund);
      setFunds(await enrichFundsWithDetails(normalized));
    } catch (err) {
      console.error('Greška pri učitavanju fondova:', err);
      setError(err?.response?.data?.message || 'Nije moguće učitati podatke fondova.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const resolvedClientId =
      user?.client_id ?? user?.clientId ?? user?.identity_id ?? user?.identityId ?? clientId;

    if (resolvedClientId) loadFunds();
  }, [clientId, user?.client_id, user?.clientId, user?.identity_id, user?.identityId]);

  // Listen for global updates (invest/withdraw) and refresh if clientId matches
  useEffect(() => {
    function handler(e) {
      try {
        const updatedClientId = e?.detail?.clientId;
        const resolvedClientId = user?.client_id ?? user?.clientId ?? user?.identity_id ?? user?.identityId ?? clientId;
        if (!updatedClientId || String(updatedClientId) === String(resolvedClientId)) {
          loadFunds();
        }
      } catch (err) {
        // ignore
      }
    }
    window.addEventListener('rafbank:clientFunds:updated', handler);
    return () => window.removeEventListener('rafbank:clientFunds:updated', handler);
  }, [clientId, user?.client_id, user?.clientId, user?.identity_id, user?.identityId]);

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
                      {formatMoney(fund.fund_value ?? 0)} RSD
                    </span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.label}>Vaš udeo:</span>
                    <span className={styles.value}>
                      {formatMoney(fund.clients_share_value_rsd ?? 0)} RSD
                    </span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.label}>Procenat:</span>
                    <span className={styles.value}>
                      {Number(fund.clients_share_percent ?? 0).toFixed(2)}%
                    </span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.label}>Profit:</span>
                    <span className={`${styles.value} ${(fund.total_profit ?? 0) >= 0 ? styles.profit : styles.loss}`}>
                      {(fund.total_profit ?? 0) >= 0 ? '+' : ''}{formatMoney(fund.total_profit ?? 0)} RSD
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
          clientId={clientId ?? user?.client_id ?? user?.clientId ?? user?.identity_id ?? user?.identityId}
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
          clientId={clientId ?? user?.client_id ?? user?.clientId ?? user?.identity_id ?? user?.identityId}
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
