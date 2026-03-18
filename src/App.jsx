import ClientList        from './pages/ClientList';
import ClientRecipients  from './pages/ClientRecipients';
import ClientAccounts  from './pages/ClientAccounts';
import ClientTransfers from './pages/ClientTransfers';
import ClientExchange  from './pages/ClientExchange';
import ClientCards     from './pages/ClientCards';
import ClientLoans     from './pages/ClientLoans';
import ClientDashboard  from './pages/ClientDashboard';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore }    from './store/authStore';
import { useLayoutEffect } from 'react';
import UnifiedLogin        from './pages/UnifiedLogin';
import ResetPassword       from './pages/ResetPassword';
import AccountActivation   from './pages/AccountActivation';
import Dashboard           from './pages/Dashboard';
import EmployeeList        from './pages/EmployeeList';
import NewEmployee         from './pages/NewEmployee';
import EmployeeDetails     from './pages/EmployeeDetails';
import Accounts            from './pages/Accounts';
import NotFound            from './pages/NotFound';

import CreateTransfer from './features/transfers/CreateTransfer';
import ConfirmTransfer from './features/transfers/ConfirmTransfer';
import TransfersHistory from './features/transfers/TransfersHistory';

import Loans from './pages/Loans';
import NewPayment from './pages/NewPayment';

import PaymentOverview from './pages/PaymentOverview';


import CardsPage           from './pages/CardsPage';

import RatesList from "./features/exchange/RatesList.jsx";
import CurrencyCalculator from "./features/exchange/CurrencyCalculator.jsx";


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
