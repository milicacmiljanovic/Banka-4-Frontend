import { useEffect, useMemo, useState } from 'react';
import styles from './OTCPortalPage.module.css';
import { useAuthStore } from '../../store/authStore';
import { usePermissions } from '../../hooks/usePermissions';
import Spinner from '../../components/ui/Spinner';
import OfferModal from './components/OfferModal';
import Navbar from "../../components/layout/Navbar.jsx";
import { otcApi } from '../../api/endpoints/tax';

function formatDate(iso) {
    try {
        return new Date(iso).toLocaleString();
    } catch {
        return iso ?? '';
    }
}

export default function OtcPortalPage() {
    const user = useAuthStore(s => s.user);
    const { isSupervisor, canAny } = usePermissions();

    const hasTradePermission = useMemo(() => {
        // probaj da pokriješ najverovatnije permission stringove
        return canAny('trading', 'trade', 'client.trade', 'orders.create');
    }, [canAny]);

    const canSeePage = isSupervisor || (user?.identity_type === 'client' && hasTradePermission);

    const [loading, setLoading] = useState(true);
    const [rows, setRows] = useState([]);
    const [selectedStock, setSelectedStock] = useState(null);

    useEffect(() => {
        fetchPublic()
    }, []);
    async function fetchPublic() {
        setLoading(true);
        try {
            const res = await otcApi.getPublic({ page: 1, page_size: 10 });
            const body = res?.data ?? res;
            const list = Array.isArray(body?.data) ? body.data : [];
            setRows(list);
        } catch (e) {
            console.error(e);
            setRows([]); // nema mock
        } finally {
            setLoading(false);
        }
    }
    if (!canSeePage) {
        return (
            <div className={styles.wrap}>
                <Navbar />
                <div className={styles.header}>
                    <h1 className={styles.title}>OTC Portal</h1>
                </div>

                <div className={styles.card}>
                    Nemaš permisiju za pristup OTC portalu.
                </div>
            </div>
        );
    }

    return (
        <div className={styles.wrap}>
            <Navbar />
            <div className={styles.header}>
                <h1 className={styles.title}>OTC Portal</h1>
                <p className={styles.subtitle}>
                    Prikaz akcija koje su vlasnici prebacili na javni režim.
                </p>
            </div>

            <div className={styles.card}>
                {loading ? (
                    <div className={styles.center}>
                        <Spinner />
                    </div>
                ) : (
                    <div className={styles.tableWrap}>
                        <table className={styles.table}>
                            <thead>
                            <tr>
                                <th>Security</th>
                                <th>Name</th>
                                <th>Symbol</th>
                                <th className={styles.num}>Amount</th>
                                <th className={styles.num}>Price</th>
                                <th>Last Updated</th>
                                <th>Owner</th>
                                <th className={styles.actions}>Buttons</th>
                            </tr>
                            </thead>

                            <tbody>
                            {rows.map(r => {
                                const ownerText = isSupervisor
                                    ? (r.bankName ?? r.owner?.bankName ?? '')
                                    : `${r.owner?.firstName ?? ''} ${r.owner?.lastName ?? ''}, ${r.owner?.bankName ?? r.bankName ?? ''}`.trim();

                                return (
                                    <tr key={r.asset_ownership_id}>
                                        <td>{r.security_type}</td>
                                        <td>{r.name}</td>
                                        <td>{r.ticker}</td>
                                        <td className={styles.num}>{r.available_amount}</td>
                                        <td className={styles.num}>{r.price}</td>
                                        <td>{formatDate(r.updated_at)}</td>
                                        <td>{r.owner_name}</td>
                                        ...
                                    </tr>
                                );
                            })}

                            {rows.length === 0 && (
                                <tr>
                                    <td colSpan={8} className={styles.empty}>
                                        Trenutno nema dostupnih akcija u OTC javnom režimu.
                                    </td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <OfferModal
                open={Boolean(selectedStock)}
                stock={selectedStock}
                isSupervisor={isSupervisor}
                onClose={() => setSelectedStock(null)}
                onSubmit={async (form) => {
                    await otcApi.createOffer({
                        asset_ownership_id: selectedStock.asset_ownership_id,
                        amount: Number(form.volumeOfStock),
                        price_per_stock: Number(form.priceOffer),
                        premium: Number(form.premiumOffer),
                        settlement_date: new Date(form.settlementDateOffer + 'T00:00:00Z').toISOString(),
                        buyer_account_number: form.buyerAccountNumber,
                    });
                    setSelectedStock(null);
                }}
            />
        </div>
    );
}