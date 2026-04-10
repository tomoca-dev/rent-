
import React from 'react';
import { Shield, Bell, Zap, Database, RefreshCw, LayoutGrid, Building2, LogOut, Sun, Moon, Monitor, Workflow } from 'lucide-react';
import { ViewMode, PaymentEntity, Theme } from '../types';

interface HeaderProps {
  onToggleReport: () => void;
  reportActive: boolean;
  isSyncing?: boolean;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  payments: PaymentEntity[];
  onLogout: () => void;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
}

const Header: React.FC<HeaderProps> = ({ 
  onToggleReport, 
  reportActive, 
  isSyncing, 
  viewMode, 
  onViewModeChange,
  payments,
  onLogout,
  theme,
  onThemeChange
}) => {
  const overdueCount = React.useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return payments.filter(p => p.status !== 'COLLECTED' && p.dueDate < today).length;
  }, [payments]);

  return (
    <header className="h-24 px-12 border-b premium-border flex items-center justify-between glass z-40 sticky top-0">
      <div className="flex items-center gap-16">
        <div className="flex items-center gap-4 group cursor-default">
          <img
            src="/logo.png"
            alt="Vaultline logo"
            className="w-14 h-14 object-contain shrink-0 drop-shadow-[0_12px_24px_rgba(0,0,0,0.45)] [filter:drop-shadow(0_12px_24px_rgba(0,0,0,0.45))_drop-shadow(0_0_12px_rgba(197,160,89,0.28))]"
          />
          <div className="flex flex-col">
            <h1 className="text-sm tracking-[0.8em] font-light theme-text uppercase group-hover:text-[#C5A059] transition-colors">Vaultline</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`w-1 h-1 rounded-full ${viewMode === 'OWNERSHIP' ? 'bg-zinc-400' : 'bg-[#C5A059]'}`}></span>
              <span className="text-[8px] text-zinc-600 tracking-[0.4em] uppercase font-bold">Private Institutional Control</span>
            </div>
          </div>
        </div>

        {/* Perspective Toggle */}
        <div className="flex surface-bg p-1 rounded-sm border premium-border ml-4">
          <button 
            onClick={() => onViewModeChange('ASSET')}
            className={`px-4 py-1.5 text-[8px] tracking-[0.3em] uppercase transition-all flex items-center gap-2 rounded-sm ${viewMode === 'ASSET' ? 'bg-[var(--accent)] text-[var(--bg)] font-bold' : 'theme-muted hover:theme-text'}`}
          >
            <LayoutGrid className="w-2.5 h-2.5" />
            Asset View
          </button>
          <button 
            onClick={() => onViewModeChange('OWNERSHIP')}
            className={`px-4 py-1.5 text-[8px] tracking-[0.3em] uppercase transition-all flex items-center gap-2 rounded-sm ${viewMode === 'OWNERSHIP' ? 'bg-[var(--text)] text-[var(--bg)] font-bold' : 'theme-muted hover:theme-text'}`}
          >
            <Building2 className="w-2.5 h-2.5" />
            Ownership
          </button>
          <button 
            onClick={() => onViewModeChange('OPERATIONS')}
            className={`px-4 py-1.5 text-[8px] tracking-[0.3em] uppercase transition-all flex items-center gap-2 rounded-sm ${viewMode === 'OPERATIONS' ? 'bg-[#2563EB] text-white font-bold' : 'theme-muted hover:theme-text'}`}
          >
            <Workflow className="w-2.5 h-2.5" />
            Operations
          </button>
        </div>

        <nav className="flex items-center gap-12">
          <button 
            onClick={() => reportActive && onToggleReport()}
            className={`text-[9px] tracking-[0.4em] uppercase transition-all flex items-center gap-2 ${!reportActive ? 'theme-text font-bold' : 'theme-muted hover:theme-text'}`}
          >
            <Database className="w-3 h-3" />
            Monitor
          </button>
          <button 
            onClick={() => !reportActive && onToggleReport()}
            className={`text-[9px] tracking-[0.4em] uppercase transition-all flex items-center gap-2 ${reportActive ? 'theme-text font-bold' : 'theme-muted hover:theme-text'}`}
          >
            <Shield className="w-3 h-3" />
            Strategy
          </button>
        </nav>
      </div>

      <div className="flex items-center gap-12">
        {/* Theme Switcher */}
        <div className="flex surface-bg p-1 rounded-sm border premium-border">
          <button 
            onClick={() => onThemeChange('VAULT')}
            className={`p-1.5 rounded-sm transition-all ${theme === 'VAULT' ? 'bg-[var(--accent)] text-[var(--bg)]' : 'theme-muted hover:theme-text'}`}
            title="Vault Dark"
          >
            <Moon className="w-3 h-3" />
          </button>
          <button 
            onClick={() => onThemeChange('LIGHT')}
            className={`p-1.5 rounded-sm transition-all ${theme === 'LIGHT' ? 'bg-[#2563EB] text-white' : 'theme-muted hover:theme-text'}`}
            title="Institutional Light"
          >
            <Sun className="w-3 h-3" />
          </button>
          <button 
            onClick={() => onThemeChange('COBALT')}
            className={`p-1.5 rounded-sm transition-all ${theme === 'COBALT' ? 'bg-[#38BDF8] text-black' : 'theme-muted hover:theme-text'}`}
            title="Cyber Cobalt"
          >
            <Monitor className="w-3 h-3" />
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end mr-2">
            <span className="text-[8px] theme-muted uppercase tracking-widest font-bold">Ledger Sync</span>
            <span className={`text-[10px] uppercase tracking-widest font-mono transition-colors ${isSyncing ? 'gold-accent' : 'theme-text opacity-60'}`}>
              {isSyncing ? 'Syncing...' : 'Encrypted'}
            </span>
          </div>
          <div className={`w-10 h-10 border premium-border rounded-full flex items-center justify-center relative surface-bg transition-all ${isSyncing ? 'border-[var(--accent)]/50' : ''}`}>
             <div className={`absolute inset-0 rounded-full border border-green-500/20 ${!isSyncing ? 'state-pulse' : ''}`} />
             {isSyncing ? (
               <RefreshCw className="w-3.5 h-3.5 gold-accent animate-spin" />
             ) : (
               <Zap className="w-4 h-4 text-green-600" />
             )}
          </div>
        </div>
        
        <div className="flex items-center gap-6 theme-muted border-l premium-border pl-12 h-10">
          <div className="relative group cursor-pointer">
            <Bell className="w-4 h-4 hover:theme-text transition-colors" />
            {overdueCount > 0 && (
              <>
                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-900 rounded-full border border-black animate-pulse" />
                <div className="absolute top-10 right-0 w-64 p-4 glass shadow-2xl invisible group-hover:visible transition-all animate-in slide-in-from-top-2">
                  <span className="text-[8px] uppercase tracking-widest gold-accent font-bold block mb-2">Priority Alerts</span>
                  <p className="text-[10px] theme-muted font-light leading-snug">
                    System has identified {overdueCount} entities past due date. Executive intervention suggested.
                  </p>
                </div>
              </>
            )}
          </div>

          <button 
            onClick={onLogout}
            className="flex items-center gap-3 px-4 py-2 rounded-sm border border-red-900/20 hover:border-red-500/50 hover:bg-red-500/5 transition-all group"
          >
            <LogOut className="w-3 h-3 text-red-900 group-hover:text-red-500" />
            <span className="text-[8px] tracking-[0.2em] uppercase theme-muted group-hover:text-red-400">Exit Secure</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
