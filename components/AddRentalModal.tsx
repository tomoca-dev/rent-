import React, { useState } from 'react';
import { X, Building, User, DollarSign, Calendar, Mail, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { db } from '../services/dbService';
import { PaymentEntity } from '../types';

interface AddRentalModalProps {
  onClose: () => void;
  onCreated?: () => Promise<void> | void;
}

const today = new Date().toISOString().split('T')[0];

const AddRentalModal: React.FC<AddRentalModalProps> = ({ onClose, onCreated }) => {
  const [formData, setFormData] = useState({
    tenantName: '',
    unit: '',
    amount: '',
    dueDate: today,
    email: '',
    propertyName: '',
    building: '',
    leaseEndDate: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
    flowType: 'RECEIVABLE' as 'RECEIVABLE' | 'PAYABLE',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const amount = Number(formData.amount || 0);
      const isPayable = formData.flowType === 'PAYABLE';
      const newRental: PaymentEntity = {
        id: (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`),
        cashFlowType: formData.flowType,
        tenantName: formData.tenantName,
        unit: formData.unit,
        amount,
        currency: 'ETB',
        status: 'PENDING',
        intent: isPayable ? 'LIQUIDITY_PRESERVATION' : 'LIQUIDITY_SECURE',
        riskScore: isPayable ? 16 : 22,
        lastActivity: isPayable ? 'New outgoing lease obligation registered' : 'New rental receivable registered',
        routingBehavior: isPayable ? 'Outgoing lease payment path' : 'Incoming receivable path',
        financialStatus: 'UNKNOWN',
        dueDate: formData.dueDate,
        autonomousActions: [isPayable ? `Payable obligation registered for ${formData.tenantName}.` : `Receivable entity registered for ${formData.tenantName}.`],
        tenant: {
          email: formData.email,
          building: formData.building || formData.propertyName,
          unitType: 'Commercial',
          moveInDate: today,
          reputationScore: 70,
          behaviorTag: isPayable ? 'LESSOR_COUNTERPARTY' : 'TENANT_COUNTERPARTY',
        },
        property: {
          propertyId: (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`),
          propertyName: formData.propertyName || 'Unassigned property',
          city: 'Addis Ababa',
          neighborhood: formData.building || undefined,
        },
        lease: {
          startDate: today,
          endDate: formData.leaseEndDate,
          monthlyRent: amount,
          depositAmount: amount,
          renewalStatus: 'ACTIVE',
          escalationRate: 5,
        },
        predictedLateProbability: isPayable ? 0.08 : 0.24,
        reminderStatus: 'SCHEDULED',
        behaviorInsight: isPayable
          ? 'FLOW:PAYABLE | Tomoca is the tenant/lessee for this unit and pays rent outward.'
          : 'FLOW:RECEIVABLE | Tomoca is the owner/lessor for this unit and collects rent inward.',
      };

      await db.createPayment(newRental);
      await onCreated?.();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to create the rental entity. Check Supabase policies and table relations.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-2xl bg-[var(--bg)] border premium-border p-8 rounded-sm shadow-2xl animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="space-y-1">
            <h3 className="text-[10px] tracking-[0.4em] uppercase theme-muted font-bold">Protocol: Entity Entry</h3>
            <p className="text-xl font-light theme-text tracking-tight">Register Receivable or Payable Lease</p>
          </div>
          <button onClick={onClose} className="p-2 theme-muted hover:theme-text transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <button type="button" onClick={() => setFormData({ ...formData, flowType: 'RECEIVABLE' })} className={`p-4 border rounded-sm text-left transition-all ${formData.flowType === 'RECEIVABLE' ? 'border-[var(--accent)] bg-[var(--accent)]/10' : 'premium-border surface-bg'}`}>
              <div className="flex items-center gap-3 mb-2"><ArrowDownCircle className="w-4 h-4 gold-accent" /><span className="text-[10px] uppercase tracking-[0.3em] font-bold theme-text">Inbound Rent</span></div>
              <p className="text-xs theme-muted">Tomoca owns or controls the unit and collects rent.</p>
            </button>
            <button type="button" onClick={() => setFormData({ ...formData, flowType: 'PAYABLE' })} className={`p-4 border rounded-sm text-left transition-all ${formData.flowType === 'PAYABLE' ? 'border-[var(--accent)] bg-[var(--accent)]/10' : 'premium-border surface-bg'}`}>
              <div className="flex items-center gap-3 mb-2"><ArrowUpCircle className="w-4 h-4 gold-accent" /><span className="text-[10px] uppercase tracking-[0.3em] font-bold theme-text">Outbound Rent</span></div>
              <p className="text-xs theme-muted">Tomoca rents from another company and pays outward.</p>
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[9px] uppercase tracking-widest theme-muted font-bold block ml-1">Counterparty Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 theme-muted" />
                <input required type="text" className="w-full surface-bg border premium-border p-4 pl-12 rounded-sm text-sm" value={formData.tenantName} onChange={e => setFormData({ ...formData, tenantName: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[9px] uppercase tracking-widest theme-muted font-bold block ml-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 theme-muted" />
                <input type="email" className="w-full surface-bg border premium-border p-4 pl-12 rounded-sm text-sm" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[9px] uppercase tracking-widest theme-muted font-bold block ml-1">Property Name</label>
              <div className="relative">
                <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 theme-muted" />
                <input required type="text" className="w-full surface-bg border premium-border p-4 pl-12 rounded-sm text-sm" value={formData.propertyName} onChange={e => setFormData({ ...formData, propertyName: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[9px] uppercase tracking-widest theme-muted font-bold block ml-1">Unit</label>
              <div className="relative">
                <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 theme-muted" />
                <input required type="text" className="w-full surface-bg border premium-border p-4 pl-12 rounded-sm text-sm" value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })} />
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-[9px] uppercase tracking-widest theme-muted font-bold block ml-1">Rent (ETB)</label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 theme-muted" />
                <input required type="number" min="0" className="w-full surface-bg border premium-border p-4 pl-12 rounded-sm text-sm" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[9px] uppercase tracking-widest theme-muted font-bold block ml-1">Due Date</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 theme-muted" />
                <input required type="date" className="w-full surface-bg border premium-border p-4 pl-12 rounded-sm text-sm" value={formData.dueDate} onChange={e => setFormData({ ...formData, dueDate: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[9px] uppercase tracking-widest theme-muted font-bold block ml-1">Lease End</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 theme-muted" />
                <input required type="date" className="w-full surface-bg border premium-border p-4 pl-12 rounded-sm text-sm" value={formData.leaseEndDate} onChange={e => setFormData({ ...formData, leaseEndDate: e.target.value })} />
              </div>
            </div>
          </div>

          {error && <div className="text-red-400 text-sm border border-red-500/20 bg-red-500/5 rounded-sm p-3">{error}</div>}

          <button type="submit" disabled={loading} className="w-full py-5 bg-[var(--text)] text-[var(--bg)] text-[10px] font-bold tracking-[0.5em] uppercase disabled:opacity-50">
            {loading ? 'Processing...' : 'Authorize Registration'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddRentalModal;
