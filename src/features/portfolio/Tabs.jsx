import styles from './Tabs.module.css';

export default function Tabs({ tabs, activeTab, onTabChange }) {
  return (
    <div className={styles.tabsContainer}>
      <div className={styles.tabsNav}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
