import { financeLedgerCoreController, type FinanceActor } from "./ledger";

export { type FinanceActor };

export const financePayablesController = {
  async listCounterparties(input?: {
    kind?: string | null;
    isActive?: string | null;
    search?: string | null;
    sourceType?: string | null;
  }) {
    return financeLedgerCoreController.listCounterparties(input);
  },

  async createCounterparty(payload: unknown, actor?: FinanceActor) {
    return financeLedgerCoreController.createCounterparty(payload, actor);
  },

  async updateCounterparty(
    counterpartyId: unknown,
    payload: unknown,
    actor?: FinanceActor,
  ) {
    return financeLedgerCoreController.updateCounterparty(
      counterpartyId,
      payload,
      actor,
    );
  },

  async deleteCounterparty(counterpartyId: unknown, actor?: FinanceActor) {
    return financeLedgerCoreController.deleteCounterparty(
      counterpartyId,
      actor,
    );
  },

  async getCounterpartySyncHistory(limit?: unknown) {
    return financeLedgerCoreController.getCounterpartySyncHistory(limit);
  },

  async reconcileCounterparties(payload: unknown, actor?: FinanceActor) {
    return financeLedgerCoreController.reconcileCounterparties(payload, actor);
  },

  async listPayables(input?: {
    status?: string | null;
    counterpartyId?: string | null;
  }) {
    return financeLedgerCoreController.listPayables(input);
  },

  async getPayableDetail(payableId: unknown) {
    return financeLedgerCoreController.getPayableDetail(payableId);
  },

  async createPayable(payload: unknown, actor?: FinanceActor) {
    return financeLedgerCoreController.createPayable(payload, actor);
  },

  async updatePayable(
    payableId: unknown,
    payload: unknown,
    actor?: FinanceActor,
  ) {
    return financeLedgerCoreController.updatePayable(payableId, payload, actor);
  },

  async submitPayable(payableId: unknown, actor?: FinanceActor) {
    return financeLedgerCoreController.submitPayable(payableId, actor);
  },

  async cancelPayable(payableId: unknown, actor?: FinanceActor) {
    return financeLedgerCoreController.cancelPayable(payableId, actor);
  },

  async recordPayablePayment(payload: unknown, actor?: FinanceActor) {
    return financeLedgerCoreController.recordPayablePayment(payload, actor);
  },

  async listPayablePayments(payableId?: string | null) {
    return financeLedgerCoreController.listPayablePayments(payableId);
  },

  async listApprovalRequests(input?: {
    status?: string | null;
    entityType?: string | null;
  }) {
    return financeLedgerCoreController.listApprovalRequests(input);
  },

  async decideApprovalRequest(
    approvalRequestId: unknown,
    payload: unknown,
    actor?: FinanceActor,
  ) {
    return financeLedgerCoreController.decideApprovalRequest(
      approvalRequestId,
      payload,
      actor,
    );
  },

  async getFinanceSettings() {
    return financeLedgerCoreController.getFinanceSettings();
  },

  async updateFinanceSettings(payload: unknown, actor?: FinanceActor) {
    return financeLedgerCoreController.updateFinanceSettings(payload, actor);
  },

  async listChartAccounts() {
    return financeLedgerCoreController.listChartAccounts();
  },

  async createChartAccount(payload: unknown, actor?: FinanceActor) {
    return financeLedgerCoreController.createChartAccount(payload, actor);
  },

  async updateChartAccount(
    accountId: unknown,
    payload: unknown,
    actor?: FinanceActor,
  ) {
    return financeLedgerCoreController.updateChartAccount(
      accountId,
      payload,
      actor,
    );
  },
};
