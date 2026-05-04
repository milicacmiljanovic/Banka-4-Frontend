import { useEffect, useState } from 'react';
import { investmentFundsApi } from '../../api/endpoints/investmentFunds';
import { clientApi } from '../../api/endpoints/client';
import { accountsApi } from '../../api/endpoints/accounts';
import styles from './FundWithdrawModal.module.css';

export default function FundWithdrawModal({ fund, clientId, actuaryId, isSupervisor = false, onClose, onSuccess }) {
  const [withdrawType, setWithdrawType] = useState('partial'); // 'partial' or 'full'
  const [amount, setAmount] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadAccounts = async () => {
      try {
        const res = isSupervisor
          ? await accountsApi.getBankAccounts()
          : await clientApi.getAccounts(clientId);
        const list = Array.isArray(res) ? res : res?.data ?? [];
        setAccounts(list);
      } catch (err) {
        console.error('Greška pri učitavanju računa:', err);
        setAccounts([]);
      }
    };

    loadAccounts();
  }, [clientId, isSupervisor]);

  useEffect(() => {
    if (!accountNumber && accounts.length > 0) {
      const firstAccount = accounts[0];
      setAccountNumber(
        firstAccount.account_number ??
        firstAccount.accountNumber ??
        firstAccount.AccountNumber ??
        firstAccount.number ??
        ''
      );
    }
  }, [accounts, accountNumber]);

  const accountOptions = accounts.map((account, index) => {
    const number = account.account_number ?? account.accountNumber ?? account.AccountNumber ?? account.number ?? '';
    const name = account.name ?? account.Name ?? account.owner_name ?? account.ownerName ?? '';
    const balance = account.balance ?? account.available_balance ?? account.availableBalance ?? account.Balance ?? account.AvailableBalance;
    const currency = account.currency ?? account.Currency?.Code ?? account.Currency ?? '';
    const label = name || number || `Račun ${index + 1}`;

    return { number, label, balance, currency };
  });

  const clientShare = fund.client_share_value ?? 0;
  const fullAmount = isSupervisor ? (fund.liquid_assets ?? 0) : clientShare;

  const handleWithdraw = async () => {
    try {
      let withdrawAmount = withdrawType === 'full' ? fullAmount : parseFloat(amount);

      if (!withdrawAmount || withdrawAmount <= 0) {
        setError('Molimo unesite validan iznos.');
        return;
      }

      if (withdrawAmount > fullAmount) {
        setError(`Iznos ne može biti veći od dostupnog: ${Number(fullAmount).toLocaleString('sr-RS', { minimumFractionDigits: 2 })} RSD`);
        return;
      }

      if (!accountNumber) {
        setError('Molimo unesite broj računa.');
        return;
      }

      setLoading(true);
      setError(null);

      const payload = {
        account_number: accountNumber,
        amount: withdrawAmount
      };

      await investmentFundsApi.withdrawFromFund(fund.fund_id, payload);
      onSuccess();
    } catch (err) {
      console.error('Greška pri povlačenju iz fonda:', err);
      setError(err.response?.data?.message || 'Greška pri povlačenju. Pokušajte ponovo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Povlačenje iz fonda: {fund.name}</h2>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <div className={styles.content}>
          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.withdrawType}>
            <label className={styles.radioLabel}>
              <input
                type="radio"
                name="withdrawType"
                value="partial"
                checked={withdrawType === 'partial'}
                onChange={(e) => setWithdrawType(e.target.value)}
                disabled={loading}
              />
              <span>Parcijalno povlačenje</span>
            </label>
            <label className={styles.radioLabel}>
              <input
                type="radio"
                name="withdrawType"
                value="full"
                checked={withdrawType === 'full'}
                onChange={(e) => setWithdrawType(e.target.value)}
                disabled={loading}
              />
              <span>Povuci sve ({Number(fullAmount).toLocaleString('sr-RS', { minimumFractionDigits: 2 })} RSD)</span>
            </label>
          </div>

          {withdrawType === 'partial' && (
            <div className={styles.formGroup}>
              <label className={styles.label}>Iznos (RSD)</label>
              <input
                type="number"
                className={styles.input}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Unesite iznos"
                min="0"
                step="0.01"
                max={fullAmount}
                disabled={loading}
              />
              <p className={styles.hint}>
                Dostupno: {Number(fullAmount).toLocaleString('sr-RS', { minimumFractionDigits: 2 })} RSD
              </p>
            </div>
          )}

          <div className={styles.formGroup}>
            <label className={styles.label}>Broj računa za primanje sredstava</label>
            <select
              className={styles.input}
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              disabled={loading}
            >
              <option value="">Izaberite račun...</option>
              {accountOptions.map((account, index) => (
                <option key={account.number || index} value={account.number}>
                  {account.label}{account.label && account.number ? ` — ${account.number}` : ''}
                  {account.balance != null ? ` (${Number(account.balance).toLocaleString('sr-RS', { minimumFractionDigits: 2 })}${account.currency ? ` ${account.currency}` : ''})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.infoBox}>
            <p><strong>Fond:</strong> {fund.name}</p>
            {!isSupervisor && (
              <p><strong>Vaš udeo:</strong> {Number(clientShare).toLocaleString('sr-RS', { minimumFractionDigits: 2 })} RSD</p>
            )}
            {isSupervisor && (
              <p><strong>Likvidnost:</strong> {Number(fund.liquid_assets ?? 0).toLocaleString('sr-RS', { minimumFractionDigits: 2 })} RSD</p>
            )}
          </div>
        </div>

        <div className={styles.footer}>
          <button
            className={styles.cancelBtn}
            onClick={onClose}
            disabled={loading}
          >
            Otkaži
          </button>
          <button
            className={styles.submitBtn}
            onClick={handleWithdraw}
            disabled={loading}
          >
            {loading ? 'Obrada...' : 'Potvrdi povlačenje'}
          </button>
        </div>
      </div>
    </div>
  );
}
