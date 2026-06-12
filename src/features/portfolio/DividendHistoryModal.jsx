import { useEffect, useMemo, useState } from 'react';
import { dividendsApi } from '../../api/endpoints/dividends';
import styles from './DividendHistoryModal.module.css';

function pickArray(body) {
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.data)) return body.data;
  if (Array.isArray(body?.items)) return body.items;
  if (Array.isArray(body?.content)) return body.content;
  return [];
}

function formatDate(value) {
  if (!value) return '—';

  try {
    return new Intl.DateTimeFormat('sr-RS', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function formatAmount(value, currencyCode = 'RSD') {
  if (value === null || value === undefined || value === '') return '—';

  const amount = Number(value);
  if (Number.isNaN(amount)) return String(value);

  try {
    return new Intl.NumberFormat('sr-RS', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString('sr-RS', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} ${currencyCode}`;
  }
}

function normalizeRows(payload) {
  return pickArray(payload).map((item, index) => ({
    id:
      item.dividendPayoutId ??
      item.dividend_payout_id ??
      `${item.paymentDate ?? item.payment_date ?? 'row'}-${index}`,
    stock: item.stock ?? item.ticker ?? '—',
    quantity: item.quantity ?? '—',
    grossAmount: item.grossAmount ?? item.gross_amount ?? 0,
    taxAmount: item.taxAmount ?? item.tax_amount ?? item.tax ?? 0,
    netAmount: item.netAmount ?? item.net_amount ?? 0,
    paymentDate: item.paymentDate ?? item.payment_date,
    accountNumber: item.accountNumber ?? item.account_number ?? '—',
    currencyCode: item.currencyCode ?? item.currency_code ?? item.currency ?? 'RSD',
  }));
}

export default function DividendHistoryModal({ open, asset, clientId, actId, onClose }) {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');

  const assetOwnershipId =
    asset?.ownership_id ??
    asset?.asset_ownership_id ??
    asset?.ownershipId ??
    asset?.assetOwnershipId ??
    asset?.id;

  const title = asset?.ticker ?? asset?.name ?? 'Pozicija';

  const loadData = async () => {
    if (!assetOwnershipId) {
      setError('Nije pronađen ownership ID za ovu poziciju.');
      setRows([]);
      return;
    }

    try {
      setLoading(true);
      setError('');

      let res;

      if (clientId) {
        res = await dividendsApi.getClientDividends(clientId, assetOwnershipId);
      } else if (actId) {
        res = await dividendsApi.getActuaryDividends(actId, assetOwnershipId);
      } else {
        setError('Nedostaje clientId ili actId za učitavanje dividendi.');
        setRows([]);
        return;
      }

      const raw = res?.data ?? res;
      setRows(normalizeRows(raw));
    } catch (err) {
      if (err?.response?.status === 404) {
        setRows([]);
        setError('');
      } else {
        setError(
          err?.response?.data?.message ??
          err?.message ??
          'Greška pri učitavanju istorije dividendi.'
        );
        setRows([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, assetOwnershipId]);

  const totalNet = useMemo(
    () => rows.reduce((sum, row) => sum + Number(row.netAmount || 0), 0),
    [rows]
  );

  const totalTax = useMemo(
    () => rows.reduce((sum, row) => sum + Number(row.taxAmount || 0), 0),
    [rows]
  );

  if (!open) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dividend-history-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <div>
            <div className={styles.eyebrow}>Dividend history</div>
            <h2 id="dividend-history-title" className={styles.title}>
              Primljene dividende — {title}
            </h2>
          </div>

          <button type="button" className={styles.closeBtn} onClick={onClose}>
            Zatvori
          </button>
        </div>

        <div className={styles.body}>
          {error ? (
            <div className={styles.errorBox}>{error}</div>
          ) : loading ? (
            <div className={styles.stateBox}>Učitavanje dividendi…</div>
          ) : rows.length === 0 ? (
            <div className={styles.stateBox}>Nema primljenih dividendi za ovu poziciju.</div>
          ) : (
            <>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Datum isplate</th>
                      <th>Akcija</th>
                      <th>Količina</th>
                      <th>Bruto iznos</th>
                      <th>Porez</th>
                      <th>Neto iznos</th>
                      <th>Račun</th>
                      <th>Valuta</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.id}>
                        <td>{formatDate(row.paymentDate)}</td>
                        <td>{row.stock}</td>
                        <td>{row.quantity}</td>
                        <td>{formatAmount(row.grossAmount, row.currencyCode)}</td>
                        <td className={Number(row.taxAmount) > 0 ? styles.negative : styles.muted}>
                          {formatAmount(row.taxAmount, 'RSD')}
                        </td>
                        <td className={styles.positive}>
                          {formatAmount(row.netAmount, row.currencyCode)}
                        </td>
                        <td>{row.accountNumber}</td>
                        <td>{row.currencyCode}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className={styles.summaryRow}>
                <div className={styles.summaryBox}>
                  <div className={styles.summaryLabel}>Ukupno neto</div>
                  <div className={styles.positive}>
                    {formatAmount(totalNet, rows[0]?.currencyCode ?? 'RSD')}
                  </div>
                </div>

                <div className={styles.summaryBox}>
                  <div className={styles.summaryLabel}>Ukupan porez</div>
                  <div className={styles.negative}>
                    {formatAmount(totalTax, 'RSD')}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}