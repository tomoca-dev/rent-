import React, { useMemo, useState } from 'react';
import {
  Bell,
  Building2,
  CreditCard,
  Home,
  Landmark,
  LineChart,
  Receipt,
  ShieldAlert,
  Sparkles,
  Wrench,
} from 'lucide-react';
import { featureService } from '../services/featureService';
import { PaymentEntity } from '../types';

interface FeatureHubProps {
  payments: PaymentEntity[];
  onRefresh: () => Promise<void>;
}

type OpsTab =
  | 'reconciliation'
  | 'prediction'
  | 'reminders'
  | 'fraud'
  | 'tenant'
  | 'analytics'
  | 'behavior'
  | 'lease'
  | 'maintenance'
  | 'investor'
  | 'portal'
  | 'gateway';

const tabs: { id: OpsTab; label: string; icon: React.ReactNode }[] = [
  { id: 'reconciliation', label: 'Bank Reconciliation', icon: <Landmark className="w-4 h-4" /> },
  { id: 'prediction', label: 'Late Prediction', icon: <Sparkles className="w-4 h-4" /> },
  { id: 'reminders', label: 'Reminders', icon: <Bell className="w-4 h-4" /> },
  { id: 'fraud', label: 'Receipt Fraud', icon: <ShieldAlert className="w-4 h-4" /> },
  { id: 'tenant', label: 'Tenant + Property', icon: <Building2 className="w-4 h-4" /> },
  { id: 'analytics', label: 'Analytics', icon: <LineChart className="w-4 h-4" /> },
  { id: 'behavior', label: 'Behavior AI', icon: <Sparkles className="w-4 h-4" /> },
  { id: 'lease', label: 'Lease', icon: <Receipt className="w-4 h-4" /> },
  { id: 'maintenance', label: 'Maintenance', icon: <Wrench className="w-4 h-4" /> },
  { id: 'investor', label: 'Investor View', icon: <Home className="w-4 h-4" /> },
  { id: 'portal', label: 'Tenant Portal', icon: <Building2 className="w-4 h-4" /> },
  { id: 'gateway', label: 'Payment Gateway', icon: <CreditCard className="w-4 h-4" /> },
];

const money = (v: number) => `${v.toLocaleString()} ETB`;

const EmptyState: React.FC<{ title: string; body: string }> = ({ title, body }) => (
  <div className="p-8 border premium-border glass text-center space-y-3">
    <div className="text-sm uppercase tracking-[0.3em] theme-muted">{title}</div>
    <p className="text-sm theme-muted max-w-2xl mx-auto">{body}</p>
  </div>
);

const FeatureHub: React.FC<FeatureHubProps> = ({ payments, onRefresh }) => {
  const [tab, setTab] = useState<OpsTab>('reconciliation');
  const [message, setMessage] = useState<string>('');

  const transactions = useMemo(() => featureService.getTransactions(), [payments]);
  const reminders = useMemo(() => featureService.getReminders(payments), [payments]);
  const maintenance = useMemo(() => featureService.getMaintenance(), [payments]);
  const analytics = useMemo(() => featureService.getAnalytics(payments), [payments]);
  const investor = useMemo(() => featureService.getInvestorSnapshot(payments), [payments]);
  const portal = useMemo(() => featureService.getTenantPortal(payments), [payments]);

  const refreshPredictions = async () => {
    await featureService.refreshPredictions(payments);
    setMessage('Late-payment prediction model refreshed for the current portfolio.');
    await onRefresh();
  };

  const runMatching = async () => {
    const result = await featureService.autoMatchTransactions(payments);
    setMessage(`Automatic bank reconciliation matched ${result.matched} payment(s).`);
    await onRefresh();
  };

  const runQuickPay = async (payment: PaymentEntity) => {
    await featureService.runGatewayAction(payment, 'BANK_TRANSFER');
    setMessage(`Quick-pay completed for ${payment.tenantName}.`);
    await onRefresh();
  };

  const renderTabContent = () => {
    switch (tab) {
      case 'reconciliation':
        return transactions.length === 0 ? (
          <EmptyState
            title="1. Automatic payment detection"
            body="No bank transactions are loaded yet. Connect a bank feed or import transactions to start reconciliation."
          />
        ) : (
          <section className="p-8 border premium-border glass space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm uppercase tracking-[0.3em] theme-muted">1. Automatic payment detection</h3>
                <p className="theme-text mt-2">Matches transaction feeds to unpaid tenant records.</p>
              </div>
              <button onClick={runMatching} className="px-5 py-3 bg-[var(--text)] text-[var(--bg)] text-[10px] uppercase tracking-[0.3em] font-bold">Run Auto Match</button>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {transactions.map(tx => (
                <div key={tx.id} className="p-4 border premium-border surface-bg">
                  <div className="flex justify-between mb-2 text-[10px] uppercase tracking-widest theme-muted"><span>{tx.id}</span><span>{tx.status}</span></div>
                  <div className="theme-text text-sm">{tx.payerName}</div>
                  <div className="theme-muted text-xs mt-2">{money(tx.amount)} · {tx.reference}</div>
                </div>
              ))}
            </div>
          </section>
        );

      case 'prediction':
        return payments.length === 0 ? (
          <EmptyState
            title="2. Smart late-payment prediction"
            body="No live payments are available yet. Add rental records to generate late-payment forecasts."
          />
        ) : (
          <section className="p-8 border premium-border glass space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm uppercase tracking-[0.3em] theme-muted">2. Smart late-payment prediction</h3>
                <p className="theme-text mt-2">Scores each tenant for late-payment risk.</p>
              </div>
              <button onClick={refreshPredictions} className="px-5 py-3 border premium-border text-[10px] uppercase tracking-[0.3em]">Refresh Forecast</button>
            </div>
            <div className="space-y-3">
              {payments.map(payment => (
                <div key={payment.id} className="p-4 border premium-border surface-bg flex justify-between items-center gap-4">
                  <div>
                    <div className="theme-text text-sm">{payment.tenantName}</div>
                    <div className="theme-muted text-xs mt-1">{payment.behaviorInsight || 'No model note yet.'}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg gold-accent mono">{Math.round((payment.predictedLateProbability || 0) * 100)}%</div>
                    <div className="text-[10px] uppercase tracking-widest theme-muted">Late probability</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );

      case 'reminders':
        return reminders.length === 0 ? (
          <EmptyState title="3. Automatic reminders" body="No reminder queue exists yet. Reminders will appear after live payments are created and scheduling is enabled." />
        ) : (
          <section className="p-8 border premium-border glass space-y-4">
            <h3 className="text-sm uppercase tracking-[0.3em] theme-muted">3. Automatic reminders</h3>
            {reminders.map(reminder => (
              <div key={reminder.id} className="p-4 border premium-border surface-bg flex justify-between items-center">
                <div>
                  <div className="theme-text text-sm">{reminder.tenantName}</div>
                  <div className="theme-muted text-xs mt-1">{reminder.kind} via {reminder.channel}</div>
                </div>
                <div className="text-right text-xs theme-muted">{new Date(reminder.scheduledFor).toLocaleString()} · {reminder.status}</div>
              </div>
            ))}
          </section>
        );

      case 'fraud':
        return payments.length === 0 ? (
          <EmptyState title="4. Receipt fraud detection" body="No payment records are available yet to review uploaded receipts." />
        ) : (
          <section className="p-8 border premium-border glass space-y-4">
            <h3 className="text-sm uppercase tracking-[0.3em] theme-muted">4. Receipt fraud detection</h3>
            {payments.map(payment => {
              const fraud = featureService.buildFraudCheck(payment);
              return (
                <div key={payment.id} className="p-4 border premium-border surface-bg">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="theme-text text-sm">{payment.tenantName}</div>
                      <div className="theme-muted text-xs mt-1">Recommendation: {fraud.recommendation}</div>
                    </div>
                    <div className="text-sm mono gold-accent">{Math.round(fraud.confidence * 100)}%</div>
                  </div>
                  <div className="mt-3 text-xs theme-muted">{fraud.reasons.length ? fraud.reasons.join(' · ') : 'No duplicate or mismatch flags detected.'}</div>
                </div>
              );
            })}
          </section>
        );

      case 'tenant':
        return payments.length === 0 ? (
          <EmptyState title="5. Tenant + property management" body="No tenant, property, or lease records are loaded yet." />
        ) : (
          <section className="p-8 border premium-border glass space-y-4">
            <h3 className="text-sm uppercase tracking-[0.3em] theme-muted">5. Tenant and property management</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {payments.map(payment => (
                <div key={payment.id} className="p-5 border premium-border surface-bg">
                  <div className="theme-text text-sm">{payment.tenantName}</div>
                  <div className="theme-muted text-xs mt-2">{payment.property?.propertyName} · {payment.unit} · {payment.tenant?.unitType}</div>
                  <div className="theme-muted text-xs mt-1">Contact: {payment.tenant?.email || 'N/A'} · Score: {payment.tenant?.reputationScore ?? 'N/A'}</div>
                </div>
              ))}
            </div>
          </section>
        );

      case 'analytics':
        return payments.length === 0 ? (
          <EmptyState title="6. Financial analytics" body="Analytics will appear after live leases and payments are available." />
        ) : (
          <section className="p-8 border premium-border glass grid md:grid-cols-5 gap-4">
            <div className="p-5 surface-bg border premium-border"><div className="text-[10px] uppercase tracking-widest theme-muted">Expected</div><div className="text-xl theme-text mt-2 mono">{money(analytics.total)}</div></div>
            <div className="p-5 surface-bg border premium-border"><div className="text-[10px] uppercase tracking-widest theme-muted">Collected</div><div className="text-xl theme-text mt-2 mono">{money(analytics.collected)}</div></div>
            <div className="p-5 surface-bg border premium-border"><div className="text-[10px] uppercase tracking-widest theme-muted">Pending</div><div className="text-xl gold-accent mt-2 mono">{money(analytics.pending)}</div></div>
            <div className="p-5 surface-bg border premium-border"><div className="text-[10px] uppercase tracking-widest theme-muted">Late Rate</div><div className="text-xl theme-text mt-2 mono">{analytics.lateRate}%</div></div>
            <div className="p-5 surface-bg border premium-border"><div className="text-[10px] uppercase tracking-widest theme-muted">Expiring Leases</div><div className="text-xl theme-text mt-2 mono">{analytics.expiringLeases}</div></div>
          </section>
        );

      case 'behavior':
        return payments.length === 0 ? (
          <EmptyState title="7. Tenant behavior insights" body="Behavior insights will populate after live payment history is available." />
        ) : (
          <section className="p-8 border premium-border glass space-y-4">
            <h3 className="text-sm uppercase tracking-[0.3em] theme-muted">7. AI tenant behavior insights</h3>
            {payments.map(payment => (
              <div key={payment.id} className="p-4 border premium-border surface-bg">
                <div className="theme-text text-sm">{payment.tenantName}</div>
                <div className="theme-muted text-xs mt-2">{payment.behaviorInsight || payment.tenant?.behaviorTag || 'No pattern yet.'}</div>
              </div>
            ))}
          </section>
        );

      case 'lease':
        return payments.length === 0 ? (
          <EmptyState title="8. Lease management" body="No leases are loaded yet. Add rental records to populate lease controls." />
        ) : (
          <section className="p-8 border premium-border glass space-y-4">
            <h3 className="text-sm uppercase tracking-[0.3em] theme-muted">8. Lease management</h3>
            {payments.map(payment => (
              <div key={payment.id} className="p-4 border premium-border surface-bg flex justify-between items-center">
                <div>
                  <div className="theme-text text-sm">{payment.tenantName}</div>
                  <div className="theme-muted text-xs mt-1">{payment.lease?.startDate} → {payment.lease?.endDate}</div>
                </div>
                <div className="text-right text-xs">
                  <div className="theme-text">{payment.lease?.renewalStatus}</div>
                  <div className="theme-muted mt-1">Deposit {money(payment.lease?.depositAmount || 0)}</div>
                </div>
              </div>
            ))}
          </section>
        );

      case 'maintenance':
        return maintenance.length === 0 ? (
          <EmptyState title="9. Maintenance requests" body="No maintenance requests are stored yet." />
        ) : (
          <section className="p-8 border premium-border glass space-y-4">
            <h3 className="text-sm uppercase tracking-[0.3em] theme-muted">9. Maintenance requests</h3>
            {maintenance.map(request => (
              <div key={request.id} className="p-4 border premium-border surface-bg flex justify-between items-center">
                <div>
                  <div className="theme-text text-sm">{request.title}</div>
                  <div className="theme-muted text-xs mt-1">{request.propertyName} · {request.unit} · {request.tenantName}</div>
                </div>
                <div className="text-right text-xs theme-muted">{request.category} · {request.priority} · {request.status}</div>
              </div>
            ))}
          </section>
        );

      case 'investor':
        return payments.length === 0 ? (
          <EmptyState title="10. Investor portfolio view" body="Investor metrics will appear after revenue-generating properties and payments are loaded." />
        ) : (
          <section className="p-8 border premium-border glass grid md:grid-cols-5 gap-4">
            <div className="p-5 surface-bg border premium-border"><div className="text-[10px] uppercase tracking-widest theme-muted">Revenue</div><div className="text-xl theme-text mt-2 mono">{money(investor.totalRevenue)}</div></div>
            <div className="p-5 surface-bg border premium-border"><div className="text-[10px] uppercase tracking-widest theme-muted">Collected</div><div className="text-xl theme-text mt-2 mono">{money(investor.collectedRevenue)}</div></div>
            <div className="p-5 surface-bg border premium-border"><div className="text-[10px] uppercase tracking-widest theme-muted">Late Exposure</div><div className="text-xl gold-accent mt-2 mono">{money(investor.lateExposure)}</div></div>
            <div className="p-5 surface-bg border premium-border"><div className="text-[10px] uppercase tracking-widest theme-muted">Occupancy</div><div className="text-xl theme-text mt-2 mono">{investor.occupancyRate}%</div></div>
            <div className="p-5 surface-bg border premium-border"><div className="text-[10px] uppercase tracking-widest theme-muted">Yield</div><div className="text-xl theme-text mt-2 mono">{investor.projectedAnnualYield.toFixed(1)}%</div></div>
          </section>
        );

      case 'portal':
        return portal.length === 0 ? (
          <EmptyState title="11. Mobile tenant portal" body="No tenant portal records are available yet." />
        ) : (
          <section className="p-8 border premium-border glass space-y-4">
            <h3 className="text-sm uppercase tracking-[0.3em] theme-muted">11. Mobile tenant portal</h3>
            {portal.map(card => (
              <div key={card.paymentId} className="p-4 border premium-border surface-bg flex justify-between items-center">
                <div>
                  <div className="theme-text text-sm">{card.tenantName}</div>
                  <div className="theme-muted text-xs mt-1">Due {card.dueDate} · Lease ends {card.leaseEndsOn || 'N/A'}</div>
                </div>
                <div className="text-right">
                  <div className="theme-text text-sm mono">{money(card.amountDue)}</div>
                  <div className="theme-muted text-xs mt-1">{card.canPayNow ? 'Pay Now enabled' : 'Settled'}</div>
                </div>
              </div>
            ))}
          </section>
        );

      case 'gateway': {
        const outstanding = payments.filter(p => p.status !== 'COLLECTED');
        return outstanding.length === 0 ? (
          <EmptyState title="12. Payment gateway integration" body="There are no outstanding payments to process right now." />
        ) : (
          <section className="p-8 border premium-border glass space-y-4">
            <h3 className="text-sm uppercase tracking-[0.3em] theme-muted">12. Payment gateway integration</h3>
            {outstanding.map(payment => (
              <div key={payment.id} className="p-4 border premium-border surface-bg flex justify-between items-center gap-4">
                <div>
                  <div className="theme-text text-sm">{payment.tenantName}</div>
                  <div className="theme-muted text-xs mt-1">Outstanding {money(payment.amount)}</div>
                </div>
                <button onClick={() => runQuickPay(payment)} className="px-4 py-3 bg-[var(--text)] text-[var(--bg)] text-[10px] uppercase tracking-[0.3em] font-bold">Quick Pay</button>
              </div>
            ))}
          </section>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-700 space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-[10px] tracking-[0.4em] uppercase theme-muted mb-2">Operations Hub</div>
          <h2 className="text-3xl font-light theme-text tracking-tight">Integrated Property Intelligence Suite</h2>
          <p className="text-xs theme-muted uppercase tracking-[0.2em] mt-2">12 operational systems integrated into one workspace</p>
        </div>
        {message && <div className="px-4 py-3 border premium-border surface-bg text-[10px] uppercase tracking-[0.2em] theme-muted max-w-xl">{message}</div>}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3">
        {tabs.map(item => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={`p-4 border text-left transition-all ${tab === item.id ? 'border-[var(--accent)] gold-accent surface-bg' : 'premium-border theme-muted hover:theme-text hover:surface-bg'}`}
          >
            <div className="flex items-center gap-2 mb-2">{item.icon}<span className="text-[10px] uppercase tracking-[0.2em]">{item.label}</span></div>
          </button>
        ))}
      </div>

      {renderTabContent()}
    </div>
  );
};

export default FeatureHub;
