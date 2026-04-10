import React, { useMemo } from 'react';
import { Building2, Home, Wallet, AlertTriangle, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { PaymentEntity } from '../types';

interface PortfolioOverviewProps {
  payments: PaymentEntity[];
  onAddRental: () => void;
}

type PropertyBucket = {
  propertyName: string;
  city: string;
  neighborhood: string;
  units: Set<string>;
  totalInbound: number;
  totalOutbound: number;
  collected: number;
  pending: number;
  atRisk: number;
  payableCount: number;
  receivableCount: number;
};

const flowOf = (p: PaymentEntity) => p.cashFlowType === 'PAYABLE' ? 'PAYABLE' : 'RECEIVABLE';

const PortfolioOverview: React.FC<PortfolioOverviewProps> = ({ payments, onAddRental }) => {
  const propertyBuckets = useMemo(() => {
    const buckets = new globalThis.Map<string, PropertyBucket>();

    for (const payment of payments ?? []) {
      const propertyName = payment.property?.propertyName?.trim() || payment.tenant?.building?.trim() || 'Unassigned Property';
      const key = propertyName;
      const existing = buckets.get(key) ?? {
        propertyName,
        city: payment.property?.city ?? '',
        neighborhood: payment.property?.neighborhood ?? '',
        units: new Set<string>(),
        totalInbound: 0,
        totalOutbound: 0,
        collected: 0,
        pending: 0,
        atRisk: 0,
        payableCount: 0,
        receivableCount: 0,
      };

      if (payment.unit) existing.units.add(payment.unit);
      if (flowOf(payment) === 'PAYABLE') {
        existing.totalOutbound += Number(payment.amount ?? 0);
        existing.payableCount += 1;
      } else {
        existing.totalInbound += Number(payment.amount ?? 0);
        existing.receivableCount += 1;
      }

      if (payment.status === 'AT_RISK' || payment.status === 'BLOCKED') existing.atRisk += 1;
      else if (payment.status === 'COLLECTED') existing.collected += 1;
      else existing.pending += 1;

      buckets.set(key, existing);
    }

    return Array.from(buckets.values()).sort((a, b) => a.propertyName.localeCompare(b.propertyName));
  }, [payments]);

  const summary = useMemo(() => {
    const uniqueProperties = new Set(propertyBuckets.map((bucket) => bucket.propertyName)).size;
    const uniqueUnits = new Set(payments.map((payment) => payment.unit).filter(Boolean)).size;
    const inbound = payments.filter((p) => flowOf(p) === 'RECEIVABLE').reduce((sum, p) => sum + Number(p.amount ?? 0), 0);
    const outbound = payments.filter((p) => flowOf(p) === 'PAYABLE').reduce((sum, p) => sum + Number(p.amount ?? 0), 0);
    const atRiskCount = payments.filter((payment) => payment.status === 'AT_RISK' || payment.status === 'BLOCKED').length;
    return { uniqueProperties, uniqueUnits, inbound, outbound, atRiskCount };
  }, [payments, propertyBuckets]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-2">
          <h2 className="text-[10px] tracking-[0.4em] uppercase theme-muted">Ownership overview</h2>
          <p className="text-sm theme-text">Portfolio visibility across properties Tomoca rents out and properties Tomoca rents from others.</p>
        </div>
        <button onClick={onAddRental} className="px-5 py-3 border premium-border surface-bg gold-accent hover:bg-[var(--accent)] hover:text-[var(--bg)] transition-all text-[10px] uppercase tracking-[0.25em]">Add rental entry</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="glass border premium-border rounded-2xl p-5 space-y-3"><Building2 className="w-5 h-5 gold-accent" /><div className="text-[10px] uppercase tracking-[0.25em] theme-muted">Properties</div><div className="text-2xl theme-text">{summary.uniqueProperties}</div></div>
        <div className="glass border premium-border rounded-2xl p-5 space-y-3"><Home className="w-5 h-5 gold-accent" /><div className="text-[10px] uppercase tracking-[0.25em] theme-muted">Units</div><div className="text-2xl theme-text">{summary.uniqueUnits}</div></div>
        <div className="glass border premium-border rounded-2xl p-5 space-y-3"><ArrowDownCircle className="w-5 h-5 text-emerald-400" /><div className="text-[10px] uppercase tracking-[0.25em] theme-muted">Inbound rent</div><div className="text-2xl theme-text">{summary.inbound.toLocaleString()}</div></div>
        <div className="glass border premium-border rounded-2xl p-5 space-y-3"><ArrowUpCircle className="w-5 h-5 text-red-400" /><div className="text-[10px] uppercase tracking-[0.25em] theme-muted">Outbound rent</div><div className="text-2xl theme-text">{summary.outbound.toLocaleString()}</div></div>
        <div className="glass border premium-border rounded-2xl p-5 space-y-3"><AlertTriangle className="w-5 h-5 text-amber-400" /><div className="text-[10px] uppercase tracking-[0.25em] theme-muted">At-risk entities</div><div className="text-2xl theme-text">{summary.atRiskCount}</div></div>
      </div>

      {propertyBuckets.length === 0 ? (
        <div className="glass border premium-border rounded-2xl p-10 text-center space-y-3">
          <div className="text-[10px] uppercase tracking-[0.35em] theme-muted">No ownership data yet</div>
          <p className="theme-text text-sm">Add your first rental entry to populate the portfolio view.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {propertyBuckets.map((bucket) => (
            <div key={bucket.propertyName} className="glass border premium-border rounded-2xl p-6 space-y-4">
              <div className="space-y-1"><h3 className="theme-text text-lg">{bucket.propertyName}</h3><p className="theme-muted text-xs uppercase tracking-[0.2em]">{[bucket.city, bucket.neighborhood].filter(Boolean).join(' · ') || 'Location pending'}</p></div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="surface-bg rounded-xl p-3 border premium-border"><div className="theme-muted text-[9px] uppercase tracking-[0.2em]">Units</div><div className="theme-text text-lg">{bucket.units.size}</div></div>
                <div className="surface-bg rounded-xl p-3 border premium-border"><div className="theme-muted text-[9px] uppercase tracking-[0.2em]">Receivable</div><div className="theme-text text-lg">{bucket.receivableCount}</div></div>
                <div className="surface-bg rounded-xl p-3 border premium-border"><div className="theme-muted text-[9px] uppercase tracking-[0.2em]">Payable</div><div className="theme-text text-lg">{bucket.payableCount}</div></div>
                <div className="surface-bg rounded-xl p-3 border premium-border"><div className="theme-muted text-[9px] uppercase tracking-[0.2em]">Collected</div><div className="theme-text text-lg">{bucket.collected}</div></div>
                <div className="surface-bg rounded-xl p-3 border premium-border"><div className="theme-muted text-[9px] uppercase tracking-[0.2em]">Pending</div><div className="theme-text text-lg">{bucket.pending}</div></div>
                <div className="surface-bg rounded-xl p-3 border premium-border"><div className="theme-muted text-[9px] uppercase tracking-[0.2em]">At risk</div><div className="theme-text text-lg">{bucket.atRisk}</div></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs uppercase tracking-[0.2em]">
                <div className="theme-muted">Inbound tracked: <span className="theme-text">{bucket.totalInbound.toLocaleString()}</span></div>
                <div className="theme-muted">Outbound tracked: <span className="theme-text">{bucket.totalOutbound.toLocaleString()}</span></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PortfolioOverview;
