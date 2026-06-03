import styles from './SecurityTabs.module.css';

const TABS = [
  { value: 'STOCK',   label: 'Akcije',  icon: '📈' },
  { value: 'FUTURES', label: 'Futures', icon: '📊' },
  { value: 'FOREX',   label: 'Forex',   icon: '💱' },
  { value: 'OPTION',  label: 'Opcije',  icon: '📄' },
];

export default function SecurityTabs({ activeTab, onChange, canSeeForex, canSeeOptions }) {
  const visibleTabs = TABS.filter(t => {
    if (t.value === 'FOREX'    && !canSeeForex)   return false;
    if (t.value === 'OPTION'   && !canSeeOptions) return false;
    return true;
  });

  return (
    <div className={styles.tabsWrapper}>
      {visibleTabs.map(tab => (
        <button
          key={tab.value}
          className={`${styles.tab} ${activeTab === tab.value ? styles.active : ''}`}
          onClick={() => onChange(tab.value)}
        >
          <span className={styles.tabIcon}>{tab.icon}</span>
          {tab.label}
        </button>
      ))}
    </div>
  );
}
