import React from 'react';
import { PaymentEntity } from '../types';

interface MetricGridProps {
  payments: PaymentEntity[];
}

const MetricCard: React.FC<{ label: string; value: string; subValue?: string; unit?: string; color?: string }> = ({ label, value, subValue, unit = 'ETB', color }) => (
  <div className="flex flex-col p-8 rounded-sm border premium-border glass group transition-all duration-500 hover:border-[var(--accent)]/30">
    <span className="text-[9px] tracking-[0.3em] theme-muted uppercase mb-8 font-semibold">{label}</span>
    <div className="flex items-baseline gap-3 mb-2">
      <span className={`text-3xl mono font-light tracking-tight ${color || 'theme-text'}`}>{value}</span>
      <span className="text-[10px] theme-muted mono font-bold">{unit}</span>
    </div>
    {subValue && (
      <div className="mt-auto pt-6 flex flex-col gap-1">
        <div className="w-full h-[1px] surface-bg group-hover:bg-[var(--surface-hover)] transition-colors"></div>
        <span className="text-[9px] theme-muted tracking-widest uppercase font-medium group-hover:theme-text transition-colors">{subValue}</span>
      </div>
    )}
  </div>
);

const flowOf = (p: PaymentEntity) => p.cashFlowType === 'PAYABLE' ? 'PAYABLE' : 'RECEIVABLE';

const MetricGrid: React.FC<MetricGridProps> = ({ payments }) => {
  const stats = React.useMemo(() => {
    const receivables = payments.filter((p) => flowOf(p) === 'RECEIVABLE');
    const payables = payments.filter((p) => flowOf(p) === 'PAYABLE');
    const expectedIn = receivables.reduce((acc, p) => acc + Number(p.amount || 0), 0);
    const collectedIn = receivables.filter(p => p.status === 'COLLECTED').reduce((acc, p) => acc + Number(p.amount || 0), 0);
    const outgoing = payables.reduce((acc, p) => acc + Number(p.amount || 0), 0);
    const netPosition = collectedIn - outgoing;
    return {
      expectedIn,
      collectedIn,
      outgoing,
      netPosition,
      inboundCount: receivables.length,
      outboundCount: payables.length,
    };
  }, [payments]);

  const format = (val: number) => val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
      <MetricCard label="Expected Inbound Rent" value={format(stats.expectedIn)} subValue={`${stats.inboundCount} receivable entities`} />
      <MetricCard label="Collected Inbound" value={format(stats.collectedIn)} subValue="Settled incoming cashflow" color="text-zinc-300" />
      <MetricCard label="Outgoing Lease Obligations" value={format(stats.outgoing)} subValue={`${stats.outboundCount} payable entities`} color="gold-accent" />
      <MetricCard label="Net Cash Position" value={format(stats.netPosition)} subValue="Inbound collected minus outbound due" color={stats.netPosition >= 0 ? 'text-emerald-400' : 'text-red-400'} />
    </div>
  );
};

export default MetricGrid;
