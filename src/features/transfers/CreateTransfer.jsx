// src/features/transfers/CreateTransfer.jsx
import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { useNavigate } from 'react-router-dom';
import { useFetch } from '../../hooks/useFetch';
import { useDebounce } from '../../hooks/useDebounce';
import { transfersApi } from '../../api/endpoints/transfers';
import Spinner from '../../components/ui/Spinner';
import Alert from '../../components/ui/Alert';
import styles from './transfers.module.css';
import { useAuthStore } from '../../store/authStore';

export default function CreateTransfer() {
    const pageRef = useRef(null);
    const navigate = useNavigate();
    const user = useAuthStore(s => s.user);

    const { data: accountsRes, loading, error } =
        useFetch(() => transfersApi.getMyAccounts());

    const accounts = accountsRes?.data || [];

    const [fromAccount, setFromAccount] = useState(null);
    const [toAccount, setToAccount] = useState(null);
    const [amount, setAmount] = useState('');
    const [preview, setPreview] = useState(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [previewError, setPreviewError] = useState(null);

    const debouncedAmount = useDebounce(amount, 600);

    const parsedAmount = parseFloat(amount);
    const parsedDebounced = parseFloat(debouncedAmount);

    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from('.page-anim', {
                opacity: 0,
                y: 24,
                duration: 0.45,
                stagger: 0.08,
                ease: 'power2.out',
            });
        }, pageRef);
        return () => ctx.revert();
    }, []);

    //  RESET TO ACCOUNT kad promeniš FROM
    useEffect(() => {
        setToAccount(null);
    }, [fromAccount]);

    //  PREVIEW
    useEffect(() => {
        if (
            !fromAccount ||
            !toAccount ||
            isNaN(parsedDebounced) ||
            parsedDebounced <= 0
        ) {
            setPreview(null);
            setPreviewError(null);
            return;
        }

        //  nema dovoljno sredstava → ne zovi backend
        if (parsedDebounced > fromAccount.stanje) {
            setPreview(null);
            setPreviewError('Nedovoljno sredstava');
            return;
        }

        const fetchPreview = async () => {
            setPreviewLoading(true);
            setPreviewError(null);

            try {
                const res = await transfersApi.getPreview({
                    fromAccountId: fromAccount.id,
                    toAccountId: toAccount.id,
                    amount: parsedDebounced,
                });

                const previewData = res?.data?.data || res?.data;
                setPreview(previewData);

            } catch (err) {
                const msg =
                    err?.response?.data?.message ||
                    err?.response?.data?.error ||
                    'Greška pri dohvatanju kursa';

                setPreviewError(msg);
                setPreview(null);
            } finally {
                setPreviewLoading(false);
            }
        };

        fetchPreview();
    }, [fromAccount, toAccount, parsedDebounced]);

    //  VALIDACIJA
    const canProceed =
        fromAccount &&
        toAccount &&
        fromAccount.id !== toAccount.id &&
        !isNaN(parsedAmount) &&
        parsedAmount > 0 &&
        parsedAmount <= fromAccount.stanje;

    const handleNext = () => {
        if (!canProceed) return;

        navigate('/transfers/confirm', {
            state: {
                fromAccount,
                toAccount,
                amount: parsedAmount,
                preview,
                userName: `${user?.first_name} ${user?.last_name}`,
            },
        });
    };

    if (loading) return <Spinner />;
    if (error) return <Alert tip="greska" poruka="Ne mogu da učitam račune" />;

    return (
        <div ref={pageRef} className={styles.stranica}>
            <main className={styles.sadrzaj}>
                <div>
                    <div className={styles.breadcrumb}>Transferi › Novi transfer</div>
                    <button className={styles.back} onClick={() => navigate('/dashboard')}>← Nazad</button>
                    <h1 className={styles.pageTitle}>Kreiraj transfer</h1>
                </div>


                <div className={`page-anim ${styles.card}`}>

                    {/* FROM */}
                    <div className={styles.field}>
                        <label>Izvor račun</label>
                        <select
                            value={fromAccount?.id || ''}
                            onChange={e =>
                                setFromAccount(
                                    accounts.find(a => a.id === +e.target.value)
                                )
                            }
                        >
                            <option value="">Izaberi račun...</option>
                            {accounts.map(acc => (
                                <option key={acc.id} value={acc.id}>
                                    {acc.broj} — {acc.valuta} (
                                    {acc.stanje.toLocaleString('sr-RS')} {acc.valuta})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* TO */}
                    <div className={styles.field}>
                        <label>Odredišni račun</label>
                        <select
                            value={toAccount?.id || ''}
                            onChange={e =>
                                setToAccount(
                                    accounts.find(a => a.id === +e.target.value)
                                )
                            }
                        >
                            <option value="">Izaberi račun...</option>
                            {accounts
                                .filter(a => a.id !== fromAccount?.id)
                                .map(acc => (
                                    <option key={acc.id} value={acc.id}>
                                        {acc.broj} — {acc.valuta} (
                                        {acc.stanje.toLocaleString('sr-RS')} {acc.valuta})
                                    </option>
                                ))}
                        </select>
                    </div>

                    {/* IZNOS */}
                    <div className={styles.field}>
                        <label>Iznos</label>
                        <input
                            type="number"
                            step="any"
                            min="0"
                            max={fromAccount?.stanje || undefined}
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            placeholder="0.00"
                        />
                    </div>

                    {/* INFO BLOK */}
                    {fromAccount && toAccount && fromAccount.valuta !== toAccount.valuta && (
                        <div className={styles.infoBlock}>
                            {previewLoading && <Spinner size="small" />}

                            {previewError && (
                                <Alert tip="greska" poruka={previewError} />
                            )}

                            {!previewLoading && preview && (
                                <>
                                    <strong>Informativni kurs:</strong>{' '}
                                    1 {fromAccount.valuta} ={' '}
                                    {Number(preview.kurs).toFixed(2)} {toAccount.valuta}
                                </>
                            )}
                        </div>
                    )}

                    <button
                        className={styles.btnPrimary}
                        onClick={handleNext}
                        disabled={!canProceed}
                    >
                        Pregledaj i potvrdi transfer
                    </button>
                </div>
            </main>
        </div>
    );
}