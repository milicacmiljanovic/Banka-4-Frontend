import { useState, useEffect } from 'react';
import CardStatusBadge from './CardStatusBadge';
import { cardsApi }      from '../../api/endpoints/cards';
import Spinner          from '../../components/ui/Spinner';
import styles           from './CardsTable.module.css';

function ClientRow({ client, onActionSuccess }) {
  const clientName = `${client.first_name} ${client.last_name}`;

  // Flatten cards from all accounts
  const cards = (client.accounts || []).flatMap(acc => {
    // Support both 'cards' and 'Cards' based on Swagger/JSON
    const accCards = acc.Cards || acc.cards || [];
    return accCards.map(card => ({
      ...card,
      // Support 'AccountNumber' and 'account_number'
      account_number: acc.AccountNumber || acc.account_number || acc.accountNumber
    }));
  });

  const handleAction = async (actionFn, cardId) => {
    if (!window.confirm('Da li ste sigurni?')) return;
    try {
      await actionFn(cardId);
      if (onActionSuccess) onActionSuccess();
    } catch (err) {
      alert(err.response?.data?.error ?? 'Akcija nije uspela.');
    }
  };

  if (cards.length === 0) {
    return (
      <tr key={`client-${client.id}`}>
        <td>
          <div className={styles.clientName}>{clientName}</div>
          <div className={styles.clientMeta}>{client.email}</div>
          <div className={styles.clientMeta}>{client.phone_number}</div>
        </td>
        <td className={styles.noCards}>Klijent nema kartice</td>
        <td className={styles.mono}>—</td>
        <td>—</td>
        <td>—</td>
      </tr>
    );
  }

  return cards.map((card, idx) => {
    // Support 'Status' and 'status'
    const rawStatus = card.Status || card.status || '';
    const status = rawStatus.toUpperCase();
    
    const canUnblock = status === 'BLOKIRANA' || status === 'BLOCKED';
    const canBlock = status === 'AKTIVNA' || status === 'ACTIVE';
    const canDeactivate = status !== 'NEAKTIVNA' && status !== 'INACTIVE' && status !== 'DEACTIVATED';

    // Support 'CardNumber', 'ID'
    const cardNumber = card.CardNumber || card.card_number || card.cardNumber || '—';
    const accountNumber = card.account_number || '—';
    const cardId = card.ID || card.id;

    return (
      <tr key={`${client.id}-${cardNumber}-${idx}`}>
        {idx === 0 && (
          <td rowSpan={cards.length}>
            <div className={styles.clientName}>{clientName}</div>
            <div className={styles.clientMeta}>{client.email}</div>
            <div className={styles.clientMeta}>{client.phone_number}</div>
          </td>
        )}
        <td className={styles.mono}>{cardNumber}</td>
        <td className={styles.mono}>{accountNumber}</td>
        <td>
          <CardStatusBadge status={status} />
        </td>
        <td>
          <div className={styles.actions}>
            {canUnblock && (
              <button 
                className={styles.btnUnblock} 
                onClick={() => handleAction(cardsApi.unblock, cardId)}
              >
                Deblokiraj
              </button>
            )}
            {canBlock && (
              <button 
                className={styles.btnBlock} 
                onClick={() => handleAction(cardsApi.block, cardId)}
              >
                Blokiraj
              </button>
            )}
            {canDeactivate && (
              <button 
                className={styles.btnDeactivate} 
                onClick={() => handleAction(cardsApi.deactivate, cardId)}
              >
                Deaktiviraj
              </button>
            )}
          </div>
        </td>
      </tr>
    );
  });
}

export default function CardsTable({ clients, onActionSuccess }) {
  if (clients.length === 0) {
    return (
      <div className={styles.tableCard}>
        <div className={styles.emptyState}>
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--tx-3)" strokeWidth="1.5" width="32" height="32">
            <rect x="1" y="4" width="22" height="16" rx="2"/>
            <line x1="1" y1="10" x2="23" y2="10"/>
          </svg>
          <p>Nema klijenata koji odgovaraju zadatim filterima.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.tableCard}>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Klijent</th>
              <th>Broj kartice</th>
              <th>Broj računa</th>
              <th>Status</th>
              <th>Akcija</th>
            </tr>
          </thead>
          <tbody>
            {clients.map(client => (
              <ClientRow key={client.id} client={client} onActionSuccess={onActionSuccess} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
