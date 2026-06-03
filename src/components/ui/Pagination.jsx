import styles from './Pagination.module.css';

export default function Pagination({ page, pageSize, total, totalPages: providedTotalPages, onPageChange }) {
  const totalPages = Number(providedTotalPages ?? Math.max(1, Math.ceil(total / pageSize)));
  if (totalPages <= 1) return null;

  const knownTotal = Number(total ?? totalPages * pageSize);
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, knownTotal);

  return (
    <div className={styles.pagination}>
      <span className={styles.info}>{from}–{to} od {knownTotal}</span>
      <div className={styles.controls}>
        <button
          className={styles.btn}
          onClick={() => onPageChange(1)}
          disabled={page === 1}
        >«</button>
        <button
          className={styles.btn}
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
        >‹</button>
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
          .reduce((acc, p, idx, arr) => {
            if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
            acc.push(p);
            return acc;
          }, [])
          .map((p, i) =>
            p === '...'
              ? <span key={`e${i}`} className={styles.ellipsis}>…</span>
              : <button
                  key={p}
                  className={`${styles.btn} ${p === page ? styles.active : ''}`}
                  onClick={() => onPageChange(p)}
                >{p}</button>
          )}
        <button
          className={styles.btn}
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
        >›</button>
        <button
          className={styles.btn}
          onClick={() => onPageChange(totalPages)}
          disabled={page === totalPages}
        >»</button>
      </div>
    </div>
  );
}
