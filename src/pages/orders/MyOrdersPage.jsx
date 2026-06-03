import { useEffect, useMemo, useState } from 'react';
import Navbar from '../../components/layout/Navbar';
import Spinner from '../../components/ui/Spinner';
import { ordersApi } from '../../api/endpoints/orders';
import styles from './MyOrdersPage.module.css';

const STATUS = ['ALL', 'PENDING', 'APPROVED', 'DECLINED', 'DONE'];
const ORDER_TYPE = ['ALL', 'MARKET', 'LIMIT', 'STOP', 'STOP_LIMIT'];

function inRange(dateStr, fromStr, toStr) {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return false;

    if (fromStr) {
        const from = new Date(fromStr + 'T00:00:00');
        if (d < from) return false;
    }
    if (toStr) {
        const to = new Date(toStr + 'T23:59:59');
        if (d > to) return false;
    }
    return true;
}

export default function MyOrdersPage() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [orders, setOrders] = useState([]);

    const [statusFilter, setStatusFilter] = useState('ALL');
    const [orderTypeFilter, setOrderTypeFilter] = useState('ALL');

    // umesto dropdown-a, text pretraga
    const [securityQuery, setSecurityQuery] = useState('');

    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                setError('');
                const res = await ordersApi.getMyOrders();
                const body = res?.data ?? res;

                const list =
                    (Array.isArray(body) && body) ||
                    body?.data ||
                    body?.content ||
                    body?.items ||
                    [];

                setOrders(Array.isArray(list) ? list : []);
            } catch (e) {
                console.error(e);
                setError('Nemate pristup ovoj stranici.');
                setOrders([]);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const filtered = useMemo(() => {
        const q = securityQuery.trim().toLowerCase();

        return orders.filter(o => {
            const status = String(o.status ?? '').toUpperCase();
            const orderType = String(o.order_type ?? o.type ?? '').toUpperCase();

            if (statusFilter !== 'ALL' && status !== statusFilter) return false;
            if (orderTypeFilter !== 'ALL' && orderType !== orderTypeFilter) return false;

            // pretraga po "hartiji": listing_name + asset_type (+ par fallback polja ako nekad stignu)
            if (q) {
                const haystack = [
                    o.listing_name,
                    o.asset_type,
                    o.security_type,
                    o.instrument_type,
                    o.listing_symbol,
                    o.ticker,
                    o.symbol,
                ]
                    .filter(Boolean)
                    .join(' ')
                    .toLowerCase();

                if (!haystack.includes(q)) return false;
            }

            const createdAt = o.created_at ?? o.createdAt ?? o.creation_date;
            if ((dateFrom || dateTo) && !inRange(createdAt, dateFrom, dateTo)) return false;

            return true;
        });
    }, [orders, statusFilter, orderTypeFilter, securityQuery, dateFrom, dateTo]);

    return (
        <div className={styles.wrap}>
            <Navbar />

            <div className={styles.header}>
                <h1 className={styles.title}>Moji orderi</h1>
                <p className={styles.subtitle}>Pregled vaših ordera sa filterima.</p>
            </div>

            <div className={styles.card}>
                <div className={styles.filters}>
                    <label className={styles.filter}>
                        Status
                        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                            {STATUS.map(s => (
                                <option key={s} value={s}>
                                    {s}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className={styles.filter}>
                        Tip ordera
                        <select value={orderTypeFilter} onChange={e => setOrderTypeFilter(e.target.value)}>
                            {ORDER_TYPE.map(t => (
                                <option key={t} value={t}>
                                    {t}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className={styles.filter}>
                        Hartija (pretraga)
                        <input
                            type="text"
                            value={securityQuery}
                            onChange={e => setSecurityQuery(e.target.value)}
                            placeholder="Npr. Fenbo, Sonoma, stock..."
                        />
                    </label>

                    <label className={styles.filter}>
                        Datum od
                        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
                    </label>

                    <label className={styles.filter}>
                        Datum do
                        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
                    </label>
                </div>

                {loading ? (
                    <div className={styles.center}>
                        <Spinner />
                    </div>
                ) : error ? (
                    <div className={styles.error}>{error}</div>
                ) : filtered.length === 0 ? (
                    <div className={styles.empty}>Nema ordera za izabrane filtere.</div>
                ) : (
                    <div className={styles.tableWrap}>
                        <table className={styles.table}>
                            <thead>
                            <tr>
                                <th>Tip ordera</th>
                                <th>Hartija</th>
                                <th className={styles.num}>Količina</th>
                                <th className={styles.num}>Cena izvršenja</th>
                                <th>Status</th>
                                <th>Datum kreiranja</th>
                                <th>Datum izvršenja</th>
                            </tr>
                            </thead>
                            <tbody>
                            {filtered.map(o => (
                                <tr key={o.order_id}>
                                    <td>{o.order_type ?? '—'}</td>

                                    <td>
                                        <div className={styles.security}>
                                            <div className={styles.ticker}>{(o.asset_type ?? '—').toUpperCase()}</div>
                                            <div className={styles.name}>{o.listing_name ?? '—'}</div>
                                        </div>
                                    </td>

                                    <td className={styles.num}>{o.quantity ?? '—'}</td>

                                    <td className={styles.num}>{o.price_per_unit ?? '—'}</td>

                                    <td>{o.status ?? '—'}</td>

                                    {/* backend trenutno ne šalje datume */}
                                    <td>—</td>
                                    <td>—</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}