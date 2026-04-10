export type SystemState = 'AUTONOMOUS' | 'CALIBRATING' | 'SECURE' | 'INTERVENTION_REQUIRED';
export type ViewMode = 'ASSET' | 'OWNERSHIP' | 'OPERATIONS';
export type Theme = 'VAULT' | 'LIGHT' | 'COBALT';

export type PaymentIntent = 'STRATEGIC_STALL' | 'LIQUIDITY_SECURE' | 'HIGH_RELIABILITY' | 'VOLATILE_BEHAVIOR' | 'EVASIVE_ROUTING' | 'LIQUIDITY_PRESERVATION';
export type PaymentStatus = 'COLLECTED' | 'PENDING' | 'AT_RISK' | 'BLOCKED';
export type FinancialStatus = 'SOLVENT' | 'LEVERAGED' | 'DISTRESSED' | 'UNKNOWN';

export interface TenantProfile {
  email?: string;
  phone?: string;
  building: string;
  unitType: string;
  moveInDate?: string;
  behaviorTag?: string;
  reputationScore?: number;
}

export interface PropertyInfo {
  propertyId: string;
  propertyName: string;
  city: string;
  neighborhood?: string;
}

export interface LeaseInfo {
  startDate: string;
  endDate: string;
  monthlyRent: number;
  depositAmount: number;
  renewalStatus: 'ACTIVE' | 'EXPIRING_SOON' | 'RENEWED' | 'ENDED';
  escalationRate?: number;
}

export interface PaymentEntity {
  cashFlowType?: 'RECEIVABLE' | 'PAYABLE';
  id: string;
  tenantName: string;
  unit: string;
  amount: number;
  currency: 'ETB';
  status: PaymentStatus;
  intent: PaymentIntent;
  riskScore: number;
  lastActivity: string;
  routingBehavior: string;
  financialStatus: FinancialStatus;
  autonomousActions: string[];
  proofUrl?: string;
  dueDate: string;
  tenant?: TenantProfile;
  property?: PropertyInfo;
  lease?: LeaseInfo;
  predictedLateProbability?: number;
  reminderStatus?: 'NONE' | 'SCHEDULED' | 'SENT' | 'ESCALATED';
  behaviorInsight?: string;
}

export interface BankTransaction {
  id: string;
  date: string;
  payerName: string;
  amount: number;
  reference: string;
  matchedPaymentId?: string;
  status: 'UNMATCHED' | 'MATCHED';
}

export interface ReminderEvent {
  id: string;
  paymentId: string;
  tenantName: string;
  channel: 'EMAIL' | 'SMS' | 'WHATSAPP' | 'PUSH';
  kind: 'PRE_DUE' | 'DUE_DATE' | 'LATE_NOTICE' | 'ESCALATION';
  scheduledFor: string;
  status: 'QUEUED' | 'SENT';
}

export interface ReceiptFraudCheck {
  paymentId: string;
  duplicateReceipt: boolean;
  duplicateReference: boolean;
  suspiciousAmountMismatch: boolean;
  confidence: number;
  recommendation: 'APPROVE' | 'MANUAL_REVIEW' | 'REJECT';
  reasons: string[];
}

export interface MaintenanceRequest {
  id: string;
  paymentId?: string;
  propertyName: string;
  unit: string;
  tenantName: string;
  category: 'PLUMBING' | 'ELECTRICAL' | 'HVAC' | 'SECURITY' | 'GENERAL';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  title: string;
  createdAt: string;
}

export interface InvestorSnapshot {
  totalRevenue: number;
  collectedRevenue: number;
  lateExposure: number;
  occupancyRate: number;
  projectedAnnualYield: number;
  averageLateRisk: number;
}

export interface TenantPortalCard {
  paymentId: string;
  tenantName: string;
  amountDue: number;
  dueDate: string;
  canPayNow: boolean;
  leaseEndsOn?: string;
}

export interface PaymentGatewayAction {
  paymentId: string;
  provider: 'STRIPE' | 'PAYPAL' | 'BANK_TRANSFER' | 'MOBILE_MONEY';
  amount: number;
  status: 'READY' | 'PROCESSING' | 'SUCCESS';
}

export interface PortfolioStats {
  totalAssets: number;
  occupancyRate: number;
  annualYield: number;
  totalTenantDebt: number;
}
