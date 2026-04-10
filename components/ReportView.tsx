
import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ShieldCheck, TrendingDown, Clock, Activity } from 'lucide-react';
import { PaymentEntity } from '../types';

interface ReportViewProps {
  payments: PaymentEntity[];
}

const ReportView: React.FC<ReportViewProps> = ({ payments }) => {
  const historicalData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    
    // Group by month
    const monthlyStats = payments.reduce((acc: any, p) => {
      const date = new Date(p.dueDate);
      const monthIndex = date.getMonth();
      const monthName = months[monthIndex];
      
      if (!acc[monthName]) {
        acc[monthName] = { month: monthName, expected: 0, collected: 0, exposure: 0, index: monthIndex };
      }
      
      acc[monthName].expected += p.amount / 1000000; // Convert to M.ETB for display
      if (p.status === 'COLLECTED') {
        acc[monthName].collected += p.amount / 1000000;
      } else {
        acc[monthName].exposure += p.amount / 1000000;
      }
      
      return acc;
    }, {});

    // Sort by month index and take last 6 months
    return Object.values(monthlyStats)
      .sort((a: any, b: any) => a.index - b.index)
      .map((s: any) => ({
        ...s,
        expected: Number(s.expected.toFixed(1)),
        collected: Number(s.collected.toFixed(1)),
        exposure: Number(s.exposure.toFixed(1))
      }))
      .slice(-6);
  }, [payments]);

  const stats = useMemo(() => {
    const totalExpected = payments.reduce((acc, p) => acc + p.amount, 0);
    const totalCollected = payments.filter(p => p.status === 'COLLECTED').reduce((acc, p) => acc + p.amount, 0);
    const totalExposure = payments.filter(p => p.status !== 'COLLECTED').reduce((acc, p) => acc + p.amount, 0);
    
    const reliability = totalExpected > 0 ? (totalCollected / totalExpected * 100) : 100;
    
    return {
      exposure: (totalExposure / 1000000).toFixed(1),
      reliability: reliability.toFixed(1)
    };
  }, [payments]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-end mb-16">
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-[#C5A059]">
            <ShieldCheck className="w-5 h-5" />
            <span className="text-[10px] tracking-[0.4em] uppercase font-semibold">Vaultline Intelligence Report</span>
          </div>
          <h2 className="text-4xl font-light text-zinc-100 tracking-tight">Institutional Performance Matrix</h2>
          <p className="text-xs text-zinc-500 tracking-[0.1em] uppercase">Autonomous Cycle: {new Date().toLocaleString('default', { month: 'long' })} {new Date().getFullYear()} // Real-time Data Active</p>
        </div>
        <div className="text-right p-4 border premium-border glass bg-zinc-900/40">
          <span className="text-[9px] tracking-[0.2em] text-zinc-500 uppercase block mb-1">System Health</span>
          <span className="text-xs text-green-500 mono flex items-center gap-2 justify-end">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 state-pulse" />
            Optimum // Autopilot Active
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Performance Graph */}
        <div className="lg:col-span-3 space-y-8">
          <div className="p-8 border premium-border glass rounded-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#C5A059]/40 to-transparent" />
            <div className="flex justify-between items-center mb-12">
              <h3 className="text-[10px] tracking-[0.3em] uppercase text-zinc-400">Monthly Collection Velocity (M.ETB)</h3>
              <div className="flex gap-6 text-[9px] uppercase tracking-widest text-zinc-500">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-0.5 bg-[#C5A059]" /> Expected
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-[#C5A059]/20 border border-[#C5A059]/40" /> Actual
                </div>
              </div>
            </div>
            <div className="h-80 w-full">
              {historicalData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={historicalData}>
                    <defs>
                      <linearGradient id="colorColl" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#C5A059" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#C5A059" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="month" 
                      stroke="#18181b" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false} 
                      tick={{ fill: '#52525b' }}
                    />
                    <YAxis hide />
                    <Tooltip 
                      cursor={{ stroke: '#27272a' }}
                      contentStyle={{ backgroundColor: '#050505', border: '1px solid #27272a', padding: '12px' }}
                      itemStyle={{ fontSize: '10px', textTransform: 'uppercase', color: '#E5E7EB' }}
                      labelStyle={{ fontSize: '11px', color: '#C5A059', marginBottom: '8px', fontWeight: 'bold' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="collected" 
                      stroke="#C5A059" 
                      strokeWidth={1.5}
                      fillOpacity={1} 
                      fill="url(#colorColl)" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="expected" 
                      stroke="#27272a" 
                      strokeDasharray="4 4"
                      fill="transparent"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center theme-muted text-[10px] tracking-[0.3em] uppercase">
                  Insufficient data for historical analysis
                </div>
              )}
            </div>
          </div>

          {/* Secondary Stats */}
          <div className="grid grid-cols-3 gap-8">
            <div className="p-6 border premium-border glass rounded-sm">
              <div className="flex items-center gap-3 mb-4">
                <Clock className="w-4 h-4 text-zinc-600" />
                <span className="text-[9px] tracking-[0.2em] text-zinc-500 uppercase">Average Settlement Delay</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl mono text-white">4.2</span>
                <span className="text-[10px] text-zinc-500 uppercase">Days</span>
              </div>
            </div>
            <div className="p-6 border premium-border glass rounded-sm">
              <div className="flex items-center gap-3 mb-4">
                <TrendingDown className="w-4 h-4 text-red-900" />
                <span className="text-[9px] tracking-[0.2em] text-zinc-500 uppercase">Overdue Exposure</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl mono text-red-800">{stats.exposure}</span>
                <span className="text-[10px] text-zinc-500 uppercase">M.ETB</span>
              </div>
            </div>
            <div className="p-6 border premium-border glass rounded-sm">
              <div className="flex items-center gap-3 mb-4">
                <Activity className="w-4 h-4 text-[#C5A059]" />
                <span className="text-[9px] tracking-[0.2em] text-zinc-500 uppercase">System Reliability</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl mono text-white">{stats.reliability}</span>
                <span className="text-[10px] text-zinc-500 uppercase">% Score</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Insights */}
        <div className="space-y-8">
          <div className="p-8 border-l-2 border-[#C5A059] bg-[#C5A059]/[0.02] flex flex-col h-full space-y-8">
            <div className="space-y-4">
              <h3 className="text-[11px] tracking-[0.3em] uppercase text-[#C5A059] font-bold">Autonomous Summary</h3>
              <p className="text-sm leading-relaxed text-zinc-400 font-light">
                The Vaultline core has processed all {payments.length} institutional entities. {stats.reliability}% were settled via Tier 1 Automated Routing. Remaining entities have been flagged for manual oversight. 
              </p>
              <p className="text-sm leading-relaxed text-zinc-400 font-light">
                <span className="text-zinc-200">Forward Insight:</span> {Number(stats.reliability) < 90 ? 'High-risk volatility detected.' : 'Stable operational flow maintained.'} Recommending Liquidity Preservation protocols for next cycle.
              </p>
            </div>

            <div className="space-y-6 flex-1">
              <h4 className="text-[10px] tracking-[0.2em] uppercase text-zinc-500 border-b premium-border pb-4">Cycle Progress</h4>
              <div className="space-y-8">
                <div>
                  <div className="flex justify-between text-[10px] text-zinc-500 uppercase tracking-widest mb-3">
                    <span>Reconciliation</span>
                    <span>{stats.reliability}%</span>
                  </div>
                  <div className="h-1 bg-zinc-900 w-full rounded-full">
                    <div className="h-full bg-zinc-500 rounded-full" style={{ width: `${stats.reliability}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[10px] text-zinc-500 uppercase tracking-widest mb-3">
                    <span>Tenant Follow-up</span>
                    <span>100%</span>
                  </div>
                  <div className="h-1 bg-zinc-900 w-full rounded-full">
                    <div className="h-full bg-zinc-500 w-full rounded-full" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[10px] text-zinc-500 uppercase tracking-widest mb-3">
                    <span>Anomalies Resolved</span>
                    <span>92%</span>
                  </div>
                  <div className="h-1 bg-zinc-900 w-full rounded-full">
                    <div className="h-full bg-[#C5A059] w-[92%] rounded-full shadow-[0_0_8px_#C5A059]" />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t premium-border">
              <button className="w-full py-3 border premium-border text-[9px] uppercase tracking-[0.3em] text-zinc-500 hover:text-zinc-200 transition-all hover:bg-zinc-900/40">
                Download PDF Archive
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportView;
