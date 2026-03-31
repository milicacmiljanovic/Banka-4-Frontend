import api from './client';
import { ORDER_DIRECTION, ORDER_STATUS, ORDER_TYPE } from '../utils/orders/orderModel';

const DELAY = 600;

const delay = ms => new Promise(r => setTimeout(r, ms));

const FAKE_EMPLOYEE = {
  employee_id:   1,
  first_name:    'Petar',
  last_name:     'Petrović',
  email:         'petar.petrovic@rafbank.rs',
  username:      'ppetrovic',
  gender:        'M',
  date_of_birth: '1985-03-15',
  phone_number:  '+381601234567',
  address:       'Knez Mihailova 10, Beograd',
  department:    'Management',
  position_id:   1,
  active:        true,
  is_admin:      true,
  permissions: [
    'employee.view',
    'employee.create',
    'employee.update',
    'employee.delete',
    'account.create',
    'admin.cards',
    'admin.clients',
    'admin.loans',
 
  ],
};

const FAKE_EMPLOYEES = [
  { employee_id: 1, first_name: 'Petar',   last_name: 'Petrović',  email: 'petar.petrovic@rafbank.rs',    username: 'ppetrovic',  position_id: 1, department: 'Management', active: true,  gender: 'M', date_of_birth: '1985-03-15', phone_number: '+381601234567', address: 'Knez Mihailova 10' },
  { employee_id: 2, first_name: 'Ana',     last_name: 'Jovanović', email: 'ana.jovanovic@rafbank.rs',     username: 'ajovanovic', position_id: 2, department: 'Finance',    active: true,  gender: 'F', date_of_birth: '1990-07-22', phone_number: '+381601234568', address: 'Bulevar Kralja Aleksandra 5' },
  { employee_id: 3, first_name: 'Marko',   last_name: 'Nikolić',   email: 'marko.nikolic@rafbank.rs',     username: 'mnikolic',   position_id: 3, department: 'IT',         active: true,  gender: 'M', date_of_birth: '1992-11-03', phone_number: '+381601234569', address: 'Nemanjina 15' },
  { employee_id: 4, first_name: 'Jelena',  last_name: 'Đorđević',  email: 'jelena.djordjevic@rafbank.rs', username: 'jdjordjevic', position_id: 4, department: 'Finance',   active: false, gender: 'F', date_of_birth: '1988-01-10', phone_number: '+381601234570', address: 'Cara Dušana 20' },
  { employee_id: 5, first_name: 'Stefan',  last_name: 'Popović',   email: 'stefan.popovic@rafbank.rs',    username: 'spopovic',   position_id: 5, department: 'IT',         active: true,  gender: 'M', date_of_birth: '1995-05-18', phone_number: '+381601234571', address: 'Terazije 8' },
  { employee_id: 6, first_name: 'Milica',  last_name: 'Stanković', email: 'milica.stankovic@rafbank.rs',  username: 'mstankovic', position_id: 6, department: 'HR',         active: true,  gender: 'F', date_of_birth: '1991-09-25', phone_number: '+381601234572', address: 'Savska 30' },
  { employee_id: 7, first_name: 'Nikola',  last_name: 'Ilić',      email: 'nikola.ilic@rafbank.rs',       username: 'nilic',      position_id: 7, department: 'IT',         active: false, gender: 'M', date_of_birth: '1993-12-07', phone_number: '+381601234573', address: 'Vojvode Stepe 42' },
  { employee_id: 8, first_name: 'Ivana',   last_name: 'Marković',  email: 'ivana.markovic@rafbank.rs',    username: 'imarkovic',  position_id: 8, department: 'Finance',    active: true,  gender: 'F', date_of_birth: '1989-04-14', phone_number: '+381601234574', address: 'Balkanska 12' },
];

const FAKE_CLIENTS = [
  { id: 101, first_name: 'Marko',  last_name: 'Nikolić',  email: 'marko.nikolic@gmail.com', jmbg: '0411990710002' },
  { id: 102, first_name: 'Jelena', last_name: 'Milić',    email: 'jelena.milic@gmail.com',  jmbg: '1209985710003' },
  { id: 103, first_name: 'Petar',  last_name: 'Petrović', email: 'petar@gmail.com',          jmbg: '0306025710001' },
];

const FAKE_ACCOUNTS = [

  {
    id: 101,
    first_name: 'Marko', last_name: 'Nikolić',
    email: 'marko.nikolic@gmail.com', jmbg: '0411990710002',
    phone_number: '+381641234567', address: 'Knez Mihailova 5, Beograd',
    cards: [
      { id: 'c1', card_number: '4111 1111 1111 1111', account_number: '170-23-2423219113', status: 'AKTIVNA'   },
      { id: 'c2', card_number: '5200 0000 0000 0007', account_number: '73-4483942-32',     status: 'BLOKIRANA' },
    ],
  },
  {
    id: 102,
    first_name: 'Jelena', last_name: 'Milić',
    email: 'jelena.milic@gmail.com', jmbg: '1209985710003',
    phone_number: '+381651234567', address: 'Nemanjina 10, Beograd',
    cards: [
      { id: 'c3', card_number: '3714 4963 5398 431', account_number: '456-7890987-65', status: 'NEAKTIVNA' },
    ],
  },
  {
    id: 103,
    first_name: 'Petar', last_name: 'Petrović',
    email: 'petar@gmail.com', jmbg: '0306025710001',
    phone_number: '+381601234567', address: 'Terazije 1, Beograd',
    cards: [],
  },
];

const FAKE_LOAN_REQUESTS = [
  { id: 'lr1', client_name: 'Marko Nikolić',  amount: 500000,  currency: 'RSD', duration_months: 36, rate_type: 'VARIJABILNA', status: 'NA ČEKANJU' },
  { id: 'lr2', client_name: 'Jelena Milić',   amount: 200000,  currency: 'RSD', duration_months: 24, rate_type: 'FIKSNA',      status: 'NA ČEKANJU' },
  { id: 'lr3', client_name: 'Petar Petrović', amount: 1000000, currency: 'RSD', duration_months: 60, rate_type: 'VARIJABILNA', status: 'ODOBRENO'   },
  { id: 'lr4', client_name: 'Ana Jovanović',  amount: 150000,  currency: 'RSD', duration_months: 12, rate_type: 'FIKSNA',      status: 'ODBIJENO'   },
];


// ─── FAKE PORTFOLIO DATA ──────────────────────────────────────────────────────

const FAKE_PORTFOLIO_ASSETS = [
    { 
        id: 1, 
        type: 'Stock', 
        ticker: 'AAPL', 
        amount: 100, 
        price: 150, 
        profit: 500, 
        lastModified: '2026-03-21', 
        status: 'Active' 
    },
    { 
        id: 2, 
        type: 'Future', 
        ticker: 'S&P500', 
        amount: 2, 
        price: 4000, 
        profit: -100, 
        lastModified: '2026-03-21', 
        status: 'Active' 
    },
    { 
        id: 3, 
        type: 'Option', 
        ticker: 'MSFT', 
        optionType: 'CALL', 
        strike: 280, 
        current: 300, 
        settlement: '2026-04-25', 
        status: 'ITM' 
    },
    { 
        id: 4, 
        type: 'Option', 
        ticker: 'TSLA', 
        optionType: 'PUT', 
        strike: 700, 
        current: 680, 
        settlement: '2026-03-20', 
        status: 'OTM' 
    }
];

const FAKE_PORTFOLIO_STATS = {
    taxPaid: 1200,
    taxUnpaid: 450
};

export const MOCK_ORDERS = [
  {
    id: 101,
    agent_name: 'Miloš Milošević',
    asset_name: 'AAPL',
    asset_type: 'Stock',
    order_type: ORDER_TYPE.MARKET,
    quantity: 10,
    contract_size: 1,
    price_per_unit: 192.5,
    direction: ORDER_DIRECTION.BUY,
    remaining_portions: 10,
    status: ORDER_STATUS.PENDING,
    approved_by: '—',
    last_modification: '2026-03-17T09:30:00Z',
    settlement_date: null,
  },
  {
    id: 102,
    agent_name: 'Jelena Jovanović',
    asset_name: 'EUR/USD',
    asset_type: 'Forex',
    order_type: ORDER_TYPE.LIMIT,
    quantity: 2,
    contract_size: 1000,
    price_per_unit: 1.09,
    direction: ORDER_DIRECTION.SELL,
    remaining_portions: 2,
    status: ORDER_STATUS.PENDING,
    approved_by: '—',
    last_modification: '2026-03-17T10:00:00Z',
    settlement_date: '2026-03-15T00:00:00Z',
  },
  {
    id: 103,
    agent_name: 'Ana Anić',
    asset_name: 'CLZ26',
    asset_type: 'Futures',
    order_type: ORDER_TYPE.STOP,
    quantity: 3,
    contract_size: 100,
    price_per_unit: 80,
    direction: ORDER_DIRECTION.BUY,
    remaining_portions: 3,
    status: ORDER_STATUS.APPROVED,
    approved_by: 'Supervisor Admin',
    last_modification: '2026-03-16T14:12:00Z',
    settlement_date: '2026-12-20T00:00:00Z',
  },
  {
    id: 104,
    agent_name: 'Petar Petrović',
    asset_name: 'MSFT',
    asset_type: 'Stock',
    order_type: ORDER_TYPE.STOP_LIMIT,
    quantity: 5,
    contract_size: 1,
    price_per_unit: 410,
    direction: ORDER_DIRECTION.SELL,
    remaining_portions: 0,
    status: ORDER_STATUS.DONE,
    approved_by: 'Supervisor Admin',
    last_modification: '2026-03-14T11:45:00Z',
    settlement_date: null,
  },
  {
    id: 105,
    agent_name: 'Nikola Nikolić',
    asset_name: 'TSLA',
    asset_type: 'Stock',
    order_type: ORDER_TYPE.LIMIT,
    quantity: 8,
    contract_size: 1,
    price_per_unit: 215,
    direction: ORDER_DIRECTION.BUY,
    remaining_portions: 8,
    status: ORDER_STATUS.DECLINED,
    approved_by: 'Supervisor Admin',
    last_modification: '2026-03-13T08:15:00Z',
    settlement_date: null,
  },
];


api.interceptors.request.use(async config => {
  await delay(DELAY);

  const { method, url, data: rawData, params } = config;
  const data = typeof rawData === 'string' ? JSON.parse(rawData || '{}') : rawData ?? {};
  const path = url?.replace(import.meta.env.VITE_API_URL ?? '', '') ?? '';

  if (method === 'post' && (path === '/auth/login' || path === '/login')) {
    if (data.username && data.password || data.email && data.password) {
      return throwFakeResponse(config, {

        access_token:  'fake-jwt-token-123',
        token:         'fake-jwt-token-123',
        refresh_token: 'fake-refresh-token-456',
        expires_in:    3600,
        employee:      FAKE_EMPLOYEE,
        user:          FAKE_EMPLOYEE,  

      });
    }
    return throwFakeError(config, 401, 'Pogrešan username ili lozinka.');
  }

  if (method === 'post' && path === '/login') {
    if (data.email && data.password) {
      return throwFakeResponse(config, {
        token:         'fake-jwt-token-123',
        refresh_token: 'fake-refresh-token-456',
        user:          FAKE_EMPLOYEE,
      });
    }
    return throwFakeError(config, 401, 'Pogrešan email ili lozinka.');
  }

  if (method === 'post' && path === '/refresh') {
    return throwFakeResponse(config, {
      token:         'fake-jwt-token-renewed',
      refresh_token: 'fake-refresh-token-renewed',
    });
  }

  if (method === 'post' && path === '/auth/register') {
    const novi = { employee_id: Date.now(), ...data };
    FAKE_EMPLOYEES.push(novi);
    return throwFakeResponse(config, { data: novi, message: 'Zaposleni je kreiran.' }, 201);
  }

  if (method === 'post' && path === '/register') {
    const novi = { employee_id: Date.now(), ...data };
    FAKE_EMPLOYEES.push(novi);
    return throwFakeResponse(config, { data: novi, message: 'Zaposleni je kreiran.' }, 201);
  }

  if (method === 'post' && path === '/auth/activate') {
    return throwFakeResponse(config, { message: 'Nalog je aktiviran.' });
  }

  if (method === 'post' && path === '/activate') {
    return throwFakeResponse(config, { message: 'Nalog je aktiviran.' });
  }

  if (method === 'post' && (path === '/auth/forgot-password' || path === '/forgot-password')) {
    return throwFakeResponse(config, { message: 'Email je poslat.' });
  }

  if (method === 'post' && (path === '/auth/reset-password' || path === '/reset-password')) {
    return throwFakeResponse(config, { message: 'Lozinka je promenjena.' });
  }

  if (method === 'post' && path === '/employees/change-password') {
    return throwFakeResponse(config, { message: 'Lozinka je uspešno promenjena.' });
  }

  const idMatch = path.match(/^\/employees\/(\d+)$/);

  if (method === 'get' && idMatch) {
    const emp = FAKE_EMPLOYEES.find(e => e.employee_id === Number(idMatch[1]));
    if (emp) return throwFakeResponse(config, { data: emp });
    return throwFakeError(config, 404, 'Zaposleni nije pronađen.');
  }

  if (method === 'put' && idMatch) {
    const idx = FAKE_EMPLOYEES.findIndex(e => e.employee_id === Number(idMatch[1]));
    if (idx !== -1) {
      Object.assign(FAKE_EMPLOYEES[idx], data);
      return throwFakeResponse(config, { data: FAKE_EMPLOYEES[idx], message: 'Zaposleni je ažuriran.' });
    }
    return throwFakeError(config, 404, 'Zaposleni nije pronađen.');
  }

  if (method === 'delete' && idMatch) {
    const idx = FAKE_EMPLOYEES.findIndex(e => e.employee_id === Number(idMatch[1]));
    if (idx !== -1) {
      FAKE_EMPLOYEES.splice(idx, 1);
      return throwFakeResponse(config, { message: 'Zaposleni je obrisan.' });
    }
    return throwFakeError(config, 404, 'Zaposleni nije pronađen.');
  }

  if (method === 'get' && path === '/employees') {
    let filtered = [...FAKE_EMPLOYEES];
    if (params?.email)      filtered = filtered.filter(e => e.email.toLowerCase().includes(params.email.toLowerCase()));
    if (params?.first_name) filtered = filtered.filter(e => e.first_name.toLowerCase().includes(params.first_name.toLowerCase()));
    if (params?.last_name)  filtered = filtered.filter(e => e.last_name.toLowerCase().includes(params.last_name.toLowerCase()));
    if (params?.position)   filtered = filtered.filter(e => String(e.position_id).includes(params.position));


    const page     = Number(params?.page)      || 1;
    const pageSize = Number(params?.page_size)  || 20;

    if (params?.email) {
      filtered = filtered.filter(e => e.email.toLowerCase().includes(params.email.toLowerCase()));
    }
    if (params?.first_name) {
      filtered = filtered.filter(e => e.first_name.toLowerCase().includes(params.first_name.toLowerCase()));
    }
    if (params?.last_name) {
      filtered = filtered.filter(e => e.last_name.toLowerCase().includes(params.last_name.toLowerCase()));
    }
    if (params?.position) {
      filtered = filtered.filter(e => String(e.position_id).includes(params.position));
    }

    // const page     = Number(params?.page)     || 1;
    // const pageSize = Number(params?.page_size) || 20;

    const start    = (page - 1) * pageSize;
    const sliced   = filtered.slice(start, start + pageSize);

    return throwFakeResponse(config, {
      data:        sliced,
      total:       filtered.length,
      page,
      page_size:   pageSize,
      total_pages: Math.ceil(filtered.length / pageSize),
    });
  }


  if (method === 'get' && path === '/clients/search') {
    const q = params?.q?.toLowerCase() ?? '';
    const found = FAKE_CLIENTS.find(
      c => c.jmbg === q || c.email.toLowerCase() === q
    );
    if (found) return throwFakeResponse(config, found);
    return throwFakeError(config, 404, 'Klijent nije pronađen.');
  }

  if (method === 'post' && path === '/clients') {
    const novi = { id: Date.now(), ...data };
    FAKE_CLIENTS.push(novi);
    return throwFakeResponse(config, novi, 201);
  }

  if (method === 'post' && path === '/accounts') {
    const noviRacun = { id: Date.now(), ...data };
    FAKE_ACCOUNTS.push(noviRacun);
    return throwFakeResponse(config, noviRacun, 201);
  }

  if (method === 'get' && path === '/accounts') {
    return throwFakeResponse(config, { data: FAKE_ACCOUNTS, total: FAKE_ACCOUNTS.length });
  }
  if (method === 'get' && path === '/clients') {
    let filtered = [...FAKE_CLIENTS];
    if (params?.first_name)     filtered = filtered.filter(c => c.first_name.toLowerCase().includes(params.first_name.toLowerCase()));
    if (params?.last_name)      filtered = filtered.filter(c => c.last_name.toLowerCase().includes(params.last_name.toLowerCase()));
    if (params?.jmbg)           filtered = filtered.filter(c => c.jmbg.includes(params.jmbg));
    if (params?.account_number) filtered = filtered.filter(c =>
      c.cards.some(card => card.account_number.includes(params.account_number))
    );
    filtered.sort((a, b) => a.last_name.localeCompare(b.last_name, 'sr'));
    return throwFakeResponse(config, { data: filtered, total: filtered.length });
  }

  const clientIdMatch = path.match(/^\/clients\/(.+)$/);
  if (method === 'patch' && clientIdMatch) {
    const idx = FAKE_CLIENTS.findIndex(c => String(c.id) === clientIdMatch[1]);
    if (idx !== -1) {
      const emailInUse = FAKE_CLIENTS.some((c, i) => i !== idx && c.email.toLowerCase() === data.email?.toLowerCase());
      if (emailInUse) return throwFakeError(config, 409, 'Email adresa je već u upotrebi u sistemu.');
      Object.assign(FAKE_CLIENTS[idx], data);
      return throwFakeResponse(config, FAKE_CLIENTS[idx]);
    }
    return throwFakeError(config, 404, 'Klijent nije pronađen.');
  }

  const unblockMatch = path.match(/^\/cards\/(.+)\/unblock$/);
  if (method === 'patch' && unblockMatch) {
    const cardId = unblockMatch[1];
    for (const client of FAKE_CLIENTS) {
      const card = client.cards.find(c => c.id === cardId);
      if (card) {
        if (card.status !== 'BLOKIRANA') return throwFakeError(config, 400, 'Kartica nije blokirana.');
        card.status = 'AKTIVNA';
        return throwFakeResponse(config, { message: 'Kartica je uspešno deblokirana.' });
      }
    }
    return throwFakeError(config, 404, 'Kartica nije pronađena.');
  }

  if (method === 'get' && path === '/loan-requests') {
    return throwFakeResponse(config, { data: FAKE_LOAN_REQUESTS, total: FAKE_LOAN_REQUESTS.length });
  }

  const approveMatch = path.match(/^\/loan-requests\/(.+)\/approve$/);
  if (method === 'post' && approveMatch) {
    const req = FAKE_LOAN_REQUESTS.find(r => r.id === approveMatch[1]);
    if (req) { req.status = 'ODOBRENO'; return throwFakeResponse(config, { message: 'Zahtev odobren.' }); }
    return throwFakeError(config, 404, 'Zahtev nije pronađen.');
  }

  const rejectMatch = path.match(/^\/loan-requests\/(.+)\/reject$/);
  if (method === 'post' && rejectMatch) {
    const req = FAKE_LOAN_REQUESTS.find(r => r.id === rejectMatch[1]);
    if (req) { req.status = 'ODBIJENO'; return throwFakeResponse(config, { message: 'Zahtev odbijen.' }); }
    return throwFakeError(config, 404, 'Zahtev nije pronađen.');
  }

  if (method === 'post' && path === '/loans/update-rate') {
    return throwFakeResponse(config, { message: `Stopa ažurirana na ${data.reference_rate}%.` });

  }

  return config;
});


function throwFakeError(config, status, errorMsg) {
  config.adapter = () =>
    Promise.reject({
      response: {
        status,
        data: { error: errorMsg },
      },
      config,
    });
  return config;
}
