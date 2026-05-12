import { useState, useEffect } from 'react';
import { investmentFundsApi } from '../../api/endpoints/investmentFunds';
import styles from './FundDetailsModal.module.css';

function normalizeFund(fund) {
  return {
    id: fund?.fund_id ?? fund?.fundId ?? fund?.id,
    name: fund?.fund_name ?? fund?.name ?? 'Fond',
    description: fund?.fund_description ?? fund?.description ?? '',
    sharePercent: Number(fund?.clients_share_percent ?? fund?.client_share_percentage ?? 0),
    shareValue: Number(fund?.clients_share_value_rsd ?? fund?.client_share_value ?? 0),
    profit: Number(fund?.total_profit ?? fund?.profit ?? 0),
    minimumContribution: Number(fund?.minimum_contribution ?? fund?.min_investment ?? 0),
  };
}

function formatMoney(value) {
  return Number(value ?? 0).toLocaleString('sr-RS', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function FundDetailsModal({ fund, isSupervisor = false, onClose }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const normalizedFund = normalizeFund(fund);
  const fundId = normalizedFund.id;

  useEffect(() => {
    const loadDetails = async () => {
      try {
        setLoading(true);
        const res = await investmentFundsApi.getFundDetails(fundId);
        setDetails(res?.data || res);
      } catch (err) {
        console.error('Greška pri učitavanju detalja fonda:', err);
      } finally {
        setLoading(false);
      }
    };

    if (fundId != null) {
      loadDetails();
    }
  }, [fundId]);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>{normalizedFund.name}</h2>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <div className={styles.content}>
          {loading ? (
            <div className={styles.loading}>Učitavanje...</div>
          ) : (
            <>
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Osnovne informacije</h3>
                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Naziv:</span>
                    <span className={styles.value}>{normalizedFund.name}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Opis:</span>
                    <span className={styles.value}>{normalizedFund.description}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Vrednost fonda:</span>
                    <span className={styles.value}>
                      {formatMoney(details?.fund_value ?? fund.fund_value ?? 0)} RSD
                    </span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Minimalni ulog:</span>
                    <span className={styles.value}>
                      {formatMoney(details?.min_investment ?? normalizedFund.minimumContribution ?? 0)} RSD
                    </span>
                  </div>
                  {isSupervisor && (
                    <div className={styles.infoItem}>
                      <span className={styles.label}>Likvidnost:</span>
                      <span className={styles.value}>
                        {formatMoney(details?.account_balance ?? details?.liquid_assets ?? 0)} RSD
                      </span>
                    </div>
                  )}
                  {!isSupervisor && (
                    <div className={styles.infoItem}>
                      <span className={styles.label}>Vaš udeo (%):</span>
                      <span className={styles.value}>{normalizedFund.sharePercent.toFixed(2)}%</span>
                    </div>
                  )}
                  {!isSupervisor && (
                    <div className={styles.infoItem}>
                      <span className={styles.label}>Vaš udeo (RSD):</span>
                      <span className={styles.value}>{formatMoney(normalizedFund.shareValue)} RSD</span>
                    </div>
                  )}
                </div>
              </div>

              {Array.isArray(details?.holdings) && details.holdings.length > 0 && (
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>Hartije u fondu</h3>
                  <div className={styles.assetsList}>
                    {details.holdings.map((asset, idx) => (
                      <div key={idx} className={styles.assetItem}>
                        <span className={styles.assetName}>{asset.ticker}</span>
                        <span className={styles.assetAmount}>
                          {formatMoney(asset.volume ?? asset.amount ?? 0)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {Array.isArray(details?.performance_history) && details.performance_history.length > 0 && (
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>Istorija performansi</h3>
                  <div className={styles.assetsList}>
                    {details.performance_history.map((point, idx) => (
                      <div key={idx} className={styles.assetItem}>
                        <span className={styles.assetName}>{point.date}</span>
                        <span className={styles.assetAmount}>{formatMoney(point.value ?? 0)} RSD</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className={styles.footer}>
          <button className={styles.closeModalBtn} onClick={onClose}>
            Zatvori
          </button>
        </div>
      </div>
    </div>
  );
}
