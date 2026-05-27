const MOCK_AUDIT_LOGS = [
  {
    id: 1,
    action_type: 'AGENT_LIMIT_CHANGED',
    actor: { first_name: 'Admin', last_name: 'Admin', email: 'admin@raf.rs' },
    target: { first_name: 'Marko', last_name: 'Nikolic', email: 'marko.agent@raf.rs' },
    created_at: '2026-05-27T09:15:00+02:00',
    details: {
      old_limit: 100000,
      new_limit: 250000,
    },
  },
  {
    id: 2,
    action_type: 'AGENT_USED_LIMIT_RESET',
    actor: { first_name: 'Sara', last_name: 'Supervisor', email: 'sara.supervisor@raf.rs' },
    target: { first_name: 'Jelena', last_name: 'Jovanovic', email: 'jelena.agent@raf.rs' },
    created_at: '2026-05-27T10:05:00+02:00',
  },
  {
    id: 3,
    action_type: 'ORDER_APPROVED',
    actor: { first_name: 'Sara', last_name: 'Supervisor', email: 'sara.supervisor@raf.rs' },
    target: 'Order #ORD-2026-1042',
    created_at: '2026-05-26T14:32:00+02:00',
    details: {
      order_id: 'ORD-2026-1042',
    },
  },
  {
    id: 4,
    action_type: 'ORDER_REJECTED',
    actor: { first_name: 'Admin', last_name: 'Admin', email: 'admin@raf.rs' },
    target: 'Order #ORD-2026-1038',
    created_at: '2026-05-26T15:18:00+02:00',
    details: {
      order_id: 'ORD-2026-1038',
      reason: 'Limit nije dovoljan za nalog.',
    },
  },
  {
    id: 5,
    action_type: 'EMPLOYEE_PERMISSIONS_CHANGED',
    actor: { first_name: 'Admin', last_name: 'Admin', email: 'admin@raf.rs' },
    target: { first_name: 'Petar', last_name: 'Petrovic', email: 'petar.employee@raf.rs' },
    created_at: '2026-05-25T11:45:00+02:00',
    details: {
      permissions: ['employee.view', 'employee.update', 'admin.clients'],
    },
  },
  {
    id: 6,
    action_type: 'MANUAL_TAX_CALCULATION_STARTED',
    actor: { first_name: 'Admin', last_name: 'Admin', email: 'admin@raf.rs' },
    target: 'Svi korisnici',
    created_at: '2026-05-24T08:00:00+02:00',
  },
  {
    id: 7,
    action_type: 'AGENT_LIMIT_CHANGED',
    actor: { first_name: 'Sara', last_name: 'Supervisor', email: 'sara.supervisor@raf.rs' },
    target: { first_name: 'Luka', last_name: 'Ilic', email: 'luka.agent@raf.rs' },
    created_at: '2026-05-23T16:20:00+02:00',
    details: {
      old_limit: 75000,
      new_limit: 150000,
    },
  },
];

function entryMatchesUser(entry, value) {
  if (!value) return true;
  const needle = value.toLowerCase();
  const haystack = [
    entry.actor?.first_name,
    entry.actor?.last_name,
    entry.actor?.email,
    entry.target?.first_name,
    entry.target?.last_name,
    entry.target?.email,
    typeof entry.target === 'string' ? entry.target : '',
    entry.target_id,
    entry.order_id,
    entry.details?.order_id,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return haystack.includes(needle);
}

function entryMatchesDate(entry, dateFrom, dateTo) {
  const time = new Date(entry.created_at).getTime();
  const from = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : null;
  const to = dateTo ? new Date(`${dateTo}T23:59:59`).getTime() : null;

  if (from && time < from) return false;
  if (to && time > to) return false;
  return true;
}

function filterAuditLogs(params = {}) {
  return MOCK_AUDIT_LOGS.filter(entry => {
    if (params.action_type && entry.action_type !== params.action_type) return false;
    if (!entryMatchesUser(entry, params.user)) return false;
    if (!entryMatchesDate(entry, params.date_from, params.date_to)) return false;
    return true;
  });
}

export const auditLogsApi = {
  getAll: async (params = {}) => {
    const page = Number(params.page) || 1;
    const pageSize = Number(params.page_size) || 100;
    const filtered = filterAuditLogs(params);
    const start = (page - 1) * pageSize;

    return {
      data: filtered.slice(start, start + pageSize),
      total: filtered.length,
      page,
      page_size: pageSize,
      total_pages: Math.ceil(filtered.length / pageSize),
      mocked: true,
    };
  },
};
