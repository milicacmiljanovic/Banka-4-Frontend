declare const Cypress: any;

export type TestUser = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  identity_type: 'employee' | 'client';
  is_admin?: boolean;
  permissions: string[];
};


export type ActuaryRow = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  position: string;
  limit: number;
  used_limit: number;
  need_approval: boolean;
  is_agent?: boolean;
  is_supervisor?: boolean;
};

export const supervisorUser: TestUser = {
  id: 9001,
  first_name: 'Sanja',
  last_name: 'Supervizor',
  email: 'supervisor@raf.rs',
  identity_type: 'employee',
  is_admin: false,
  permissions: ['supervisor'],
};

export const agentUser: TestUser = {
  id: 9002,
  first_name: 'Aca',
  last_name: 'Agent',
  email: 'agent@raf.rs',
  identity_type: 'employee',
  is_admin: false,
  permissions: ['orders.create'],
};

export const adminUser: TestUser = {
  id: 9003,
  first_name: 'Ana',
  last_name: 'Admin',
  email: 'admin@raf.rs',
  identity_type: 'employee',
  is_admin: true,
  permissions: ['admin', 'employee.view', 'employee.update'],
};

export function apiUrl() {
  const url = Cypress.env('API_URL') as string | undefined;
  const fallbackUrl = 'http://rafsi.davidovic.io:8080/api';
  const resolvedUrl = url && !url.includes('localhost') ? url : fallbackUrl;

  if (!resolvedUrl) throw new Error('Missing Cypress env API_URL');
  return resolvedUrl;
}

export function loginAs(user: TestUser, targetPath: string) {
  cy.visit(targetPath, {
    onBeforeLoad(win) {
      win.localStorage.setItem('token', 'test-token');
      win.localStorage.setItem('refreshToken', 'test-refresh-token');
      win.localStorage.setItem('user', JSON.stringify(user));
    },
  });
}

export function buildActuaries(overrides: Partial<ActuaryRow> = {}): ActuaryRow[] {
  return [
    {
      id: 101,
      first_name: 'Milan',
      last_name: 'Markovic',
      email: 'milan.markovic@raf.rs',
      position: 'Agent',
      limit: 100000,
      used_limit: 30000,
      need_approval: true,
      is_agent: true,
      is_supervisor: false,
      ...overrides,
    },
    {
      id: 102,
      first_name: 'Sara',
      last_name: 'Supervisor',
      email: 'sara.supervisor@raf.rs',
      position: 'Supervisor',
      limit: 250000,
      used_limit: 12000,
      need_approval: false,
      is_agent: false,
      is_supervisor: true,
    },
  ];
}
