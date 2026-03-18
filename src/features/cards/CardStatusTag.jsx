import { getStatusMeta } from '../../utils/cardHelpers';
import styles from '../../pages/CardsPage.module.css';

export default function CardStatusTag({ status }) {
  const meta = getStatusMeta(status);

  return (
    <span className={`${styles.statusTag} ${styles[`status_${meta.tone}`]}`}>
      <span className={styles.statusDot} />
      {meta.label}
    </span>
  );
}
