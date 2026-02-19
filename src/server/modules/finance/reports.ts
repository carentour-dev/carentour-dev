import { financeLedgerCoreController } from "./ledger";

export const financeReportsController = {
  async getApAgingReport(asOfDate?: string | null) {
    return financeLedgerCoreController.getApAgingReport(asOfDate);
  },

  async getPayablesDueCalendar(input?: {
    dateFrom?: string | null;
    dateTo?: string | null;
  }) {
    return financeLedgerCoreController.getPayablesDueCalendar(input);
  },

  async getTrialBalanceReport(input?: {
    dateFrom?: string | null;
    dateTo?: string | null;
  }) {
    return financeLedgerCoreController.getTrialBalanceReport(input);
  },

  async getProfitLossReport(input?: {
    dateFrom?: string | null;
    dateTo?: string | null;
  }) {
    return financeLedgerCoreController.getProfitLossReport(input);
  },

  async getBalanceSheetReport(input?: { dateTo?: string | null }) {
    return financeLedgerCoreController.getBalanceSheetReport(input);
  },
};
