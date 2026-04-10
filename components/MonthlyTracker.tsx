import React from 'react';
import { Activity, ShieldCheck } from 'lucide-react';
import { PaymentEntity } from '../types';

interface MonthlyTrackerProps {
  payments: PaymentEntity[];
}

const flowOf = (p: PaymentEntity) => p.cashFlowType === 'PAYABLE' ? 'PAYABLE' : 'RECEIVABLE';

const MonthlyTracker: React.FC<MonthlyTrackerProps> = ({ payments }) => {
  const stats = React.useMemo(() => {
    const receivables = payments.filter((p) => flowOf(p) === 'RECEIVABLE');
    const payables = payments.filter((p) => flowOf(p) === 'PAYABLE');
    const expectedIn = receivables.reduce((acc, p) => acc + p.amount, 0);
    const collectedIn = receivables.filter(p => p.status === 'COLLECTED').reduce((acc, p) => acc + p.amount, 0);
    const outgoingDue = payables.reduce((acc, p) => acc + p.amount, 0);
    const net = collectedIn - outgoingDue;
    const percentage = expectedIn > 0 ? (collectedIn / expectedIn * 100) : 0;
    return { expectedIn, collectedIn, outgoingDue, net, percentage };
  }, [payments]);

  const formatCurrency = (val: number) => val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  const aiSummary = stats.outgoingDue > 0
    ? `Two-way lease mode active. Inbound collection is at ${stats.percentage.toFixed(1)}%, while outbound obligations total ${formatCurrency(stats.outgoingDue)} ETB.`
    : stats.percentage > 80
      ? 'Liquidity performance is optimal. Autonomous closing protocols ready for execution.'
      : `Autonomous reconciliation is at ${stats.percentage.toFixed(1)}%. Receivable risk exposure is still present in the active lease book.`;

  return (
    <div className="mt-12 p-8 border premium-border glass rounded-sm relative overflow-hidden flex flex-col lg:flex-row gap-12 group transition-all duration-500 hover:border-[var(--accent)]/20">
      <div className="absolute -top-4 -right-4 w-24 h-24 bg-[var(--accent)]/5 blur-3xl rounded-full state-pulse pointer-events-none"></div>
      <div className="flex flex-col gap-6 min-w-[200px]">
        <h3 className="text-[10px] tracking-[0.3em] uppercase theme-muted font-bold flex items-center gap-2">
          <Activity className="w-3 h-3 gold-accent" />Cycle Progress
        </h3>
        <div className="relative w-32 h-32 flex items-center justify-center mx-auto lg:mx-0">
          <svg className="w-full h-full transform -rotate-90">
            <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="2" fill="transparent" className="surface-bg opacity-20" />
            <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="2" fill="transparent" strokeDasharray={364.4} strokeDashoffset={364.4 * (1 - stats.percentage / 100)} className="gold-accent transition-all duration-1000 ease-out" strokeLinecap="square" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl mono theme-text leading-none">{stats.percentage.toFixed(1)}%</span>
            <span className="text-[8px] theme-muted uppercase tracking-widest mt-1">Inbound settled</span>
          </div>
        </div>
      </div>
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-8 py-2">
        <div className="flex flex-col justify-center border-l sm:border-l-0 sm:border-r premium-border pl-4 sm:pl-0"><span className="text-[9px] tracking-[0.2em] theme-muted uppercase mb-2">Inbound Due</span><div className="flex items-baseline gap-2"><span className="text-lg mono theme-text opacity-80">{formatCurrency(stats.expectedIn)}</span><span className="text-[9px] theme-muted mono">ETB</span></div></div>
        <div className="flex flex-col justify-center border-l sm:border-l-0 sm:border-r premium-border pl-4 sm:pl-0"><span className="text-[9px] tracking-[0.2em] theme-muted uppercase mb-2">Inbound Collected</span><div className="flex items-baseline gap-2"><span className="text-lg mono gold-accent">{formatCurrency(stats.collectedIn)}</span><span className="text-[9px] theme-muted mono">ETB</span></div></div>
        <div className="flex flex-col justify-center border-l sm:border-l-0 sm:border-r premium-border pl-4 sm:pl-0"><span className="text-[9px] tracking-[0.2em] theme-muted uppercase mb-2">Outbound Due</span><div className="flex items-baseline gap-2"><span className="text-lg mono text-red-300">{formatCurrency(stats.outgoingDue)}</span><span className="text-[9px] theme-muted mono">ETB</span></div></div>
        <div className="flex flex-col justify-center pl-4 sm:pl-0"><span className="text-[9px] tracking-[0.2em] theme-muted uppercase mb-2">Net Position</span><div className="flex items-baseline gap-2"><span className={`text-lg mono ${stats.net >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatCurrency(stats.net)}</span><span className="text-[9px] theme-muted mono">ETB</span></div></div>
      </div>
      <div className="lg:w-1/3 p-6 bg-[var(--accent)]/[0.02] border-l premium-border flex flex-col justify-between">
        <div className="flex items-center gap-2 mb-4"><ShieldCheck className="w-3.5 h-3.5 gold-accent" /><span className="text-[10px] tracking-[0.3em] uppercase font-bold gold-accent">AI Executive Summary</span></div>
        <p className="text-[11px] leading-relaxed theme-muted italic font-light">"{aiSummary}"</p>
        <div className="mt-4 flex items-center justify-between"><div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-green-900 shadow-[0_0_4px_rgba(20,83,45,0.5)]"></div><span className="text-[8px] theme-muted uppercase tracking-widest">Protocol: Active</span></div><span className="text-[8px] theme-muted uppercase tracking-widest font-mono">MD-312 // ST-09</span></div>
      </div>
    </div>
  );
};

export default MonthlyTracker;
