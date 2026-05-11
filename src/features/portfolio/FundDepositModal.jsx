import { useEffect, useState } from 'react';
import { investmentFundsApi } from '../../api/endpoints/investmentFunds';
import { clientApi } from '../../api/endpoints/client';
import { accountsApi } from '../../api/endpoints/accounts';
import styles from './FundDepositModal.module.css';

export default function FundDepositModal({ fund, clientId, isSupervisor = false, onClose, onSuccess }) {
  const [amount, setAmount] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fundId = fund?.fund_id ?? fund?.id;
  const fundName = fund?.name ?? fund?.fund_name ?? '';

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
    const balance =
      account.balance ??
      account.available_balance ??
      account.availableBalance ??
      account.Balance ??
      account.AvailableBalance;
    const currency = account.currency ?? account.Currency?.Code ?? account.Currency ?? '';
    const label = name || number || `Račun ${index + 1}`;

    return { number, label, balance, currency };
  });

  const handleDeposit = async () => {
    try {
      const depositAmount = parseFloat(amount);

      if (!depositAmount || depositAmount <= 0) {
        setError('Molimo unesite validan iznos.');
        return;
      }

      if (!accountNumber) {
        setError('Molimo izaberite račun.');
        return;
      }

      setLoading(true);
      setError(null);

      await investmentFundsApi.depositToFund(fundId, {
        account_number: accountNumber,
        amount: depositAmount,
      });

      onSuccess();
    } catch (err) {
      console.error('Greška pri uplati u fond:', err);
      setError(err?.response?.data?.message || 'Greška pri uplati. Pokušajte ponovo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Uplata u fond: {fundName}</h2>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <div className={styles.content}>
          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.formGroup}>
            <label className={styles.label}>Iznos (RSD)</label>
            <input
              type="number"
              className={styles.input}
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="Unesite iznos"
              min="0"
              step="0.01"
              disabled={loading}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              {isSupervisor ? 'Bankovni račun za uplatu' : 'Račun sa kog se vrši uplata'}
            </label>
            <select
              className={styles.input}
              value={accountNumber}
              onChange={e => setAccountNumber(e.target.value)}
              disabled={loading}
            >
              <option value="">Izaberite račun...</option>
              {accountOptions.map((account, index) => (
                <option key={account.number || index} value={account.number}>
                  {account.label}{account.label && account.number ? ` — ${account.number}` : ''}
                  {account.balance != null
                    ? ` (${Number(account.balance).toLocaleString('sr-RS', { minimumFractionDigits: 2 })}${account.currency ? ` ${account.currency}` : ''})`
                    : ''}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.infoBox}>
            <p><strong>Fond:</strong> {fundName}</p>
            {fund.fund_description && (
              <p><strong>Opis:</strong> {fund.fund_description}</p>
            )}
            {fund.clients_share_value_rsd != null && !isSupervisor && (
              <p>
                <strong>Vaš trenutni udeo:</strong>{' '}
                {Number(fund.clients_share_value_rsd).toLocaleString('sr-RS', {
                  minimumFractionDigits: 2,
                })} RSD
              </p>
            )}
            {fund.clients_share_percent != null && !isSupervisor && (
              <p>
                <strong>Vaš procenat udela:</strong>{' '}
                {Number(fund.clients_share_percent).toFixed(2)}%
              </p>
            )}
          </div>
        </div>

        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose} disabled={loading}>
            Otkaži
          </button>
          <button className={styles.submitBtn} onClick={handleDeposit} disabled={loading}>
            {loading ? 'Obrada...' : 'Potvrdi uplatu'}
          </button>
        </div>
      </div>
    </div>
  );
}