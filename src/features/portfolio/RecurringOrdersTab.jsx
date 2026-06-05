import { useEffect, useMemo, useState } from 'react';
import Alert from '../../components/ui/Alert';
import { accountsApi } from '../../api/endpoints/accounts';
import { securitiesApi } from '../../api/endpoints/securities';
import { recurringOrdersApi } from '../../api/endpoints/recurringOrders';
import { useAuthStore } from '../../store/authStore';
import styles from './RecurringOrdersTab.module.css';

const DIRECTIONS = [
    { value: 'BUY', label: 'Kupovina' },
    { value: 'SELL', label: 'Prodaja' },
];

const MODES = [
    { value: 'BY_QUANTITY', label: 'Po količini' },
    { value: 'BY_AMOUNT', label: 'Po iznosu' },
];

const CADENCES = [
    { value: 'DAILY', label: 'DAILY' },
    { value: 'WEEKLY', label: 'WEEKLY' },
    { value: 'MONTHLY', label: 'MONTHLY' },
];

function toId(value) {
    return value == null ? '' : String(value);
}

function formatMoney(value, currency = 'RSD') {
    return `${Number(value ?? 0).toLocaleString('sr-RS', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })} ${currency}`;
}

function formatDateTime(value) {
    if (!value) return '—';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';

    const pad = (n) => String(n).padStart(2, '0');

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatStatus(order) {
    return order.active ? 'Da' : 'Ne';
}

function formatDirection(direction) {
    return direction === 'BUY' ? 'Kupovina' : 'Prodaja';
}

function formatMode(mode) {
    return mode === 'BY_QUANTITY' ? 'Po količini' : 'Po iznosu';
}

function normalizeAsset(asset) {
    const id =
        asset?.listing_id ??
        asset?.listingId ??
        asset?.id ??
        asset?.asset_id ??
        asset?.assetId;

    const ticker =
        asset?.ticker ??
        asset?.symbol ??
        asset?.name ??
        '—';

    return {
        id: toId(id || ticker),
        listingId: Number(id),
        ticker,
        name:
            asset?.listing_name ??
            asset?.listingName ??
            asset?.name ??
            asset?.description ??
            ticker,
        currency: (
            asset?.currency ??
            asset?.quote_currency ??
            asset?.quoteCurrency ??
            'RSD'
        ).toUpperCase(),
        price: Number(
            asset?.price ??
            asset?.last_price ??
            asset?.lastPrice ??
            0
        ),
        amount: Number(
            asset?.amount ??
            asset?.quantity ??
            asset?.available ??
            asset?.holdings ??
            asset?.public_amount ??
            0
        ),
    };
}

function normalizeAccount(account, index) {
    const id =
        account?.account_number ??
        account?.accountNumber ??
        account?.AccountNumber ??
        account?.number ??
        account?.id ??
        account?.ID ??
        index + 1;

    const currency = (
        account?.currency ??
        account?.Currency?.Code ??
        account?.currency_code ??
        account?.currencyCode ??
        'RSD'
    ).toUpperCase();

    const balance =
        account?.balance ??
        account?.available_balance ??
        account?.availableBalance ??
        account?.Balance ??
        account?.availableFunds ??
        account?.available_funds;

    return {
        id: toId(id),
        accountNumber: toId(id),
        label:
            account?.name ??
            account?.Name ??
            account?.account_name ??
            account?.accountName ??
            `Račun ${index + 1}`,
        balance: balance != null ? Number(balance) : null,
        currency,
    };
}


function normalizeOrder(order, ownerLabel = 'Korisnik') {
    return {
        id: order?.recurring_order_id ?? order?.id,
        recurringOrderId: order?.recurring_order_id ?? order?.id,

        userId: order?.user_id ?? order?.userId ?? '',
        userName: order?.userName ?? ownerLabel,

        assetId: toId(order?.listing_id ?? order?.listingId ?? ''),
        assetTicker: order?.ticker ?? '—',
        assetName: order?.listing_name ?? order?.listingName ?? order?.ticker ?? '—',

        direction: order?.direction ?? 'BUY',
        mode: order?.mode ?? 'BY_QUANTITY',
        value: Number(order?.value ?? 0),
        valueCurrency: order?.mode === 'BY_AMOUNT' ? 'RSD' : '',

        accountId: toId(order?.account_number ?? order?.accountNumber ?? ''),
        accountLabel: 'Račun',

        cadence: order?.cadence ?? 'MONTHLY',
        nextRun: order?.next_run ?? order?.nextRun ?? null,

        active: Boolean(order?.active),

        ownerType: order?.owner_type ?? order?.ownerType ?? '',
        createdAt: order?.created_at ?? order?.createdAt ?? null,
        updatedAt: order?.updated_at ?? order?.updatedAt ?? null,
    };
}

function buildInitialDraft(accounts, assets) {
    return {
        direction: 'BUY',
        assetId: assets[0]?.id ?? '',
        mode: 'BY_QUANTITY',
        value: '',
        accountId: accounts[0]?.id ?? '',
        cadence: 'MONTHLY',
    };
}

function getOwnerLabel(user, ownerName) {
    if (ownerName) return ownerName;
    if (user?.first_name && user?.last_name) return `${user.first_name} ${user.last_name}`;
    if (user?.firstName && user?.lastName) return `${user.firstName} ${user.lastName}`;
    return user?.name ?? 'Korisnik';
}

function extractArray(response) {
    const data = response?.data ?? response;

    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.content)) return data.content;
    if (Array.isArray(data?.items)) return data.items;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.assets)) return data.assets;
    if (Array.isArray(data?.accounts)) return data.accounts;

    return [];
}

function RecurringOrderModal({
                                 open,
                                 ownerLabel,
                                 accounts,
                                 buyAssets,
                                 sellAssets,
                                 draft,
                                 setDraft,
                                 onClose,
                                 onSubmit,
                                 submitting,
                                 formError,
                             }) {
    const selectedAssets = draft.direction === 'SELL' ? sellAssets : buyAssets;

    const selectedAsset =
        selectedAssets.find((asset) => toId(asset.id) === toId(draft.assetId)) ??
        selectedAssets[0] ??
        null;

    const selectedAccount =
        accounts.find((account) => toId(account.id) === toId(draft.accountId)) ??
        null;

    const estimatedQuantity =
        draft.mode === 'BY_AMOUNT' && selectedAsset?.price > 0
            ? Math.floor(Number(draft.value || 0) / Number(selectedAsset.price))
            : null;

    useEffect(() => {
        if (!open) return;

        setDraft((current) => {
            const visibleAssets = current.direction === 'SELL' ? sellAssets : buyAssets;
            const assetExists = visibleAssets.some((asset) => toId(asset.id) === toId(current.assetId));

            return {
                ...current,
                assetId: assetExists ? current.assetId : visibleAssets[0]?.id ?? '',
            };
        });
    }, [open, buyAssets, sellAssets, setDraft]);

    if (!open) return null;

    return (
        <div className={styles.backdrop} onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="recurring-order-modal-title">
            <div className={styles.modal} onClick={(event) => event.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <div>
                        <h3 id="recurring-order-modal-title" className={styles.modalTitle}>Kreiraj trajni nalog</h3>
                    </div>

                    <button type="button" className={styles.closeButton} onClick={onClose} disabled={submitting}>
                        ×
                    </button>
                </div>

                <form className={styles.form} onSubmit={(event) => onSubmit(event, selectedAsset, selectedAccount)}>
                    <div className={styles.grid2}>
                        <label className={styles.field}>
                            <span>Smer</span>

                            <select
                                value={draft.direction}
                                onChange={(event) => {
                                    const nextDirection = event.target.value;
                                    const nextAssets = nextDirection === 'SELL' ? sellAssets : buyAssets;

                                    setDraft((current) => ({
                                        ...current,
                                        direction: nextDirection,
                                        assetId: nextAssets.some((asset) => toId(asset.id) === toId(current.assetId))
                                            ? current.assetId
                                            : nextAssets[0]?.id ?? '',
                                    }));
                                }}
                            >
                                {DIRECTIONS.map((direction) => (
                                    <option key={direction.value} value={direction.value}>
                                        {direction.label}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label className={styles.field}>
                            <span>Hartija</span>

                            <select
                                value={draft.assetId}
                                onChange={(event) => setDraft((current) => ({ ...current, assetId: event.target.value }))}
                            >
                                {selectedAssets.map((asset) => (
                                    <option key={asset.id} value={asset.id}>
                                        {asset.ticker}
                                        {asset.name && asset.name !== asset.ticker ? ` — ${asset.name}` : ''}
                                    </option>
                                ))}
                            </select>

                            {selectedAssets.length === 0 && (
                                <span className={styles.helperText}>
                  {draft.direction === 'SELL'
                      ? 'Nema dostupnih hartija za prodaju.'
                      : 'Nema dostupnih hartija za kupovinu.'}
                </span>
                            )}
                        </label>
                    </div>

                    <div className={styles.grid2}>
                        <label className={styles.field}>
                            <span>Način</span>

                            <div className={styles.segmented}>
                                {MODES.map((mode) => (
                                    <button
                                        key={mode.value}
                                        type="button"
                                        className={`${styles.segment} ${draft.mode === mode.value ? styles.segmentActive : ''}`}
                                        onClick={() => setDraft((current) => ({ ...current, mode: mode.value }))}
                                    >
                                        {mode.label}
                                    </button>
                                ))}
                            </div>
                        </label>

                        <label className={styles.field}>
                            <span>Učestalost</span>

                            <select
                                value={draft.cadence}
                                onChange={(event) => setDraft((current) => ({ ...current, cadence: event.target.value }))}
                            >
                                {CADENCES.map((cadence) => (
                                    <option key={cadence.value} value={cadence.value}>
                                        {cadence.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>

                    <div className={styles.grid2}>
                        <label className={styles.field}>
                            <span>{draft.mode === 'BY_AMOUNT' ? 'Vrednost (iznos)' : 'Vrednost (količina)'}</span>

                            <input
                                type="number"
                                min="0"
                                step={draft.mode === 'BY_AMOUNT' ? '0.01' : '1'}
                                placeholder={draft.mode === 'BY_AMOUNT' ? 'Unesite iznos' : 'Unesite količinu'}
                                value={draft.value}
                                onChange={(event) => setDraft((current) => ({ ...current, value: event.target.value }))}
                            />

                            {draft.mode === 'BY_AMOUNT' && selectedAsset && (
                                <span className={styles.helperText}>
                  Iznos će biti ograničen vrednošću valute {selectedAsset.currency}. Procena: do {estimatedQuantity ?? 0} kom.
                </span>
                            )}
                        </label>

                        <label className={styles.field}>
                            <span>Račun</span>

                            <select
                                value={draft.accountId}
                                onChange={(event) => setDraft((current) => ({ ...current, accountId: event.target.value }))}
                            >
                                <option value="">Izaberite račun</option>

                                {accounts.map((account) => (
                                    <option key={account.id} value={account.id}>
                                        {account.label} — {account.id}
                                        {account.balance != null ? ` (${formatMoney(account.balance, account.currency)})` : ''}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>

                    <div className={styles.previewBox}>
                        <div>
                            <span>Korisnik</span>
                            <strong>{ownerLabel}</strong>
                        </div>

                        <div>
                            <span>Hartija</span>
                            <strong>
                                {selectedAsset
                                    ? `${selectedAsset.ticker}${selectedAsset.name && selectedAsset.name !== selectedAsset.ticker ? ` — ${selectedAsset.name}` : ''}`
                                    : '—'}
                            </strong>
                        </div>

                        <div>
                            <span>Smer</span>
                            <strong>{formatDirection(draft.direction)}</strong>
                        </div>

                        <div>
                            <span>Način</span>
                            <strong>{formatMode(draft.mode)}</strong>
                        </div>

                        <div>
                            <span>Vrednost</span>
                            <strong>
                                {draft.mode === 'BY_AMOUNT'
                                    ? formatMoney(draft.value || 0, selectedAsset?.currency ?? 'RSD')
                                    : `${Number(draft.value || 0).toLocaleString('sr-RS')} kom`}
                            </strong>
                        </div>

                        <div>
                            <span>Učestalost</span>
                            <strong>{draft.cadence}</strong>
                        </div>

                        <div>
                            <span>Račun</span>
                            <strong>{selectedAccount ? `${selectedAccount.label} — ${selectedAccount.id}` : '—'}</strong>
                        </div>
                    </div>

                    {formError && <Alert tip="greska" poruka={formError} />}

                    <div className={styles.modalActions}>
                        <button type="button" className={styles.secondaryButton} onClick={onClose} disabled={submitting}>
                            Otkaži
                        </button>

                        <button type="submit" className={styles.primaryButton} disabled={submitting}>
                            {submitting ? 'Kreiranje...' : 'Kreiraj nalog'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function RecurringOrdersTab({ ownerId, ownerName, ownedAssets = [], isClient = true }) {
    const user = useAuthStore((state) => state.user);

    const resolvedOwnerId =
        ownerId ??
        user?.client_id ??
        user?.clientId ??
        user?.identity_id ??
        user?.identityId ??
        user?.id;

    const ownerLabel = useMemo(() => getOwnerLabel(user, ownerName), [user, ownerName]);

    const [accounts, setAccounts] = useState([]);
    const [buyAssets, setBuyAssets] = useState([]);
    const [orders, setOrders] = useState([]);

    const [loading, setLoading] = useState(true);
    const [warning, setWarning] = useState('');
    const [pageError, setPageError] = useState('');

    const [modalOpen, setModalOpen] = useState(false);
    const [draft, setDraft] = useState({
        direction: 'BUY',
        assetId: '',
        mode: 'BY_QUANTITY',
        value: '',
        accountId: '',
        cadence: 'MONTHLY',
    });

    const [actionId, setActionId] = useState(null);
    const [confirmCancelId, setConfirmCancelId] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState('');

    const sellAssets = useMemo(() => {
        return ownedAssets.map(normalizeAsset).filter((asset) => asset.id);
    }, [ownedAssets]);

    const normalizedBuyAssets = useMemo(() => {
        return buyAssets.map(normalizeAsset).filter((asset) => asset.id);
    }, [buyAssets]);

    const visibleOrders = useMemo(() => {
        return [...orders].sort((left, right) => {
            const leftActive = left.active ? 1 : 0;
            const rightActive = right.active ? 1 : 0;

            if (leftActive !== rightActive) return rightActive - leftActive;

            return new Date(left.nextRun ?? 0).getTime() - new Date(right.nextRun ?? 0).getTime();
        });
    }, [orders]);

    useEffect(() => {
        if (!resolvedOwnerId) return;

        let cancelled = false;

        async function loadData() {
            try {
                setLoading(true);
                setWarning('');
                setPageError('');

                const [accountsResult, assetsResult, ordersResult] = await Promise.allSettled([
                    isClient
                        ? accountsApi.getClientAccounts(resolvedOwnerId)
                        : accountsApi.getAll({ page: 1, page_size: 200 }),
                    securitiesApi.getStocks(),
                    recurringOrdersApi.getRecurringOrders(),
                ]);

                if (cancelled) return;

                const rawAccounts = accountsResult.status === 'fulfilled'
                    ? extractArray(accountsResult.value)
                    : [];

                const rawAssets = assetsResult.status === 'fulfilled'
                    ? extractArray(assetsResult.value)
                    : [];

                const rawOrders = ordersResult.status === 'fulfilled'
                    ? extractArray(ordersResult.value)
                    : [];

                setAccounts(rawAccounts.map(normalizeAccount));
                setBuyAssets(rawAssets);
                setOrders(rawOrders.map((order) => normalizeOrder(order, ownerLabel)));

                const warnings = [];

                if (accountsResult.status === 'rejected') {
                    warnings.push('Računi nisu mogli da se učitaju.');
                }

                if (assetsResult.status === 'rejected') {
                    warnings.push('Lista hartija za kupovinu nije dostupna.');
                }

                if (ordersResult.status === 'rejected') {
                    warnings.push('Trajni nalozi nisu mogli da se učitaju.');
                }

                setWarning(warnings.join(' '));
            } catch (error) {
                if (cancelled) return;

                setPageError(
                    error?.response?.data?.message ??
                    error?.message ??
                    'Nije moguće učitati podatke za trajne naloge.'
                );
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadData();

        return () => {
            cancelled = true;
        };
    }, [resolvedOwnerId, isClient, ownerLabel]);

    function openModal() {
        const defaultAssets = normalizedBuyAssets.length > 0 ? normalizedBuyAssets : sellAssets;

        setDraft(buildInitialDraft(accounts, defaultAssets));
        setFormError('');
        setModalOpen(true);
    }

    function handleCloseModal() {
        if (submitting) return;

        setModalOpen(false);
        setFormError('');
    }

    function validateDraft(currentDraft, selectedAsset, selectedAccount) {
        if (!currentDraft.direction) return 'Izaberite smer.';
        if (!selectedAsset) return 'Izaberite hartiju.';
        if (!selectedAccount) return 'Izaberite račun.';
        if (!currentDraft.value || Number(currentDraft.value) <= 0) return 'Vrednost mora biti veća od nule.';

        if (currentDraft.mode === 'BY_QUANTITY') {
            const quantity = Number(currentDraft.value);

            if (!Number.isInteger(quantity) || quantity <= 0) {
                return 'Način po količini zahteva pozitivan ceo broj.';
            }

            if (currentDraft.direction === 'SELL' && selectedAsset.amount > 0 && quantity > selectedAsset.amount) {
                return `Možete prodati najviše ${selectedAsset.amount} kom.`;
            }
        }

        if (!selectedAsset.listingId || Number.isNaN(selectedAsset.listingId)) {
            return 'Izabrana hartija nema validan listing_id.';
        }

        return '';
    }

    async function handleSubmit(event, selectedAsset, selectedAccount) {
        event.preventDefault();

        const error = validateDraft(draft, selectedAsset, selectedAccount);

        if (error) {
            setFormError(error);
            return;
        }

        const payload = {
            account_number: selectedAccount.accountNumber,
            cadence: draft.cadence,
            direction: draft.direction,
            listing_id: selectedAsset.listingId,
            mode: draft.mode,
            value: Number(draft.value),
        };

        try {
            setSubmitting(true);
            setFormError('');

            const response = await recurringOrdersApi.createRecurringOrder(payload);
            const createdOrder = response?.data ?? response;

            setOrders((current) => [
                normalizeOrder(createdOrder, ownerLabel),
                ...current,
            ]);

            setModalOpen(false);
            setDraft({
                direction: 'BUY',
                assetId: '',
                mode: 'BY_QUANTITY',
                value: '',
                accountId: '',
                cadence: 'MONTHLY',
            });
        } catch (error) {
            setFormError(
                error?.response?.data?.message ??
                error?.message ??
                'Nije moguće kreirati trajni nalog.'
            );
        } finally {
            setSubmitting(false);
        }
    }

    async function handlePauseToggle(orderId) {
        try {
            setActionId(orderId);

            const response = await recurringOrdersApi.togglePauseRecurringOrder(orderId);
            const updatedOrder = response?.data ?? response;

            setOrders((current) =>
                current.map((order) =>
                    String(order.id) === String(orderId)
                        ? normalizeOrder(updatedOrder, order.userName)
                        : order
                )
            );
        } catch (error) {
            setPageError(
                error?.response?.data?.message ??
                error?.message ??
                'Nije moguće promeniti status trajnog naloga.'
            );
        } finally {
            setActionId(null);
        }
    }

    async function handleCancel(orderId) {
        try {
            setActionId(orderId);
            setConfirmCancelId(null);

            await recurringOrdersApi.deleteRecurringOrder(orderId);

            setOrders((current) =>
                current.filter((order) => String(order.id) !== String(orderId))
            );
        } catch (error) {
            setPageError(
                error?.response?.data?.message ??
                error?.message ??
                'Nije moguće otkazati trajni nalog.'
            );
        } finally {
            setActionId(null);
        }
    }

    const activeCount = visibleOrders.filter((order) => order.active).length;
    const pausedCount = visibleOrders.filter((order) => !order.active).length;

    if (loading) {
        return (
            <div className={styles.loadingState}>
                <div className={styles.loadingCard}>Učitavanje trajnih naloga...</div>
            </div>
        );
    }

    return (
        <div className={styles.wrapper}>
            <div className={styles.toolbar}>
                <div>
                    <div className={styles.kicker}>DTC</div>
                    <h3 className={styles.title}>Trajni nalozi</h3>
                    <p className={styles.subtitle}>
                        Kreirajte i upravljajte aktivnim nalozima za kupovinu ili prodaju hartija.
                    </p>
                </div>

                <button
                    className={styles.primaryButton}
                    onClick={openModal}
                    disabled={!accounts.length || (!normalizedBuyAssets.length && !sellAssets.length)}
                >
                    Kreiraj trajni nalog
                </button>
            </div>

            <div className={styles.statsRow}>
                <div className={styles.statCard}>
                    <span>Ukupno</span>
                    <strong>{visibleOrders.length}</strong>
                </div>

                <div className={styles.statCard}>
                    <span>Aktivni</span>
                    <strong>{activeCount}</strong>
                </div>

                <div className={styles.statCard}>
                    <span>Pauzirani</span>
                    <strong>{pausedCount}</strong>
                </div>
            </div>

            {warning && <Alert tip="info" poruka={warning} />}
            {pageError && <Alert tip="greska" poruka={pageError} />}

            {visibleOrders.length === 0 ? (
                <div className={styles.emptyState}>
                    <h4>Nema trajnih naloga</h4>
                    <p>Otvorite formu i kreirajte prvi trajni nalog za ovog korisnika.</p>
                </div>
            ) : (
                <div className={styles.tableWrap}>
                    <table className={styles.table}>
                        <thead>
                        <tr>
                            <th>Korisnik</th>
                            <th>Hartija</th>
                            <th>Smer</th>
                            <th>Način</th>
                            <th>Vrednost</th>
                            <th>Račun</th>
                            <th>Učestalost</th>
                            <th>Sledeće izvršenje</th>
                            <th>Aktivan</th>
                            <th>Akcije</th>
                        </tr>
                        </thead>

                        <tbody>
                        {visibleOrders.map((order) => (
                            <tr key={order.id}>
                                <td>{order.userName}</td>

                                <td>
                                    <div className={styles.assetCell}>
                                        <strong>{order.assetTicker}</strong>
                                        <span>{order.assetName}</span>
                                    </div>
                                </td>

                                <td>
                    <span className={`${styles.badge} ${order.direction === 'BUY' ? styles.buy : styles.sell}`}>
                      {formatDirection(order.direction)}
                    </span>
                                </td>

                                <td>{formatMode(order.mode)}</td>

                                <td>
                                    {order.mode === 'BY_QUANTITY'
                                        ? `${Number(order.value).toLocaleString('sr-RS')} kom`
                                        : formatMoney(order.value, order.valueCurrency || 'RSD')}
                                </td>

                                <td>{order.accountId}</td>

                                <td>{order.cadence}</td>

                                <td>{formatDateTime(order.nextRun)}</td>

                                <td>
                    <span className={`${styles.badge} ${order.active ? styles.active : styles.paused}`}>
                      {formatStatus(order)}
                    </span>
                                </td>

                                <td>
                                    <div className={styles.actions}>
                                        <button
                                            type="button"
                                            className={styles.secondaryButton}
                                            onClick={() => handlePauseToggle(order.id)}
                                            disabled={actionId === order.id}
                                        >
                                            {order.active ? 'Pauziraj' : 'Aktiviraj'}
                                        </button>

                                        {confirmCancelId === order.id ? (
                                            <>
                                                <span style={{ fontSize: 12 }}>Sigurno?</span>
                                                <button
                                                    type="button"
                                                    className={styles.dangerButton}
                                                    onClick={() => handleCancel(order.id)}
                                                    disabled={actionId === order.id}
                                                >
                                                    Da
                                                </button>
                                                <button
                                                    type="button"
                                                    className={styles.secondaryButton}
                                                    onClick={() => setConfirmCancelId(null)}
                                                >
                                                    Ne
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                type="button"
                                                className={styles.dangerButton}
                                                onClick={() => setConfirmCancelId(order.id)}
                                                disabled={actionId === order.id}
                                            >
                                                Otkaži
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}

            {modalOpen && (
                <RecurringOrderModal
                    open={modalOpen}
                    ownerLabel={ownerLabel}
                    accounts={accounts}
                    buyAssets={normalizedBuyAssets}
                    sellAssets={sellAssets}
                    draft={draft}
                    setDraft={setDraft}
                    onClose={handleCloseModal}
                    onSubmit={handleSubmit}
                    submitting={submitting}
                    formError={formError}
                />
            )}
        </div>
    );
}