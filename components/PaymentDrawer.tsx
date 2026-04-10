import React, { useEffect, useState } from 'react';
import { X, Upload, ShieldCheck, AlertCircle, Sparkles, Clock, FileWarning } from 'lucide-react';
import { PaymentEntity } from '../types';
import { db } from '../services/dbService';
import { getPaymentIntelligence, verifyPaymentProof } from '../services/geminiService';
import { featureService } from '../services/featureService';

interface PaymentDrawerProps {
  payment: PaymentEntity | null;
  onClose: () => void;
}

const PaymentDrawer: React.FC<PaymentDrawerProps> = ({ payment, onClose }) => {
  const [insight, setInsight] = useState('Preparing payment intelligence...');
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{ verified: boolean; confidence: number; detectedAnomaly?: string } | null>(null);

  useEffect(() => {
    if (!payment) return;
    setInsight('Reviewing tenant pattern and lease context...');
    setVerificationResult(null);
    getPaymentIntelligence(payment).then(setInsight);
  }, [payment]);

  if (!payment) return null;

  const overdue = payment.status !== 'COLLECTED' && payment.dueDate < new Date().toISOString().split('T')[0];
  const fraudCheck = featureService.buildFraudCheck(payment, verificationResult || undefined);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !payment) return;
    setVerifying(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result?.toString().split(',')[1];
      if (!base64) return;
      const result = await verifyPaymentProof(base64);
      setVerificationResult(result);

      const advisory = featureService.buildFraudCheck(payment, result);
      await db.updatePayment(payment.id, { proofUrl: `data:image/jpeg;base64,${base64}` });

      if (advisory.recommendation === 'APPROVE' && result.verified) {
        await db.updatePayment(payment.id, { status: 'COLLECTED', reminderStatus: 'SENT' });
        await db.addAutonomousAction(payment.id, 'Receipt uploaded and approved after AI + fraud advisory checks.');
      } else {
        await db.addAutonomousAction(payment.id, `Receipt uploaded and routed to manual review. ${advisory.reasons.join(' | ') || 'Confidence below settlement threshold.'}`);
      }
      setVerifying(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-[560px] bg-[var(--bg)] border-l premium-border z-50 p-8 overflow-y-auto space-y-8">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.4em] theme-muted">Payment entity</div>
            <h3 className="text-3xl theme-text font-light mt-2">{payment.tenantName}</h3>
            <div className="theme-muted text-xs mt-2">{payment.property?.propertyName || 'Property not set'} · {payment.unit}</div>
          </div>
          <button onClick={onClose} className="p-2 theme-muted hover:theme-text"><X className="w-5 h-5" /></button>
        </div>

        <section className="p-6 border premium-border surface-bg">
          <div className="flex items-center gap-3 mb-4"><Sparkles className="w-4 h-4 gold-accent" /><h4 className="text-[10px] uppercase tracking-[0.3em] theme-muted">AI risk insight</h4></div>
          <p className="theme-text text-sm leading-6">{insight}</p>
        </section>

        <section className="grid grid-cols-2 gap-4">
          <div className="p-5 border premium-border surface-bg">
            <div className="text-[10px] uppercase tracking-widest theme-muted">Status</div>
            <div className="theme-text mt-2 text-lg">{payment.status}</div>
          </div>
          <div className="p-5 border premium-border surface-bg">
            <div className="text-[10px] uppercase tracking-widest theme-muted">Late risk</div>
            <div className="theme-text mt-2 text-lg">{Math.round((payment.predictedLateProbability || 0) * 100)}%</div>
          </div>
          <div className="p-5 border premium-border surface-bg">
            <div className="text-[10px] uppercase tracking-widest theme-muted">Lease</div>
            <div className="theme-text mt-2 text-sm">{payment.lease?.renewalStatus || 'N/A'}</div>
          </div>
          <div className="p-5 border premium-border surface-bg">
            <div className="text-[10px] uppercase tracking-widest theme-muted">Reminder flow</div>
            <div className="theme-text mt-2 text-sm">{payment.reminderStatus || 'NONE'}</div>
          </div>
        </section>

        <section className="p-6 border premium-border surface-bg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3"><FileWarning className="w-4 h-4 gold-accent" /><h4 className="text-[10px] uppercase tracking-[0.3em] theme-muted">Receipt verification + fraud routing</h4></div>
            {overdue && <div className="text-[10px] uppercase tracking-widest text-red-500">Overdue</div>}
          </div>
          {!payment.proofUrl && (
            <label className="block border border-dashed premium-border p-8 text-center cursor-pointer hover:surface-bg transition-colors">
              <Upload className="w-8 h-8 mx-auto theme-muted mb-3" />
              <div className="text-[10px] uppercase tracking-[0.3em] theme-muted">Upload receipt</div>
              <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
            </label>
          )}
          {verifying && <div className="theme-muted text-xs mt-4">Running AI receipt review and duplicate checks...</div>}
          {payment.proofUrl && <img src={payment.proofUrl} alt="Payment proof" className="mt-4 w-full h-48 object-cover border premium-border" />}
          <div className="mt-4 text-xs theme-muted leading-6">
            Recommendation: <span className="theme-text">{fraudCheck.recommendation}</span>
            {fraudCheck.reasons.length > 0 ? ` · ${fraudCheck.reasons.join(' · ')}` : ' · No duplicate or mismatch flags detected.'}
          </div>
          {verificationResult && (
            <div className={`mt-4 p-4 border ${verificationResult.verified ? 'border-emerald-500/30' : 'border-red-500/30'} flex items-start gap-3`}>
              {verificationResult.verified ? <ShieldCheck className="w-4 h-4 text-emerald-500 mt-0.5" /> : <AlertCircle className="w-4 h-4 text-red-500 mt-0.5" />}
              <div className="text-xs theme-muted">
                Confidence {Math.round(verificationResult.confidence * 100)}%.
                {verificationResult.detectedAnomaly ? ` ${verificationResult.detectedAnomaly}` : ''}
              </div>
            </div>
          )}
        </section>

        <section className="p-6 border premium-border surface-bg">
          <div className="flex items-center gap-3 mb-4"><Clock className="w-4 h-4 gold-accent" /><h4 className="text-[10px] uppercase tracking-[0.3em] theme-muted">Activity log</h4></div>
          <div className="space-y-3">
            {payment.autonomousActions.map((action, index) => (
              <div key={index} className="p-3 border premium-border text-xs theme-muted">{action}</div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
};

export default PaymentDrawer;
