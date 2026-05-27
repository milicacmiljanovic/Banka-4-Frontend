import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { auditLogsApi } from '../../api/endpoints/auditLogs';
import Navbar from '../../components/layout/Navbar';
import Spinner from '../../components/ui/Spinner';
import Alert from '../../components/ui/Alert';
import styles from './AuditLogPage.module.css';

const ACTION_OPTIONS = [
  { value: '', label: 'Sve akcije' },
  { value: 'AGENT_LIMIT_CHANGED', label: 'Promena limita agentu' },
  { value: 'AGENT_USED_LIMIT_RESET', label: 'Reset used limita' },
  { value: 'ORDER_APPROVED', label: 'Order odobren' },
  { value: 'ORDER_REJECTED', label: 'Order odbijen' },
  { value: 'EMPLOYEE_PERMISSIONS_CHANGED', label: 'Promena permisija' },
  { value: 'MANUAL_TAX_CALCULATION_STARTED', label: 'Rucni obracun poreza' },
];

const ACTION_LABELS = ACTION_OPTIONS.reduce((acc, option) => {
  if (option.value) acc[option.value] = option.label;
  return acc;
}, {});

const EMPTY_FILTERS = {
  action_type: '',
  user: '',
  date_from: '',
  date_to: '',
};

function actionLabel(action) {
  if (ACTION_LABELS[action]) return ACTION_LABELS[action];
  return action ? action.replaceAll('_', ' ').toLowerCase() : 'Akcija';
}

function unwrapList(response) {
  const body = response?.data ?? response;
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.data)) return body.data;
  if (Array.isArray(body?.content)) return body.content;
  if (Array.isArray(body?.items)) return body.items;
  return [];
}

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat('sr-RS', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function actorName(entry) {
  const actor = entry.actor ?? entry.user ?? entry.employee ?? entry.performed_by;
  if (typeof actor === 'string') return actor;
  const fullName = [actor?.first_name ?? actor?.firstName, actor?.last_name ?? actor?.lastName]
    .filter(Boolean)
    .join(' ');
  return fullName || actor?.email || entry.actor_email || entry.user_email || entry.username || '-';
}

function targetName(entry) {
  const target = entry.target ?? entry.target_user ?? entry.subject ?? entry.employee_target;
  if (typeof target === 'string') return target;
  return [target?.first_name ?? target?.firstName, target?.last_name ?? target?.lastName]
    .filter(Boolean)
    .join(' ') || target?.email || entry.target_email || entry.target_id || entry.order_id || '-';
}

function normalizeAction(entry) {
  return entry.action_type ?? entry.actionType ?? entry.type ?? entry.action ?? '';
}

function formatDetails(entry, action) {
  if (entry.description) return entry.description;
  if (entry.details && typeof entry.details === 'string') return entry.details;

  const details = entry.details ?? entry.metadata ?? {};
  const oldLimit = details.old_limit ?? details.oldLimit ?? entry.old_limit;
  const newLimit = details.new_limit ?? details.newLimit ?? entry.new_limit;
  const orderId = details.order_id ?? details.orderId ?? entry.order_id;
  const permissions = details.permissions ?? details.new_permissions ?? entry.permissions;

  if (action === 'AGENT_LIMIT_CHANGED') {
    return `Novi limit: ${Number(newLimit ?? 0).toLocaleString('sr-RS')} RSD${oldLimit != null ? `, prethodno ${Number(oldLimit).toLocaleString('sr-RS')} RSD` : ''}.`;
  }
  if (action === 'AGENT_USED_LIMIT_RESET') return 'Iskorisceni limit je resetovan na 0 RSD.';
  if (action === 'ORDER_APPROVED') return `Odobren order ${orderId ?? targetName(entry)}.`;
  if (action === 'ORDER_REJECTED') {
    const reason = details.reason ?? entry.reason;
    return `Odbijen order ${orderId ?? targetName(entry)}${reason ? `: ${reason}` : '.'}`;
  }
  if (action === 'EMPLOYEE_PERMISSIONS_CHANGED') {
    const value = Array.isArray(permissions) ? permissions.join(', ') : permissions;
    return value ? `Nove permisije: ${value}.` : 'Permisije zaposlenog su izmenjene.';
  }
  if (action === 'MANUAL_TAX_CALCULATION_STARTED') return 'Pokrenut je rucni obracun poreza.';

  if (details && typeof details === 'object' && Object.keys(details).length > 0) {
    return Object.entries(details)
      .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
      .join('; ');
  }
  return '-';
}

function normalizeEntry(entry) {
  const action = normalizeAction(entry);
  return {
    id: entry.id ?? entry.audit_log_id ?? `${action}-${entry.created_at ?? entry.timestamp}-${entry.target_id ?? ''}`,
    action,
    actionLabel: actionLabel(action),
    actor: actorName(entry),
    target: targetName(entry),
    createdAt: entry.created_at ?? entry.createdAt ?? entry.timestamp ?? entry.performed_at,
    details: formatDetails(entry, action),
  };
}

export default function AuditLogPage() {
  const pageRef = useRef(null);
  const [logs, setLogs] = useState([]);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(EMPTY_FILTERS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await auditLogsApi.getAll();
      setLogs(unwrapList(response).map(normalizeEntry));
    } catch (err) {
      setError(err?.response?.data?.error ?? err?.message ?? 'Greska pri ucitavanju audit loga.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.page-anim', { opacity: 0, y: 20, duration: 0.45, stagger: 0.07, ease: 'power2.out' });
    }, pageRef);
    return () => ctx.revert();
  }, []);

  const filteredLogs = useMemo(() => {
    const user = appliedFilters.user.trim().toLowerCase();
    const from = appliedFilters.date_from ? new Date(`${appliedFilters.date_from}T00:00:00`).getTime() : null;
    const to = appliedFilters.date_to ? new Date(`${appliedFilters.date_to}T23:59:59`).getTime() : null;

    return logs.filter(log => {
      if (appliedFilters.action_type && log.action !== appliedFilters.action_type) return false;
      if (user && !`${log.actor} ${log.target}`.toLowerCase().includes(user)) return false;
      const time = new Date(log.createdAt).getTime();
      if (from && time < from) return false;
      if (to && time > to) return false;
      return true;
    });
  }, [logs, appliedFilters]);

  function updateFilter(key, value) {
    setFilters(prev => ({ ...prev, [key]: value }));
  }

  function applyFilters(event) {
    event.preventDefault();
    setAppliedFilters(filters);
  }

  function resetFilters() {
    setFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
  }

  return (
    <div ref={pageRef} className={styles.stranica}>
      <Navbar />
      <main className={styles.sadrzaj}>
        <div className="page-anim">
          <div className={styles.breadcrumb}>
            <span>Admin</span><span className={styles.sep}>›</span>
            <span className={styles.current}>Audit log</span>
          </div>
          <h1 className={styles.title}>Audit log</h1>
          <p className={styles.desc}>
            Pregled sistemskih akcija: izmene limita, resetovanja, odluke nad orderima, promene permisija i rucni obracuni poreza.
          </p>
        </div>

        <form className={`page-anim ${styles.filters}`} onSubmit={applyFilters}>
          <label className={styles.field}>
            <span className={styles.label}>Tip akcije</span>
            <select value={filters.action_type} onChange={event => updateFilter('action_type', event.target.value)}>
              {ACTION_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Korisnik</span>
            <input
              type="text"
              placeholder="Ime, email ili ID..."
              value={filters.user}
              onChange={event => updateFilter('user', event.target.value)}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Od datuma</span>
            <input type="date" value={filters.date_from} onChange={event => updateFilter('date_from', event.target.value)} />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Do datuma</span>
            <input type="date" value={filters.date_to} onChange={event => updateFilter('date_to', event.target.value)} />
          </label>
          <button type="submit" className={styles.btnPrimary}>Primeni</button>
          <button type="button" className={styles.btnGhost} onClick={resetFilters}>Reset</button>
        </form>

        <section className="page-anim">
          {loading && <Spinner />}
          {!loading && error && <Alert tip="greska" poruka={error} />}
          {!loading && !error && filteredLogs.length === 0 && (
            <div className={styles.empty}>Nema audit zapisa za izabrane filtere.</div>
          )}
          {!loading && !error && filteredLogs.length > 0 && (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Vreme</th>
                    <th>Akcija</th>
                    <th>Korisnik</th>
                    <th>Objekat</th>
                    <th>Detalji</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map(log => (
                    <tr key={log.id}>
                      <td>
                        <div>{formatDate(log.createdAt)}</div>
                      </td>
                      <td><span className={styles.badge}>{log.actionLabel}</span></td>
                      <td className={styles.actor}>{log.actor}</td>
                      <td>{log.target}</td>
                      <td className={styles.details}>{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
