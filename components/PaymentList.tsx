
import React, { useState } from 'react';
import { PaymentEntity, PaymentIntent } from '../types';
import { ChevronRight, Search, ShieldAlert, Eye, EyeOff, Activity, AlertTriangle } from 'lucide-react';

interface PaymentListProps {
  payments: PaymentEntity[];
  onSelect: (p: PaymentEntity) => void;
}

const PaymentList: React.FC<PaymentListProps> = ({ payments, onSelect }) => {
  const [search, setSearch] = useState('');
  const [showExtendedData, setShowExtendedData] = useState(true);

  const filteredPayments = payments.filter(p => 
    p.tenantName.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COLLECTED': return 'bg-zinc-800 text-zinc-500';
      case 'AT_RISK': return 'bg-[#C5A059]/10 text-[#C5A059]';
      case 'BLOCKED': return 'bg-red-950/20 text-red-800';
      default: return 'bg-zinc-900 text-zinc-400';
    }
  };

  const getIntentMeta = (intent: PaymentIntent) => {
    switch (intent) {
      case 'STRATEGIC_STALL': return { label: 'Strategic Stall', color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20' };
      case 'LIQUIDITY_SECURE': return { label: 'Liquidity Secure', color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/20' };
      case 'HIGH_RELIABILITY': return { label: 'High Reliability', color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' };
      case 'VOLATILE_BEHAVIOR': return { label: 'Volatile Behavior', color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20' };
      case 'EVASIVE_ROUTING': return { label: 'Evasive Routing', color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20' };
      case 'LIQUIDITY_PRESERVATION': return { label: 'Liquidity Preservation', color: 'text-zinc-400', bg: 'bg-zinc-400/10', border: 'border-zinc-400/20' };
      default: return { label: intent, color: 'text-zinc-500', bg: 'bg-zinc-500/10', border: 'border-zinc-500/20' };
    }
  };

  const isOverdue = (payment: PaymentEntity) => {
    const today = new Date().toISOString().split('T')[0];
    return payment.status !== 'COLLECTED' && payment.dueDate < today;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="relative group w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 theme-muted group-focus-within:gold-accent transition-colors" />
          <input 
            type="text" 
            placeholder="FILTER BY TENANT..."
            className="w-full surface-bg border premium-border p-3 pl-12 rounded-sm text-[10px] tracking-widest theme-text placeholder:theme-muted focus:outline-none focus:border-[var(--accent)]/30 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <button 
          onClick={() => setShowExtendedData(!showExtendedData)}
          className={`flex items-center gap-3 px-4 py-2 border rounded-sm group transition-all ${showExtendedData ? 'bg-[var(--accent)]/5 border-[var(--accent)]/20' : 'surface-bg border-zinc-800'}`}
        >
          {showExtendedData ? <EyeOff className="w-3 h-3 gold-accent" /> : <Eye className="w-3 h-3 theme-muted" />}
          <span className={`text-[8px] uppercase tracking-[0.3em] font-bold ${showExtendedData ? 'gold-accent' : 'theme-muted'}`}>
            {showExtendedData ? 'Hide Intelligence Columns' : 'Show Intelligence Columns'}
          </span>
        </button>
      </div>

      {/* Grid Header */}
      <div className="px-5 py-2 flex items-center justify-between border-b premium-border text-[8px] uppercase tracking-[0.3em] theme-muted font-bold">
        <div className="flex items-center gap-8 flex-1">
          <div className="w-48">Entity / Designation</div>
          {showExtendedData && <div className="hidden lg:block w-40">Payment Intent</div>}
          <div className="hidden md:block w-32">Risk Index Array</div>
          <div className="hidden xl:block ml-4">Maturity Date</div>
        </div>
        <div className="flex items-center gap-12">
          <div className="w-24 text-right">Settlement Value</div>
          <div className="w-[100px] text-center">Status</div>
          <div className="w-4"></div>
        </div>
      </div>

      <div className="space-y-3">
        {filteredPayments.length === 0 ? (
          <div className="p-20 text-center border border-dashed premium-border">
            <p className="text-[10px] uppercase tracking-[0.5em] text-zinc-700">No matching entities identified</p>
          </div>
        ) : (
          filteredPayments.map((payment) => {
            const intentMeta = getIntentMeta(payment.intent);
            return (
              <div 
                key={payment.id}
                onClick={() => onSelect(payment)}
                className={`group flex items-center justify-between p-5 rounded-sm border transition-all cursor-pointer glass hover:bg-zinc-900/60 ${isOverdue(payment) ? 'border-red-950/30' : 'premium-border'}`}
              >
                <div className="flex items-center gap-8 flex-1">
                  <div className="flex flex-col w-48">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium theme-text group-hover:gold-accent transition-colors truncate">{payment.tenantName}</span>
                      {isOverdue(payment) && (
                        <div className="flex items-center gap-1 px-1.5 py-0.5 bg-red-950/20 border border-red-950/30 rounded-[2px] shrink-0">
                          <ShieldAlert className="w-2.5 h-2.5 text-red-900" />
                          <span className="text-[7px] font-bold text-red-900 uppercase">Overdue</span>
                        </div>
                      )}
                    </div>
                    <span className="text-[9px] theme-muted tracking-[0.1em] mt-1">{payment.unit} // {payment.id}</span>
                  </div>
                  
                  {showExtendedData && (
                    <div className="hidden lg:flex flex-col w-40 animate-in fade-in slide-in-from-left-2 duration-300">
                      <div className="flex items-center gap-2">
                        <div className={`px-2.5 py-1 rounded-[1px] ${intentMeta.bg} ${intentMeta.color} border ${intentMeta.border} flex items-center gap-2`}>
                           <div className={`w-1 h-1 rounded-full ${intentMeta.color} bg-current opacity-40`} />
                           <span className="text-[7.5px] uppercase tracking-wider font-bold whitespace-nowrap">{intentMeta.label}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Enhanced Segmented Risk Score */}
                  <div className="hidden md:flex flex-col w-32 animate-in fade-in duration-500">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 flex gap-0.5 h-[3px]">
                        {[...Array(10)].map((_, i) => {
                          const threshold = (i + 1) * 10;
                          const isActive = payment.riskScore >= threshold;
                          let activeColor = "bg-zinc-900";
                          
                          if (isActive) {
                            if (i < 3) activeColor = "bg-emerald-500/60 shadow-[0_0_4px_rgba(16,185,129,0.2)]";
                            else if (i < 7) activeColor = "bg-[#C5A059]/60 shadow-[0_0_4px_rgba(197,160,89,0.2)]";
                            else activeColor = "bg-red-600/60 shadow-[0_0_4px_rgba(220,38,38,0.2)]";
                          }
                          
                          return (
                            <div 
                              key={i} 
                              className={`flex-1 h-full transition-all duration-700 ease-out ${activeColor}`}
                              style={{ transitionDelay: `${i * 30}ms` }}
                            />
                          );
                        })}
                      </div>
                      <span className="text-[9px] mono text-zinc-400 min-w-[28px] text-right font-medium">
                        {payment.riskScore}
                      </span>
                    </div>
                  </div>

                  <div className="hidden xl:flex flex-col ml-4">
                    <span className={`text-[10px] mono ${isOverdue(payment) ? 'text-red-900 font-bold' : 'theme-muted'}`}>
                      {payment.dueDate}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-12">
                  <div className="text-right flex flex-col w-24">
                    <span className="text-sm mono theme-text">
                      {payment.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-[9px] theme-muted mono uppercase">ETB</span>
                  </div>

                  <div className={`px-3 py-1 text-[9px] tracking-[0.15em] rounded-sm uppercase min-w-[100px] text-center ${getStatusColor(payment.status)}`}>
                    {payment.status}
                  </div>

                  <ChevronRight className="w-4 h-4 text-zinc-700 group-hover:text-zinc-400 transition-colors" />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default PaymentList;
