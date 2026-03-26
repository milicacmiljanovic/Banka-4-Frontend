// src/features/transfers/ConfirmTransfer.jsx
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Alert from '../../components/ui/Alert';
import { transfersApi } from '../../api/endpoints/transfers';
import { useAuthStore } from '../../store/authStore';
import styles from './transfers.module.css';

function VerifyModal({ open, onClose, onConfirm, loading }) {
    const [code, setCode] = useState('');
    const [codeError, setCodeError] = useState('');

    useEffect(() => {
        if (open) { setCode(''); setCodeError(''); }
    }, [open]);

    if (!open) return null;

    const isValid = /^\d{6}$/.test(code);

    function handleSubmit(e) {
        e.preventDefault();
        if (!isValid) { setCodeError('Unesite tačno 6 cifara.'); return; }
        onConfirm(code);
    }

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
                <button className={styles.closeBtn} onClick={onClose}>×</button>
                <h3 style={{ marginBottom: 8, fontSize: 18, fontWeight: 700, color: 'var(--tx-1)' }}>Verifikacija</h3>
                <p style={{ fontSize: 13, color: 'var(--tx-2)', marginBottom: 20 }}>
                    Unesite 6-cifreni verifikacioni kod koji ste primili putem SMS/Email poruke.
                </p>
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: 16 }}>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--tx-3)', marginBottom: 6, textTransform: 'uppercase' }}>
                            Verifikacioni kod
                        </label>
                        <input
                            type="text"
                            maxLength={6}
                            value={code}
                            onChange={e => { setCode(e.target.value.replace(/\D/g, '')); setCodeError(''); }}
                            placeholder="000000"
                            style={{ width: '100%', padding: '10px 14px', fontSize: 22, letterSpacing: 8, textAlign: 'center', border: '1.5px solid var(--border)', borderRadius: 'var(--radius)', fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box' }}
                            autoFocus
                        />
                        {codeError && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 6 }}>{codeError}</p>}
                    </div>
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                        <button type="button" className={styles.btnSecondary} onClick={onClose} disabled={loading}>Otkaži</button>
                        <button type="submit" className={styles.btnPrimary} disabled={!isValid || loading}>
                            {loading ? 'Potvrđivanje...' : 'Potvrdi'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function ConfirmTransfer() {
    const navigate = useNavigate();
    const { state } = useLocation();
    const clientId = useAuthStore(s => s.user?.client_id ?? s.user?.id);

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [showVerify, setShowVerify] = useState(false);

    // ✅ FIX 1: redirect ako nema state
    useEffect(() => {
        if (!state) {
            navigate('/transfers/new');
        }
    }, [state, navigate]);

    // ✅ FIX 2: zaštita od crash-a
    if (!state) return null;

    const {
        fromAccount,
        toAccount,
        amount,
        userName,
        rateInfo,
        isCrossCurrency,
    } = state;

    const numericAmount = parseFloat(amount) || 0;

    const fromCurrency = fromAccount.currency ?? fromAccount.valuta;
    const toCurrency   = toAccount.currency   ?? toAccount.valuta;
    const fromBalance  = fromAccount.balance  ?? fromAccount.stanje ?? 0;
    const toBalance    = toAccount.balance    ?? toAccount.stanje   ?? 0;
    const fromNum      = fromAccount.account_number ?? fromAccount.number ?? fromAccount.broj;
    const toNum        = toAccount.account_number   ?? toAccount.number   ?? toAccount.broj;

    // Cross-currency: compute commission (1%) and final amount
    const commission = isCrossCurrency && rateInfo ? numericAmount * 0.01 : 0;
    const convertedAmount = isCrossCurrency && rateInfo?.convertedAmount != null
        ? rateInfo.convertedAmount
        : numericAmount;
    const finalAmount = isCrossCurrency && rateInfo
        ? convertedAmount * (1 - 0.01)
        : numericAmount;

    const handleSendOtp = async () => {
        setSubmitting(true);
        setError(null);

        try {
            await transfersApi.sendOtp(clientId, {
                from_account: fromNum,
                to_account:   toNum,
                amount:       numericAmount,
            });
            setShowVerify(true);
        } catch (err) {
            const msg =
                err?.response?.data?.error ||
                err?.message ||
                'Greška pri slanju verifikacionog koda.';
            setError(msg);
        } finally {
            setSubmitting(false);
        }
    };

    const handleConfirm = async (code) => {
        setSubmitting(true);
        setError(null);

        try {
            await transfersApi.execute(clientId, {
                from_account: fromNum,
                to_account:   toNum,
                amount:       numericAmount,
                otp_code:     code,
            });

            setShowVerify(false);
            setSuccess(true);

            setTimeout(() => {
                navigate('/transfers/history');
            }, 2000);

        } catch (err) {
            const msg =
                err?.response?.data?.error ||
                err?.message ||
                'Greška pri izvršavanju transfera.';

            setError(msg);
            setShowVerify(false);
        } finally {
            setSubmitting(false);
        }
    };

    const handleBack = () => {
        navigate('/transfers/new', { state });
    };

    return (
        <div className={styles.stranica}>
            <main className={styles.sadrzaj}>
                <div className="page-anim">
                    <div className={styles.breadcrumb}>
                        <span>Transferi</span> › <span>Potvrda transfera</span>
                    </div>

                    <h1 className={styles.pageTitle}>Potvrdi transfer</h1>

                    <p className={styles.pageDesc}>
                        Proverite podatke pre izvršenja transakcije
                    </p>
                </div>

                {success ? (
                    <div className={`page-anim ${styles.successCard}`}>
                        <div className={styles.successIcon}>✅</div>
                        <h2>Transfer uspešno izvršen!</h2>
                        <p>Sredstva su prebačena na odabrani račun.</p>
                        <p>Preusmeravamo vas na istoriju transfera...</p>
                    </div>
                ) : (
                    <div className={`page-anim ${styles.confirmCard}`}>
                        <div className={styles.summaryGrid}>

                            {/* KLIJENT */}
                            <div className={styles.summaryItem}>
                                <span className={styles.label}>Klijent</span>
                                <span className={styles.value}>{userName}</span>
                            </div>

                            {/* FROM */}
                            <div className={styles.summaryItem}>
                                <span className={styles.label}>Iz računa</span>
                                <span className={styles.value}>
                                    {fromNum} ({fromCurrency})
                                    <br />
                                    <small>
                                        Stanje: {fromBalance.toLocaleString('sr-RS')} {fromCurrency}
                                    </small>
                                </span>
                            </div>

                            {/* TO */}
                            <div className={styles.summaryItem}>
                                <span className={styles.label}>Na račun</span>
                                <span className={styles.value}>
                                    {toNum} ({toCurrency})
                                    <br />
                                    <small>
                                        Stanje: {toBalance.toLocaleString('sr-RS')} {toCurrency}
                                    </small>
                                </span>
                            </div>

                            {/* IZNOS */}
                            <div className={styles.summaryItem}>
                                <span className={styles.label}>Iznos za skidanje</span>
                                <span className={styles.valueBig}>
                                    {numericAmount.toLocaleString('sr-RS', {
                                        minimumFractionDigits: 2,
                                    })} {fromCurrency}
                                </span>
                            </div>

                            {/* EXCHANGE RATE & COMMISSION — only for cross-currency */}
                            {isCrossCurrency && rateInfo && (
                                <>
                                    <div className={styles.summaryItem}>
                                        <span className={styles.label}>Primenjeni kurs</span>
                                        <span className={styles.value}>{rateInfo.label}</span>
                                    </div>
                                    <div className={styles.summaryItem}>
                                        <span className={styles.label}>Provizija (1%)</span>
                                        <span className={styles.value}>
                                            {commission.toLocaleString('sr-RS', {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                            })} {fromCurrency}
                                        </span>
                                    </div>
                                </>
                            )}

                            {/* FINAL */}
                            <div className={`${styles.summaryItem} ${styles.finalRow}`}>
                                <span className={styles.label}>
                                    Konačni iznos koji stiže
                                </span>
                                <span className={styles.finalAmount}>
                                    {Number(finalAmount).toLocaleString('sr-RS', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    })} {isCrossCurrency ? rateInfo?.toCurrency ?? toCurrency : toCurrency}
                                </span>
                            </div>
                        </div>

                        {error && (
                            <Alert
                                tip="greska"
                                poruka={error}
                                style={{ margin: '20px 0' }}
                            />
                        )}

                        <div className={styles.actions}>
                            <button
                                className={styles.btnSecondary}
                                onClick={handleBack}
                                disabled={submitting}
                            >
                                Nazad – izmeni
                            </button>

                            <button
                                className={styles.btnPrimary}
                                onClick={handleSendOtp}
                                disabled={submitting}
                            >
                                Potvrdi transfer
                            </button>
                        </div>
                    </div>
                )}
            </main>

            <VerifyModal
                open={showVerify}
                onClose={() => setShowVerify(false)}
                onConfirm={handleConfirm}
                loading={submitting}
            />
        </div>
    );
}