import { useState, useEffect } from 'react';
import { investmentFundsApi } from '../../api/endpoints/investmentFunds';
import styles from './FundDetailsModal.module.css';

function formatMoney(value) {
  if (value == null) return '—';
  return `${Number(value).toLocaleString('sr-RS', { minimumFractionDigits: 2 })} RSD`;
}

function formatPercent(value) {
  if (value == null) return '—';
  return `${Number(value).toFixed(2)}%`;
}

export default function FundDetailsModal({ fund, onClose }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDetails = async () => {
      try {
        setLoading(true);
        const res = await investmentFundsApi.getFundDetails(fund.fund_id);
        setDetails(res?.data || res);
      } catch (err) {
        console.error('Greška pri učitavanju detalja fonda:', err);
      } finally {
        setLoading(false);
      }
    };

    if (fund?.fund_id) {
      loadDetails();
    }
  }, [fund?.fund_id]);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>{fund.fund_name}</h2>
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
                    <span className={styles.value}>{fund.fund_name}</span>
                  </div>

                  <div className={styles.infoItem}>
                    <span className={styles.label}>Opis:</span>
                    <span className={styles.value}>{fund.fund_description}</span>
                  </div>

                  <div className={styles.infoItem}>
                    <span className={styles.label}>Vaš udeo:</span>
                    <span className={styles.value}>
                      {formatMoney(fund.clients_share_value_rsd)}
                    </span>
                  </div>

                  <div className={styles.infoItem}>
                    <span className={styles.label}>Procenat:</span>
                    <span className={styles.value}>
                      {formatPercent(fund.clients_share_percent)}
                    </span>
                  </div>

                  <div className={styles.infoItem}>
                    <span className={styles.label}>Profit:</span>
                    <span className={styles.value}>
                      {(fund.total_profit ?? 0) >= 0 ? '+' : ''}
                      {formatMoney(fund.total_profit)}
                    </span>
                  </div>
                </div>
              </div>

              {details?.assets && (
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>Sredstva u fondu</h3>
                  <div className={styles.assetsList}>
                    {details.assets.map((asset, idx) => (
                      <div key={idx} className={styles.assetItem}>
                        <span className={styles.assetName}>
                          {asset.name} {asset.ticker ? `(${asset.ticker})` : ''}
                        </span>
                        <span className={styles.assetAmount}>
                          {Number(asset.amount ?? 0).toLocaleString('sr-RS', {
                            minimumFractionDigits: 2,
                          })}
                        </span>
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