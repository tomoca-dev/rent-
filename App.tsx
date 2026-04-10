import React, { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import Header from './components/Header';
import MetricGrid from './components/MetricGrid';
import PaymentList from './components/PaymentList';
import MonthlyTracker from './components/MonthlyTracker';
import Auth from './components/Auth';
import { db } from './services/dbService';
import { supabase, supabaseConfigured } from './services/supabaseClient';
import { PaymentEntity, ViewMode, Theme } from './types';
import { Plus } from 'lucide-react';
import { Session } from '@supabase/supabase-js';

const PaymentDrawer = lazy(() => import('./components/PaymentDrawer'));
const ReportView = lazy(() => import('./components/ReportView'));
const PortfolioOverview = lazy(() => import('./components/PortfolioOverview'));
const FeatureHub = lazy(() => import('./components/FeatureHub'));
const AddRentalModal = lazy(() => import('./components/AddRentalModal'));

const SectionLoader: React.FC<{ label?: string }> = ({ label = 'Loading module' }) => (
  <div className="border premium-border surface-bg p-8 text-[10px] uppercase tracking-[0.3em] theme-muted">
    {label}...
  </div>
);

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [theme, setTheme] = useState<Theme>('VAULT');
  const [payments, setPayments] = useState<PaymentEntity[]>([]);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('ASSET');
  const [isSyncing, setIsSyncing] = useState(false);
  const [systemActive, setSystemActive] = useState(false);
  const [showAddRental, setShowAddRental] = useState(false);

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadData = async () => {
    setIsSyncing(true);
    try {
      const data = await db.getPayments();
      setPayments(data);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (session) {
      loadData();
      const unsubscribe = db.subscribe(() => {
        loadData();
      });

      const timer = setTimeout(() => setSystemActive(true), 900);
      return () => {
        unsubscribe();
        clearTimeout(timer);
      };
    }
  }, [session]);

  const sortedPayments = useMemo(() => {
    return [...payments].sort((a, b) => b.riskScore - a.riskScore);
  }, [payments]);

  const selectedPayment = useMemo(() => {
    return payments.find((p) => p.id === selectedPaymentId) || null;
  }, [payments, selectedPaymentId]);

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setSystemActive(false);
  };

  if (!session) {
    return <Auth />;
  }

  if (!systemActive) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[var(--bg)]">
        <div className="theme-muted text-[10px] tracking-[0.5em] uppercase mb-4 opacity-50">Vaultline Core</div>
        <div className="w-48 h-[1px] surface-bg relative overflow-hidden">
          <div className="absolute top-0 left-0 h-full gold-accent w-1/3 animate-[translateX_1.5s_infinite] bg-current" />
        </div>
        <div className="mt-4 theme-muted text-[9px] tracking-[0.2em] uppercase state-pulse">
          Establishing institutional link...
        </div>
        <style>{`
          @keyframes translateX {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(300%); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col relative overflow-hidden bg-[var(--bg)] selection:bg-[var(--accent)]/30 transition-colors duration-1000">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,var(--accent),transparent_40%)] opacity-[0.03] pointer-events-none" />

      <Header
        onToggleReport={() => setShowReport(!showReport)}
        reportActive={showReport}
        isSyncing={isSyncing}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        payments={payments}
        onLogout={handleLogout}
        theme={theme}
        onThemeChange={setTheme}
      />

      <main className="flex-1 px-12 py-10 max-w-[1600px] mx-auto w-full transition-all duration-700 ease-in-out overflow-y-auto overflow-x-hidden pb-24">
        {(!supabaseConfigured) && (
          <div className="mb-8 border premium-border glass p-4 flex items-center justify-between gap-4 text-[10px] uppercase tracking-[0.25em]">
            <span className="theme-muted">Local mode active · no sample portfolio is preloaded. Connect Supabase or create records manually.</span>
            <span className="gold-accent">Ready for schema + auth hookup</span>
          </div>
        )}

        <Suspense fallback={<SectionLoader label="Loading workspace" />}>
          {showReport ? (
            <ReportView payments={payments} />
          ) : viewMode === 'OWNERSHIP' ? (
            <PortfolioOverview payments={payments} onAddRental={() => setShowAddRental(true)} />
          ) : viewMode === 'OPERATIONS' ? (
            <FeatureHub payments={payments} onRefresh={loadData} />
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-700">
              <MetricGrid payments={payments} />
              <MonthlyTracker payments={payments} />
              <div className="mt-16">
                <div className="flex justify-between items-end mb-8">
                  <div className="space-y-1">
                    <h2 className="text-[10px] tracking-[0.4em] uppercase theme-muted flex items-center">
                      <span className="w-1 h-1 rounded-full gold-accent mr-3 shadow-[0_0_8px_var(--accent)] bg-current"></span>
                      High-priority entity matrix
                    </h2>
                    <span className="text-[9px] theme-muted uppercase tracking-widest opacity-60">Sorted by institutional risk</span>
                  </div>
                  <button
                    onClick={() => setShowAddRental(true)}
                    className="flex items-center gap-3 px-6 py-3 border premium-border surface-bg gold-accent hover:bg-[var(--accent)] hover:text-[var(--bg)] transition-all group"
                  >
                    <Plus className="w-3 h-3 group-hover:rotate-90 transition-transform" />
                    <span className="text-[9px] uppercase tracking-[0.3em] font-bold">Add rental entry</span>
                  </button>
                </div>
                <PaymentList payments={sortedPayments} onSelect={(p) => setSelectedPaymentId(p.id)} />
              </div>
            </div>
          )}
        </Suspense>
      </main>

      <Suspense fallback={null}>
        <PaymentDrawer payment={selectedPayment} onClose={() => setSelectedPaymentId(null)} />
      </Suspense>

      {showAddRental && (
        <Suspense fallback={null}>
          <AddRentalModal onClose={() => setShowAddRental(false)} onCreated={loadData} />
        </Suspense>
      )}

      <footer className="absolute bottom-6 left-12 right-12 flex justify-between items-center text-[9px] theme-muted tracking-[0.3em] uppercase pointer-events-none">
        <div className="flex items-center gap-6">
          <span>Session protocol: Alpha-9</span>
          <span className={`opacity-50 transition-opacity duration-300 ${isSyncing ? 'opacity-100 gold-accent' : ''}`}>
            {isSyncing ? 'TRANSMITTING DATA...' : 'BUILD VERIFIED'}
          </span>
        </div>
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-2">
            <div className={`w-1 h-1 rounded-full transition-colors duration-300 ${isSyncing ? 'gold-accent bg-current' : 'bg-green-900'} shadow-[0_0_4px_rgba(20,83,45,1)]`}></div>
            Mainnet secure
          </span>
          <span className="font-mono">Sync: 100%</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
