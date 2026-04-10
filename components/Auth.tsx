
import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Shield, Lock, Mail, ArrowRight, Loader2 } from 'lucide-react';

const Auth: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    if (!supabase) {
      setError('Supabase is not configured. Please check your environment variables.');
      setLoading(false);
      return;
    }

    let isPending = true;
    const authTimeout = setTimeout(() => {
      if (isPending) {
        setError('The request is taking longer than expected. This could be due to a slow connection or Supabase email service. Please wait or try again.');
      }
    }, 10000);

    try {
      if (isSignUp) {
        const { data, error: signUpError } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            emailRedirectTo: window.location.origin
          }
        });
        
        if (signUpError) throw signUpError;
        
        if (data.user && !data.session) {
          setSuccessMessage('Account initialized. Please check your email for the confirmation link. Tip: Check your spam folder if you don\'t see it within a minute.');
        } else if (data.session) {
          setSuccessMessage('Account created and verified. Establishing link...');
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      
      if (err.message === 'Email not confirmed') {
        setError('Your email has not been verified yet. Please check your inbox (and spam folder) for the confirmation link.');
      } else if (err.message === 'Invalid login credentials') {
        setError('The email or access key you provided is incorrect. Please verify your credentials and try again.');
      } else if (err.message === 'Failed to fetch') {
        const urlInfo = supabase ? ` (Target: ${import.meta.env.VITE_SUPABASE_URL || 'Not configured'})` : '';
        setError(`Connection failed. Please ensure your Supabase URL is correct and ends in .co, not .com.${urlInfo}`);
      } else {
        setError(err.message || 'An unexpected error occurred during authentication.');
      }
    } finally {
      isPending = false;
      clearTimeout(authTimeout);
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!email || !supabase) return;
    setLoading(true);
    setError(null);
    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: window.location.origin
        }
      });
      if (resendError) throw resendError;
      setSuccessMessage('Confirmation link resent. Please check your email.');
    } catch (err: any) {
      setError(err.message || 'Failed to resend confirmation link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[var(--bg)] p-6 relative overflow-hidden">
      {/* Background Accents */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[var(--accent)]/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[var(--accent)]/3 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4 pointer-events-none" />

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex justify-center mb-6">
            <img
              src="/logo.png"
              alt="Vaultline logo"
              className="w-28 h-28 object-contain drop-shadow-[0_18px_30px_rgba(0,0,0,0.55)] [filter:drop-shadow(0_18px_30px_rgba(0,0,0,0.55))_drop-shadow(0_0_18px_rgba(197,160,89,0.4))]"
            />
          </div>
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full surface-bg border premium-border mb-5 shadow-[0_0_20px_rgba(197,160,89,0.1)]">
            <Shield className="w-6 h-6 gold-accent" />
          </div>
          <h1 className="text-3xl font-light tracking-[0.2em] uppercase theme-text mb-2">Vaultline</h1>
          <p className="theme-muted text-[10px] tracking-[0.4em] uppercase">Institutional Asset Intelligence</p>
        </div>

        <div className="glass p-8 rounded-2xl border premium-border shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
          {successMessage ? (
            <div className="text-center space-y-6 py-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
                <Shield className="w-6 h-6 text-emerald-500" />
              </div>
              <div className="space-y-2">
                <h3 className="text-emerald-500 text-[11px] tracking-[0.2em] uppercase font-bold">Protocol Success</h3>
                <p className="theme-text text-[10px] tracking-widest uppercase leading-relaxed">
                  {successMessage}
                </p>
              </div>
              <button
                onClick={() => {
                  setSuccessMessage(null);
                  setIsSignUp(false);
                }}
                className="theme-muted hover:gold-accent text-[9px] tracking-[0.2em] uppercase transition-colors"
              >
                Return to Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleAuth} className="space-y-6">
              <div className="space-y-4">
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 theme-muted group-focus-within:gold-accent transition-colors" />
                  <input
                    type="email"
                    placeholder="INSTITUTIONAL EMAIL"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full surface-bg border premium-border rounded-xl py-4 pl-12 pr-4 text-[11px] tracking-widest uppercase focus:outline-none focus:border-[var(--accent)]/50 transition-all placeholder:theme-muted theme-text"
                    required
                  />
                </div>

                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 theme-muted group-focus-within:gold-accent transition-colors" />
                  <input
                    type="password"
                    placeholder="ACCESS KEY"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full surface-bg border premium-border rounded-xl py-4 pl-12 pr-4 text-[11px] tracking-widest uppercase focus:outline-none focus:border-[var(--accent)]/50 transition-all placeholder:theme-muted theme-text"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="space-y-3">
                  <div className="text-red-500/80 text-[10px] tracking-wider uppercase text-center bg-red-500/5 py-3 px-4 rounded-lg border border-red-500/10 leading-relaxed">
                    {error}
                  </div>
                  {error.includes('verified') && (
                    <button
                      type="button"
                      onClick={handleResendConfirmation}
                      disabled={loading}
                      className="w-full theme-muted hover:gold-accent text-[9px] tracking-[0.2em] uppercase transition-colors text-center py-2"
                    >
                      {loading ? 'Resending...' : 'Resend Confirmation Link'}
                    </button>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[var(--accent)] hover:opacity-90 text-[var(--bg)] font-bold py-4 rounded-xl text-[11px] tracking-[0.3em] uppercase transition-all flex items-center justify-center gap-3 shadow-[0_10px_20px_rgba(197,160,89,0.2)] active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    {isSignUp ? 'Initialize Account' : 'Establish Link'}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {!successMessage && (
            <div className="mt-8 flex flex-col gap-4">
              <button
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError(null);
                }}
                className="theme-muted hover:gold-accent text-[9px] tracking-[0.2em] uppercase transition-colors text-center"
              >
                {isSignUp ? 'Existing Protocol? Sign In' : 'New Institution? Request Access'}
              </button>

            </div>
          )}
        </div>

        <div className="mt-12 text-center space-y-2 opacity-30">
          <p className="theme-muted text-[8px] tracking-[0.5em] uppercase">Secure Terminal v2.4.0</p>
          <p className="theme-muted text-[7px] tracking-[0.3em] uppercase">End-to-End Encrypted Institutional Bridge</p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
