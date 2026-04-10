import {
  BankTransaction,
  InvestorSnapshot,
  MaintenanceRequest,
  PaymentEntity,
  PaymentGatewayAction,
  ReceiptFraudCheck,
  ReminderEvent,
  TenantPortalCard,
} from '../types';
import { db } from './dbService';

const txStoreKey = 'vaultline_transactions_prod_v2';
const maintenanceStoreKey = 'vaultline_maintenance_prod_v2';
const reminderStoreKey = 'vaultline_reminders_prod_v2';

const seedTransactions = (): BankTransaction[] => [];

const seedMaintenance = (): MaintenanceRequest[] => [];

const readLocal = <T,>(key: string, seed: () => T[]): T[] => {
  const raw = localStorage.getItem(key);
  if (!raw) {
    const value = seed();
    localStorage.setItem(key, JSON.stringify(value));
    return value;
  }
  return JSON.parse(raw) as T[];
};

const saveLocal = <T,>(key: string, value: T[]) => localStorage.setItem(key, JSON.stringify(value));

export const featureService = {
  getTransactions(): BankTransaction[] {
    return readLocal(txStoreKey, seedTransactions);
  },

  getMaintenance(): MaintenanceRequest[] {
    return readLocal(maintenanceStoreKey, seedMaintenance);
  },

  getReminders(payments: PaymentEntity[]): ReminderEvent[] {
    const seeded = readLocal(reminderStoreKey, () => {
      const now = new Date();
      return payments.slice(0, 3).map((payment, index) => ({
        id: `RM-${index + 1}`,
        paymentId: payment.id,
        tenantName: payment.tenantName,
        channel: index === 0 ? 'EMAIL' : index === 1 ? 'SMS' : 'WHATSAPP',
        kind: payment.status === 'AT_RISK' ? 'LATE_NOTICE' : 'PRE_DUE',
        scheduledFor: new Date(now.getTime() + (index + 1) * 3600000).toISOString(),
        status: payment.status === 'COLLECTED' ? 'SENT' : 'QUEUED',
      }));
    });
    return seeded;
  },

  async autoMatchTransactions(payments: PaymentEntity[]) {
    const transactions = this.getTransactions();
    const updatedTransactions = [...transactions];
    let matched = 0;

    for (const tx of updatedTransactions) {
      if (tx.status === 'MATCHED') continue;
      const candidate = payments.find(p =>
        p.status !== 'COLLECTED' &&
        (p.tenantName.toLowerCase() === tx.payerName.toLowerCase() || p.amount === tx.amount)
      );
      if (!candidate) continue;

      tx.status = 'MATCHED';
      tx.matchedPaymentId = candidate.id;
      matched += 1;
      await db.updatePayment(candidate.id, {
        status: 'COLLECTED',
        lastActivity: `Matched from transaction ${tx.id}`,
        riskScore: Math.max(candidate.riskScore - 15, 0),
      });
      await db.addAutonomousAction(candidate.id, `Automatic bank reconciliation matched ${tx.amount.toLocaleString()} ETB from ${tx.payerName}.`);
    }

    saveLocal(txStoreKey, updatedTransactions);
    return { matched, transactions: updatedTransactions };
  },

  predictLateProbability(payment: PaymentEntity): number {
    let score = payment.riskScore / 100;
    if (payment.status === 'AT_RISK') score += 0.2;
    if (payment.financialStatus === 'LEVERAGED') score += 0.08;
    if (payment.financialStatus === 'DISTRESSED') score += 0.15;
    const today = new Date().toISOString().split('T')[0];
    if (payment.dueDate < today && payment.status !== 'COLLECTED') score += 0.2;
    return Math.max(0.05, Math.min(0.98, Number(score.toFixed(2))));
  },

  async refreshPredictions(payments: PaymentEntity[]) {
    for (const payment of payments) {
      const probability = this.predictLateProbability(payment);
      const behaviorInsight = probability > 0.75
        ? 'High risk of late settlement; immediate follow-up recommended.'
        : probability > 0.45
          ? 'Moderate lateness risk; reminders should be staged early.'
          : 'Low lateness risk based on current payment pattern.';
      await db.updatePayment(payment.id, {
        predictedLateProbability: probability,
        behaviorInsight,
        reminderStatus: payment.status === 'COLLECTED' ? 'SENT' : probability > 0.65 ? 'ESCALATED' : 'SCHEDULED',
      });
    }
  },

  buildFraudCheck(payment: PaymentEntity, verification?: { verified: boolean; confidence: number; detectedAnomaly?: string }): ReceiptFraudCheck {
    const duplicateReceipt = Boolean(payment.proofUrl);
    const suspiciousAmountMismatch = payment.amount <= 0;
    const duplicateReference = payment.autonomousActions.some(action => action.toLowerCase().includes('transaction'));
    const reasons = [
      duplicateReceipt ? 'Receipt already exists on this payment record.' : '',
      duplicateReference ? 'A similar transaction reference already exists in the action log.' : '',
      suspiciousAmountMismatch ? 'Amount mismatch detected.' : '',
      verification?.detectedAnomaly || '',
    ].filter(Boolean);

    const confidence = verification?.confidence ?? 0.5;
    const recommendation = reasons.length === 0 && verification?.verified
      ? 'APPROVE'
      : reasons.length >= 2 || confidence < 0.5
        ? 'MANUAL_REVIEW'
        : 'REJECT';

    return {
      paymentId: payment.id,
      duplicateReceipt,
      duplicateReference,
      suspiciousAmountMismatch,
      confidence,
      recommendation,
      reasons,
    };
  },

  getAnalytics(payments: PaymentEntity[]) {
    const total = payments.reduce((sum, p) => sum + p.amount, 0);
    const collected = payments.filter(p => p.status === 'COLLECTED').reduce((sum, p) => sum + p.amount, 0);
    const pending = total - collected;
    const avgRisk = payments.length ? payments.reduce((sum, p) => sum + p.riskScore, 0) / payments.length : 0;
    const expiringLeases = payments.filter(p => p.lease?.renewalStatus === 'EXPIRING_SOON').length;
    return {
      total,
      collected,
      pending,
      avgRisk: Number(avgRisk.toFixed(1)),
      expiringLeases,
      lateRate: payments.length ? Number(((payments.filter(p => p.status === 'AT_RISK').length / payments.length) * 100).toFixed(1)) : 0,
    };
  },

  getInvestorSnapshot(payments: PaymentEntity[]): InvestorSnapshot {
    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
    const collectedRevenue = payments.filter(p => p.status === 'COLLECTED').reduce((sum, p) => sum + p.amount, 0);
    const lateExposure = payments.filter(p => p.status !== 'COLLECTED').reduce((sum, p) => sum + p.amount, 0);
    const averageLateRisk = payments.length ? payments.reduce((sum, p) => sum + (p.predictedLateProbability || 0), 0) / payments.length : 0;
    return {
      totalRevenue,
      collectedRevenue,
      lateExposure,
      occupancyRate: Math.max(84, 98 - payments.filter(p => p.status === 'BLOCKED').length * 3),
      projectedAnnualYield: 8.1 + (collectedRevenue / Math.max(totalRevenue, 1)) * 1.4,
      averageLateRisk: Number((averageLateRisk * 100).toFixed(1)),
    };
  },

  getTenantPortal(payments: PaymentEntity[]): TenantPortalCard[] {
    return payments.map(payment => ({
      paymentId: payment.id,
      tenantName: payment.tenantName,
      amountDue: payment.status === 'COLLECTED' ? 0 : payment.amount,
      dueDate: payment.dueDate,
      canPayNow: payment.status !== 'COLLECTED',
      leaseEndsOn: payment.lease?.endDate,
    }));
  },

  async runGatewayAction(payment: PaymentEntity, provider: PaymentGatewayAction['provider']) {
    await db.updatePayment(payment.id, {
      status: 'COLLECTED',
      lastActivity: `${provider} quick-pay success`,
      reminderStatus: 'SENT',
      riskScore: Math.max(payment.riskScore - 10, 0),
    });
    await db.addAutonomousAction(payment.id, `Payment gateway ${provider} processed ${payment.amount.toLocaleString()} ETB.`);
    return {
      paymentId: payment.id,
      provider,
      amount: payment.amount,
      status: 'SUCCESS',
    } as PaymentGatewayAction;
  },
};
