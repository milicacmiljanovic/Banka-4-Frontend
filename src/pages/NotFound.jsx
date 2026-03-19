import { useRef, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import styles from './NotFound.module.css';

export default function NotFound() {
  const navigate = useNavigate();
  const ref = useRef(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(['.nf-code', '.nf-title', '.nf-desc', '.nf-btn'], {
        opacity: 0,
        y: 30,
        duration: 0.5,
        stagger: 0.1,
        ease: 'power2.out',
      });
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={ref} className={styles.stranica}>
      <div className={styles.sadrzaj}>
        <p className={`nf-code ${styles.kod}`}>404</p>
        <h1 className={`nf-title ${styles.naslov}`}>Stranica nije pronađena</h1>
        <p className={`nf-desc ${styles.opis}`}>Stranica koju tražite ne postoji ili je premeštena.</p>
        <button className={`nf-btn ${styles.dugme}`} onClick={() => navigate('/')}>
          Nazad na početnu
        </button>
      </div>
    </div>
  );
}
