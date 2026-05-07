import { useEffect, useMemo, useState } from 'react';
import './OfferModal.css';

function toDateInputValue(date = new Date()) {
    const pad = n => String(n).padStart(2, '0');
    const yyyy = date.getFullYear();
    const mm = pad(date.getMonth() + 1);
    const dd = pad(date.getDate());
    return `${yyyy}-${mm}-${dd}`;
}

export default function OfferModal({ open, stock, isSupervisor, onClose, onSubmit }) {
    const ownerLabel = useMemo(() => {
        if (!stock) return '';
        // novi shape (iz otc/public)
        if (stock.owner_name) return stock.owner_name;

        // fallback za stari shape ako nekad dođe
        if (isSupervisor) return stock.bankName ?? stock.owner?.bankName ?? '';
        return `${stock.owner?.firstName ?? ''} ${stock.owner?.lastName ?? ''}, ${stock.owner?.bankName ?? stock.bankName ?? ''}`.trim();
    }, [stock, isSupervisor]);

    const stockLabel = useMemo(() => {
        if (!stock) return '';
        const sym = stock.ticker ? ` (${stock.ticker})` : '';
        return `${stock.name ?? ''}${sym}`;
    }, [stock]);

    const [volume, setVolume] = useState('');
    const [priceOffer, setPriceOffer] = useState('');
    const [settlementDate, setSettlementDate] = useState(toDateInputValue(new Date()));
    const [premium, setPremium] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!open) return;
        setVolume('');
        setPriceOffer('');
        setSettlementDate(toDateInputValue(new Date()));
        setPremium('');
        setError('');
        setSubmitting(false);
    }, [open]);

    if (!open) return null;

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');

        const v = Number(volume);
        const p = Number(priceOffer);
        const pr = Number(premium);

        if (!Number.isFinite(v) || v <= 0) return setError('Volume mora biti pozitivan broj.');
        if (!Number.isFinite(p) || p <= 0) return setError('Price Offer mora biti pozitivan broj.');
        if (!settlementDate) return setError('Settlement Date je obavezan.');
        if (!Number.isFinite(pr) || pr < 0) return setError('Premium Offer mora biti broj (0 ili veći).');

        setSubmitting(true);
        try {
            await onSubmit({
                ownerOfStock: ownerLabel,
                stockId: stock?.asset_ownership_id,
                stock: stockLabel,
                volumeOfStock: v,
                priceOffer: p,
                settlementDateOffer: settlementDate,
                premiumOffer: pr,
            });
        } catch (err) {
            setError(err?.message ?? 'Greška prilikom slanja ponude.');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="backdrop" onMouseDown={onClose}>
            <div className="modal" onMouseDown={e => e.stopPropagation()}>
                <div className="header">
                    <h2 className="title">Make an Offer</h2>
                    <button className="close" onClick={onClose} aria-label="Close">×</button>
                </div>

                <form className="form" onSubmit={handleSubmit}>
                    <label className="label">
                        Owner of a stock
                        <input className="input" value={ownerLabel} readOnly />
                    </label>

                    <label className="label">
                        Stock
                        <input className="input" value={stockLabel} readOnly />
                    </label>

                    <label className="label">
                        Volume of a stock
                        <input
                            className="input"
                            value={volume}
                            onChange={e => setVolume(e.target.value)}
                            type="number"
                            min="1"
                            step="1"
                            placeholder="npr. 10"
                        />
                    </label>

                    <label className="label">
                        Price Offer
                        <input
                            className="input"
                            value={priceOffer}
                            onChange={e => setPriceOffer(e.target.value)}
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="npr. 125.50"
                        />
                    </label>

                    <label className="label">
                        Settlement Date Offer
                        <input
                            className="input"
                            value={settlementDate}
                            onChange={e => setSettlementDate(e.target.value)}
                            type="date"
                        />
                    </label>

                    <label className="label">
                        Premium Offer
                        <input
                            className="input"
                            value={premium}
                            onChange={e => setPremium(e.target.value)}
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="npr. 0"
                        />
                    </label>

                    {error && <div className="error">{error}</div>}

                    <div className="actions">
                        <button type="button" className="cancelBtn" onClick={onClose} disabled={submitting}>
                            Cancel
                        </button>
                        <button type="submit" className="submitBtn" disabled={submitting}>
                            {submitting ? 'Submitting...' : 'Make an Offer'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}