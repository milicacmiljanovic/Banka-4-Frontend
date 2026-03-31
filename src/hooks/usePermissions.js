import { useAuthStore } from '../store/authStore';

export function usePermissions() {
  const user = useAuthStore(s => s.user);
  const permissions = user?.permissions ?? [];

  const isSuperAdmin = permissions.includes('*') || 
                       permissions.includes('admin') || 
                       permissions.includes('employee.create') || 
                       permissions.includes('employee.update') || 
                       permissions.includes('employee.delete');

  const isSupervisor = Boolean(
    user?.is_admin === true ||
    permissions.includes('supervisor') ||
    permissions.includes('orders.supervisor')
  );

  function can(permission) {
    if (isSuperAdmin) return true;
    return permissions.includes(permission);
  }

  function canAny(...perms) {
    if (isSuperAdmin) return true;
    return perms.some(p => permissions.includes(p));
  }

  return { can, canAny, isSupervisor };
}
