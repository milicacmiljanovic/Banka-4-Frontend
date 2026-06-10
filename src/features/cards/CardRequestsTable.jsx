import styles from './CardsTable.module.css';

export default function CardRequestsTable({ requests, onApprove, onReject, actionId }) {
    if (!requests || requests.length === 0) {
        return <div style={{ padding: '24px', textAlign: 'center', color: 'var(--tx-3)', background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px dashed var(--border)' }}>Nema aktivnih zahteva za kartice.</div>;
    }

    return (
        <div className={styles.tableWrap}>
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Klijent ID</th>
                        <th>Račun</th>
                        <th>Kreirano</th>
                        <th>Status</th>
                        <th className={styles.rightAlign}>Akcije</th>
                    </tr>
                </thead>
                <tbody>
                    {requests.map(req => {
                        const isPending = req.status === 'PENDING';
                        return (
                            <tr key={req.id}>
                                <td>#{req.id}</td>
                                <td>{req.clientId ?? req.client_id ?? 'Nepoznato'}</td>
                                <td>{req.accountNumber ?? req.account_number ?? 'Nepoznato'}</td>
                                <td>{(req.createdAt ?? req.created_at) ? new Date(req.createdAt ?? req.created_at).toLocaleDateString('sr-RS') : '—'}</td>
                                <td>
                                    <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', background: req.status === 'PENDING' ? '#fff3cd' : (req.status === 'APPROVED' ? '#d4edda' : '#f8d7da'), color: req.status === 'PENDING' ? '#856404' : (req.status === 'APPROVED' ? '#155724' : '#721c24') }}>
                                        {req.status}
                                    </span>
                                </td>
                                <td className={styles.rightAlign}>
                                    {isPending ? (
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                            <button
                                                className={styles.btnActionRow}
                                                style={{ color: 'var(--red)', background: 'var(--red-bg, #ffebee)', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
                                                onClick={() => onReject(req.id)}
                                                disabled={actionId === req.id}
                                            >
                                                Odbij
                                            </button>
                                            <button
                                                className={styles.btnActionRow}
                                                style={{ color: 'var(--blue)', background: 'var(--blue-bg, #e3f2fd)', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
                                                onClick={() => onApprove(req.id)}
                                                disabled={actionId === req.id}
                                            >
                                                {actionId === req.id ? '...' : 'Odobri'}
                                            </button>
                                        </div>
                                    ) : (
                                        <span style={{ fontSize: 13, color: 'var(--tx-3)' }}>Rešeno</span>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
