import { useState, useEffect } from 'react';
import { investmentFundsApi } from '../../api/endpoints/investmentFunds';
import styles from './FundDetailsModal.module.css';

export default function FundDetailsModal({ fund, isSupervisor = false, onClose }) {
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
          <h2 className={styles.title}>{fund.name}</h2>
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
                    <span className={styles.value}>{fund.name}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Opis:</span>
                    <span className={styles.value}>{fund.description}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Vrednost fonda:</span>
                    <span className={styles.value}>
                      {Number(fund.fund_value ?? 0).toLocaleString('sr-RS', { minimumFractionDigits: 2 })} RSD
                    </span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Minimalna ulaganja:</span>
                    <span className={styles.value}>
                      {Number(fund.minimum_contribution ?? 0).toLocaleString('sr-RS', { minimumFractionDigits: 2 })} RSD
                    </span>
                  </div>
                  {isSupervisor && (
                    <div className={styles.infoItem}>
                      <span className={styles.label}>Likvidnost:</span>
                      <span className={styles.value}>
                        {Number(fund.liquid_assets ?? 0).toLocaleString('sr-RS', { minimumFractionDigits: 2 })} RSD
                      </span>
                    </div>
                  )}
                  {!isSupervisor && (
                    <div className={styles.infoItem}>
                      <span className={styles.label}>Vaš udeo (%):</span>
                      <span className={styles.value}>{Number(fund.client_share_percentage ?? 0).toFixed(2)}%</span>
                    </div>
                  )}
                </div>
              </div>

              {details?.assets && (
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>Sredstva u fondu</h3>
                  <div className={styles.assetsList}>
                    {details.assets.map((asset, idx) => (
                      <div key={idx} className={styles.assetItem}>
                        <span className={styles.assetName}>{asset.name} ({asset.ticker})</span>
                        <span className={styles.assetAmount}>
                          {Number(asset.amount ?? 0).toLocaleString('sr-RS', { minimumFractionDigits: 2 })}
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
