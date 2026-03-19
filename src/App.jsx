import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore }    from './store/authStore';
import { useLayoutEffect } from 'react';

// Auth pages
import UnifiedLogin      from './pages/auth/UnifiedLogin';
import ResetPassword     from './pages/auth/ResetPassword';
import AccountActivation from './pages/auth/AccountActivation';

// Admin pages
import Dashboard      from './pages/admin/Dashboard';
import EmployeeList   from './pages/admin/EmployeeList';
import NewEmployee    from './pages/admin/NewEmployee';
import EmployeeDetails from './pages/admin/EmployeeDetails';
import ClientList     from './pages/admin/ClientList';
import Loans          from './pages/admin/Loans';
import PaymentOverview from './pages/admin/PaymentOverview';
import Accounts       from './pages/admin/Accounts';
import CardsPage      from './pages/admin/CardsPage';

// Client pages
import ClientDashboard  from './pages/client/ClientDashboard';
import ClientAccounts   from './pages/client/ClientAccounts';
import ClientCards      from './pages/client/ClientCards';
import ClientExchange   from './pages/client/ClientExchange';
import ClientLoans      from './pages/client/ClientLoans';
import ClientRecipients from './pages/client/ClientRecipients';
import ClientTransfers  from './pages/client/ClientTransfers';
import NewPayment       from './pages/client/NewPayment';

// Shared
import NotFound from './pages/NotFound';

import CreateTransfer   from './features/transfers/CreateTransfer';
import ConfirmTransfer  from './features/transfers/ConfirmTransfer';
import TransfersHistory from './features/transfers/TransfersHistory';

import RatesList        from './features/exchange/RatesList.jsx';
import CurrencyCalculator from './features/exchange/CurrencyCalculator.jsx';


function ProtectedRoute({ children }) {
  const token = useAuthStore(s => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function PermissionRoute({ permission, children }) {
  const permissions = useAuthStore(s => s.user?.permissions ?? []);
  if (!permissions.includes(permission)) return <Navigate to="/dashboard" replace />;
  return children;
}

function ClientRoute({ children }) {
  const identityType = useAuthStore(s => s.user?.identity_type);
  if (identityType?.toUpperCase() !== 'CLIENT') return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const token = useAuthStore(s => s.token);
  const user = useAuthStore(s => s.user);
  
  // Inicijalizuj auth iz localStorage PRE prvog rendera
  useLayoutEffect(() => {
    useAuthStore.getState().initFromStorage();
  }, []);
  
  // Odluči gde da redirektuje na osnovu role
  const getDefaultRoute = () => {
    if (!token) return '/login';
    if (!user)  return '/login';
    if (user.role === 'client')   return '/dashboard';
    if (user.role === 'employee') return '/admin';
    if (user.employee_id)         return '/admin';
    if (user.id && !user.employee_id) return '/dashboard';
    return '/login';
  };
  
  return (
    <BrowserRouter>
      <Routes>

        {/* ROOT - Pametni redirect na osnovu role */}
        <Route path="/" element={<Navigate to={getDefaultRoute()} replace />} />

        {/* UNIFIED LOGIN */}
        <Route path="/login"            element={<UnifiedLogin />} />

        <Route path="/reset-password"   element={<ResetPassword />} />
        <Route path="/activate"         element={<AccountActivation />} />

        {/* KLIJENTSKE RUTE */}
        <Route path="/dashboard" element={
          <ProtectedRoute><ClientDashboard /></ProtectedRoute>
        } />
        <Route path="/client/accounts"  element={<ProtectedRoute><ClientAccounts  /></ProtectedRoute>} />
        <Route path="/client/payments"  element={<ProtectedRoute><PaymentOverview /></ProtectedRoute>} />
        <Route path="/client/transfers" element={<ProtectedRoute><ClientTransfers /></ProtectedRoute>} />
        <Route path="/client/exchange"  element={<ProtectedRoute><ClientExchange  /></ProtectedRoute>} />
        <Route path="/client/cards"     element={<ProtectedRoute><ClientCards     /></ProtectedRoute>} />
        <Route path="/client/loans"         element={<ProtectedRoute><ClientLoans     /></ProtectedRoute>} />
        <Route path="/client/payments/new" element={<ProtectedRoute><NewPayment      /></ProtectedRoute>} />
        <Route path="/client/recipients"  element={<ProtectedRoute><ClientRecipients  /></ProtectedRoute>} />

        {/* ADMIN/EMPLOYEE RUTE */}
        <Route path="/admin" element={
          <ProtectedRoute><Dashboard /></ProtectedRoute>
        } />
        <Route path="/clients" element={
          <ProtectedRoute><ClientList /></ProtectedRoute>
        } />
        <Route path="/employees" element={
          <ProtectedRoute><PermissionRoute permission="employee.view"><EmployeeList /></PermissionRoute></ProtectedRoute>
        } />
        <Route path="/employees/new" element={
          <ProtectedRoute><PermissionRoute permission="employee.create"><NewEmployee /></PermissionRoute></ProtectedRoute>
        } />
        <Route path="/employees/:id" element={
          <ProtectedRoute><PermissionRoute permission="employee.view"><EmployeeDetails /></PermissionRoute></ProtectedRoute>
        } />
        <Route path="/loans" element={
          <ProtectedRoute><Loans /></ProtectedRoute>
        } />
        <Route path="/payments" element={
          <ProtectedRoute><PaymentOverview /></ProtectedRoute>
        } />

        <Route path="/cards" element={
          <ProtectedRoute><CardsPage/></ProtectedRoute>
        } />

        <Route path="/accounts" element={
          <ProtectedRoute><ClientRoute><Accounts /></ClientRoute></ProtectedRoute>
        } />


        <Route path="/exchange/rates" element={<RatesList />} />
        <Route path="/exchange/calculator" element={<CurrencyCalculator />} />


          <Route path="/transfers/new" element={<ProtectedRoute><CreateTransfer /></ProtectedRoute>} />
          <Route path="/transfers/confirm" element={<ProtectedRoute><ConfirmTransfer /></ProtectedRoute>} />
          <Route path="/transfers/history" element={<ProtectedRoute><TransfersHistory /></ProtectedRoute>} />

        <Route path="*" element={<NotFound />} />



      </Routes>
    </BrowserRouter>
  );
}
