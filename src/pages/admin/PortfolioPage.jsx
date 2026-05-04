import { useState, useRef, useLayoutEffect, useEffect } from 'react';
import gsap from 'gsap';
import { useAuthStore } from '../../store/authStore';
import { usePermissions } from '../../hooks/usePermissions'; 
import Navbar from '../../components/layout/Navbar';
import PortfolioTable from '../../features/portfolio/PortfolioTable';
import ProfitSummary from '../../features/portfolio/ProfitSummary';
import TaxSummary from '../../features/portfolio/TaxSummary';
import OptionsSection from '../../features/portfolio/OptionsSection';
import Tabs from '../../features/portfolio/Tabs';
import SupervisorFundsTab from '../../features/portfolio/SupervisorFundsTab';
import { portfolioApi } from '../../api/endpoints/portfolio';
import SellOrderModal from '../../features/portfolio/SellOrderModal';
import styles from './PortfolioPage.module.css';


export default function PortfolioPage() {
  const pageRef = useRef(null);
  const { can } = usePermissions();
  const user = useAuthStore(s => s.user);
  const initFromStorage = useAuthStore(s => s.initFromStorage);
  const employeeId = user?.employee_id ?? user?.id;

  // --- ISPRAVLJEN STATE (Počinjemo sa praznim podacima) ---
  const [data, setData] = useState({
    stocks: [],
    options: [],
    tax: { taxPaid: 0, taxUnpaid: 0 }
  });
  const [, setLoading] = useState(false);
  const [sellModal, setSellModal] = useState(null);
  const [activeTab, setActiveTab] = useState('securities');

  useEffect(() => {
    if (!user) initFromStorage();
  }, [user]);

  const canManageOTC = can('portfolio.otc.manage') || can('admin.all');
  const canExercise = can('portfolio.options.exercise');
  const canViewOptions = can('portfolio.options.view') || canExercise;
  const isAgent = canManageOTC || canViewOptions || can('trading');

  // --- ISPRAVLJENA API LOGIKA ---
  // --- ISPRAVLJENA API LOGIKA ---
  useEffect(() => {
    const loadEverything = async () => {
      if (!employeeId) return;

      try {
        setLoading(true);
        let res;
        
        // DEBUG: Log what endpoint we're using
        console.log('[AdminPortfolioPage] Loading portfolio:', {
          employeeId,
          isAgent,
          willUse: isAgent ? 'getActuaryPortfolio' : 'getClientPortfolio',
          userRole: user?.role,
          userEmail: user?.email,
          canManageOTC,
          canExercise,
          canViewOptions
        });
        
        // Dinamički biramo endpoint: Actuary/Agent ili običan Client
        if (isAgent) {
          res = await portfolioApi.getActuaryPortfolio(employeeId);
        } else {
          res = await portfolioApi.getClientPortfolio(employeeId);
        }

        // Tvoj client.js verovatno već vraća res.data kroz interceptor, 
        // ali za svaki slučaj radimo proveru formata:
        const rawData = res?.data || res; 
        const allAssets = Array.isArray(rawData) ? rawData : (rawData?.assets || []);
        
        setData({
          stocks: allAssets.filter(a => a.type?.toUpperCase() !== 'OPTION'),
          options: allAssets.filter(a => a.type?.toUpperCase() === 'OPTION'),
          tax: rawData?.tax || { taxPaid: 0, taxUnpaid: 0 }
        });

      } catch (err) {
        console.error('[AdminPortfolioPage] API Error:', {
          status: err?.response?.status,
          message: err?.response?.data?.message || err?.message,
          url: err?.response?.config?.url,
          fullError: err
        });
        // Resetujemo state na prazno u slučaju greške da UI ne bi "pukao"
        setData({ stocks: [], options: [], tax: { taxPaid: 0, taxUnpaid: 0 } });
      } finally {
        setLoading(false);
      }
    };

    loadEverything();
  }, [employeeId, isAgent, canManageOTC, canExercise, canViewOptions, user?.role]);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.page-anim', { opacity: 0, y: 20, duration: 0.4, stagger: 0.08, ease: 'power2.out' });
    }, pageRef);
    return () => ctx.revert();
  }, [data]); // Okidaj animaciju kada se podaci promene

  if (!user) return null;

  const clientId = user?.client_id ?? user?.id;

  return (
    <div ref={pageRef} className={styles.stranica}>
      <Navbar />

      {sellModal && (
        <SellOrderModal
          asset={sellModal}
          clientId={clientId}
          isEmployee
          onClose={() => setSellModal(null)}
          onSuccess={() => setSellModal(null)}
        />
      )}
      <main className={styles.sadrzaj}>
        
        <div className="page-anim">
          <div className={styles.breadcrumb}><span>Portfolio</span></div>
          <div className={styles.pageHeader}>
            <div>
              <h1 className={styles.pageTitle}>Moj Portfolio</h1>
              <p className={styles.pageDesc}>Pregled akcija i finansijskih instrumenata.</p>
            </div>
            {/* Koristi data.tax */}
            <TaxSummary stats={data.tax} />
          </div>
        </div>

        <div className="page-anim">
          {/* Koristi data.stocks */}
          <ProfitSummary assets={data.stocks} />
        </div>

        <div className="page-anim">
          <Tabs
            tabs={[
              { id: 'securities', label: 'Moje hartije' },
              { id: 'funds', label: 'Moji fondovi' }
            ]}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </div>

        {activeTab === 'securities' && (
          <>
            {/* TABELA 1: Akcije */}
            <div className={`page-anim ${styles.tableCard}`}>
              <div className={styles.cardHeader}><h3>Hartije od vrednosti</h3></div>
              <PortfolioTable assets={data.stocks} isAdmin={canManageOTC} onSell={asset => setSellModal(asset)} />
            </div>

            {/* TABELA 2: Opcije */}
            {canViewOptions && (
              <div className={`page-anim ${styles.tableCard}`} style={{ marginTop: '32px' }}>
                <div className={styles.cardHeader}><h3>Opcije i Derivati</h3></div>
                <OptionsSection assets={data.options} canExercise={canExercise} />
              </div>
            )}

            {/* TABELA 3: OTC Panel */}
            {canManageOTC && (
              <div className={`page-anim ${styles.tableCard}`} style={{ marginTop: '32px' }}>
                <div className={styles.cardHeader}>
                   <div className={styles.headerWithBadge}>
                      <h3>Upravljanje javnim akcijama (OTC)</h3>
                      <span className={styles.adminBadge}>ADMIN CONTROL</span>
                   </div>
                </div>
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>TICKER</th>
                        <th>JAVNA KOLIČINA</th>
                        <th>CENA</th>
                        <th style={{ textAlign: 'right' }}>AKCIJE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Koristi data.stocks */}
                      {data.stocks.map((asset, idx) => (
                        <tr key={asset.assetId ?? asset.id ?? `${asset.ticker || 'asset'}-${idx}`}>
                          <td className={styles.ticker}>{asset.ticker}</td>
                          <td>{asset.amount}</td>
                          <td>${asset.price}</td>
                          <td style={{ textAlign: 'right' }}>
                            <button className={styles.removeBtn}>Povuci sa portala</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'funds' && (
          <div className="page-anim">
            <SupervisorFundsTab actuaryId={employeeId} />
          </div>
        )}
      </main>
    </div>
  );
}