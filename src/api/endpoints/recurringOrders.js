import { tradingApi as api } from '../client';

export const recurringOrdersApi = {
    getRecurringOrders() {
        return api.get('/recurring-orders');
    },

    createRecurringOrder(payload) {
        return api.post('/recurring-orders', payload);
    },

    deleteRecurringOrder(id) {
        return api.delete(`/recurring-orders/${id}`);
    },

    togglePauseRecurringOrder(id) {
        return api.patch(`/recurring-orders/${id}/pause`);
    },
};
