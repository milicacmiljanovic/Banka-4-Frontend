import styles from './SecurityTabs.module.css';

const TABS = [
  { value: 'STOCK',   label: 'Akcije',  icon: '📈' },
  { value: 'FUTURES', label: 'Futures', icon: '📊' },
  { value: 'FOREX',   label: 'Forex',   icon: '💱' },
];

export default function SecurityTabs({ activeTab, onChange, canSeeForex }) {
  const visibleTabs = canSeeForex ? TABS : TABS.filter(t => t.value !== 'FOREX');

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
