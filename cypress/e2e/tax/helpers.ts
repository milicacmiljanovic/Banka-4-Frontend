export type TestUser = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  identity_type: 'employee' | 'client';
  is_admin?: boolean;
  permissions: string[];
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

export const clientUser: TestUser = {
  id: 2001,
  first_name: 'Marko',
  last_name: 'Klijent',
  email: 'marko@klijent.rs',
  identity_type: 'client',
  is_admin: false,
  permissions: [],
};

export function tradingApiUrl(): string {
  return (Cypress.env('TRADING_API_URL') as string) ?? 'http://localhost:8082/api';
}

export function loginAs(user: TestUser, targetPath: string): void {
  cy.visit(targetPath, {
    onBeforeLoad(win) {
      win.localStorage.setItem('token', 'test-token');
      win.localStorage.setItem('refreshToken', 'test-refresh-token');
      win.localStorage.setItem('user', JSON.stringify(user));
    },
  });
}

export type TaxUserRow = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  userType: 'client' | 'actuary';
  taxOwedRsd: number;
};

export function buildTaxUsers(): TaxUserRow[] {
  return [
    {
      id: 1,
      firstName: 'Ana',
      lastName: 'Anić',
      email: 'ana.anic@example.com',
      userType: 'client',
      taxOwedRsd: 300,
    },
    {
      id: 2,
      firstName: 'Milan',
      lastName: 'Milić',
      email: 'milan.milic@raf.rs',
      userType: 'actuary',
      taxOwedRsd: 0,
    },
    {
      id: 3,
      firstName: 'Jovana',
      lastName: 'Jović',
      email: 'jovana.jovic@example.com',
      userType: 'client',
      taxOwedRsd: 150,
    },
  ];
}
