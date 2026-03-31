import { ORDER_STATUS, USER_ROLE } from './orderModel';

function isExpiredSettlement(settlementDate) {
  if (!settlementDate) return false;
  return new Date(settlementDate).getTime() < Date.now();
}

export function getOrderPermissions(order, actorRole) {
  const expired = isExpiredSettlement(order.settlementDate);

  const isSupervisorLike =
    actorRole === USER_ROLE.SUPERVISOR || actorRole === USER_ROLE.ADMIN;

  const isPending = order.status === ORDER_STATUS.PENDING || order.status === ORDER_STATUS.PARTIALLY_FILLED;
  const isFinal =
    order.status === ORDER_STATUS.APPROVED ||
    order.status === ORDER_STATUS.DECLINED ||
    order.status === ORDER_STATUS.DONE || 
    order.status === ORDER_STATUS.CANCELLED;

  return {
    canView: isSupervisorLike,
    canApprove: isSupervisorLike && isPending && !expired,
    canDecline: isSupervisorLike && isPending,
    canDecide: isSupervisorLike && isPending,
    canCancelWhole: isSupervisorLike && !isFinal && order.remainingPortions > 0,
    canCancelPartial: isSupervisorLike && !isFinal && order.remainingPortions > 0,
    isSettlementExpired: expired,
    isReadOnlyDecision: isFinal,
  };
}