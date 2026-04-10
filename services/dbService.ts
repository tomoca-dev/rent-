import { PaymentEntity } from '../types';
import { supabase } from './supabaseClient';

const STORAGE_KEY = 'vaultline_payments_prod_v4';

type PaymentRow = {
  id: string;
  amount: number | string;
  currency?: string | null;
  due_date: string;
  paid_at?: string | null;
  status?: string | null;
  risk_score?: number | null;
  predicted_late_probability?: number | null;
  reminder_status?: string | null;
  intent?: string | null;
  routing_behavior?: string | null;
  financial_status?: string | null;
  behavior_insight?: string | null;
  proof_storage_path?: string | null;
  tenants?: {
    id?: string;
    full_name?: string | null;
    email?: string | null;
    phone?: string | null;
    move_in_date?: string | null;
    reputation_score?: number | null;
    behavior_tag?: string | null;
  } | null;
  units?: {
    id?: string;
    unit_code?: string | null;
    unit_type?: string | null;
    properties?: {
      id?: string | null;
      name?: string | null;
      city?: string | null;
      neighborhood?: string | null;
    } | null;
  } | null;
  leases?: {
    id?: string;
    start_date?: string | null;
    end_date?: string | null;
    monthly_rent?: number | string | null;
    deposit_amount?: number | string | null;
    renewal_status?: string | null;
    escalation_rate?: number | string | null;
  } | null;
};

type PaymentEventRow = {
  payment_id: string;
  message: string;
  created_at: string;
};

const toNumber = (value: unknown, fallback = 0): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const asUpper = (value: string | null | undefined, fallback: string): string =>
  (value ?? fallback).toString().toUpperCase();

const extractCashFlowType = (payment: Partial<PaymentEntity> | { behaviorInsight?: string | null } | null | undefined): 'RECEIVABLE' | 'PAYABLE' => {
  const explicit = (payment as PaymentEntity | undefined)?.cashFlowType;
  if (explicit === 'PAYABLE' || explicit === 'RECEIVABLE') return explicit;
  const insight = (payment as { behaviorInsight?: string | null } | undefined)?.behaviorInsight ?? '';
  const match = insight.match(/FLOW:(PAYABLE|RECEIVABLE)/i);
  return match?.[1]?.toUpperCase() === 'PAYABLE' ? 'PAYABLE' : 'RECEIVABLE';
};

const ensureFlowInsight = (flow: 'RECEIVABLE' | 'PAYABLE', behaviorInsight?: string): string => {
  const cleaned = (behaviorInsight ?? '').replace(/FLOW:(PAYABLE|RECEIVABLE)\s*\|?\s*/gi, '').trim();
  return cleaned ? `FLOW:${flow} | ${cleaned}` : `FLOW:${flow}`;
};

const normalizePayment = (payment: PaymentEntity): PaymentEntity => ({
  ...payment,
  autonomousActions: Array.isArray(payment.autonomousActions) ? payment.autonomousActions : [],
  predictedLateProbability: payment.predictedLateProbability ?? 0,
  reminderStatus: payment.reminderStatus ?? 'NONE',
  cashFlowType: extractCashFlowType(payment),
  behaviorInsight: ensureFlowInsight(extractCashFlowType(payment), payment.behaviorInsight),
});

const mapPaymentRow = (row: PaymentRow, actions: string[] = []): PaymentEntity => {
  const tenant = row.tenants ?? null;
  const unit = row.units ?? null;
  const property = unit?.properties ?? null;
  const lease = row.leases ?? null;
  const flow = extractCashFlowType({ behaviorInsight: row.behavior_insight ?? undefined });

  return normalizePayment({
    id: row.id,
    tenantName: tenant?.full_name ?? 'Unknown Tenant',
    unit: unit?.unit_code ?? 'Unknown Unit',
    amount: toNumber(row.amount),
    currency: (row.currency ?? 'ETB') as 'ETB',
    status: asUpper(row.status, 'PENDING') as PaymentEntity['status'],
    intent: (row.intent ?? 'HIGH_RELIABILITY') as PaymentEntity['intent'],
    riskScore: toNumber(row.risk_score),
    lastActivity: row.paid_at ? 'Payment received' : 'Awaiting payment',
    routingBehavior: row.routing_behavior ?? 'Standard routing',
    financialStatus: asUpper(row.financial_status, 'UNKNOWN') as PaymentEntity['financialStatus'],
    autonomousActions: actions,
    proofUrl: row.proof_storage_path ?? undefined,
    dueDate: row.due_date,
    tenant: {
      email: tenant?.email ?? undefined,
      phone: tenant?.phone ?? undefined,
      building: property?.name ?? '',
      unitType: unit?.unit_type ?? '',
      moveInDate: tenant?.move_in_date ?? undefined,
      behaviorTag: tenant?.behavior_tag ?? undefined,
      reputationScore: tenant?.reputation_score ?? undefined,
    },
    property: {
      propertyId: property?.id ?? '',
      propertyName: property?.name ?? '',
      city: property?.city ?? '',
      neighborhood: property?.neighborhood ?? '',
    },
    lease: lease
      ? {
          startDate: lease.start_date ?? '',
          endDate: lease.end_date ?? '',
          monthlyRent: toNumber(lease.monthly_rent),
          depositAmount: toNumber(lease.deposit_amount),
          renewalStatus: asUpper(lease.renewal_status, 'ACTIVE') as PaymentEntity['lease'] extends infer T ? any : never,
          escalationRate: toNumber(lease.escalation_rate),
        }
      : undefined,
    predictedLateProbability: toNumber(row.predicted_late_probability),
    reminderStatus: asUpper(row.reminder_status, 'NONE') as PaymentEntity['reminderStatus'],
    behaviorInsight: ensureFlowInsight(flow, row.behavior_insight ?? undefined),
    cashFlowType: flow,
  } as PaymentEntity);
};

class DatabaseService {
  private static instance: DatabaseService;
  private listeners: (() => void)[] = [];

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  public subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((listener) => listener());
  }

  private loadLocal(): PaymentEntity[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        this.saveLocal([]);
        return [];
      }
      const parsed = JSON.parse(raw) as PaymentEntity[];
      return parsed.map(normalizePayment).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    } catch {
      this.saveLocal([]);
      return [];
    }
  }

  private saveLocal(payments: PaymentEntity[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payments.map(normalizePayment)));
  }

  private async fetchPaymentActions(paymentIds: string[]): Promise<Record<string, string[]>> {
    if (!supabase || paymentIds.length === 0) return {};

    const { data, error } = await supabase
      .from('payment_events')
      .select('payment_id, message, created_at')
      .in('payment_id', paymentIds)
      .order('created_at', { ascending: false });

    if (error || !data) return {};

    const grouped: Record<string, string[]> = {};

    (data as PaymentEventRow[]).forEach((event) => {
      if (!grouped[event.payment_id]) grouped[event.payment_id] = [];
      const stamp = new Date(event.created_at).toLocaleString();
      grouped[event.payment_id].push(`${stamp}: ${event.message}`);
    });

    return grouped;
  }

  public async getPayments(): Promise<PaymentEntity[]> {
    if (!supabase) return this.loadLocal();

    const { data, error } = await supabase
      .from('payments')
      .select(`
        id,
        amount,
        currency,
        due_date,
        paid_at,
        status,
        risk_score,
        predicted_late_probability,
        reminder_status,
        intent,
        routing_behavior,
        financial_status,
        behavior_insight,
        proof_storage_path,
        tenants (
          id,
          full_name,
          email,
          phone,
          move_in_date,
          reputation_score,
          behavior_tag
        ),
        units (
          id,
          unit_code,
          unit_type,
          properties (
            id,
            name,
            city,
            neighborhood
          )
        ),
        leases (
          id,
          start_date,
          end_date,
          monthly_rent,
          deposit_amount,
          renewal_status,
          escalation_rate
        )
      `)
      .order('due_date', { ascending: true });

    if (error) {
      console.error('Failed to load payments from Supabase:', error);
      return this.loadLocal();
    }

    const rows = (data ?? []) as unknown as PaymentRow[];
    if (rows.length === 0) return [];

    const actionsByPayment = await this.fetchPaymentActions(rows.map((row) => row.id));
    return rows.map((row) => mapPaymentRow(row, actionsByPayment[row.id] ?? []));
  }

  public async updatePayment(id: string, updates: Partial<PaymentEntity>): Promise<void> {
    if (!supabase) {
      const local = this.loadLocal().map((p) => (p.id === id ? normalizePayment({ ...p, ...updates }) : p));
      this.saveLocal(local);
      this.notify();
      return;
    }

    const flow = extractCashFlowType(updates as PaymentEntity);
    const payload: Record<string, unknown> = {};

    if (updates.amount !== undefined) payload.amount = updates.amount;
    if (updates.currency !== undefined) payload.currency = updates.currency;
    if (updates.status !== undefined) payload.status = updates.status.toLowerCase();
    if (updates.intent !== undefined) payload.intent = updates.intent;
    if (updates.riskScore !== undefined) payload.risk_score = updates.riskScore;
    if (updates.routingBehavior !== undefined) payload.routing_behavior = updates.routingBehavior;
    if (updates.financialStatus !== undefined) payload.financial_status = updates.financialStatus;
    if (updates.proofUrl !== undefined) payload.proof_storage_path = updates.proofUrl;
    if (updates.dueDate !== undefined) payload.due_date = updates.dueDate;
    if (updates.predictedLateProbability !== undefined) payload.predicted_late_probability = updates.predictedLateProbability;
    if (updates.reminderStatus !== undefined) payload.reminder_status = updates.reminderStatus.toLowerCase();
    if (updates.behaviorInsight !== undefined || updates.cashFlowType !== undefined) {
      payload.behavior_insight = ensureFlowInsight(flow, updates.behaviorInsight);
    }
    if (updates.status === 'COLLECTED') payload.paid_at = new Date().toISOString();

    const { error } = await supabase.from('payments').update(payload).eq('id', id);
    if (error) {
      console.error('Failed to update payment in Supabase:', error);
      const local = this.loadLocal().map((p) => (p.id === id ? normalizePayment({ ...p, ...updates }) : p));
      this.saveLocal(local);
    }

    this.notify();
  }

  public async createPayment(payment: PaymentEntity): Promise<void> {
    const normalized = normalizePayment(payment);
    if (!supabase) {
      const local = [normalized, ...this.loadLocal()];
      this.saveLocal(local);
      this.notify();
      return;
    }

    const tenantPayload = {
      full_name: normalized.tenantName,
      email: normalized.tenant?.email ?? null,
      phone: normalized.tenant?.phone ?? null,
      move_in_date: normalized.tenant?.moveInDate ?? null,
      reputation_score: normalized.tenant?.reputationScore ?? 50,
      behavior_tag: normalized.tenant?.behaviorTag ?? null,
    };

    const { data: tenantRow, error: tenantError } = await supabase
      .from('tenants')
      .insert([tenantPayload])
      .select('id')
      .single();

    if (tenantError || !tenantRow) {
      console.error('Failed to create tenant:', tenantError);
      throw tenantError ?? new Error('Tenant creation failed');
    }

    let propertyId: string | null = null;
    if (normalized.property?.propertyName) {
      const { data: existingProperty } = await supabase
        .from('properties')
        .select('id')
        .eq('name', normalized.property.propertyName)
        .maybeSingle();

      if (existingProperty?.id) {
        propertyId = existingProperty.id;
      } else {
        const { data: newProperty, error: propertyError } = await supabase
          .from('properties')
          .insert([{ name: normalized.property.propertyName, city: normalized.property.city || 'Addis Ababa', neighborhood: normalized.property.neighborhood || null }])
          .select('id')
          .single();
        if (propertyError) throw propertyError;
        propertyId = newProperty?.id ?? null;
      }
    }

    let unitId: string | null = null;
    if (propertyId && normalized.unit) {
      const { data: existingUnit } = await supabase
        .from('units')
        .select('id')
        .eq('property_id', propertyId)
        .eq('unit_code', normalized.unit)
        .maybeSingle();

      if (existingUnit?.id) {
        unitId = existingUnit.id;
      } else {
        const { data: newUnit, error: unitError } = await supabase
          .from('units')
          .insert([{ property_id: propertyId, unit_code: normalized.unit, unit_type: normalized.tenant?.unitType || 'Commercial', is_occupied: true }])
          .select('id')
          .single();
        if (unitError) throw unitError;
        unitId = newUnit?.id ?? null;
      }
    }

    let leaseId: string | null = null;
    if (unitId) {
      const { data: leaseRow, error: leaseError } = await supabase
        .from('leases')
        .insert([{ tenant_id: tenantRow.id, unit_id: unitId, start_date: normalized.lease?.startDate || new Date().toISOString().slice(0, 10), end_date: normalized.lease?.endDate || new Date(Date.now() + 31536000000).toISOString().slice(0, 10), monthly_rent: normalized.lease?.monthlyRent ?? normalized.amount, deposit_amount: normalized.lease?.depositAmount ?? 0, renewal_status: (normalized.lease?.renewalStatus || 'ACTIVE').toLowerCase(), escalation_rate: normalized.lease?.escalationRate ?? 0, is_active: true }])
        .select('id')
        .single();
      if (leaseError) throw leaseError;
      leaseId = leaseRow?.id ?? null;
    }

    const paymentPayload = {
      lease_id: leaseId,
      tenant_id: tenantRow.id,
      unit_id: unitId,
      amount: normalized.amount,
      currency: normalized.currency || 'ETB',
      due_date: normalized.dueDate,
      paid_at: normalized.status === 'COLLECTED' ? new Date().toISOString() : null,
      status: normalized.status.toLowerCase(),
      risk_score: normalized.riskScore ?? 0,
      predicted_late_probability: normalized.predictedLateProbability ?? 0,
      reminder_status: (normalized.reminderStatus || 'NONE').toLowerCase(),
      intent: normalized.intent ?? 'HIGH_RELIABILITY',
      routing_behavior: normalized.routingBehavior ?? 'Standard routing',
      financial_status: normalized.financialStatus ?? 'UNKNOWN',
      behavior_insight: ensureFlowInsight(extractCashFlowType(normalized), normalized.behaviorInsight),
      proof_storage_path: normalized.proofUrl ?? null,
    };

    const { data: insertedPayment, error: paymentError } = await supabase
      .from('payments')
      .insert([paymentPayload])
      .select('id')
      .single();
    if (paymentError) {
      console.error('Failed to create payment:', paymentError);
      throw paymentError;
    }

    if (normalized.autonomousActions.length > 0 && insertedPayment?.id) {
      const eventRows = normalized.autonomousActions.map((message) => ({ payment_id: insertedPayment.id, event_type: 'system', message }));
      await supabase.from('payment_events').insert(eventRows);
    }

    this.notify();
  }

  public async addAutonomousAction(id: string, action: string): Promise<void> {
    const timestamp = new Date().toLocaleString();

    if (!supabase) {
      const payments = this.loadLocal();
      const payment = payments.find((p) => p.id === id);
      if (!payment) return;
      const updatedActions = [`${timestamp}: ${action}`, ...payment.autonomousActions].slice(0, 25);
      await this.updatePayment(id, { autonomousActions: updatedActions, lastActivity: action });
      return;
    }

    const { error } = await supabase.from('payment_events').insert([{ payment_id: id, event_type: 'system', message: action }]);
    if (error) console.error('Failed to add payment event:', error);
    this.notify();
  }
}

export const db = DatabaseService.getInstance();
