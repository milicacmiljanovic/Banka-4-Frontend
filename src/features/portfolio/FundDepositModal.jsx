import { useEffect, useState } from 'react';
import { investmentFundsApi } from '../../api/endpoints/investmentFunds';
import { clientApi } from '../../api/endpoints/client';
import { accountsApi } from '../../api/endpoints/accounts';
import styles from './FundDepositModal.module.css';

export default function FundDepositModal({ fund, clientId, actuaryId, isSupervisor = false, onClose, onSuccess }) {
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

  const handleDeposit = async () => {
    try {
      if (!amount || parseFloat(amount) <= 0) {
        setError('Molimo unesite validan iznos.');
        return;
      }

      if (!accountNumber) {
        setError('Molimo odaberite račun.');
        return;
      }

      setLoading(true);
      setError(null);

      const payload = {
        account_number: accountNumber,
        amount: parseFloat(amount)
      };

      await investmentFundsApi.depositToFund(fund.fund_id, payload);
      onSuccess();
    } catch (err) {
      console.error('Greška pri ulaganju u fond:', err);
      setError(err.response?.data?.message || 'Greška pri ulaganju. Pokušajte ponovo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Uplata u fond: {fund.name}</h2>
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
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Unesite iznos"
              min="0"
              step="0.01"
              disabled={loading}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              {isSupervisor ? 'Bankovni račun' : 'Vaš račun'}
            </label>
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
            <p className={styles.hint}>
              Izaberite račun sa kojeg će biti izvršena uplata
            </p>
          </div>

          <div className={styles.infoBox}>
            <p><strong>Fond:</strong> {fund.name}</p>
            <p><strong>Minimalna ulaganja:</strong> {Number(fund.minimum_contribution ?? 0).toLocaleString('sr-RS', { minimumFractionDigits: 2 })} RSD</p>
            <p><strong>Trenutna vrednost:</strong> {Number(fund.fund_value ?? 0).toLocaleString('sr-RS', { minimumFractionDigits: 2 })} RSD</p>
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
            onClick={handleDeposit}
            disabled={loading}
          >
            {loading ? 'Obrada...' : 'Potvrdi uplatu'}
          </button>
        </div>
      </div>
    </div>
  );
}
